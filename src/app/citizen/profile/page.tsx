'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/config'; // Import db
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import { signOut, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User as UserIcon, Phone, Loader2, ShieldCheck, Edit } from 'lucide-react'; // Added ShieldCheck, Edit
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

export default function CitizenProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null); // To store Firestore data
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        router.push('/'); // Redirect to landing if not logged in
      } else {
        setUser(currentUser);
        // Fetch additional user data from Firestore
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data());
             console.log("User Firestore data:", userDocSnap.data());
          } else {
            console.log("No Firestore document found for this user.");
            setUserData(null); // Explicitly set to null if no data
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          toast({ title: "Profile Error", description: "Could not fetch profile details.", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      }
    });
    return () => unsubscribe(); // Cleanup subscription
  }, [router, toast]);

  const handleLogout = async () => {
    setLoading(true); // Show loading on logout button
    try {
      await signOut(auth);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/'); // Redirect to landing page after logout
    } catch (error) {
      console.error('Error logging out:', error);
      toast({ title: 'Logout Failed', description: 'Could not log you out. Please try again.', variant: 'destructive' });
       setLoading(false); // Hide loading on error
    }
    // setLoading will implicitly be false after redirect or error handling
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]"> {/* Adjust height */}
          {/* Skeleton Loader for Profile */}
           <Card className="w-full max-w-md shadow-lg animate-pulse">
                <CardHeader className="items-center text-center">
                    <Skeleton className="w-24 h-24 rounded-full mb-4 bg-muted" />
                    <Skeleton className="h-6 w-3/4 mb-2 bg-muted" />
                    <Skeleton className="h-4 w-1/2 bg-muted" />
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                    <div className="flex items-center space-x-3 p-3 border rounded-md">
                        <Skeleton className="h-5 w-5 rounded bg-muted" />
                        <Skeleton className="h-4 w-full bg-muted" />
                    </div>
                     <Skeleton className="h-10 w-full rounded-md bg-muted" />
                </CardContent>
            </Card>
      </div>
    );
  }

  if (!user) {
    // Should have been redirected by useEffect, but added as a safeguard
    return <div className="p-4 text-center text-muted-foreground">Please log in.</div>;
  }

  // Determine role display
  const roleDisplay = userData?.role === 'citizen' ? 'Citizen' : userData?.role === 'municipal' ? 'Municipal Authority' : 'User';
  const roleIcon = userData?.role === 'citizen' ? <UserIcon size={16} className="mr-1"/> : <ShieldCheck size={16} className="mr-1"/>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card className="shadow-xl border border-primary/10 rounded-lg overflow-hidden">
        <CardHeader className="items-center text-center bg-gradient-to-b from-primary/10 to-background p-6">
          <Avatar className="w-24 h-24 mb-4 border-4 border-primary ring-2 ring-offset-2 ring-primary/50">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User Profile'} />
            <AvatarFallback className="text-4xl bg-secondary text-primary font-semibold">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon size={40} />}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl font-semibold text-foreground">
             {user.displayName || 'Your Profile'}
          </CardTitle>
           <CardDescription className="flex items-center justify-center text-muted-foreground text-sm mt-1">
              {roleIcon} {roleDisplay}
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          {/* Display User Info */}
          <div className="flex items-center space-x-3 p-3 border border-input rounded-md bg-background shadow-sm">
            <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <span className="text-foreground truncate">{user.phoneNumber || 'No phone number'}</span>
          </div>

           {/* Add more details if available in Firestore */}
          {userData?.createdAt && (
              <div className="flex items-center space-x-3 p-3 border border-input rounded-md bg-background shadow-sm">
                <CalendarIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground text-sm">
                    Joined: {format(userData.createdAt.toDate(), 'PPP')} {/* Format timestamp */}
                </span>
             </div>
          )}

           {/* Edit Profile Button (Placeholder) */}
           <Button variant="outline" className="w-full text-accent border-accent hover:bg-accent/10" disabled>
             <Edit className="mr-2 h-4 w-4" /> Edit Profile (Coming Soon)
           </Button>

          {/* Logout Button */}
          <Button onClick={handleLogout} variant="destructive" className="w-full" disabled={loading}>
             {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Added imports for CalendarIcon, format, X
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
