
'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp, GeoPoint } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { MapPin, MessageSquare, User, Clock, CalendarDays } from 'lucide-react'; // Added Clock, CalendarDays icons
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Added Avatar
import { Button } from '@/components/ui/button'; // Added Button import
import { formatDistanceToNow } from 'date-fns'; // Import formatDistanceToNow

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
         // console.log(`Processing post ${doc.id}:`, data); // Log raw data if needed for deep debugging
         if (!data.imageUrl || !data.caption || !data.timestamp || !data.userId) {
             console.warn(`Skipping post ${doc.id} due to missing required fields. Data:`, data);
             skippedCount++;
             return; // Skip this post if essential data is missing
         }
          // Basic type check for timestamp
          if (!(data.timestamp instanceof Timestamp)) {
              console.warn(`Skipping post ${doc.id} due to invalid timestamp type. Received:`, data.timestamp);
              skippedCount++;
              return;
          }
          // Basic type check for location if it exists
          if (data.location && !(data.location instanceof GeoPoint)) {
               console.warn(`Skipping post ${doc.id} due to invalid location type. Received:`, data.location);
               skippedCount++;
               return; // Optionally skip, or handle differently
          }
           // Basic type check for deadline if it exists
          if (data.deadline && !(data.deadline instanceof Timestamp)) {
              console.warn(`Skipping post ${doc.id} due to invalid deadline type. Received:`, data.deadline);
              // Don't necessarily skip, just ignore the invalid deadline
              data.deadline = undefined; // Or set to null
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
      console.error("Error fetching posts from Firestore: ", err);
      // Log the specific error details
      console.error("Firestore error code:", err.code);
      console.error("Firestore error message:", err.message);
      console.error("Firestore error stack:", err.stack);
      setError(`Failed to load posts. Please check your connection and permissions, or try again later. (Code: ${err.code})`);
      setLoading(false); // Ensure loading is set to false even on error
      console.error("Error occurred in onSnapshot listener. Loading set to false.");
    });

    // Cleanup subscription on unmount
    return () => {
        console.log("Cleaning up Firestore listener.");
        unsubscribe();
    }
  }, []); // Empty dependency array means this effect runs only once on mount

  const PostCardSkeleton = () => (
    <Card className="w-full max-w-lg mx-auto mb-6 overflow-hidden shadow-md rounded-lg border border-border">
      <CardHeader className="p-4 flex flex-row items-center space-x-3">
         <Skeleton className="h-10 w-10 rounded-full bg-muted" />
         <div className="space-y-2">
            <Skeleton className="h-4 w-[150px] bg-muted" />
            <Skeleton className="h-3 w-[100px] bg-muted" />
         </div>
      </CardHeader>
      <Skeleton className="w-full h-[300px] md:h-[400px] bg-muted" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-full bg-muted" />
        <Skeleton className="h-4 w-[80%] bg-muted" />
        <Skeleton className="h-4 w-[60%] mt-2 bg-muted" /> {/* Location Skeleton */}
        <Skeleton className="h-4 w-[50%] mt-2 bg-muted" /> {/* Deadline Skeleton */}
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center text-sm text-muted-foreground">
        <Skeleton className="h-4 w-[120px] bg-muted" />
         <Skeleton className="h-4 w-[80px] bg-muted" />
      </CardFooter>
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
    <div className="container mx-auto px-4 py-6">
       <h1 className="text-3xl font-bold text-center mb-8 text-primary">Issue Feed</h1>
      <div className="space-y-6">
        {posts.length === 0 ? (
           <Card className="w-full max-w-lg mx-auto text-center p-6 shadow-md rounded-lg border border-border">
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
            return (
              <Card key={post.id || index} className="w-full max-w-lg mx-auto overflow-hidden shadow-md rounded-lg border border-border transition-shadow duration-300 hover:shadow-lg">
                <CardHeader className="p-4 flex items-center justify-between bg-card">
                   {/* User Info */}
                   <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10 border border-border">
                          {/* Add AvatarImage if you store profile pics */}
                          <AvatarFallback className="bg-secondary"><User className="h-5 w-5 text-muted-foreground"/></AvatarFallback>
                      </Avatar>
                      <div>
                          <p className="text-sm font-medium text-foreground">{post.userName || 'Anonymous User'}</p>
                          <p className="text-xs text-muted-foreground" title={formatFullDate(post.timestamp)}>
                            <Clock className="inline h-3 w-3 mr-0.5 relative -top-px" />
                            {formatRelativeDate(post.timestamp)}
                          </p>
                      </div>
                   </div>
                    {/* Status Badge */}
                   <div>
                      {post.status === 'solved' ? (
                          <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full inline-block border border-green-200">
                          Solved
                          </span>
                      ) : (
                          <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full inline-block border border-orange-200">
                          Pending
                          </span>
                      )}
                   </div>
                </CardHeader>
                {post.imageUrl ? (
                  <div className="relative w-full h-[300px] md:h-[400px] bg-muted">
                    <Image
                      src={post.imageUrl}
                      alt={post.caption || 'Issue Image'}
                      fill // Use fill instead of layout="fill"
                      style={{ objectFit: 'cover' }} // Use style prop for objectFit
                      priority={index < 3} // Prioritize loading first few images
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, 512px" // Provide sizes prop
                      onError={(e) => console.error(`Error loading image: ${post.imageUrl}`, e.currentTarget.srcset)}
                      unoptimized={false} // Ensure optimization is enabled unless specifically needed otherwise
                    />
                  </div>
                ) : (
                   <div className="w-full h-[300px] md:h-[400px] bg-muted flex items-center justify-center text-muted-foreground">
                       <span>Image not available</span>
                   </div>
                )}
                <CardContent className="p-4 bg-card space-y-2">
                  <p className="text-foreground whitespace-pre-wrap">{post.caption || '(No caption provided)'}</p>
                   {post.address ? (
                      <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
                      <span>{post.address}</span>
                      {/* Optional: Link to map */}
                       {post.location && (
                          <a
                          href={`https://www.google.com/maps?q=${post.location.latitude},${post.location.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-accent hover:underline text-xs"
                          aria-label="View location on Google Maps"
                          >
                          (View Map)
                          </a>
                      )}
                      </div>
                   ) : post.location ? (
                        <div className="flex items-center text-sm text-muted-foreground">
                           <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
                           <span>Lat: {post.location.latitude.toFixed(4)}, Lon: {post.location.longitude.toFixed(4)}</span>
                             <a
                              href={`https://www.google.com/maps?q=${post.location.latitude},${post.location.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-accent hover:underline text-xs"
                              aria-label="View location on Google Maps"
                              >
                              (View Map)
                              </a>
                       </div>
                   ) : (
                        <div className="flex items-center text-sm text-muted-foreground">
                           <MapPin className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
                           <span>Location not provided</span>
                       </div>
                   )}
                    {/* Display Deadline */}
                    {formattedDeadline && (
                        <div className="flex items-center text-sm text-muted-foreground">
                            <CalendarDays className="h-4 w-4 mr-1.5 flex-shrink-0 text-red-600" />
                            <span className="text-red-700 font-medium">Deadline: {formattedDeadline}</span>
                        </div>
                    )}

                  {post.municipalReply && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm font-semibold text-green-800 mb-1">Municipal Response:</p>
                      <p className="text-sm text-green-700 whitespace-pre-wrap">{post.municipalReply}</p>
                    </div>
                  )}
                </CardContent>
                {/* Add footer for actions like comments if needed */}
                {/* Example Footer:
                <CardFooter className="p-4 flex justify-start items-center text-sm text-muted-foreground border-t border-border bg-card">
                   <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                     <MessageSquare className="h-4 w-4 mr-1" /> Comment
                   </Button>
                </CardFooter> */}
              </Card>
            )
          })
        )}
      </div>
    </div>
  );
}
