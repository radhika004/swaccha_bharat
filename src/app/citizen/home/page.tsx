'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { MapPin, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  location?: { latitude: number; longitude: number }; // Make location optional initially
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
  return timestamp.toDate().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function CitizenHomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData: Post[] = [];
      querySnapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() } as Post);
      });
      setPosts(postsData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching posts: ", err);
      setError("Failed to load posts. Please try again later.");
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
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
    return <div className="text-center text-red-500 mt-10">{error}</div>;
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
              <CardHeader className="p-4">
                {/* Optional: Add user avatar and name here if available */}
                <p className="text-xs text-muted-foreground">{formatDate(post.timestamp)}</p>
                 {post.status === 'solved' && (
                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full ml-2 inline-block">
                      Solved
                    </span>
                  )}
                   {post.status !== 'solved' && (
                     <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full ml-2 inline-block">
                      Pending
                    </span>
                  )}
              </CardHeader>
              {post.imageUrl && (
                <div className="relative w-full h-[300px] md:h-[400px] bg-gray-200">
                  <Image
                    src={post.imageUrl}
                    alt={post.caption || 'Issue Image'}
                    layout="fill"
                    objectFit="cover"
                    priority={posts.indexOf(post) < 3} // Prioritize loading first few images
                    onError={(e) => console.error(`Error loading image: ${post.imageUrl}`, e)}
                  />
                </div>
              )}
              <CardContent className="p-4">
                <p className="text-foreground mb-2">{post.caption}</p>
                 {post.address && (
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
