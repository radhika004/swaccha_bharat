
'use client';

import React, { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Import useParams and useRouter
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { MapPin, Loader2, MessageSquare, CheckCircle, Send, AlertCircle, CalendarDays, Clock, Trash2, Tag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Interface matching mock data structure
interface MockPost {
  id: string;
  imageUrl: string;
  caption: string;
  category: string;
  location?: { latitude: number; longitude: number };
  address?: string;
  timestamp: string; // ISO String
  userId: string;
  userName?: string;
  status: 'pending' | 'solved';
  municipalReply?: string;
  deadline?: string; // ISO String
  solvedTimestamp?: string; // ISO String
}

// Sample mock data (consistent with other pages)
const sampleMockPosts: MockPost[] = [
    {
    id: 'mock1',
    imageUrl: 'https://picsum.photos/600/600?random=1',
    caption: 'Overflowing bin near the park entrance. Needs immediate attention.',
    category: 'garbage',
    location: { latitude: 19.0760, longitude: 72.8777 },
    address: 'Near Central Park Entrance, Mock City',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    userId: 'mock_citizen_1',
    userName: 'Concerned Citizen A',
    status: 'pending',
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
  },
   {
    id: 'mock_local_1',
    imageUrl: 'https://picsum.photos/600/600?random=4',
    caption: 'Pothole on Oak Avenue',
    category: 'potholes',
    location: { latitude: 19.0800, longitude: 72.8800 },
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
    category: 'drainage',
    address: '123 Main Street, Mock City',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    userId: 'mock_citizen_2',
    userName: 'Resident B',
    status: 'solved',
    municipalReply: 'The drainage has been cleared by our team.',
    solvedTimestamp: new Date(Date.now() - 86400000).toISOString(),
  },
   {
    id: 'mock_garbage_2',
    imageUrl: 'https://picsum.photos/600/600?random=5&category=garbage',
    caption: 'Another garbage pile on 2nd Street.',
    category: 'garbage',
    address: '2nd Street, Mock City',
    timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
    userId: 'mock_citizen_3',
    userName: 'Resident C',
    status: 'pending',
  },
];

// Helper functions for date formatting
const parseAndFormatDate = (isoString: string | undefined, formatFn: (date: Date, options?: any) => string, options?: any): string => {
  if (!isoString) return 'N/A';
  try {
    const date = parseISO(isoString);
    return formatFn(date, options);
  } catch (e) {
    console.error("Error parsing/formatting date:", e, isoString);
    return "Error date";
  }
};
const formatRelativeDate = (isoString: string): string => parseAndFormatDate(isoString, formatDistanceToNow, { addSuffix: true }) || 'a while ago';
const formatFullDate = (isoString: string): string => parseAndFormatDate(isoString, (d) => d.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }));
const formatDeadline = (isoString?: string): string | null => {
     if (!isoString) return null;
     return parseAndFormatDate(isoString, (d) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }));
};

