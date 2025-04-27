
'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp, GeoPoint } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { MapPin, User, Clock, CalendarDays, Heart, MessageCircle, Send, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  location?: GeoPoint; // Use Firestore GeoPoint type
  address?: string; // Add address field
  timestamp: Timestamp;
  userId: string;
  userName?: string; // Add username field
  status?: 'pending' | 'solved';
  municipalReply?: string;
  deadline?: Timestamp; // Add deadline field
}

// Helper function to format Firestore Timestamp (full date)
const formatFullDate = (timestamp: Timestamp): string => {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
      console.warn("Invalid timestamp received:", timestamp);
      return 'Invalid date'; // Handle potential errors if timestamp is not valid or missing
  }
  try {
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    console.error("Error formatting timestamp:", e, timestamp);
    return 'Error date';
  }
};

// Helper function to format date relative to now (e.g., "2 days ago")
const formatRelativeDate = (timestamp: Timestamp): string => {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
        return 'a while ago';
    }
    try {
        return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
    } catch (e) {
        console.error("Error formatting relative date:", e, timestamp);
        return 'Error date';
    }
};

// Helper function to format deadline date
const formatDeadline = (timestamp?: Timestamp): string | null => {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
        return null;
    }
    try {
        return timestamp.toDate().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch (e) {
        console.error("Error formatting deadline:", e, timestamp);
        return 'Error date';
    }
};

