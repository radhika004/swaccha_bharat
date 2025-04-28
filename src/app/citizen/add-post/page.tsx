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
import { ref, uploadBytesResumable, getDownloadURL, type UploadTaskSnapshot } from 'firebase/storage';
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
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  Camera,
  MapPin,
  LocateFixed,
  Calendar as CalendarIcon,
  AlertCircle,
  Video,
  VideoOff,
  UploadCloud,
  Check,
  Image as ImageIcon,
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

// Helper function to get address from coordinates (Reverse Geocoding - OpenStreetMap)
async function getAddressFromCoordinates(lat: number, lon: number): Promise<string | null> {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=en`);
    if (!response.ok) throw new Error(`Nominatim API error: ${response.statusText}`);
    const data = await response.json();
    return data.display_name || null;
  } catch (error) {
    console.error('Error fetching address:', error);
    return null; // Return null on error
  }
}

export default function AddPostPage() {
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [address, setAddress] = useState<string | null>(null); // Store address separately
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const router = useRouter();
  const { toast } = useToast();

   // Cleanup camera stream on component unmount
   useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        console.log("Camera stream stopped on unmount.");
      }
    };
  }, [stream]);

  // Function to request camera permission
  const requestCameraPermission = async () => {
    if (hasCameraPermission === true) return true; // Already have permission
    if (!navigator.mediaDevices?.getUserMedia) {
      console.warn('Camera API not supported.');
      setHasCameraPermission(false);
      toast({ title: "Camera Not Supported", variant: "destructive" });
      return false;
    }
    try {
      console.log("Requesting camera permission...");
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(mediaStream);
      setHasCameraPermission(true);
      console.log("Camera permission granted.");
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      return true;
    } catch (err) {
      console.error('Error accessing camera:', err);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in browser settings.',
      });
      return false;
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    stopCameraStream(); // Stop camera if file is selected
    setShowCameraPreview(false);

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        toast({ title: 'Invalid File Type', variant: 'destructive' });
        clearImageState();
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Image size exceeds 10MB.');
        toast({ title: 'File Too Large', variant: 'destructive' });
        clearImageState();
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleTakePhotoClick = async () => {
    clearImageState(); // Clear previous file/preview
    setError(null);
    const permissionGranted = await requestCameraPermission();
    if (permissionGranted) {
      setShowCameraPreview(true);
       // Ensure stream is active and attached
       if (!videoRef.current?.srcObject && stream) {
           videoRef.current!.srcObject = stream;
       }
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !stream) {
      setError("Camera feed not available."); return;
    }
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) { setError("Could not process image."); return; }

    canvas.width = video.videoWidth; // Use actual video dimensions
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const capturedFile = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setImageFile(capturedFile);
        setImagePreview(URL.createObjectURL(capturedFile)); // Show captured preview
        setShowCameraPreview(false);
        stopCameraStream(); // Stop stream after capture
        setError(null);
         toast({ title: "Photo Captured!", description: "Image ready for upload." });
      } else {
        setError("Failed to capture photo.");
        toast({ title: "Capture Failed", variant: "destructive" });
      }
    }, 'image/jpeg', 0.9); // Quality 0.9
  };

  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
       if (videoRef.current) videoRef.current.srcObject = null;
      console.log("Camera stream stopped.");
    }
     setShowCameraPreview(false); // Also hide preview when stopping
  };

  const triggerFileInput = () => {
    stopCameraStream(); // Ensure camera is off
    fileInputRef.current?.click();
  };

   const clearImageState = () => {
     setImageFile(null);
     setImagePreview(null);
     if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
   };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      toast({ title: 'Geolocation Error', variant: 'destructive' });
      return;
    }
    setIsLocating(true);
    setError(null);
    setAddress(null); // Clear old address

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`Location obtained: Lat ${latitude}, Lon ${longitude}`);
        setLocation({ latitude, longitude });
        const fetchedAddress = await getAddressFromCoordinates(latitude, longitude);
         setAddress(fetchedAddress ?? `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`); // Use coords as fallback
        setIsLocating(false);
        toast({ title: 'Location Added', description: fetchedAddress ? 'Address found.' : 'Coordinates saved.' });
      },
      (err) => {
        console.error('Error getting location:', err);
        let message = 'Failed to get location.';
        if (err.code === err.PERMISSION_DENIED) message = 'Location permission denied.';
        else if (err.code === err.POSITION_UNAVAILABLE) message = 'Location information unavailable.';
        else if (err.code === err.TIMEOUT) message = 'Getting location timed out.';
        setError(message);
        toast({ title: 'Location Error', description: message, variant: 'destructive' });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 } // Options
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!auth.currentUser) {
      setError('You must be logged in to post.');
      toast({ title: 'Not Logged In', variant: 'destructive' });
      router.push('/auth/citizen'); return;
    }
    if (!imageFile) {
      setError('Please select or capture an image.');
      toast({ title: 'Missing Image', variant: 'destructive' });
      return;
    }
    if (!caption.trim()) {
      setError('Please enter a caption.');
      toast({ title: 'Missing Caption', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // 1. Upload Image to Firebase Storage
      const storagePath = `posts/${auth.currentUser.uid}/${Date.now()}_${imageFile.name}`;
      const imageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(imageRef, imageFile);

      uploadTask.on('state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          console.log('Upload is ' + progress + '% done');
        },
        (uploadError) => {
          console.error('Upload failed:', uploadError);
          setError(`Image upload failed: ${uploadError.message}`);
          toast({ title: 'Upload Failed', variant: 'destructive' });
          setIsSubmitting(false);
          setUploadProgress(0);
        },
        async () => {
          // 2. Get Download URL
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('File available at', downloadURL);

            // 3. Prepare Post Data for Firestore
            const postData: any = {
              userId: auth.currentUser!.uid,
              userName: auth.currentUser!.displayName || auth.currentUser!.phoneNumber || 'Citizen User',
              imageUrl: downloadURL,
              caption: caption.trim(),
              timestamp: serverTimestamp(),
              status: 'pending', // Initial status
            };
            if (location) {
              postData.location = new GeoPoint(location.latitude, location.longitude);
            }
            if (address) { // Save the fetched or fallback address
              postData.address = address;
            }
            if (deadline) {
              postData.deadline = Timestamp.fromDate(deadline);
            }

            // 4. Add Document to Firestore
            console.log('Saving post data to Firestore:', postData);
            const docRef = await addDoc(collection(db, 'posts'), postData);
            console.log('Post submitted successfully! Document ID:', docRef.id);

            toast({ title: 'Success!', description: 'Your issue has been reported.' });
            setIsSubmitting(false);
            setUploadProgress(0);

            // 5. Navigate to Home Feed AFTER successful submission
            router.push('/citizen/home');

          } catch (firestoreError: any) {
             console.error('Error saving post to Firestore:', firestoreError);
             setError(`Failed to save post details: ${firestoreError.message}`);
             toast({ title: 'Submission Failed', description: 'Could not save post details.', variant: 'destructive' });
             setIsSubmitting(false);
             setUploadProgress(0);
          }
        }
      );
    } catch (err: any) {
      console.error('Error starting upload or preparing data:', err);
      setError(`Failed to submit post: ${err.message}`);
      toast({ title: 'Submission Error', variant: 'destructive' });
      setIsSubmitting(false);
      setUploadProgress(0);
    }
    // Removed finally block as navigation happens inside the upload success callback
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <Card className="w-full shadow-xl border border-primary/10 rounded-lg">
        <CardHeader className="bg-primary/5 p-6 rounded-t-lg">
          <CardTitle className="text-2xl font-bold text-center text-primary">
            Report an Issue
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground pt-1">
            Capture or upload a picture and describe the cleanliness issue.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form id="add-post-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Image Area */}
            <div>
              <Label htmlFor="image-upload" className="mb-2 block font-medium text-gray-700">
                Issue Image *
              </Label>
              <div className="mt-1 flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-md space-y-4 bg-gray-50/50">
                 {/* Hidden File Input */}
                  <Input
                    id="image-upload"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                    disabled={isSubmitting}
                  />
                   {/* Hidden Canvas for Capturing Photo */}
                  <canvas ref={canvasRef} className="hidden"></canvas>

                  {/* Camera Preview Area */}
                  {showCameraPreview && (
                      <div className="w-full aspect-video rounded-md overflow-hidden border bg-black mb-2">
                          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                           {hasCameraPermission === false && (
                              <Alert variant="destructive" className="m-2">
                                  <VideoOff className="h-4 w-4" />
                                  <AlertTitle>Camera Access Denied</AlertTitle>
                              </Alert>
                           )}
                      </div>
                  )}

                 {/* Image Preview Area */}
                 {imagePreview && !showCameraPreview && (
                  <div className="mb-2 w-full max-w-xs aspect-square rounded-md overflow-hidden border bg-muted relative">
                    <Image
                      src={imagePreview}
                      alt="Selected preview"
                      fill
                      style={{ objectFit: 'contain' }}
                      sizes="(max-width: 640px) 90vw, 320px"
                    />
                     <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-80 hover:opacity-100"
                        onClick={clearImageState}
                        aria-label="Remove image"
                        disabled={isSubmitting}
                      >
                       <X className="h-4 w-4" />
                     </Button>
                  </div>
                )}

                 {/* Buttons */}
                 <div className="flex gap-3 justify-center w-full">
                     <Button
                       type="button"
                       variant="outline"
                       onClick={triggerFileInput}
                       disabled={isSubmitting}
                       className="flex-1 border-primary text-primary hover:bg-primary/10"
                     >
                       <UploadCloud className="h-5 w-5 mr-2" /> Upload
                     </Button>
                     <Button
                       type="button"
                       variant="outline"
                       onClick={showCameraPreview ? handleCapturePhoto : handleTakePhotoClick}
                       disabled={isSubmitting || hasCameraPermission === false}
                       className="flex-1 border-accent text-accent hover:bg-accent/10 disabled:opacity-60"
                     >
                       {showCameraPreview ? (
                          <><Check className="h-5 w-5 mr-2" /> Capture</>
                       ) : (
                          <><Camera className="h-5 w-5 mr-2" /> Take Photo</>
                       )}
                     </Button>
                 </div>
              </div>
            </div>

            {/* Caption */}
            <div>
              <Label htmlFor="caption" className="font-medium text-gray-700">
                Caption *
              </Label>
              <Textarea
                id="caption"
                placeholder="Describe the issue (e.g., Overflowing bin near park entrance)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                required
                className="mt-1 min-h-[100px] shadow-inner focus:ring-primary focus:border-primary"
                maxLength={500}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {caption.length}/500
              </p>
            </div>

            {/* Geolocation */}
            <div>
              <Label className="font-medium text-gray-700">Location (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                onClick={handleGetLocation}
                disabled={isLocating || isSubmitting}
                className="w-full mt-1 flex items-center justify-center text-accent border-accent hover:bg-accent/10 shadow-sm"
              >
                {isLocating ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : location ? (
                  <MapPin className="h-5 w-5 mr-2 text-green-600" />
                ) : (
                  <LocateFixed className="h-5 w-5 mr-2" />
                )}
                <span>
                  {isLocating ? 'Locating...' : location ? 'Location Added' : 'Add Current Location'}
                </span>
              </Button>
              {address && (
                <p className="text-sm text-muted-foreground mt-2 flex items-start gap-1.5">
                  <MapPin className="h-4 w-4 mr-0 flex-shrink-0 mt-px text-gray-500" />
                  <span className="line-clamp-2">{address}</span>
                </p>
              )}
            </div>

            {/* Deadline Picker */}
            <div>
              <Label htmlFor="deadline" className="font-medium text-gray-700">
                Resolution Deadline (Optional)
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="deadline"
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal mt-1 shadow-sm',
                      !deadline && 'text-muted-foreground'
                    )}
                     disabled={isSubmitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, 'PPP') : <span>Pick a desired resolution date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} // Disable past dates only
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Upload Progress */}
            {isSubmitting && uploadProgress > 0 && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-primary">Uploading Image...</Label>
                  <Progress value={uploadProgress} className="w-full h-2" />
                  <p className="text-xs text-muted-foreground text-right">{Math.round(uploadProgress)}%</p>
                </div>
            )}
          </form>
        </CardContent>
        <CardFooter className="p-6 bg-gray-50/50 rounded-b-lg">
          <Button
            type="submit"
            form="add-post-form"
            className="w-full bg-primary hover:bg-primary/90 text-lg py-3 font-semibold shadow-md disabled:opacity-70"
            disabled={isSubmitting || !imageFile || !caption.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...
              </>
            ) : (
              'Post Issue'
            )}
          </Button>
        </CardFooter>
      </Card>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Address lookup uses{' '}
        <a
          href="https://openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-accent"
        >
          OpenStreetMap
        </a>{' '}
        data.
      </p>
    </div>
  );
}

// Added X icon import
import { X } from 'lucide-react';