export default function CategoryIssuesPage() {
  const params = useParams();
  const router = useRouter();
  const categoryName = typeof params.categoryName === 'string' ? decodeURIComponent(params.categoryName) : 'unknown';

  const [allPosts, setAllPosts] = useState<MockPost[]>([]);
  const [categoryPosts, setCategoryPosts] = useState<MockPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<MockPost | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<Record<string, boolean>>({});
  const [dialogError, setDialogError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    setError(null);
    console.log(`Frontend-only mode: Loading issues for category: ${categoryName}`);

    try {
        const storedPosts = localStorage.getItem('mockPosts');
        let postsData: MockPost[];

        if (storedPosts) {
            postsData = JSON.parse(storedPosts);
        } else {
            postsData = sampleMockPosts;
        }
        
        postsData = postsData.filter(post => post.id && post.imageUrl && post.caption && post.category && post.timestamp && post.userId && post.status);
        postsData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAllPosts(postsData);

        const filtered = postsData.filter(post => post.category.toLowerCase() === categoryName.toLowerCase());
        setCategoryPosts(filtered);
        console.log(`Found ${filtered.length} posts for category ${categoryName}`);

    } catch (err: any) {
         console.error("Error loading/processing mock posts for category:", err);
         setError(`Failed to load issues for category ${categoryName}. ${err.message}`);
    } finally {
        setTimeout(() => setLoading(false), 500);
    }
  }, [categoryName]);

  const updateLocalStorageAndState = (updatedPosts: MockPost[]) => {
    setAllPosts(updatedPosts); // Update the base list of all posts
    // Re-filter for the current category
    const filtered = updatedPosts.filter(post => post.category.toLowerCase() === categoryName.toLowerCase());
    setCategoryPosts(filtered);
    localStorage.setItem('mockPosts', JSON.stringify(updatedPosts));
  };

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

  const handleSendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !replyText.trim()) {
        setDialogError("Please enter a reply message.");
        return;
    };
    setIsReplying(true);
    setDialogError(null);
    await new Promise(resolve => setTimeout(resolve, 700));
    try {
      const updated = allPosts.map(p =>
        p.id === selectedPost.id
          ? { ...p, status: 'solved' as 'solved', municipalReply: replyText.trim(), solvedTimestamp: new Date().toISOString() }
          : p
      );
      updateLocalStorageAndState(updated);
      toast({ title: "Reply Sent (Simulated)", description: "Issue marked as solved." });
      handleCloseReplyDialog();
    } catch (err: any) {
      const message = `Failed to simulate reply: ${err.message}`;
      setDialogError(message);
      toast({ title: "Reply Error (Simulated)", description: message, variant: "destructive" });
    } finally {
      setIsReplying(false);
    }
  };

  const handleMarkAsSolved = async (postId: string) => {
    setIsUpdatingStatus(prev => ({ ...prev, [postId]: true }));
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
       const updated = allPosts.map(p =>
        p.id === postId
          ? { ...p, status: 'solved' as 'solved', solvedTimestamp: new Date().toISOString() }
          : p
      );
       updateLocalStorageAndState(updated);
      toast({ title: "Status Updated (Simulated)", description: "Issue marked as solved." });
    } catch (err: any) {
      toast({ title: "Update Error (Simulated)", description: `Failed to update status: ${err.message}`, variant: "destructive" });
    } finally {
      setIsUpdatingStatus(prev => ({ ...prev, [postId]: false }));
    }
  };

   const handleDeleteIssue = async (postId: string) => {
     setIsUpdatingStatus(prev => ({ ...prev, [postId]: true }));
     await new Promise(resolve => setTimeout(resolve, 600));
     try {
         const updated = allPosts.filter(p => p.id !== postId);
         updateLocalStorageAndState(updated);
        toast({ title: "Issue Deleted (Simulated)" });
     } catch(err: any) {
        toast({ title: "Deletion Error (Simulated)", description: err.message, variant: "destructive" });
     } finally {
        setIsUpdatingStatus(prev => ({ ...prev, [postId]: false }));
     }
   };

  const PostCardSkeleton = () => ( /* Same as in main issues page */
    <Card className="w-full mb-6 overflow-hidden shadow-md rounded-lg animate-pulse border border-border">
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div className='space-y-1.5'>
             <Skeleton className="h-5 w-20 bg-muted" />
             <Skeleton className="h-3 w-24 bg-muted" />
             <Skeleton className="h-4 w-16 mt-1 bg-muted" />
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
      <div className="flex items-center mb-6 gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()} className="flex-shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary capitalize">
          Issues: {categoryName}
        </h1>
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
        ) : categoryPosts.length === 0 ? (
           <Card className="text-center py-12 px-6 border-dashed border-border">
                <CardContent>
                   <h3 className="text-lg font-medium text-muted-foreground">No issues found for &quot;{categoryName}&quot;.</h3>
                   <p className="text-sm text-muted-foreground mt-1">
                     <Link href="/municipal/issues/categories" className="text-primary hover:underline">
                        View other categories
                     </Link>
                   </p>
                </CardContent>
            </Card>
        ) : (
          categoryPosts.map((post) => {
            const deadlineDate = post.deadline ? parseISO(post.deadline) : null;
            const formattedDeadline = deadlineDate ? formatDeadline(post.deadline) : 'N/A';
            const isOverdue = post.status === 'pending' && deadlineDate && new Date() > deadlineDate;
            const displayAddress = post.address || (post.location ? `Lat: ${post.location.latitude.toFixed(4)}, Lon: ${post.location.longitude.toFixed(4)}` : 'Not provided');
            const mapLink = post.location ? `https://www.google.com/maps?q=${post.location.latitude},${post.location.longitude}` : null;

            return (
              <Card key={post.id} className="w-full overflow-hidden shadow-lg rounded-lg border border-border bg-card">
                 <CardHeader className="p-4 bg-muted/30 border-b">
                    <div className="flex flex-row justify-between items-start gap-4">
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
                           <span className="ml-2 text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded border border-border capitalize inline-flex items-center">
                               <Tag className="h-3.5 w-3.5 mr-1"/> {post.category || 'General'}
                           </span>
                          <p className="text-xs text-muted-foreground mt-1.5" title={formatFullDate(post.timestamp)}>
                            Reported {formatRelativeDate(post.timestamp)}
                          </p>
                       </div>
                       <div className="text-right">
                           <p className="text-xs text-muted-foreground">By: {post.userName || 'Citizen'}</p>
                           <p className="text-xs text-muted-foreground mt-1 font-mono" title={post.userId}>UID: {post.userId.substring(0, 6)}...</p>
                       </div>
                    </div>
                 </CardHeader>

                {post.imageUrl && (
                  <div className="relative w-full h-60 bg-muted overflow-hidden">
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

                <CardContent className="p-4 space-y-3">
                  <p className="text-foreground whitespace-pre-wrap break-words font-medium">{post.caption}</p>
                   <div className="flex items-start text-sm text-muted-foreground gap-1.5">
                      <MapPin className="h-4 w-4 mr-0 flex-shrink-0 mt-px text-gray-400" />
                       <span className="line-clamp-2" title={displayAddress}>
                          {displayAddress}
                       </span>
                       {mapLink && (
                          <a href={mapLink} target="_blank" rel="noopener noreferrer" className="ml-1 text-accent hover:underline text-xs flex-shrink-0 whitespace-nowrap">(View Map)</a>
                       )}
                  </div>
                  {post.deadline && (
                      <div className={cn("flex items-center text-sm gap-1.5", isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground")}>
                          <CalendarDays className="h-4 w-4 mr-0 flex-shrink-0" />
                          <span>Deadline: {formatDeadline(post.deadline)} {isOverdue && '(Overdue)'}</span>
                      </div>
                  )}
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
