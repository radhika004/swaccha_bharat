'use client';

import React, { useState, useEffect } from 'react';
// Removed Firebase imports (collection, query, orderBy, onSnapshot, Timestamp, GeoPoint, db)
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { MapPin, User, Clock, CalendarDays, Heart, MessageCircle, Send, CheckCircle2, AlertTriangle, CircleEllipsis } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow, parseISO } from 'date-fns'; // Added parseISO
import { cn } from '@/lib/utils';

interface MockLocation {
  latitude: number;
  longitude: number;
}

interface MockPost {
  id: string;
  imageUrl: string;
  caption: string;
  location?: MockLocation; // Use simple object for mock
  address?: string;
  timestamp: string; // Use ISO string for mock
  userId: string;
  userName?: string;
  status?: 'pending' | 'solved';
  municipalReply?: string;
  deadline?: string; // Use ISO string for mock
  solvedTimestamp?: string; // Use ISO string for mock
}

// Sample Mock Data (if localStorage is empty)
const sampleMockPosts: MockPost[] = [
  {
    id: 'mock1',
    imageUrl: 'https://picsum.photos/600/600?random=1',
    caption: 'Overflowing bin near the park entrance. Needs immediate attention.',
    location: { latitude: 19.0760, longitude: 72.8777 }, // Mock Mumbai coords
    address: 'Near Central Park Entrance, Mock City',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    userId: 'mock_citizen_1',
    userName: 'Concerned Citizen A',
    status: 'pending',
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
  },
  {
    id: 'mock2',
    imageUrl: 'https://picsum.photos/600/600?random=2',
    caption: 'Drainage blocked on Main Street. Water logging during rains.',
    address: '123 Main Street, Mock City',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    userId: 'mock_citizen_2',
    userName: 'Resident B',
    status: 'solved',
    municipalReply: 'The drainage has been cleared by our team.',
    solvedTimestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
];

// Helper to parse ISO string and format (handle errors gracefully)
const parseAndFormatDate = (isoString: string | undefined, formatFn: (date: Date, options?: any) => string, options?: any): string => {
  if (!isoString) return 'Invalid date';
  try {
    const date = parseISO(isoString);
    return formatFn(date, options);
  } catch (e) {
    console.error("Error parsing/formatting date:", e, isoString);
    return "Error date";
  }
};

const formatFullDate = (isoString: string): string => parseAndFormatDate(isoString, (d) => d.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }));

const formatRelativeDate = (isoString: string): string => parseAndFormatDate(isoString, formatDistanceToNow, { addSuffix: true }) || 'a while ago';

const formatDeadline = (isoString?: string): string | null => {
     if (!isoString) return null;
     return parseAndFormatDate(isoString, (d) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }));
};


export default function CitizenHomePage() {
  const [posts, setPosts] = useState<MockPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Frontend-only mode: Loading mock posts...");
    setLoading(true);
    setError(null);

    try {
        // Try loading from localStorage first
        const storedPosts = localStorage.getItem('mockPosts');
        let postsData: MockPost[] = [];

        if (storedPosts) {
            postsData = JSON.parse(storedPosts);
            console.log(`Loaded ${postsData.length} mock posts from localStorage.`);
        } else {
            postsData = sampleMockPosts; // Use sample data if nothing in storage
            console.log("Using sample mock posts as localStorage is empty.");
        }

        // Basic validation or transformation if needed
        postsData = postsData.filter(post => post.id && post.imageUrl && post.caption && post.timestamp && post.userId);

        // Sort by timestamp descending (most recent first)
        postsData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setPosts(postsData);
        setLoading(false);
        console.log("Mock posts loaded and processed.");

    } catch (err: any) {
         console.error("Error loading/processing mock posts: ", err);
         setError(`Failed to load mock posts. ${err.message}`);
         setLoading(false);
    }

    // No cleanup needed for listeners as Firebase is removed
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
            const deadlineDate = post.deadline ? parseISO(post.deadline) : null;
            const isOverdue = post.status !== 'solved' && deadlineDate && new Date() > deadlineDate;


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
                   <div title={post.status === 'solved' ? `Solved ${post.solvedTimestamp ? formatRelativeDate(post.solvedTimestamp) : ''}` : (isOverdue ? 'Pending (Overdue)' : 'Pending')}>
                      {post.status === 'solved' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                          <AlertTriangle className={`h-5 w-5 ${isOverdue ? 'text-red-500' : 'text-orange-500'}`} />
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
                  {/* Action Icons (Mocked Actions) */}
                  <div className="flex items-center space-x-1 -ml-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-red-500 hover:bg-red-100/50 rounded-full" onClick={() => toast({title: "Action not implemented"})}>
                      <Heart className="h-5 w-5" />
                      <span className="sr-only">Like</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full" onClick={() => toast({title: "Action not implemented"})}>
                      <MessageCircle className="h-5 w-5" />
                      <span className="sr-only">Comment</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-full" onClick={() => toast({title: "Action not implemented"})}>
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
                    <p className={cn("text-xs font-medium pt-1 flex items-center gap-1", isOverdue ? "text-red-600" : "text-muted-foreground")}>
                      <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Deadline: {formattedDeadline} {isOverdue && '(Overdue)'}</span>
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

import { toast } from '@/hooks/use-toast'; // Added toast import for mock actions
