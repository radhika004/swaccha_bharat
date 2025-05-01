'use client';

import React, { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where, Timestamp, serverTimestamp, deleteDoc, GeoPoint, db } from '@/lib/firebase/config'; // Added deleteDoc
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { MapPin, Filter, Loader2, MessageSquare, CheckCircle, Send, AlertCircle, CalendarDays, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label'; // Added Label import

// Interface matching Firestore structure
interface Post {
  id: string;
  imageUrl: string;
  caption: string;
  location?: GeoPoint; // Firestore GeoPoint
  address?: string;
  timestamp: Timestamp; // Firestore Timestamp
  userId: string;
  userName?: string;
  status?: 'pending' | 'solved';
  category: string; // Added category
  municipalReply?: string;
  deadline?: Timestamp; // Firestore Timestamp
  solvedTimestamp?: Timestamp; // Firestore Timestamp
}


// Helper to convert Firestore Timestamp to Date or return null
const timestampToDate = (timestamp: Timestamp | undefined): Date | null => {
    if (!timestamp) return null;
    try {
        return timestamp.toDate();
    } catch (e) {
        console.error("Error converting Timestamp:", e, timestamp);
        return null;
    }
}

// Helper to format Date or return 'N/A'
const formatDate = (date: Date | null, formatString: string, options?: any): string => {
    if (!date) return 'N/A';
    try {
        return format(date, formatString, options);
    } catch (e) {
        console.error("Error formatting date:", e, date);
        return "Error date";
    }
}
const formatRelativeDate = (date: Date | null): string => formatDate(date, '', { addSuffix: true }) || 'a while ago';
const formatFullDate = (date: Date | null): string => formatDate(date, "MMM d, yyyy, h:mm a");
const formatDeadline = (date: Date | null): string => formatDate(date, "MMM d, yyyy");


export default function MunicipalIssuesPage() {
  const [allPosts, setAllPosts] = useState<Post[]>([]); // Store all posts from Firestore
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]); // Posts to display based on filter
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'solved' | 'all'>('pending');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<Record<string, boolean>>({});
  const [dialogError, setDialogError] = useState<string | null>(null);
  const { toast } = useToast();


  // Load initial data from Firestore
  useEffect(() => {
    setLoading(true);
    setError(null);
    console.log("Setting up Firestore listener for posts...");

    if (!db) {
      setError("Firestore is not initialized. Check Firebase configuration.");
      setLoading(false);
      console.error("Firestore instance (db) is null.");
      return;
    }

    const postsCollection = collection(db, 'posts');
    // Order by timestamp descending (most recent first)
    const q = query(postsCollection, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log(`Firestore snapshot received: ${querySnapshot.size} docs`);
      const postsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Post));

      // Basic validation
      const validPosts = postsData.filter(post =>
          post.id &&
          post.timestamp && // Ensure timestamp exists
          post.imageUrl &&
          post.caption &&
          post.userId &&
          post.category && // Check for category
          post.status // Ensure status exists
      );
      console.log(`Valid posts after filtering: ${validPosts.length}`);

      setAllPosts(validPosts);
      setLoading(false);
      console.log("Posts loaded from Firestore.");

    }, (err) => {
      console.error("Error fetching posts from Firestore: ", err);
      setError(`Failed to load issues. Check console for details. (Code: ${err.code})`);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log("Unsubscribing from Firestore posts listener.");
      unsubscribe();
    };
  }, []); // Run only once on mount

  // Apply filter whenever allPosts or filter changes
  useEffect(() => {
    console.log(`Applying filter: ${filter}`);
    if (filter === 'all') {
      setFilteredPosts(allPosts);
    } else {
      setFilteredPosts(allPosts.filter(post => post.status === filter));
    }
     console.log(`Filtered posts count: ${filteredPosts.length}`);
  }, [filter, allPosts]); // React to changes in filter or the base data


  const handleOpenReplyDialog = (post: Post) => {
    setSelectedPost(post);
    setReplyText(post.municipalReply || '');
    setDialogError(null);
  };

  const handleCloseReplyDialog = () => {
    setSelectedPost(null);
    setReplyText('');
    setDialogError(null);
    setIsReplying(false);
  };

  // Send reply and update status in Firestore
  const handleSendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !replyText.trim()) {
        setDialogError("Please enter a reply message.");
        return;
    };
    if (!db || !selectedPost.id) {
        setDialogError("Database connection or Post ID missing.");
        return;
    }

    setIsReplying(true);
    setDialogError(null);
    console.log(`Sending reply for post ${selectedPost.id}: ${replyText.trim()}`);

    const postDocRef = doc(db, 'posts', selectedPost.id);

    try {
      await updateDoc(postDocRef, {
        municipalReply: replyText.trim(),
        status: 'solved',
        solvedTimestamp: serverTimestamp() // Use server timestamp
      });

      toast({ title: "Reply Sent", description: "Issue marked as solved." });
      handleCloseReplyDialog();
    } catch (err: any) {
      console.error("Error sending reply:", err);
      const message = `Failed to send reply: ${err.message}`;
      setDialogError(message);
      toast({ title: "Reply Error", description: message, variant: "destructive" });
    } finally {
      setIsReplying(false);
    }
  };

  // Mark issue as solved in Firestore
  const handleMarkAsSolved = async (postId: string) => {
    if (!postId || !db) {
        toast({ title: "Error", description: "Post ID or database connection missing.", variant: "destructive"});
        return;
    }
    setIsUpdatingStatus(prev => ({ ...prev, [postId]: true }));
    console.log(`Marking post ${postId} as solved.`);

    const postDocRef = doc(db, 'posts', postId);

    try {
       await updateDoc(postDocRef, {
         status: 'solved',
         solvedTimestamp: serverTimestamp() // Use server timestamp
       });

      toast({ title: "Status Updated", description: "Issue marked as solved." });
    } catch (err: any) {
      console.error("Error marking as solved:", err);
      toast({ title: "Update Error", description: `Failed to update status: ${err.message}`, variant: "destructive" });
    } finally {
      setIsUpdatingStatus(prev => ({ ...prev, [postId]: false }));
    }
  };

   // Delete issue from Firestore
   const handleDeleteIssue = async (postId: string) => {
      if (!postId || !db) {
        toast({ title: "Error", description: "Post ID or database connection missing.", variant: "destructive"});
        return;
    }
     console.warn(`Deleting post ${postId}.`);
     setIsUpdatingStatus(prev => ({ ...prev, [postId]: true })); // Use loading state for delete button too

     const postDocRef = doc(db, 'posts', postId);

     try {
        await deleteDoc(postDocRef);
        toast({ title: "Issue Deleted" });
        // No need to manually update state, onSnapshot will handle it
     } catch(err: any) {
         console.error("Error deleting issue:", err);
        toast({ title: "Deletion Error", description: err.message, variant: "destructive" });
     } finally {
        setIsUpdatingStatus(prev => ({ ...prev, [postId]: false }));
     }
   };


  const PostCardSkeleton = () => (
    <Card className="w-full mb-6 overflow-hidden shadow-md rounded-lg animate-pulse border border-border">
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div className='space-y-1.5'>
             <Skeleton className="h-5 w-20 bg-muted" />
             <Skeleton className="h-3 w-24 bg-muted" />
          </div>
          <div className='space-y-1.5 text-right'>
             <Skeleton className="h-3 w-28 bg-muted" />
             <Skeleton className="h-3 w-20 bg-muted" />
          </div>
        </div>
      </CardHeader>
      <Skeleton className="w-full h-56 bg-muted" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-full bg-muted" />
        <Skeleton className="h-4 w-5/6 bg-muted" />
        <Skeleton className="h-4 w-1/2 mt-2 bg-muted" />
        <Skeleton className="h-4 w-1/3 mt-1 bg-muted" />
      </CardContent>
      <CardFooter className="p-4 flex justify-end space-x-2 bg-muted/30 border-t">
        <Skeleton className="h-9 w-24 rounded-md bg-muted" />
        <Skeleton className="h-9 w-28 rounded-md bg-muted" />
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">Reported Issues</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
           <Filter className="h-5 w-5 text-muted-foreground" />
           <Select value={filter} onValueChange={(value) => setFilter(value as 'all' | 'pending' | 'solved')}>
                <SelectTrigger className="w-full sm:w-[180px]">
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
        <Alert variant="destructive" className="mb-6">
             <AlertCircle className="h-4 w-4" />
             <AlertTitle>Error Loading Issues</AlertTitle>
             <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {loading ? (
           <> <PostCardSkeleton /> <PostCardSkeleton /> </>
        ) : filteredPosts.length === 0 ? (
           <Card className="text-center py-12 px-6 border-dashed border-border">
                <CardContent>
                   <h3 className="text-lg font-medium text-muted-foreground">No {filter !== 'all' ? filter : ''} issues found.</h3>
                   <p className="text-sm text-muted-foreground mt-1">
                     {filter === 'pending' ? "All caught up!" : filter === 'solved' ? "No issues have been marked as solved yet." : "No issues reported in the system."}
                   </p>
                </CardContent>
            </Card>
        ) : (
          filteredPosts.map((post) => {
            const postDate = timestampToDate(post.timestamp);
            const deadlineDate = timestampToDate(post.deadline);
            const solvedDate = timestampToDate(post.solvedTimestamp);
            const formattedDeadline = deadlineDate ? formatDeadline(deadlineDate) : 'N/A';
            const isOverdue = post.status === 'pending' && deadlineDate && new Date() > deadlineDate;

            const displayAddress = post.address || (post.location ? `Lat: ${post.location.latitude.toFixed(4)}, Lon: ${post.location.longitude.toFixed(4)}` : 'Not provided');
            const mapLink = post.location ? `https://www.google.com/maps?q=${post.location.latitude},${post.location.longitude}` : null;


            return (
              <Card key={post.id} className="w-full overflow-hidden shadow-lg rounded-lg border border-border bg-card">
                 <CardHeader className="p-4 bg-muted/30 border-b">
                    <div className="flex flex-row justify-between items-start gap-4">
                       {/* Left side: Status, Category & Time */}
                       <div>
                          {post.status === 'solved' ? (
                             <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full inline-flex items-center border border-green-200">
                                <CheckCircle className="h-3.5 w-3.5 mr-1"/> Solved
                             </span>
                          ) : (
                              <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center border",
                                 isOverdue ? "bg-red-100 text-red-700 border-red-200" : "bg-orange-100 text-orange-700 border-orange-200"
                                )}>
                                 {isOverdue ? <AlertCircle className="h-3.5 w-3.5 mr-1"/> : <Clock className="h-3.5 w-3.5 mr-1"/>}
                                {isOverdue ? 'Overdue' : 'Pending'}
                              </span>
                          )}
                           <span className="ml-2 text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded border border-border capitalize">{post.category || 'General'}</span>
                          <p className="text-xs text-muted-foreground mt-1.5" title={formatFullDate(postDate)}>
                            Reported {formatRelativeDate(postDate)}
                          </p>
                       </div>
                       {/* Right side: User Info */}
                       <div className="text-right">
                           <p className="text-xs text-muted-foreground">By: {post.userName || 'Citizen'}</p>
                           <p className="text-xs text-muted-foreground mt-1 font-mono" title={post.userId}>UID: {post.userId.substring(0, 6)}...</p>
                       </div>
                    </div>
                 </CardHeader>

                {/* Image */}
                {post.imageUrl && (
                  <div className="relative w-full h-60 bg-muted overflow-hidden"> {/* Fixed height for consistency */}
                    <Image
                      src={post.imageUrl}
                      alt={post.caption || 'Issue Image'}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 100vw, 672px"
                       onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/600/400?grayscale'; (e.target as HTMLImageElement).alt="Image load error"; }}
                       data-ai-hint="waste management urban environment"
                    />
                  </div>
                )}

                {/* Content: Caption, Location, Deadline */}
                <CardContent className="p-4 space-y-3">
                  <p className="text-foreground whitespace-pre-wrap break-words font-medium">{post.caption}</p>
                  {/* Location */}
                   <div className="flex items-start text-sm text-muted-foreground gap-1.5">
                      <MapPin className="h-4 w-4 mr-0 flex-shrink-0 mt-px text-gray-400" />
                       <span className="line-clamp-2" title={displayAddress}>
                          {displayAddress}
                       </span>
                       {mapLink && (
                          <a href={mapLink} target="_blank" rel="noopener noreferrer" className="ml-1 text-accent hover:underline text-xs flex-shrink-0 whitespace-nowrap">(View Map)</a>
                       )}
                  </div>
                  {/* Deadline */}
                  {deadlineDate && (
                      <div className={cn("flex items-center text-sm gap-1.5", isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground")}>
                          <CalendarDays className="h-4 w-4 mr-0 flex-shrink-0" />
                          <span>Deadline: {formattedDeadline} {isOverdue && '(Overdue)'}</span>
                      </div>
                  )}
                  {/* Municipal Reply */}
                  {post.municipalReply && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm font-semibold text-green-800 mb-1">Municipal Response:</p>
                      <p className="text-sm text-green-700 whitespace-pre-wrap break-words">{post.municipalReply}</p>
                       {solvedDate && (
                          <p className="text-xs text-muted-foreground mt-1.5 italic">Responded: {formatRelativeDate(solvedDate)}</p>
                       )}
                    </div>
                  )}
                   {post.status === 'solved' && !post.municipalReply && solvedDate && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                         <p className="text-sm text-yellow-700 italic">Marked as solved {formatRelativeDate(solvedDate)} without comment.</p>
                      </div>
                  )}
                </CardContent>

                {/* Actions Footer */}
                <CardFooter className="p-4 flex justify-end space-x-2 bg-muted/30 border-t">
                  {post.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsSolved(post.id)}
                        disabled={isUpdatingStatus[post.id] || isReplying}
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
                  {post.status === 'solved' && (
                    <Button
                      size="sm"
                      onClick={() => handleOpenReplyDialog(post)}
                      variant="outline"
                      disabled={isReplying}
                    >
                      <MessageSquare className="h-4 w-4 mr-1"/> {post.municipalReply ? 'Edit Reply' : 'Add Reply'}
                    </Button>
                  )}
                   {/* Delete Button */}
                    <AlertDialog>
                       <AlertDialogTrigger asChild>
                           <Button variant="destructive" size="icon" className="h-9 w-9" title="Delete Issue" disabled={isUpdatingStatus[post.id]}>
                              {isUpdatingStatus[post.id]? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                           </Button>
                       </AlertDialogTrigger>
                       <AlertDialogContent>
                           <AlertDialogHeader>
                           <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                           <AlertDialogDescription>
                                Are you sure you want to delete this issue? This action cannot be undone.
                           </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteIssue(post.id)} className="bg-destructive hover:bg-destructive/90">Confirm Delete</AlertDialogAction>
                           </AlertDialogFooter>
                       </AlertDialogContent>
                   </AlertDialog>
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>

      {/* Reply Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && handleCloseReplyDialog()}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{selectedPost?.municipalReply ? 'Edit Reply' : 'Reply to Issue'} & Mark as Solved</DialogTitle>
            <CardDescription className="pt-1">
              Your reply will be visible to the citizen. Replying marks the issue as solved.
            </CardDescription>
          </DialogHeader>
          {dialogError && (
            <Alert variant="destructive" className="my-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{dialogError}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSendReply} className="grid gap-4 py-4">
            <Label htmlFor="reply" className="sr-only">Reply Message</Label>
            <Textarea
              id="reply"
              placeholder="Enter your reply message here..."
              value={replyText}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setReplyText(e.target.value)}
              className="col-span-4 min-h-[120px]"
              required
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isReplying}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isReplying || !replyText.trim()} className="bg-primary hover:bg-primary/90">
                {isReplying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {selectedPost?.municipalReply ? 'Update Reply' : 'Send Reply'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    