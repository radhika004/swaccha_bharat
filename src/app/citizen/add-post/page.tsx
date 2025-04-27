
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
  const [deadline, setDeadline] = useState<Date | undefined>(undefined); // State for deadline
  const [isLocating, setIsLocating] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // This state manages the overall submission loading
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
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
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // ~5MB limit
        setError('Image size should not exceed 5MB.');
        toast({
          title: 'File Too Large',
          description: 'Image size should not exceed 5MB.',
          variant: 'destructive',
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        console.log('Image preview generated.');
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const triggerFileInput = () => {
    console.log('Triggering file input click.');
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
          description: `Location set: ${fetchedAddress}`,
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Options
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
      router.push('/auth/citizen');
      return;
    }
    console.log('User authenticated:', auth.currentUser.uid);

    console.log('Checking for image file...');
    if (!imageFile) {
      setError('Please select an image.');
      toast({
        title: 'Missing Image',
        description: 'Please select an image to upload.',
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
    setIsLoading(true);

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
          'Anonymous User',
        imageUrl: imageUrl,
        caption: caption.trim(),
        timestamp: serverTimestamp(),
        status: 'pending',
      };

      if (location) {
        postData.location = new GeoPoint(location.latitude, location.longitude);
        console.log('Location GeoPoint added:', postData.location);
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
      console.log('Post data saved:', postData); // Verify saved data

      toast({ title: 'Success!', description: 'Your issue has been reported.' });

      console.log('Navigating to /citizen/home...');
      router.push('/citizen/home');

    } catch (err: any) {
      console.error('Error submitting post:', err);
      if (err.code) {
        console.error(`Firebase Error Code: ${err.code}`);
        console.error(`Firebase Error Message: ${err.message}`);
      }
      setError(
        `Failed to submit post: ${err.message}. Please check console for details.`
      );
      toast({
        title: 'Submission Failed',
        description: `Error: ${err.message}`,
        variant: 'destructive',
      });
      setIsLoading(false); // Stop loading ONLY on error
    }
    // Do not set isLoading to false here on success, navigation handles it.
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-primary">
            Report an Issue
          </CardTitle>
          <CardDescription className="text-center">
            Upload a picture and describe the cleanliness issue.
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
            {/* Image Upload */}
            <div>
              <Label htmlFor="image" className="mb-2 block font-medium">
                Issue Image *
              </Label>
              <Input
                id="image"
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                capture="environment"
                className="hidden"
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={triggerFileInput}
                className="w-full border-dashed border-primary text-primary hover:bg-primary/10 flex items-center justify-center py-6"
              >
                <Camera className="h-6 w-6 mr-2" />
                <span>
                  {imagePreview
                    ? 'Change Photo'
                    : 'Click to Upload or Take Photo'}
                </span>
              </Button>
              {imagePreview && (
                <div className="mt-4 border rounded-md overflow-hidden aspect-video relative">
                  <Image
                    src={imagePreview}
                    alt="Selected preview"
                    fill
                    style={{ objectFit: 'cover' }}
                    priority
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
            disabled={isLoading || !imageFile || !caption.trim()}
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


    