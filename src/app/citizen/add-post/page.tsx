
'use client';

import type { ChangeEvent, FormEvent } from 'react';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection,
  addDoc,
  serverTimestamp,
  GeoPoint,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Loader2,
  Camera,
  MapPin,
  LocateFixed,
  Calendar as CalendarIcon,
  AlertCircle,
  Video,
  VideoOff,
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Location {
  latitude: number;
  longitude: number;
}

// Helper function to get address from coordinates (Reverse Geocoding)
async function getAddressFromCoordinates(
  lat: number,
  lon: number
): Promise<string> {
  try {
    // Using OpenStreetMap Nominatim API (Free, requires attribution)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    );
    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.statusText}`);
    }
    const data = await response.json();
    return data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`; // Fallback to coordinates
  } catch (error) {
    console.error('Error fetching address:', error);
    return `Location: ${lat.toFixed(5)}, ${lon.toFixed(5)}`; // Fallback
  }
}

export default function AddPostPage() {
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null); // Ref for video element
  const canvasRef = useRef<HTMLCanvasElement>(null); // Ref for canvas to capture snapshot
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null); // Store the stream

  const router = useRouter();
  const { toast } = useToast();

  // Request camera permission on component mount
  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
         console.warn('Camera API not supported in this browser.');
         setHasCameraPermission(false);
         // No toast here, let user proceed with file upload
         return;
      }
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); // Prioritize rear camera
        setStream(mediaStream); // Store the stream
        setHasCameraPermission(true);
        console.log("Camera permission granted.");
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setHasCameraPermission(false);
        // Only show toast if user explicitly tries to use camera later?
        // toast({
        //   variant: 'destructive',
        //   title: 'Camera Access Denied',
        //   description: 'Please enable camera permissions to take a photo directly.',
        // });
      }
    };

    getCameraPermission();

     // Cleanup function to stop the stream when component unmounts
     return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            console.log("Camera stream stopped.");
        }
    };
    // Re-run if stream changes (needed for cleanup logic)
  }, [stream]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setShowCameraPreview(false); // Hide camera preview if a file is selected
     if (stream) { // Stop camera stream if file upload is chosen
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
        if (videoRef.current) videoRef.current.srcObject = null;
    }

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('Image selected:', file.name, file.size, file.type);
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        toast({
          title: 'Invalid File',
          description: 'Please select a valid image file.',
          variant: 'destructive',
        });
         setImageFile(null); // Clear invalid file
         setImagePreview(null); // Clear preview
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // Increased limit to 10MB
        setError('Image size should not exceed 10MB.');
        toast({
          title: 'File Too Large',
          description: 'Image size should not exceed 10MB.',
          variant: 'destructive',
        });
         setImageFile(null); // Clear invalid file
         setImagePreview(null); // Clear preview
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        console.log('Image preview generated from file.');
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

   const handleTakePhotoClick = () => {
    if (hasCameraPermission === false) {
        toast({ title: "Camera Required", description: "Camera access is needed to take a photo. Please grant permission or upload a file.", variant: "destructive" });
        return;
    }
    if (hasCameraPermission === null) {
        toast({ title: "Camera Status Unknown", description: "Waiting for camera permission..."});
        return;
    }
    // Clear any previously selected file/preview
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    setShowCameraPreview(true); // Show the video feed
     // Ensure stream is active
     if (!stream && videoRef.current && hasCameraPermission) {
         navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
         .then(newStream => {
             setStream(newStream);
             if(videoRef.current) videoRef.current.srcObject = newStream;
         })
         .catch(err => {
             console.error("Error reactivating camera:", err);
             setError("Failed to reactivate camera.");
             toast({title: "Camera Error", description: "Could not reactivate camera.", variant: "destructive"});
         });
     }
  };

   const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !stream) {
        setError("Camera feed not available or stream not active.");
        console.error("Capture failed: Video or canvas ref missing or stream inactive.");
        return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
        setError("Could not get canvas context.");
        console.error("Capture failed: Canvas context unavailable.");
        return;
    }

     // Set canvas dimensions to match video element's display size
     const displayWidth = video.clientWidth;
     const displayHeight = video.clientHeight;
     canvas.width = displayWidth;
     canvas.height = displayHeight;

    console.log(`Canvas dimensions set to: ${displayWidth}x${displayHeight}`);
    console.log(`Video dimensions: natural ${video.videoWidth}x${video.videoHeight}, display ${displayWidth}x${displayHeight}`);


    // Draw the current video frame onto the canvas
    // Use videoWidth/videoHeight for source, scale to canvas width/height
    try {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        console.log("Image drawn onto canvas.");
    } catch (drawError) {
         console.error("Error drawing image on canvas:", drawError);
         setError("Failed to capture frame from video.");
         return;
    }


    // Convert canvas to data URL (JPEG format with quality 0.9)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    console.log("Canvas converted to data URL (first 50 chars):", dataUrl.substring(0, 50));
    setImagePreview(dataUrl); // Show the captured photo as preview

    // Convert data URL to Blob/File object
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        if (blob) {
            const imageFileName = `capture_${Date.now()}.jpg`;
            const capturedFile = new File([blob], imageFileName, { type: 'image/jpeg' });
            setImageFile(capturedFile);
            console.log("Captured image converted to File object:", capturedFile.name, capturedFile.size);
            setShowCameraPreview(false); // Hide camera feed after capture
            // Stop the stream after capture
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                console.log("Camera stream stopped after capture.");
                setStream(null); // Clear stream state
                if (videoRef.current) videoRef.current.srcObject = null; // Clear video src
            }
        } else {
            throw new Error("Failed to create blob from data URL");
        }
      })
       .catch(err => {
          console.error("Error converting data URL to file:", err);
          setError("Failed to process captured image.");
       });
  };


  const triggerFileInput = () => {
    console.log('Triggering file input click.');
    setShowCameraPreview(false); // Hide camera if file input is triggered
    if (stream) { // Stop camera stream if file upload is chosen
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
        if (videoRef.current) videoRef.current.srcObject = null;
    }
    fileInputRef.current?.click();
  };

  const handleGetLocation = () => {
    console.log('Attempting to get location...');
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      toast({
        title: 'Geolocation Error',
        description: 'Geolocation is not supported by your browser.',
        variant: 'destructive',
      });
      console.error('Geolocation not supported.');
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`Location obtained: Lat ${latitude}, Lon ${longitude}`);
        setLocation({ latitude, longitude });
        console.log('Fetching address for coordinates...');
        const fetchedAddress = await getAddressFromCoordinates(
          latitude,
          longitude
        );
        setAddress(fetchedAddress);
        console.log('Address fetched:', fetchedAddress);
        setIsLocating(false);
        toast({
          title: 'Location Added',
          description: `Location set: ${fetchedAddress || 'Coordinates saved'}`,
        });
      },
      (err) => {
        console.error('Error getting location:', err);
        let message = 'Failed to get location.';
        if (err.code === err.PERMISSION_DENIED) {
          message =
            'Location permission denied. Please enable it in your browser settings.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = 'Location information is unavailable.';
        } else if (err.code === err.TIMEOUT) {
          message = 'Getting location timed out.';
        }
        setError(message);
        toast({
          title: 'Location Error',
          description: message,
          variant: 'destructive',
        });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 } // Increased timeout
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log('Submit button clicked.');
    setError(null);

    console.log('Checking authentication status...');
    if (!auth.currentUser) {
      setError('You must be logged in to post.');
      toast({
        title: 'Not Logged In',
        description: 'Please log in again.',
        variant: 'destructive',
      });
      console.error('User not logged in during post attempt.');
      router.push('/auth/citizen'); // Redirect to login if not authenticated
      return;
    }
    console.log('User authenticated:', auth.currentUser.uid);

    console.log('Checking for image file...');
    if (!imageFile) {
      setError('Please select or capture an image.');
      toast({
        title: 'Missing Image',
        description: 'Please select or capture an image to upload.',
        variant: 'destructive',
      });
      console.error('Image file missing during post attempt.');
      return;
    }
    console.log('Image file present.');

    console.log('Checking for caption...');
    if (!caption.trim()) {
      setError('Please enter a caption describing the issue.');
      toast({
        title: 'Missing Caption',
        description: 'Please enter a caption.',
        variant: 'destructive',
      });
      console.error('Caption missing during post attempt.');
      return;
    }
    console.log('Caption present:', caption);

    console.log('Starting post submission process...');
    setIsLoading(true); // Start loading state

    try {
      console.log('Uploading image to Storage...');
      const storagePath = `posts/${auth.currentUser.uid}/${Date.now()}_${
        imageFile.name
      }`;
      const imageRef = ref(storage, storagePath);
      await uploadBytes(imageRef, imageFile);
      const imageUrl = await getDownloadURL(imageRef);
      console.log('Image uploaded successfully. URL:', imageUrl);

      console.log('Preparing post data for Firestore...');
      const postData: any = {
        userId: auth.currentUser.uid,
        userName:
          auth.currentUser.displayName ||
          auth.currentUser.phoneNumber ||
          'Anonymous User', // Fallback username
        imageUrl: imageUrl,
        caption: caption.trim(),
        timestamp: serverTimestamp(),
        status: 'pending', // Default status
      };

      // Ensure location is valid before adding
      if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
         postData.location = new GeoPoint(location.latitude, location.longitude);
         console.log('Location GeoPoint added:', postData.location);
      } else {
          console.warn("Invalid or missing location data, skipping GeoPoint:", location);
      }

      if (address) {
        postData.address = address;
        console.log('Address string added:', postData.address);
      }
      if (deadline) {
        postData.deadline = Timestamp.fromDate(deadline);
        console.log('Deadline Timestamp added:', postData.deadline);
      }

      console.log('Final post data object being sent to Firestore:', postData);
      const docRef = await addDoc(collection(db, 'posts'), postData);
      console.log(
        'Post submitted successfully to Firestore! Document ID:',
        docRef.id
      );
      // Log the actual data saved for verification
       console.log('Post data saved:', postData); // Verify saved data


      toast({ title: 'Success!', description: 'Your issue has been reported.' });

      console.log('Navigating to /citizen/home...');
      router.push('/citizen/home'); // Navigate AFTER successful submission

    } catch (err: any) {
      console.error('Error submitting post:', err);
      console.error('Full error object:', err); // Log the full error
      if (err.code) {
        console.error(`Firebase Error Code: ${err.code}`);
        console.error(`Firebase Error Message: ${err.message}`);
      }
      setError(
        `Failed to submit post: ${err.message || 'Unknown error'}. Check console for details.`
      );
      toast({
        title: 'Submission Failed',
        description: `Error: ${err.message || 'Could not submit the post.'}`,
        variant: 'destructive',
      });
      setIsLoading(false); // Stop loading ONLY on error
    }
    // Removed finally block to ensure isLoading=false is only set on error.
    // On success, navigation handles the transition away from the loading state.
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-primary">
            Report an Issue
          </CardTitle>
          <CardDescription className="text-center">
            Upload or take a picture and describe the cleanliness issue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form id="add-post-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload / Camera */}
            <div>
              <Label htmlFor="image" className="mb-2 block font-medium">
                Issue Image *
              </Label>
              {/* Hidden File Input */}
              <Input
                id="image"
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
                // Removed 'required' from hidden input, validation happens in submit handler
              />
               {/* Hidden Canvas for Capturing Photo */}
               <canvas ref={canvasRef} className="hidden"></canvas>

                {/* Camera Preview Area */}
                <div className={cn("mt-2", !showCameraPreview && "hidden")}>
                    <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                    {hasCameraPermission === false && (
                        <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Camera Access Denied</AlertTitle>
                        <AlertDescription>
                            Cannot access camera. Please grant permission or upload a file.
                        </AlertDescription>
                        </Alert>
                    )}
                     <Button type="button" onClick={handleCapturePhoto} className="w-full mt-2 bg-accent hover:bg-accent/90">
                       <Camera className="mr-2 h-4 w-4" /> Capture Photo
                     </Button>
                </div>


              {/* Buttons for Upload/Take Photo */}
               <div className={cn("mt-2 grid grid-cols-2 gap-2", showCameraPreview && "hidden")}>
                 <Button
                    type="button"
                    variant="outline"
                    onClick={triggerFileInput}
                    className="border-dashed border-primary text-primary hover:bg-primary/10 flex items-center justify-center py-3"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    <span>Upload Photo</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTakePhotoClick}
                     disabled={hasCameraPermission === false || hasCameraPermission === null}
                    className="border-dashed border-accent text-accent hover:bg-accent/10 flex items-center justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     {hasCameraPermission === false ? <VideoOff className="h-5 w-5 mr-2"/> : <Video className="h-5 w-5 mr-2"/>}
                    <span>Take Photo</span>
                  </Button>
              </div>

              {/* Image Preview */}
              {imagePreview && !showCameraPreview && (
                <div className="mt-4 border rounded-md overflow-hidden aspect-video relative bg-muted">
                  <Image
                    src={imagePreview}
                    alt="Selected preview"
                    fill
                    style={{ objectFit: 'contain' }} // Use contain to see full image
                    priority // Prioritize loading preview
                    sizes="(max-width: 640px) 100vw, 512px"
                  />
                </div>
              )}
            </div>

            {/* Caption */}
            <div>
              <Label htmlFor="caption" className="font-medium">
                Caption *
              </Label>
              <Textarea
                id="caption"
                placeholder="Describe the issue (e.g., Overflowing bin near park entrance)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                required
                className="mt-1 min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {caption.length}/500
              </p>
            </div>

            {/* Geolocation */}
            <div>
              <Label className="font-medium">Location (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="w-full mt-1 flex items-center justify-center text-accent border-accent hover:bg-accent/10"
              >
                {isLocating ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : location ? (
                  <MapPin className="h-5 w-5 mr-2 text-green-600" />
                ) : (
                  <LocateFixed className="h-5 w-5 mr-2" />
                )}
                <span>
                  {isLocating
                    ? 'Getting Location...'
                    : location
                    ? 'Location Added'
                    : 'Add Current Location'}
                </span>
              </Button>
              {address && (
                <p className="text-sm text-muted-foreground mt-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                  {address}
                </p>
              )}
            </div>

            {/* Deadline Picker */}
            <div>
              <Label htmlFor="deadline" className="font-medium">
                Resolution Deadline (Optional)
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="deadline"
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal mt-1',
                      !deadline && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? (
                      format(deadline, 'PPP')
                    ) : (
                      <span>Pick a desired resolution date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    initialFocus
                    disabled={(date) =>
                      date < new Date(new Date().setDate(new Date().getDate() - 1))
                    } // Disable past dates
                  />
                </PopoverContent>
              </Popover>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            form="add-post-form"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isLoading || !imageFile || !caption.trim()} // Disable if loading, no image OR no caption
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'Post Issue'
            )}
          </Button>
        </CardFooter>
      </Card>

      <p className="text-center text-xs text-muted-foreground mt-4">
        Address lookup powered by{' '}
        <a
          href="https://openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          OpenStreetMap
        </a>{' '}
        contributors.
      </p>
    </div>
  );
}