export default function CitizenHomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null); // Clear previous errors
    console.log("Setting up Firestore listener for posts...");

    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log(`Received snapshot with ${querySnapshot.size} documents.`);
      const postsData: Post[] = [];
      let skippedCount = 0;
      querySnapshot.forEach((doc) => {
         const data = doc.data();
         // --- Data Validation & Logging ---
         if (!data.imageUrl || !data.caption || !data.timestamp || !data.userId) {
             console.warn(`Skipping post ${doc.id} due to missing required fields. Data:`, data);
             skippedCount++;
             return; // Skip this post if essential data is missing
         }
          if (!(data.timestamp instanceof Timestamp)) {
              console.warn(`Skipping post ${doc.id} due to invalid timestamp type. Received:`, data.timestamp);
              skippedCount++;
              return;
          }
          if (data.location && !(data.location instanceof GeoPoint)) {
               console.warn(`Skipping post ${doc.id} due to invalid location type. Received:`, data.location);
               skippedCount++;
               return;
          }
           if (data.deadline && !(data.deadline instanceof Timestamp)) {
               console.warn(`Skipping post ${doc.id} due to invalid deadline type. Received:`, data.deadline);
               data.deadline = undefined; // Treat invalid deadline as undefined
           }


         postsData.push({
             id: doc.id,
             imageUrl: data.imageUrl,
             caption: data.caption,
             location: data.location, // Keep as GeoPoint
             address: data.address,
             timestamp: data.timestamp,
             userId: data.userId,
             userName: data.userName || 'Anonymous User', // Provide fallback
             status: data.status || 'pending', // Provide fallback status
             municipalReply: data.municipalReply,
             deadline: data.deadline // Add deadline here
         });
      });
      if (skippedCount > 0) {
          console.log(`Skipped ${skippedCount} posts due to validation issues.`);
      }
      console.log("Processed posts data count:", postsData.length);
      setPosts(postsData);
      setLoading(false); // Set loading to false after successful processing
      console.log("State updated with posts. Loading set to false.");
    }, (err) => {
      // Enhanced error logging
      console.error("Error fetching posts from Firestore: ", err);
      console.error("Firestore error code:", err.code);
      console.error("Firestore error message:", err.message);
      console.error("Firestore error stack:", err.stack); // Log stack trace for more context
      setError(`Failed to load posts. Please check your connection and permissions, or try again later. (Code: ${err.code})`);
      setLoading(false); // Ensure loading is set to false even on error
      console.error("Error occurred in onSnapshot listener. Loading set to false.");
    });

    // Cleanup subscription on unmount
    return () => {
        console.log("Cleaning up Firestore listener.");
        unsubscribe();
    }
    // Removed dependency array: This effect should run only once on mount to set up the listener.
    // Re-running on state changes (like 'posts') could lead to infinite loops or unexpected behavior.
  }, []);

  const PostCardSkeleton = () => (
    <Card className="w-full max-w-lg mx-auto mb-6 overflow-hidden shadow-md rounded-lg border border-border">
      <CardHeader className="p-3 flex flex-row items-center space-x-3">
         <Skeleton className="h-9 w-9 rounded-full bg-muted" />
         <div className="space-y-1.5">
            <Skeleton className="h-4 w-[150px] bg-muted" />
            <Skeleton className="h-3 w-[100px] bg-muted" />
         </div>
      </CardHeader>
      <Skeleton className="w-full h-[400px] md:h-[500px] bg-muted" />
      <CardContent className="p-3 space-y-2">
          <div className="flex space-x-3">
            <Skeleton className="h-6 w-6 rounded-full bg-muted" />
            <Skeleton className="h-6 w-6 rounded-full bg-muted" />
            <Skeleton className="h-6 w-6 rounded-full bg-muted" />
          </div>
        <Skeleton className="h-4 w-full bg-muted" />
        <Skeleton className="h-4 w-[80%] bg-muted" />
        <Skeleton className="h-3 w-[60%] mt-1 bg-muted" />
      </CardContent>
    </Card>
  );


  if (loading) {
       return (
           <div className="container mx-auto px-4 py-6">
               <h1 className="text-3xl font-bold text-center mb-8 text-primary">Issue Feed</h1>
               <div className="space-y-6">
                  <PostCardSkeleton />
                  <PostCardSkeleton />
                  <PostCardSkeleton />
               </div>
           </div>
       );
  }


  if (error) {
    return (
        <div className="container mx-auto px-4 py-6">
             <Alert variant="destructive" className="max-w-lg mx-auto">
              <AlertTitle>Error Loading Feed</AlertTitle>
              <AlertDescription>
                  {error}
                  <br />
                  <Button onClick={() => window.location.reload()} variant="link" className="p-0 h-auto mt-2 text-destructive-foreground">
                      Try Refreshing
                  </Button>
              </AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-0 sm:px-4 py-6"> {/* Removed horizontal padding on small screens */}
       <h1 className="text-3xl font-bold text-center mb-8 text-primary sr-only">Issue Feed</h1> {/* Made title screen-reader only */}
      <div className="space-y-6">
        {posts.length === 0 ? (
           <Card className="w-full max-w-lg mx-auto text-center p-6 shadow-md rounded-lg border border-border mt-10">
             <CardContent>
                <p className="text-muted-foreground">No issues reported yet.</p>
                <Button asChild variant="link" className="mt-2">
                    <Link href="/citizen/add-post">Be the first to report an issue!</Link>
                </Button>
             </CardContent>
           </Card>
        ) : (
          posts.map((post, index) => {
            const formattedDeadline = formatDeadline(post.deadline);
            const relativeDate = formatRelativeDate(post.timestamp);
            const fullDate = formatFullDate(post.timestamp);

            return (
              // Use rounded-none on small screens for edge-to-edge feel
              <Card key={post.id || index} className="w-full max-w-lg mx-auto overflow-hidden shadow-none sm:shadow-md rounded-none sm:rounded-lg border-b sm:border border-border transition-shadow duration-300 hover:shadow-lg">
                {/* Post Header */}
                <CardHeader className="p-3 flex items-center justify-between bg-card border-b sm:border-none">
                   <div className="flex items-center space-x-3">
                      <Avatar className="h-9 w-9 border border-border">
                          {/* Add AvatarImage if user profile pics are stored */}
                          <AvatarFallback className="bg-secondary text-xs"><User className="h-4 w-4 text-muted-foreground"/></AvatarFallback>
                      </Avatar>
                      <div>
                          <p className="text-sm font-medium text-foreground">{post.userName || 'Anonymous User'}</p>
                          {/* Show address or relative location in header if available */}
                          {post.address ? (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px] hover:max-w-none hover:whitespace-normal" title={post.address}>
                                  <MapPin className="inline h-3 w-3 mr-0.5 relative -top-px" />
                                  {post.address.split(',')[0]} {/* Show first part of address */}
                              </p>
                          ) : post.location ? (
                             <p className="text-xs text-muted-foreground">
                                <MapPin className="inline h-3 w-3 mr-0.5 relative -top-px" />
                                Near {post.location.latitude.toFixed(2)}, {post.location.longitude.toFixed(2)}
                                 <a href={`https://www.google.com/maps?q=${post.location.latitude},${post.location.longitude}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-accent hover:underline" aria-label="View location on Google Maps">(Map)</a>
                             </p>
                          ) : <p className="text-xs text-muted-foreground italic">Location not provided</p>}
                      </div>
                   </div>
                   {/* Status Icon */}
                   <div>
                      {post.status === 'solved' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" title="Solved" />
                      ) : (
                          <AlertTriangle className="h-5 w-5 text-orange-500" title="Pending" />
                      )}
                   </div>
                </CardHeader>

                {/* Post Image */}
                {post.imageUrl ? (
                  <div className="relative w-full aspect-square bg-muted"> {/* Maintain aspect ratio */}
                    <Image
                      src={post.imageUrl}
                      alt={post.caption || 'Issue Image'}
                      fill
                      style={{ objectFit: 'cover' }} // Use cover for better fill
                      priority={index < 3} // Prioritize loading first few images
                      sizes="(max-width: 640px) 100vw, 512px" // Responsive image sizes
                      onError={(e) => console.error(`Error loading image: ${post.imageUrl}`, e.currentTarget.srcset)}
                      // Consider adding placeholder="blur" and blurDataURL if generating previews
                    />
                  </div>
                ) : (
                   <div className="w-full aspect-square bg-muted flex items-center justify-center text-muted-foreground">
                       <span>Image not available</span>
                   </div>
                )}

                 {/* Post Content & Actions */}
                <CardContent className="p-3 bg-card space-y-2">
                    {/* Action Icons */}
                    <div className="flex items-center space-x-3 mb-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-full">
                            <Heart className="h-5 w-5"/>
                            <span className="sr-only">Like</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-full">
                             <MessageCircle className="h-5 w-5"/>
                            <span className="sr-only">Comment</span>
                        </Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-full">
                             <Send className="h-5 w-5"/>
                             <span className="sr-only">Share</span>
                        </Button>
                         {/* Maybe a bookmark icon on the right */}
                    </div>

                  {/* Caption */}
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{post.userName || 'Anonymous User'}</span>
                    <span className="ml-1 whitespace-pre-wrap">{post.caption || '(No caption provided)'}</span>
                  </p>

                  {/* Location and Address (Combined) */}
                   {post.address ? (
                        <div className="flex items-center text-xs text-muted-foreground pt-1">
                           <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                           <span className="truncate" title={post.address}>
                               {post.address}
                               {post.location && <a href={`https://www.google.com/maps?q=${post.location.latitude},${post.location.longitude}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-accent hover:underline" aria-label="View location on Google Maps">(Map)</a>}
                            </span>
                        </div>
                    ) : post.location ? (
                        <div className="flex items-center text-xs text-muted-foreground pt-1">
                           <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                           <span>Lat: {post.location.latitude.toFixed(3)}, Lon: {post.location.longitude.toFixed(3)}</span>
                            <a href={`https://www.google.com/maps?q=${post.location.latitude},${post.location.longitude}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-accent hover:underline" aria-label="View location on Google Maps">(Map)</a>
                        </div>
                    ) : null}


                    {/* Deadline */}
                    {formattedDeadline && (
                        <div className="flex items-center text-xs text-red-600 font-medium pt-1">
                            <CalendarDays className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                            <span>Deadline: {formattedDeadline}</span>
                        </div>
                    )}

                    {/* Municipal Reply */}
                   {post.municipalReply && (
                    <div className="mt-2 p-2 bg-secondary/50 border border-border rounded-md">
                      <p className="text-xs font-medium text-foreground mb-0.5">Municipal Response:</p>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{post.municipalReply}</p>
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs text-muted-foreground pt-1" title={fullDate}>
                    <Clock className="inline h-3 w-3 mr-0.5 relative -top-px" />
                    {relativeDate}
                  </p>

                </CardContent>

              </Card>
            )
          })
        )}
      </div>
    </div>
  );
}
