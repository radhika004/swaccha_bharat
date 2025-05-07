'use client';

import type { ChangeEvent, FormEvent } from 'react';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  X, 
  Map, 
  Sparkles, // Icon for AI categorization
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
import { categorizeIssue } from '@/ai/flows/categorize-issue-flow'; // Import AI categorization flow

interface Location {
  latitude: number;
  longitude: number;
}

// Mock function since OpenStreetMap fetch is removed
async function getAddressFromCoordinates(lat: number, lon: number): Promise<string | null> {
  console.log(`Mock fetching address for: Lat ${lat}, Lon ${lon}`);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  return `Mock Address near ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

export default function AddPostPage() {
  const [caption, setCaption] = useState('');
  // Removed category state: const [category, setCategory] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false); // State for AI categorization
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

   useEffect(() => {
    return () => {
      stopCameraStream();
      console.log("Cleanup: Camera stream stopped on unmount.");
    };
  }, []);

  const requestCameraPermission = async () => {
    if (hasCameraPermission === true) return true;
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
    stopCameraStream();
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
    clearImageState();
    setError(null);
    const permissionGranted = await requestCameraPermission();
    if (permissionGranted) {
      setShowCameraPreview(true);
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

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const capturedFile = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setImageFile(capturedFile);
        setImagePreview(URL.createObjectURL(capturedFile));
        setShowCameraPreview(false);
        stopCameraStream();
        setError(null);
         toast({ title: "Photo Captured!", description: "Image ready for upload." });
      } else {
        setError("Failed to capture photo.");
        toast({ title: "Capture Failed", variant: "destructive" });
      }
    }, 'image/jpeg', 0.9);
  };

  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
       if (videoRef.current) videoRef.current.srcObject = null;
      console.log("Camera stream stopped.");
    }
     setShowCameraPreview(false);
  };

  const triggerFileInput = () => {
    stopCameraStream();
    fileInputRef.current?.click();
  };

   const clearImageState = () => {
     setImageFile(null);
     setImagePreview(null);
     if (fileInputRef.current) fileInputRef.current.value = "";
   };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      toast({ title: 'Geolocation Error', variant: 'destructive' });
      return;
    }
    setIsLocating(true);
    setError(null);
    setLocation(null);
    setAddress(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`Location obtained: Lat ${latitude}, Lon ${longitude}`);
        const newLocation = { latitude, longitude };
        setLocation(newLocation);
        const fetchedAddress = await getAddressFromCoordinates(latitude, longitude);
        setAddress(fetchedAddress ?? `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

   const handlePickLocation = () => {
     handleGetLocation();
     toast({ title: "Location Picker (Mock)", description: "Using current location for now." });
   };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!imageFile || !imagePreview) {
      setError('Please select or capture an image.');
      toast({ title: 'Missing Image', variant: 'destructive' });
      return;
    }
    if (!caption.trim()) {
      setError('Please enter a caption.');
      toast({ title: 'Missing Caption', variant: 'destructive' });
      return;
    }
    if (!location) {
      setError('Please add a location for the issue.');
      toast({ title: 'Missing Location', variant: 'destructive' });
      return;
    }

    setIsCategorizing(true);
    setUploadProgress(0); // Reset progress for potential re-submission
    toast({ title: 'Categorizing Issue...', description: 'AI is analyzing your report.' });

    let issueCategory = 'other'; // Default category
    try {
      const categorizationResult = await categorizeIssue({
        caption: caption.trim(),
        imageDataUri: imagePreview, // Send image preview (data URI) to AI
      });
      issueCategory = categorizationResult.category;
      toast({ title: 'Issue Categorized!', description: `Category: ${issueCategory}` });
    } catch (aiError: any) {
      console.error('AI Categorization Error:', aiError);
      setError(`AI categorization failed: ${aiError.message}. Defaulting to 'other'.`);
      toast({ title: 'AI Error', description: 'Could not categorize issue, using default.', variant: 'destructive' });
      // Continue with 'other' category
    } finally {
      setIsCategorizing(false);
    }

    setIsSubmitting(true); // Now proceed to submission simulation

    console.log('Frontend-only: Simulating post submission...');
    console.log('Caption:', caption.trim());
    console.log('AI Category:', issueCategory); // Log AI category
    console.log('Image File:', imageFile.name);
    console.log('Location:', location);
    console.log('Address:', address);
    console.log('Deadline:', deadline);

    // Simulate upload progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 20;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(progressInterval);
        console.log('Simulated upload complete.');

        setTimeout(() => {
            toast({ title: 'Success!', description: 'Your issue has been reported (Simulated).' });
            setIsSubmitting(false);
            setUploadProgress(0);

            const newPost = {
                id: `mock_${Date.now()}`,
                imageUrl: imagePreview || 'https://picsum.photos/600/600?grayscale',
                caption: caption.trim(),
                category: issueCategory, // Use AI-determined category
                location: location ? { latitude: location.latitude, longitude: location.longitude } : undefined,
                address: address,
                timestamp: new Date().toISOString(),
                userId: 'mock_citizen_user',
                userName: 'Citizen User (Mock)',
                status: 'pending' as 'pending',
                deadline: deadline?.toISOString(),
            };
            try {
                const existingPosts = JSON.parse(localStorage.getItem('mockPosts') || '[]');
                localStorage.setItem('mockPosts', JSON.stringify([newPost, ...existingPosts]));
                console.log('Mock post saved to localStorage with AI category.');
            } catch (storageError) {
                console.error("Error saving mock post to localStorage:", storageError);
                setError("Could not save the post locally.");
            }
            router.push('/citizen/home');
        }, 500);
      }
    }, 300);
  };

  const isFormInvalid = !imageFile || !caption.trim() || !location;

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <Card className="w-full shadow-xl border border-primary/10 rounded-lg">
        <CardHeader className="bg-primary/5 p-6 rounded-t-lg">
          <CardTitle className="text-2xl font-bold text-center text-primary">
            Report an Issue
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground pt-1">
            Capture/upload picture, add details, and specify the location. The issue will be automatically categorized.
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
            <div>
              <Label htmlFor="image-upload" className="mb-2 block font-medium text-gray-700">
                Issue Image *
              </Label>
              <div className="mt-1 flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-md space-y-4 bg-gray-50/50">
                  <Input
                    id="image-upload"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                    disabled={isSubmitting || isCategorizing}
                  />
                  <canvas ref={canvasRef} className="hidden"></canvas>

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

                 {imagePreview && !showCameraPreview && (
                  <div className="mb-2 w-full max-w-xs aspect-square rounded-md overflow-hidden border bg-muted relative">
                    <Image
                      src={imagePreview}
                      alt="Selected preview"
                      fill
                      style={{ objectFit: 'contain' }}
                      sizes="(max-width: 640px) 90vw, 320px"
                      data-ai-hint="waste management urban issue"
                    />
                     <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-80 hover:opacity-100"
                        onClick={clearImageState}
                        aria-label="Remove image"
                        disabled={isSubmitting || isCategorizing}
                      >
                       <X className="h-4 w-4" />
                     </Button>
                  </div>
                )}

                 <div className="flex gap-3 justify-center w-full">
                     <Button
                       type="button"
                       variant="outline"
                       onClick={triggerFileInput}
                       disabled={isSubmitting || isCategorizing}
                       className="flex-1 border-primary text-primary hover:bg-primary/10"
                     >
                       <UploadCloud className="h-5 w-5 mr-2" /> Upload
                     </Button>
                     <Button
                       type="button"
                       variant="outline"
                       onClick={showCameraPreview ? handleCapturePhoto : handleTakePhotoClick}
                       disabled={isSubmitting || isCategorizing || hasCameraPermission === false}
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

            {/* Category is now automatically determined, so dropdown is removed */}
            {/* Removed Category Dropdown */}

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
                disabled={isSubmitting || isCategorizing}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {caption.length}/500
              </p>
            </div>

            <div>
               <Label className="font-medium text-gray-700">Location *</Label>
               <div className="flex gap-3 mt-1">
                 <Button
                   type="button"
                   variant="outline"
                   onClick={handleGetLocation}
                   disabled={isLocating || isSubmitting || isCategorizing}
                   className="flex-1 flex items-center justify-center text-accent border-accent hover:bg-accent/10 shadow-sm"
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePickLocation}
                    disabled={isLocating || isSubmitting || isCategorizing}
                    className="flex-1 flex items-center justify-center text-primary border-primary hover:bg-primary/10 shadow-sm"
                    title="Pick location on map (mock - uses current)"
                   >
                      <Map className="h-5 w-5 mr-2"/> Pick on Map (Mock)
                   </Button>
               </div>
               {address && (
                 <p className="text-sm text-muted-foreground mt-2 flex items-start gap-1.5">
                   <MapPin className="h-4 w-4 mr-0 flex-shrink-0 mt-px text-gray-500" />
                   <span className="line-clamp-2">{address}</span>
                 </p>
               )}
             </div>

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
                     disabled={isSubmitting || isCategorizing}
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
                    disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {(isCategorizing || (isSubmitting && uploadProgress > 0)) && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-primary">
                    {isCategorizing ? "Categorizing Issue with AI..." : "Submitting Issue..."}
                  </Label>
                  {isSubmitting && <Progress value={uploadProgress} className="w-full h-2" />}
                  {isSubmitting && <p className="text-xs text-muted-foreground text-right">{Math.round(uploadProgress)}%</p>}
                  {isCategorizing && <Loader2 className="h-5 w-5 animate-spin text-primary mt-1" />}
                </div>
            )}
          </form>
        </CardContent>
        <CardFooter className="p-6 bg-gray-50/50 rounded-b-lg">
          <Button
            type="submit"
            form="add-post-form"
            className="w-full bg-primary hover:bg-primary/90 text-lg py-3 font-semibold shadow-md disabled:opacity-70"
            disabled={isSubmitting || isCategorizing || isFormInvalid}
          >
            {isCategorizing ? (
              <>
                <Sparkles className="mr-2 h-5 w-5 animate-pulse" /> Categorizing...
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...
              </>
            ) : (
              'Post Issue'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}