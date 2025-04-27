
'use client';

import React, { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where, Timestamp, serverTimestamp } from 'firebase/firestore'; // Added serverTimestamp
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { MapPin, Filter, Loader2, MessageSquare, CheckCircle, Send, AlertCircle, CalendarDays, Clock } from 'lucide-react'; // Added CalendarDays, Clock
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Added Alert components
import { useToast } from '@/hooks/use-toast';
import { GeoPoint } from 'firebase/firestore'; // Import GeoPoint
import { formatDistanceToNow } from 'date-fns'; // Import formatDistanceToNow


interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  location?: GeoPoint; // Correct type
  address?: string;
  timestamp: Timestamp;
  userId: string;
  userName?: string;
  status?: 'pending' | 'solved';
  municipalReply?: string;
  deadline?: Timestamp; // Add deadline field
  solvedTimestamp?: Timestamp; // Add solvedTimestamp field
}

// Helper function to format Firestore Timestamp (full date)
const formatFullDate = (timestamp: Timestamp): string => {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
      console.warn("Invalid timestamp received for formatting:", timestamp);
      return 'Invalid date';
  }
  try {
      return timestamp.toDate().toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
  } catch (e) {
      console.error("Error formatting date:", e, timestamp);
      return "Error date";
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


export default function MunicipalIssuesPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // For page-level errors
  const [filter, setFilter] = useState<'all' | 'pending' | 'solved'>('pending'); // Default to pending
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false); // Loading state for reply dialog
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<Record<string, boolean>>({}); // Loading state per post for status update
  const [dialogError, setDialogError] = useState<string | null>(null); // For dialog-specific errors
  const { toast } = useToast();


  useEffect(() => {
    setLoading(true);
    setError(null); // Clear page error on filter change
    let q;
    const postsCol = collection(db, 'posts');

    console.log(`Fetching posts with filter: ${filter}`);

    try {
      if (filter === 'all') {
        q = query(postsCol, orderBy('timestamp', 'desc'));
      } else {
        q = query(postsCol, where('status', '==', filter), orderBy('timestamp', 'desc'));
      }
    } catch(queryError: any) {
        console.error("Error creating Firestore query:", queryError);
        setError(`Failed to build query: ${queryError.message}`);
        setLoading(false);
        return; // Stop if query fails
    }


    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log(`Snapshot received for filter '${filter}'. Documents: ${querySnapshot.size}`);
      const postsData: Post[] = [];
      let invalidCount = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Basic validation
        if (!data.imageUrl || !data.caption || !data.timestamp || !data.userId) {
            console.warn(`Skipping invalid post ${doc.id}: Missing required fields.`, data);
            invalidCount++;
            return;
        }
         if (!(data.timestamp instanceof Timestamp)) {
             console.warn(`Skipping invalid post ${doc.id}: Invalid timestamp type.`, data.timestamp);
             invalidCount++;
             return;
         }
         if (data.location && !(data.location instanceof GeoPoint)) {
              console.warn(`Skipping invalid post ${doc.id}: Invalid location type.`, data.location);
              invalidCount++;
              return;
         }
          if (data.deadline && !(data.deadline instanceof Timestamp)) {
              console.warn(`Skipping invalid post ${doc.id}: Invalid deadline type.`, data.deadline);
              data.deadline = undefined;
          }
           if (data.solvedTimestamp && !(data.solvedTimestamp instanceof Timestamp)) {
              console.warn(`Skipping invalid post ${doc.id}: Invalid solvedTimestamp type.`, data.solvedTimestamp);
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
            userName: data.userName,
            status: data.status || 'pending',
            municipalReply: data.municipalReply,
            deadline: data.deadline, // Add deadline
            solvedTimestamp: data.solvedTimestamp // Add solvedTimestamp
        });
      });
      if (invalidCount > 0) {
          console.log(`Skipped ${invalidCount} invalid posts during processing.`);
      }
      setPosts(postsData);
      setLoading(false);
    }, (err) => {
      console.error(`Error fetching posts with filter '${filter}': `, err);
        // Check for specific Firestore API disabled error
         if (err.code === 'failed-precondition' && err.message.includes('Cloud Firestore API')) {
             setError("Firestore API is not enabled. Please enable it in your Google Cloud console and refresh.");
             console.error("Action needed: Enable Cloud Firestore API at https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=" + db.app.options.projectId);
         } else {
             setError(`Failed to load issues. Please try again later. (Error: ${err.code})`);
         }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
        console.log(`Unsubscribing from posts listener (filter: ${filter})`);
        unsubscribe();
    }
  }, [filter]); // Re-run effect when filter changes

  const handleOpenReplyDialog = (post: Post) => {
    setSelectedPost(post);
    setReplyText(post.municipalReply || ''); // Pre-fill with existing reply if any
    setDialogError(null); // Clear previous dialog errors
  };

  const handleCloseReplyDialog = () => {
    setSelectedPost(null);
    setReplyText('');
    setDialogError(null);
    setIsReplying(false); // Ensure loading state is reset
  };

  const handleSendReply = async (e: FormEvent) => {
     e.preventDefault();
     if (!selectedPost) return;

     // Basic validation for reply text (optional)
     // if (!replyText.trim()) {
     //    setDialogError("Please enter a reply message.");
     //    return;
     // }

     setIsReplying(true);
     setDialogError(null);
     try {
         const postRef = doc(db, 'posts', selectedPost.id);
         await updateDoc(postRef, {
             municipalReply: replyText.trim(), // Trim whitespace
             status: 'solved', // Automatically mark as solved when replying
             solvedTimestamp: serverTimestamp() // Add timestamp when solved
         });
         toast({ title: "Reply Sent", description: "Issue marked as solved and reply sent." });
         handleCloseReplyDialog(); // Close dialog on success
     } catch (err: any) {
         console.error("Error sending reply:", err);
         const message = `Failed to send reply: ${err.message} (Code: ${err.code})`;
         setDialogError(message); // Show error within the dialog
         toast({ title: "Error Sending Reply", description: message, variant: "destructive" });
     } finally {
         setIsReplying(false);
     }
  };

   const handleMarkAsSolved = async (postId: string) => {
     if (!postId) return;
     setIsUpdatingStatus(prev => ({ ...prev, [postId]: true })); // Set loading state for this specific post
     try {
         const postRef = doc(db, 'posts', postId);
         await updateDoc(postRef, {
             status: 'solved',
             solvedTimestamp: serverTimestamp() // Add timestamp when solved
             // Optionally add a default reply if needed:
             // municipalReply: '(Marked as resolved without comment)',
         });
         toast({ title: "Status Updated", description: "Issue marked as solved." });
         // No need to manually remove from list if filter is 'pending', onSnapshot will handle it
     } catch (err: any) {
         console.error("Error marking as solved:", err);
         toast({ title: "Error Updating Status", description: `Failed to update status: ${err.message}`, variant: "destructive" });
     } finally {
         setIsUpdatingStatus(prev => ({ ...prev, [postId]: false })); // Reset loading state for this post
     }
   };


  const PostCardSkeleton = () => (
     <Card className="w-full mb-6 overflow-hidden shadow-md rounded-lg animate-pulse border border-border">
        <CardHeader className="p-4">
            <div className="flex justify-between items-start">
                <div>
                    <Skeleton className="h-5 w-20 mb-1 bg-muted" /> {/* Status placeholder */}
                    <Skeleton className="h-3 w-24 bg-muted" /> {/* Date placeholder */}
                </div>
                <Skeleton className="h-3 w-28 bg-muted" /> {/* User ID placeholder */}
            </div>
            <Skeleton className="h-3 w-32 mt-1 bg-muted" /> {/* Username placeholder */}
        </CardHeader>
        <Skeleton className="w-full h-48 bg-muted" /> {/* Image placeholder */}
        <CardContent className="p-4 space-y-2">
            <Skeleton className="h-4 w-full bg-muted" /> {/* Caption line 1 */}
            <Skeleton className="h-4 w-3/4 bg-muted" /> {/* Caption line 2 */}
            <Skeleton className="h-4 w-1/2 mt-2 bg-muted" /> {/* Location placeholder */}
            <Skeleton className="h-4 w-1/3 mt-2 bg-muted" /> {/* Deadline placeholder */}
        </CardContent>
        <CardFooter className="p-4 flex justify-end space-x-2">
            <Skeleton className="h-9 w-20 rounded-md bg-muted" /> {/* Button placeholder */}
             <Skeleton className="h-9 w-24 rounded-md bg-muted" /> {/* Button placeholder */}
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

      {error && ( // Page-level error display
        <Alert variant="destructive" className="mb-6">
             <AlertCircle className="h-4 w-4" />
             <AlertTitle>Error Loading Issues</AlertTitle>
             <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {loading ? (
           <>
             <PostCardSkeleton />
             <PostCardSkeleton />
             <PostCardSkeleton />
           </>
        ) : posts.length === 0 ? (
           <p className="text-center text-muted-foreground mt-10">
             No {filter !== 'all' ? filter : ''} issues found.
           </p>
        ) : (
          posts.map((post) => {
             const formattedDeadline = formatDeadline(post.deadline);
             return (
                <Card key={post.id} className="w-full overflow-hidden shadow-md rounded-lg border border-border">
                   <CardHeader className="p-4">
                      <div className="flex flex-row justify-between items-start">
                         <div>
                            {post.status === 'solved' ? (
                               <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full inline-flex items-center border border-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1"/> Solved
                               </span>
                            ) : (
                                <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                                  Pending
                                </span>
                            )}
                            <p className="text-xs text-muted-foreground mt-1" title={formatFullDate(post.timestamp)}>
                                <Clock className="inline h-3 w-3 mr-0.5 relative -top-px" />
                                {formatRelativeDate(post.timestamp)}
                             </p>
                         </div>
                         {/* User Info */}
                         <div className="text-right">
                             <p className="text-xs text-muted-foreground">User ID: <span className='font-mono text-xs'>{post.userId.substring(0, 8)}...</span></p>
                              {post.userName && <p className="text-xs text-muted-foreground mt-1">By: {post.userName}</p>}
                         </div>
                      </div>
                   </CardHeader>
                  {post.imageUrl && (
                    <div className="relative w-full h-56 bg-muted">
                      <Image
                        src={post.imageUrl}
                        alt={post.caption || 'Issue Image'}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={(e) => console.error(`Error loading image: ${post.imageUrl}`)}
                      />
                    </div>
                  )}
                  <CardContent className="p-4 space-y-2">
                    <p className="text-foreground whitespace-pre-wrap">{post.caption}</p>
                    {post.address ? (
                        <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="truncate" title={post.address}>{post.address}</span>
                        {/* Optional: Link to map */}
                         {post.location && (
                            <a
                            href={`https://www.google.com/maps?q=${post.location.latitude},${post.location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-accent hover:underline text-xs flex-shrink-0"
                            >
                            Map
                            </a>
                        )}
                        </div>
                     ) : post.location ? (
                          <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                              Lat: {post.location.latitude.toFixed(4)}, Lon: {post.location.longitude.toFixed(4)}
                              <a
                                  href={`https://www.google.com/maps?q=${post.location.latitude},${post.location.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 text-accent hover:underline text-xs flex-shrink-0"
                                  >
                                  Map
                              </a>
                          </div>
                      ) : (
                          <div className="flex items-center text-sm text-muted-foreground">
                             <MapPin className="h-4 w-4 mr-1 flex-shrink-0 text-gray-400" />
                             Location not provided
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
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm font-semibold text-green-800 mb-1">Your Response:</p>
                        <p className="text-sm text-green-700 whitespace-pre-wrap">{post.municipalReply}</p>
                        {post.solvedTimestamp && (
                           <p className="text-xs text-muted-foreground mt-1">Replied: {formatRelativeDate(post.solvedTimestamp)}</p>
                        )}
                      </div>
                    )}
                     {post.status === 'solved' && !post.municipalReply && post.solvedTimestamp &&(
                         <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-sm text-yellow-700">Marked as solved {formatRelativeDate(post.solvedTimestamp)} without a comment.</p>
                         </div>
                     )}
                  </CardContent>
                  <CardFooter className="p-4 flex justify-end space-x-2 bg-muted/50 border-t border-border">
                     {post.status === 'pending' && (
                         <>
                         <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsSolved(post.id)}
                            disabled={isUpdatingStatus[post.id] || isReplying} // Disable if updating this post or replying globally
                         >
                            {isUpdatingStatus[post.id] ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : <CheckCircle className="h-4 w-4 mr-1"/>}
                             Mark Solved
                         </Button>
                         <Button
                            size="sm"
                            onClick={() => handleOpenReplyDialog(post)}
                            disabled={isUpdatingStatus[post.id] || isReplying}
                            className="bg-accent hover:bg-accent/90 text-accent-foreground"
                          >
                            <MessageSquare className="h-4 w-4 mr-1"/> Reply & Solve
                         </Button>
                         </>
                     )}
                      {post.status === 'solved' && !post.municipalReply && ( // Allow adding reply even if solved
                         <Button
                             size="sm"
                            onClick={() => handleOpenReplyDialog(post)}
                            variant="outline"
                            disabled={isReplying} // Disable if reply dialog is busy
                          >
                             <MessageSquare className="h-4 w-4 mr-1"/> Add Reply
                         </Button>
                     )}
                     {post.status === 'solved' && post.municipalReply && ( // Show button to edit reply
                          <Button
                             size="sm"
                            onClick={() => handleOpenReplyDialog(post)}
                            variant="outline"
                            disabled={isReplying} // Disable if reply dialog is busy
                          >
                             <MessageSquare className="h-4 w-4 mr-1"/> Edit Reply
                         </Button>
                      )}
                  </CardFooter>
                </Card>
             )
          })
        )}
      </div>

       {/* Reply Dialog */}
       <Dialog open={!!selectedPost} onOpenChange={(open) => !open && handleCloseReplyDialog()}>
           <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{selectedPost?.municipalReply ? 'Edit Reply' : 'Reply to Issue'} & Mark as Solved</DialogTitle>
                 <p className="text-sm text-muted-foreground pt-1">
                    Replying will automatically mark the issue as solved.
                 </p>
            </DialogHeader>
            {dialogError && ( // Show dialog-specific errors
                <Alert variant="destructive" className="my-2">
                     <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{dialogError}</AlertDescription>
                </Alert>
             )}
            <form onSubmit={handleSendReply} className="grid gap-4 py-4">
               <Textarea
                id="reply"
                placeholder="Enter your reply..."
                value={replyText}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setReplyText(e.target.value)}
                className="col-span-4 min-h-[100px]"
                required // Make reply text required? Optional.
               />
                 <DialogFooter>
                    <DialogClose asChild>
                       <Button type="button" variant="outline" disabled={isReplying}>Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isReplying || !replyText.trim()} className="bg-primary hover:bg-primary/90">
                        {isReplying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        {selectedPost?.municipalReply ? 'Update Reply & Solve' : 'Send Reply & Solve'}
                    </Button>
                </DialogFooter>
            </form>

           </DialogContent>
       </Dialog>

    </div>
  );
}
