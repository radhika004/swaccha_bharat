'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp, GeoPoint } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { MapPin, MessageSquare, User } from 'lucide-react'; // Added User icon
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Added Avatar


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
}

// Helper function to format Firestore Timestamp
const formatDate = (timestamp: Timestamp): string => {
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
      querySnapshot.forEach((doc) => {
         const data = doc.data();
         // --- Data Validation & Logging ---
          console.log(`Processing post ${doc.id}:`, data); // Log raw data
         if (!data.imageUrl || !data.caption || !data.timestamp || !data.userId) {
             console.warn(`Skipping post ${doc.id} due to missing required fields. Image: ${!!data.imageUrl}, Caption: ${!!data.caption}, Timestamp: ${!!data.timestamp}, UserID: ${!!data.userId}`);
             return; // Skip this post if essential data is missing
         }
          // Basic type check for timestamp
          if (!(data.timestamp instanceof Timestamp)) {
              console.warn(`Skipping post ${doc.id} due to invalid timestamp type. Received:`, data.timestamp);
              return;
          }
         postsData.push({
             id: doc.id,
             imageUrl: data.imageUrl,
             caption: data.caption,
             location: data.location, // Keep as GeoPoint
             address: data.address,
             timestamp: data.timestamp,
             userId: data.userId,
             userName: data.userName || 'Anonymous', // Provide fallback
             status: data.status || 'pending', // Provide fallback
             municipalReply: data.municipalReply
         } as Post); // Use 'as Post' carefully, ensure data structure matches
      });
      console.log("Processed posts data count:", postsData.length);
      // console.log("First few processed posts:", postsData.slice(0, 3)); // Log a sample
      setPosts(postsData);
      setLoading(false);
      console.log("State updated with posts. Loading set to false.");
    }, (err) => {
      console.error("Error fetching posts from Firestore: ", err);
      // Log the specific error details
      console.error("Firestore error code:", err.code);
      console.error("Firestore error message:", err.message);
      console.error("Firestore error stack:", err.stack);
      setError(`Failed to load posts. Please check your connection and permissions, or try again later. (Code: ${err.code})`);
      setLoading(false);
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
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center text-sm text-muted-foreground">
        <Skeleton className="h-4 w-[120px] bg-muted" />
         <Skeleton className="h-4 w-[80px] bg-muted" />
      </CardFooter>
    </Card>
  );


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
        {loading ? (
           <>
            {/* Removed Loading text, skeleton implies loading */}
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
           </>
        ) : posts.length === 0 ? (
           <Card className="w-full max-w-lg mx-auto text-center p-6 shadow-md rounded-lg border border-border">
             <CardContent>
                <p className="text-muted-foreground">No issues reported yet.</p>
                <Button asChild variant="link" className="mt-2">
                    <Link href="/citizen/add-post">Be the first to report an issue!</Link>
                </Button>
             </CardContent>
           </Card>
        ) : (
          posts.map((post, index) => (
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
                        <p className="text-xs text-muted-foreground">{formatDate(post.timestamp)}</p>
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
              <CardContent className="p-4 bg-card">
                <p className="text-foreground mb-2 whitespace-pre-wrap">{post.caption || '(No caption provided)'}</p>
                 {post.address ? (
                    <div className="flex items-center text-sm text-muted-foreground mt-2">
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
                      <div className="flex items-center text-sm text-muted-foreground mt-2">
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
                      <div className="flex items-center text-sm text-muted-foreground mt-2">
                         <MapPin className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
                         <span>Location not provided</span>
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
          ))
        )}
      </div>
    </div>
  );
}

// Added Button import
import { Button } from '@/components/ui/button';
