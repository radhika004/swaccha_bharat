'use client';

import React, { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { MapPin, Filter, Loader2, MessageSquare, CheckCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';


interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  location?: { latitude: number; longitude: number };
  address?: string;
  timestamp: Timestamp;
  userId: string;
  userName?: string;
  status?: 'pending' | 'solved';
  municipalReply?: string;
}

// Helper function to format Firestore Timestamp
const formatDate = (timestamp: Timestamp): string => {
  if (!timestamp) return 'N/A';
  return timestamp.toDate().toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

export default function MunicipalIssuesPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'solved'>('pending'); // Default to pending
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { toast } = useToast();


  useEffect(() => {
    setLoading(true);
    let q;
    const postsCol = collection(db, 'posts');

    if (filter === 'all') {
      q = query(postsCol, orderBy('timestamp', 'desc'));
    } else {
      q = query(postsCol, where('status', '==', filter), orderBy('timestamp', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData: Post[] = [];
      querySnapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() } as Post);
      });
      setPosts(postsData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching posts: ", err);
      setError(`Failed to load issues. Please try again later. (Error: ${err.code})`);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [filter]); // Re-run effect when filter changes

  const handleOpenReplyDialog = (post: Post) => {
    setSelectedPost(post);
    setReplyText(post.municipalReply || ''); // Pre-fill with existing reply if any
  };

  const handleCloseReplyDialog = () => {
    setSelectedPost(null);
    setReplyText('');
    setError(null); // Clear any dialog errors
  };

  const handleSendReply = async (e: FormEvent) => {
     e.preventDefault();
     if (!selectedPost || !replyText.trim()) return;

     setIsReplying(true);
     setError(null);
     try {
         const postRef = doc(db, 'posts', selectedPost.id);
         await updateDoc(postRef, {
             municipalReply: replyText,
             status: 'solved' // Automatically mark as solved when replying
         });
         toast({ title: "Reply Sent", description: "Issue marked as solved and reply sent." });
         handleCloseReplyDialog();
     } catch (err: any) {
         console.error("Error sending reply:", err);
         setError(`Failed to send reply: ${err.message}`);
         toast({ title: "Error", description: "Failed to send reply.", variant: "destructive" });
     } finally {
         setIsReplying(false);
     }
  };

   const handleMarkAsSolved = async (postId: string) => {
     if (!postId) return;
     setIsUpdatingStatus(true); // Use a different loading state if needed, or reuse isReplying
     try {
         const postRef = doc(db, 'posts', postId);
         await updateDoc(postRef, {
             status: 'solved',
             // Optionally add a default reply or timestamp when marking solved without text reply
             // municipalReply: 'Issue resolved.',
             // solvedTimestamp: serverTimestamp()
         });
         toast({ title: "Status Updated", description: "Issue marked as solved." });
     } catch (err: any) {
         console.error("Error marking as solved:", err);
         toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
     } finally {
         setIsUpdatingStatus(false);
     }
   };


  const PostCardSkeleton = () => (
     <Card className="w-full mb-6 overflow-hidden shadow-md rounded-lg animate-pulse">
        <CardHeader className="p-4">
            <Skeleton className="h-4 w-1/4 mb-2" /> {/* Status placeholder */}
            <Skeleton className="h-3 w-1/3" /> {/* Date placeholder */}
        </CardHeader>
        <Skeleton className="w-full h-48 bg-gray-300" /> {/* Image placeholder */}
        <CardContent className="p-4 space-y-2">
            <Skeleton className="h-4 w-full" /> {/* Caption line 1 */}
            <Skeleton className="h-4 w-3/4" /> {/* Caption line 2 */}
            <Skeleton className="h-4 w-1/2 mt-2" /> {/* Location placeholder */}
        </CardContent>
        <CardFooter className="p-4 flex justify-end space-x-2">
            <Skeleton className="h-9 w-20 rounded-md" /> {/* Button placeholder */}
             <Skeleton className="h-9 w-24 rounded-md" /> {/* Button placeholder */}
        </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary">Reported Issues</h1>
        <div className="flex items-center gap-2">
           <Filter className="h-5 w-5 text-muted-foreground" />
           <Select value={filter} onValueChange={(value) => setFilter(value as 'all' | 'pending' | 'solved')}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="solved">Solved</SelectItem>
                    <SelectItem value="all">All Issues</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="space-y-6">
        {loading ? (
           <>
             <PostCardSkeleton />
             <PostCardSkeleton />
           </>
        ) : posts.length === 0 ? (
           <p className="text-center text-muted-foreground mt-10">
             No issues found for the selected filter ({filter}).
           </p>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="w-full overflow-hidden shadow-md rounded-lg border">
               <CardHeader className="p-4 flex flex-row justify-between items-start">
                  <div>
                     {post.status === 'solved' ? (
                        <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full inline-flex items-center">
                           <CheckCircle className="h-3 w-3 mr-1"/> Solved
                        </span>
                     ) : (
                         <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                           Pending
                         </span>
                     )}
                     <p className="text-xs text-muted-foreground mt-1">{formatDate(post.timestamp)}</p>
                  </div>
                   {/* Add Citizen User Info if available */}
                  {/* <p className="text-xs text-muted-foreground">Reported by: {post.userId}</p> */}
               </CardHeader>
              {post.imageUrl && (
                <div className="relative w-full h-56 bg-gray-200">
                  <Image
                    src={post.imageUrl}
                    alt={post.caption || 'Issue Image'}
                    layout="fill"
                    objectFit="cover"
                    onError={(e) => console.error(`Error loading image: ${post.imageUrl}`)}
                  />
                </div>
              )}
              <CardContent className="p-4">
                <p className="text-foreground mb-2">{post.caption}</p>
                {post.address && (
                    <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate" title={post.address}>{post.address}</span>
                    {/* Optional: Link to map */}
                     {post.location && (
                        <a
                        href={`https://www.google.com/maps?q=${post.location.latitude},${post.location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:underline text-xs flex-shrink-0"
                        >
                        Map
                        </a>
                    )}
                    </div>
                )}
                 {post.municipalReply && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm font-semibold text-green-800 mb-1">Your Response:</p>
                    <p className="text-sm text-green-700 whitespace-pre-wrap">{post.municipalReply}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-4 flex justify-end space-x-2">
                 {post.status === 'pending' && (
                     <>
                     <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsSolved(post.id)}
                        disabled={isUpdatingStatus}
                     >
                        {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : <CheckCircle className="h-4 w-4 mr-1"/>}
                         Mark Solved
                     </Button>
                     <Button
                        size="sm"
                        onClick={() => handleOpenReplyDialog(post)}
                        className="bg-accent hover:bg-accent/90"
                      >
                        <MessageSquare className="h-4 w-4 mr-1"/> Reply & Solve
                     </Button>
                     </>
                 )}
                  {post.status === 'solved' && !post.municipalReply && (
                     <Button
                         size="sm"
                        onClick={() => handleOpenReplyDialog(post)}
                        variant="outline"
                      >
                         <MessageSquare className="h-4 w-4 mr-1"/> Add Reply
                     </Button>
                 )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>

       {/* Reply Dialog */}
       <Dialog open={!!selectedPost} onOpenChange={(open) => !open && handleCloseReplyDialog()}>
           <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Reply to Issue & Mark as Solved</DialogTitle>
            </DialogHeader>
            {error && ( // Show dialog-specific errors
                <Alert variant="destructive" className="mb-4">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
             )}
            <form onSubmit={handleSendReply} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                   <Textarea
                    id="reply"
                    placeholder="Enter your reply (optional, will mark as solved regardless)..."
                    value={replyText}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setReplyText(e.target.value)}
                    className="col-span-4 min-h-[100px]"
                   />
                </div>
                 <DialogFooter>
                    <DialogClose asChild>
                       <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isReplying} className="bg-primary hover:bg-primary/90">
                        {isReplying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Send Reply & Solve
                    </Button>
                </DialogFooter>
            </form>

           </DialogContent>
       </Dialog>

    </div>
  );
}
