'use client';

import React, { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
// Removed Firebase imports (collection, query, orderBy, onSnapshot, doc, updateDoc, where, Timestamp, serverTimestamp, GeoPoint, db)
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
import { format, formatDistanceToNow, parseISO } from 'date-fns'; // Added parseISO
import { cn } from '@/lib/utils';

interface MockLocation {
  latitude: number;
  longitude: number;
}

// Adjusted MockPost interface to use strings for dates
interface MockPost {
  id: string;
  imageUrl: string;
  caption: string;
  location?: MockLocation;
  address?: string;
  timestamp: string; // ISO String
  userId: string;
  userName?: string;
  status?: 'pending' | 'solved';
  municipalReply?: string;
  deadline?: string; // ISO String
  solvedTimestamp?: string; // ISO String
}

// Sample Mock Data
const sampleMockPosts: MockPost[] = [
  {
    id: 'mock1',
    imageUrl: 'https://picsum.photos/600/600?random=1',
    caption: 'Overflowing bin near the park entrance. Needs immediate attention.',
    location: { latitude: 19.0760, longitude: 72.8777 },
    address: 'Near Central Park Entrance, Mock City',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    userId: 'mock_citizen_1',
    userName: 'Concerned Citizen A',
    status: 'pending',
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
  },
  {
    id: 'mock3',
    imageUrl: 'https://picsum.photos/600/600?random=3',
    caption: 'Street light not working on Elm Street.',
    address: '456 Elm Street, Mock City',
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
    userId: 'mock_citizen_3',
    userName: 'Resident C',
    status: 'pending',
  },
   {
    id: 'mock_local_1', // Example from potential localStorage
    imageUrl: 'https://picsum.photos/600/600?random=4',
    caption: 'Pothole on Oak Avenue',
    location: { latitude: 19.0780, longitude: 72.8800 },
    address: 'Oak Avenue, Mock City',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    userId: 'mock_citizen_user',
    userName: 'Citizen User (Mock)',
    status: 'pending',
    deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
  },
  {
    id: 'mock2',
    imageUrl: 'https://picsum.photos/600/600?random=2',
    caption: 'Drainage blocked on Main Street. Water logging during rains.',
    address: '123 Main Street, Mock City',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    userId: 'mock_citizen_2',
    userName: 'Resident B',
    status: 'solved',
    municipalReply: 'The drainage has been cleared by our team.',
    solvedTimestamp: new Date(Date.now() - 86400000).toISOString(),
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

const formatFullDate = (isoString: string): string => parseAndFormatDate(isoString, (d) => format(d, "MMM d, yyyy, h:mm a"));
const formatRelativeDate = (isoString: string): string => parseAndFormatDate(isoString, formatDistanceToNow, { addSuffix: true }) || 'a while ago';
const formatDeadline = (isoString?: string): string | null => {
     if (!isoString) return null;
     return parseAndFormatDate(isoString, (d) => format(d, "MMM d, yyyy"));
};


export default function MunicipalIssuesPage() {
  const [allPosts, setAllPosts] = useState<MockPost[]>([]); // Store all mock posts
  const [filteredPosts, setFilteredPosts] = useState<MockPost[]>([]); // Posts to display based on filter
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'solved' | 'all'>('pending');
  const [selectedPost, setSelectedPost] = useState<MockPost | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<Record<string, boolean>>({});
  const [dialogError, setDialogError] = useState<string | null>(null);
  const { toast } = useToast();


  // Load initial mock data
  useEffect(() => {
    setLoading(true);
    setError(null);
    console.log("Frontend-only mode: Loading initial mock issues...");

    try {
        // Try loading from localStorage first (to include posts added via AddPostPage mock)
        const storedPosts = localStorage.getItem('mockPosts');
        let combinedPosts: MockPost[] = [];

        if (storedPosts) {
             try {
                const parsedStoredPosts = JSON.parse(storedPosts);
                // Filter out any invalid entries just in case
                combinedPosts = parsedStoredPosts.filter((p: any) => p.id && p.timestamp);
                console.log(`Loaded ${combinedPosts.length} mock posts from localStorage.`);
            } catch (parseError) {
                console.error("Error parsing localStorage posts:", parseError);
                // Fallback to sample data if parsing fails
                 combinedPosts = [...sampleMockPosts];
                 localStorage.removeItem('mockPosts'); // Clear corrupted data
            }
        } else {
             combinedPosts = [...sampleMockPosts]; // Use sample data if nothing in storage
        }

         // Ensure sample posts are included if not already present from storage (simple check)
         sampleMockPosts.forEach(samplePost => {
            if (!combinedPosts.some(p => p.id === samplePost.id)) {
                combinedPosts.push(samplePost);
            }
         });

        // Sort by timestamp descending
        combinedPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setAllPosts(combinedPosts);
        setLoading(false);
        console.log("Initial mock issues loaded.");

    } catch (err: any) {
         console.error("Error loading initial mock issues: ", err);
         setError(`Failed to load mock issues. ${err.message}`);
         setLoading(false);
    }
  }, []); // Load only once on mount

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


  const handleOpenReplyDialog = (post: MockPost) => {
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

  // Simulate sending reply and updating status
  const handleSendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !replyText.trim()) {
        setDialogError("Please enter a reply message.");
        return;
    };
    setIsReplying(true);
    setDialogError(null);
    console.log(`Simulating reply for post ${selectedPost.id}: ${replyText.trim()}`);

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 700));

    try {
      // Update the state locally
      setAllPosts(prevPosts =>
        prevPosts.map(p =>
          p.id === selectedPost.id
            ? {
                ...p,
                municipalReply: replyText.trim(),
                status: 'solved',
                solvedTimestamp: new Date().toISOString()
              }
            : p
        )
      );
       // Update localStorage as well (Optional)
       const updatedLocalStoragePosts = allPosts.map(p =>
           p.id === selectedPost.id
            ? { ...p, municipalReply: replyText.trim(), status: 'solved', solvedTimestamp: new Date().toISOString() }
            : p
       );
       localStorage.setItem('mockPosts', JSON.stringify(updatedLocalStoragePosts));


      toast({ title: "Reply Sent (Simulated)", description: "Issue marked as solved." });
      handleCloseReplyDialog();
    } catch (err: any) {
      console.error("Error simulating reply:", err);
      const message = `Failed to send reply (simulated): ${err.message}`;
      setDialogError(message);
      toast({ title: "Reply Error", description: message, variant: "destructive" });
    } finally {
      setIsReplying(false);
    }
  };

  // Simulate marking as solved
  const handleMarkAsSolved = async (postId: string) => {
    if (!postId) return;
    setIsUpdatingStatus(prev => ({ ...prev, [postId]: true }));
    console.log(`Simulating marking post ${postId} as solved.`);

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
       // Update the state locally
       setAllPosts(prevPosts =>
        prevPosts.map(p =>
          p.id === postId
            ? { ...p, status: 'solved', solvedTimestamp: new Date().toISOString() }
            : p
        )
       );
       // Update localStorage as well (Optional)
        const updatedLocalStoragePosts = allPosts.map(p =>
           p.id === postId
            ? { ...p, status: 'solved', solvedTimestamp: new Date().toISOString() }
            : p
        );
       localStorage.setItem('mockPosts', JSON.stringify(updatedLocalStoragePosts));

      toast({ title: "Status Updated (Simulated)", description: "Issue marked as solved." });
    } catch (err: any) {
      console.error("Error simulating mark as solved:", err);
      toast({ title: "Update Error", description: `Failed to update status (simulated): ${err.message}`, variant: "destructive" });
    } finally {
      setIsUpdatingStatus(prev => ({ ...prev, [postId]: false }));
    }
  };

   // Simulate delete
   const handleDeleteIssue = async (postId: string) => {
     console.warn(`Simulating delete for post ${postId}.`);
     setIsUpdatingStatus(prev => ({ ...prev, [postId]: true })); // Use loading state for delete button too

     await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

     try {
        // Update state
        setAllPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
        // Update localStorage (Optional)
        const updatedLocalStoragePosts = allPosts.filter(p => p.id !== postId);
        localStorage.setItem('mockPosts', JSON.stringify(updatedLocalStoragePosts));

        toast({ title: "Issue Deleted (Simulated)" });
     } catch(err: any) {
        toast({ title: "Deletion Error (Simulated)", description: err.message, variant: "destructive" });
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
            const formattedDeadline = formatDeadline(post.deadline);
            const deadlineDate = post.deadline ? parseISO(post.deadline) : null;
            const isOverdue = post.status === 'pending' && deadlineDate && new Date() > deadlineDate;

            return (
              <Card key={post.id} className="w-full overflow-hidden shadow-lg rounded-lg border border-border bg-card">
                 <CardHeader className="p-4 bg-muted/30 border-b">
                    <div className="flex flex-row justify-between items-start gap-4">
                       {/* Left side: Status & Time */}
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
                          <p className="text-xs text-muted-foreground mt-1.5" title={formatFullDate(post.timestamp)}>
                            Reported {formatRelativeDate(post.timestamp)}
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
                    />
                  </div>
                )}

                {/* Content: Caption, Location, Deadline */}
                <CardContent className="p-4 space-y-3">
                  <p className="text-foreground whitespace-pre-wrap break-words font-medium">{post.caption}</p>
                  {/* Location */}
                   <div className="flex items-start text-sm text-muted-foreground gap-1.5">
                      <MapPin className="h-4 w-4 mr-0 flex-shrink-0 mt-px text-gray-400" />
                       <span className="line-clamp-2" title={post.address || (post.location ? `Lat: ${post.location.latitude.toFixed(4)}, Lon: ${post.location.longitude.toFixed(4)}` : 'Not provided')}>
                          {post.address || (post.location ? `Lat: ${post.location.latitude.toFixed(4)}, Lon: ${post.location.longitude.toFixed(4)}` : 'Location not provided')}
                       </span>
                       {post.location && (
                          <a href={`https://www.google.com/maps?q=${post.location.latitude},${post.location.longitude}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-accent hover:underline text-xs flex-shrink-0 whitespace-nowrap">(View Map)</a>
                       )}
                  </div>
                  {/* Deadline */}
                  {formattedDeadline && (
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
                       {post.solvedTimestamp && (
                          <p className="text-xs text-muted-foreground mt-1.5 italic">Responded: {formatRelativeDate(post.solvedTimestamp)}</p>
                       )}
                    </div>
                  )}
                   {post.status === 'solved' && !post.municipalReply && post.solvedTimestamp && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                         <p className="text-sm text-yellow-700 italic">Marked as solved {formatRelativeDate(post.solvedTimestamp)} without comment.</p>
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
                   {/* Delete Button (Simulated) */}
                    <AlertDialog>
                       <AlertDialogTrigger asChild>
                           <Button variant="destructive" size="icon" className="h-9 w-9" title="Delete Issue (Simulated)" disabled={isUpdatingStatus[post.id]}>
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

      {/* Reply Dialog (Remains mostly the same, but onSubmit calls simulated function) */}
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
