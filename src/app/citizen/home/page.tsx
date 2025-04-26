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
  if (!timestamp) return 'Just now';
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
    return 'Invalid date'; // Handle potential errors if timestamp is not valid
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
         // --- Data Validation ---
         if (!data.imageUrl || !data.caption || !data.timestamp || !data.userId) {
             console.warn(`Skipping post ${doc.id} due to missing required fields:`, data);
             return; // Skip this post if essential data is missing
         }
         console.log(`Processing post ${doc.id}:`, data); // Log raw data
         postsData.push({
             id: doc.id,
             imageUrl: data.imageUrl,
             caption: data.caption,
             location: data.location, // Keep as GeoPoint
             address: data.address,
             timestamp: data.timestamp,
             userId: data.userId,
             userName: data.userName,
             status: data.status,
             municipalReply: data.municipalReply
         } as Post);
      });
      console.log("Processed posts data:", postsData);
      setPosts(postsData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching posts: ", err);
      // Log the specific error details
      console.error("Firestore error code:", err.code);
      console.error("Firestore error message:", err.message);
      console.error("Firestore error stack:", err.stack);
      setError(`Failed to load posts. Please check your connection and permissions. (Code: ${err.code})`);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
        console.log("Cleaning up Firestore listener.");
        unsubscribe();
    }
  }, []);

  const PostCardSkeleton = () => (
    <Card className="w-full max-w-lg mx-auto mb-6 overflow-hidden shadow-md rounded-lg">
      <CardHeader className="p-4 flex flex-row items-center space-x-3">
         <Skeleton className="h-10 w-10 rounded-full" />
         <div className="space-y-2">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-3 w-[100px]" />
         </div>
      </CardHeader>
      <Skeleton className="w-full h-[300px] md:h-[400px]" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[80%]" />
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center text-sm text-muted-foreground">
        <Skeleton className="h-4 w-[120px]" />
         <Skeleton className="h-4 w-[80px]" />
      </CardFooter>
    </Card>
  );


  if (error) {
    return (
        <div className="container mx-auto px-4 py-6">
             <Alert variant="destructive" className="max-w-lg mx-auto">
              <AlertTitle>Error Loading Feed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
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
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        ) : posts.length === 0 ? (
           <p className="text-center text-muted-foreground mt-10">No issues reported yet. Be the first to add one!</p>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="w-full max-w-lg mx-auto overflow-hidden shadow-md rounded-lg border border-border transition-shadow duration-300 hover:shadow-lg">
              <CardHeader className="p-4 flex items-center justify-between">
                 {/* User Info */}
                 <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 border">
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
                        <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full inline-block">
                        Solved
                        </span>
                    ) : (
                        <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full inline-block">
                        Pending
                        </span>
                    )}
                 </div>
              </CardHeader>
              {post.imageUrl ? (
                <div className="relative w-full h-[300px] md:h-[400px] bg-gray-200">
                  <Image
                    src={post.imageUrl}
                    alt={post.caption || 'Issue Image'}
                    fill // Use fill instead of layout="fill"
                    style={{ objectFit: 'cover' }} // Use style prop for objectFit
                    priority={posts.indexOf(post) < 3} // Prioritize loading first few images
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Provide sizes prop
                    onError={(e) => console.error(`Error loading image: ${post.imageUrl}`, e)}
                  />
                </div>
              ) : (
                 <div className="w-full h-[300px] md:h-[400px] bg-gray-200 flex items-center justify-center text-muted-foreground">
                     <span>Image not available</span>
                 </div>
              )}
              <CardContent className="p-4">
                <p className="text-foreground mb-2">{post.caption || '(No caption provided)'}</p>
                 {post.address ? (
                    <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{post.address}</span>
                    {/* Optional: Link to map */}
                     {post.location && (
                        <a
                        href={`https://www.google.com/maps?q=${post.location.latitude},${post.location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:underline text-xs"
                        >
                        (View on Map)
                        </a>
                    )}
                    </div>
                 ) : post.location ? (
                      <div className="flex items-center text-sm text-muted-foreground mt-2">
                         <MapPin className="h-4 w-4 mr-1" />
                         <span>Lat: {post.location.latitude.toFixed(4)}, Lon: {post.location.longitude.toFixed(4)}</span>
                           <a
                            href={`https://www.google.com/maps?q=${post.location.latitude},${post.location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-600 hover:underline text-xs"
                            >
                            (View on Map)
                            </a>
                     </div>
                 ) : (
                      <div className="flex items-center text-sm text-muted-foreground mt-2">
                         <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                         <span>Location not provided</span>
                     </div>
                 )}
                {post.municipalReply && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm font-semibold text-green-800 mb-1">Municipal Response:</p>
                    <p className="text-sm text-green-700">{post.municipalReply}</p>
                  </div>
                )}
              </CardContent>
              {/* Add footer for actions like comments if needed */}
              {/* <CardFooter className="p-4 flex justify-start items-center text-sm text-muted-foreground border-t">
                 <MessageSquare className="h-4 w-4 mr-1" /> Comment (feature coming soon)
              </CardFooter> */}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
