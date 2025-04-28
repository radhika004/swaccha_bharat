'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp, GeoPoint } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { MapPin, User, Clock, CalendarDays, Heart, MessageCircle, Send, CheckCircle2, AlertTriangle, CircleEllipsis } from 'lucide-react';
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
  location?: GeoPoint;
  address?: string;
  timestamp: Timestamp;
  userId: string;
  userName?: string;
  status?: 'pending' | 'solved';
  municipalReply?: string;
  deadline?: Timestamp;
  solvedTimestamp?: Timestamp;
}

// Helper to format Firestore Timestamp (e.g., "Aug 15, 2024, 10:30 AM")
const formatFullDate = (timestamp: Timestamp): string => {
  if (!timestamp?.toDate) return 'Invalid date';
  try {
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch (e) { console.error("Error formatting full date:", e, timestamp); return "Error date"; }
};

// Helper to format date relative to now (e.g., "2 days ago")
const formatRelativeDate = (timestamp: Timestamp): string => {
  if (!timestamp?.toDate) return 'a while ago';
  try {
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
  } catch (e) { console.error("Error formatting relative date:", e, timestamp); return 'Error date'; }
};

// Helper to format deadline date (e.g., "Aug 20, 2024")
const formatDeadline = (timestamp?: Timestamp): string | null => {
  if (!timestamp?.toDate) return null;
  try {
    return timestamp.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) { console.error("Error formatting deadline:", e, timestamp); return 'Error date'; }
};

export default function CitizenHomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Setting up Firestore listener for posts...");
    setLoading(true);
    setError(null);

    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log(`Snapshot received. Documents: ${querySnapshot.size}. Pending writes: ${querySnapshot.metadata.hasPendingWrites}`);
      const postsData: Post[] = [];
      let skippedCount = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // --- Data Validation ---
        if (!data.imageUrl || !data.caption || !data.timestamp || !data.userId) {
          console.warn(`Skipping post ${doc.id} due to missing required fields. Data:`, data);
          skippedCount++;
          return;
        }
        if (!(data.timestamp instanceof Timestamp)) {
          console.warn(`Skipping post ${doc.id} due to invalid timestamp type. Received:`, data.timestamp);
          skippedCount++;
          return;
        }
        if (data.location && !(data.location instanceof GeoPoint)) {
           console.warn(`Skipping post ${doc.id} due to invalid location type. Received:`, data.location);
           skippedCount++;
           return; // Skip if location exists but is wrong type
        }
         if (data.deadline && !(data.deadline instanceof Timestamp)) {
            console.warn(`Post ${doc.id} has invalid deadline type, ignoring deadline. Received:`, data.deadline);
            data.deadline = undefined;
         }
         if (data.solvedTimestamp && !(data.solvedTimestamp instanceof Timestamp)) {
            console.warn(`Post ${doc.id} has invalid solvedTimestamp type, ignoring solved time. Received:`, data.solvedTimestamp);
            data.solvedTimestamp = undefined;
        }

        postsData.push({
          id: doc.id,
          imageUrl: data.imageUrl,
          caption: data.caption,
          location: data.location,
          address: data.address,
          timestamp: data.timestamp,
          userId: data.userId,
          userName: data.userName || 'Anonymous User',
          status: data.status === 'solved' ? 'solved' : 'pending', // Ensure valid status
          municipalReply: data.municipalReply,
          deadline: data.deadline,
          solvedTimestamp: data.solvedTimestamp,
        });
      });

      if (skippedCount > 0) {
        console.log(`Skipped ${skippedCount} posts due to validation issues.`);
      }
      console.log("Processed posts count:", postsData.length);
      setPosts(postsData);
      setLoading(false);
      console.log("Loading state set to false.");

    }, (err) => {
      console.error("Error fetching posts from Firestore: ", err);
      setError(`Failed to load posts. Check connection/permissions. (Code: ${err.code})`);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log("Cleaning up Firestore listener.");
      unsubscribe();
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  const PostCardSkeleton = () => (
    <Card className="w-full max-w-xl mx-auto mb-6 overflow-hidden shadow-md rounded-lg border border-border animate-pulse">
      <CardHeader className="p-3 flex items-center space-x-3">
         <Skeleton className="h-10 w-10 rounded-full bg-muted" />
         <div className="space-y-2">
            <Skeleton className="h-4 w-[180px] bg-muted" />
            <Skeleton className="h-3 w-[120px] bg-muted" />
         </div>
      </CardHeader>
      <Skeleton className="w-full aspect-square bg-muted" /> {/* Image Placeholder */}
      <CardContent className="p-3 space-y-3">
          <div className="flex space-x-3">
            <Skeleton className="h-7 w-7 rounded-full bg-muted" />
            <Skeleton className="h-7 w-7 rounded-full bg-muted" />
            <Skeleton className="h-7 w-7 rounded-full bg-muted" />
          </div>
        <Skeleton className="h-4 w-full bg-muted" />
        <Skeleton className="h-4 w-[85%] bg-muted" />
        <Skeleton className="h-3 w-[50%] mt-1 bg-muted" />
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10 flex justify-center">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Feed</AlertTitle>
          <AlertDescription>
            {error}
            <Button onClick={() => window.location.reload()} variant="link" className="p-0 h-auto mt-2 text-destructive-foreground underline">
              Try Refreshing
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-0 sm:px-4 py-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-primary sr-only">Issue Feed</h1>
      <div className="space-y-6">
        {loading ? (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        ) : posts.length === 0 ? (
           <Card className="w-full max-w-lg mx-auto text-center p-8 shadow-md rounded-lg border border-border mt-10 bg-card">
             <CardContent className="flex flex-col items-center gap-4">
                <CircleEllipsis className="w-12 h-12 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">No issues reported yet.</p>
                <Button asChild variant="default" className="mt-2 bg-primary hover:bg-primary/90">
                    <Link href="/citizen/add-post">Be the first to report one!</Link>
                </Button>
             </CardContent>
           </Card>
        ) : (
          posts.map((post, index) => {
            const formattedDeadline = formatDeadline(post.deadline);
            const relativeDate = formatRelativeDate(post.timestamp);
            const fullDate = formatFullDate(post.timestamp);

            return (
              <Card key={post.id} className="w-full max-w-xl mx-auto overflow-hidden shadow-md rounded-lg border border-border transition-shadow duration-300 hover:shadow-xl bg-card">
                {/* Post Header */}
                <CardHeader className="p-3 flex items-center justify-between border-b">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-9 w-9 border">
                      <AvatarFallback className="bg-secondary text-xs"><User className="h-4 w-4 text-muted-foreground"/></AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{post.userName || 'Anonymous User'}</p>
                      {/* Location Info */}
                      <p className="text-xs text-muted-foreground truncate max-w-[200px] hover:max-w-none hover:whitespace-normal" title={post.address || (post.location ? `Near ${post.location.latitude.toFixed(2)}, ${post.location.longitude.toFixed(2)}` : 'Location not provided')}>
                         <MapPin className="inline h-3 w-3 mr-0.5 relative -top-px" />
                          {post.address ? post.address.split(',')[0] : post.location ? `Near lat/lon` : 'No location'}
                          {post.location && (
                             <a href={`https://www.google.com/maps?q=${post.location.latitude},${post.location.longitude}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-accent hover:underline text-xs">(Map)</a>
                          )}
                      </p>
                    </div>
                  </div>
                   {/* Status Icon */}
                   <div title={post.status === 'solved' ? `Solved ${post.solvedTimestamp ? formatRelativeDate(post.solvedTimestamp) : ''}` : 'Pending'}>
                      {post.status === 'solved' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                      )}
                   </div>
                </CardHeader>

                {/* Post Image */}
                <div className="relative w-full aspect-square bg-muted overflow-hidden">
                  {post.imageUrl ? (
                    <Image
                      src={post.imageUrl}
                      alt={post.caption || 'Issue Image'}
                      fill
                      style={{ objectFit: 'cover' }}
                      priority={index < 2} // Prioritize first 2 images
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 672px" // Optimized sizes
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/600/600?grayscale'; (e.target as HTMLImageElement).alt="Image load error"; }} // Fallback image
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gray-200">
                       <span>Image not available</span>
                    </div>
                  )}
                </div>

                {/* Post Content & Actions */}
                <CardContent className="p-3 space-y-2">
                  {/* Action Icons */}
                  <div className="flex items-center space-x-1 -ml-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-red-500 hover:bg-red-100/50 rounded-full">
                      <Heart className="h-5 w-5" />
                      <span className="sr-only">Like</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full">
                      <MessageCircle className="h-5 w-5" />
                      <span className="sr-only">Comment</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-full">
                      <Send className="h-5 w-5" />
                      <span className="sr-only">Share</span>
                    </Button>
                  </div>

                  {/* Caption */}
                  <p className="text-sm text-foreground">
                    <span className="font-semibold mr-1">{post.userName || 'User'}</span>
                    <span className="whitespace-pre-wrap break-words">{post.caption || '(No caption provided)'}</span>
                  </p>

                  {/* Full Address (if available and different from header) */}
                  {post.address && (
                    <p className="text-xs text-muted-foreground pt-1 flex items-start gap-1" title={post.address}>
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-px" />
                      <span>{post.address}</span>
                    </p>
                  )}

                  {/* Deadline */}
                  {formattedDeadline && (
                    <p className={cn("text-xs font-medium pt-1 flex items-center gap-1", new Date() > (post.deadline?.toDate() ?? new Date()) ? "text-red-600" : "text-muted-foreground")}>
                      <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Deadline: {formattedDeadline} {new Date() > (post.deadline?.toDate() ?? new Date()) && '(Overdue)'}</span>
                    </p>
                  )}

                  {/* Municipal Reply */}
                  {post.municipalReply && (
                    <div className="mt-2 p-2.5 bg-secondary/60 border border-border rounded-md text-xs">
                      <p className="font-semibold text-foreground mb-1">Municipal Response:</p>
                      <p className="text-muted-foreground whitespace-pre-wrap break-words">{post.municipalReply}</p>
                       {post.solvedTimestamp && (
                          <p className="text-gray-500 mt-1 text-[11px]">Responded: {formatRelativeDate(post.solvedTimestamp)}</p>
                        )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs text-muted-foreground pt-1" title={fullDate}>
                    <Clock className="inline h-3 w-3 mr-1 relative -top-px" />
                    Posted {relativeDate}
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
