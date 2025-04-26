'use client';

import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User as UserIcon, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CitizenProfilePage() {
  const [user, setUser] = useState(auth.currentUser);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push('/'); // Redirect to landing if not logged in
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe(); // Cleanup subscription
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/'); // Redirect to landing page after logout
    } catch (error) {
      console.error('Error logging out:', error);
       toast({ title: 'Logout Failed', description: 'Could not log you out. Please try again.', variant: 'destructive' });
    }
  };

  if (!user) {
    // Optional: Show a loading state or redirect immediately
     return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-md">
      <Card className="shadow-lg">
        <CardHeader className="items-center text-center">
          <Avatar className="w-24 h-24 mb-4 border-4 border-primary">
            {/* Use AvatarImage if user has a photoURL, otherwise fallback */}
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User Profile'} />
            <AvatarFallback className="text-4xl bg-secondary text-secondary-foreground">
                {/* Display initials or default icon */}
                 {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon size={40} />}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl font-semibold">Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           {/* Display User Info */}
           <div className="flex items-center space-x-3 p-3 border rounded-md">
             <Phone className="h-5 w-5 text-muted-foreground" />
             <span className="text-foreground">{user.phoneNumber || 'No phone number available'}</span>
          </div>
           {/* Add more profile details here if needed (e.g., Name, Email if collected) */}
           {/* Example:
           <div className="flex items-center space-x-3 p-3 border rounded-md">
             <Mail className="h-5 w-5 text-muted-foreground" />
             <span className="text-foreground">{user.email || 'No email provided'}</span>
          </div>
          */}

          <Button onClick={handleLogout} variant="destructive" className="w-full">
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Added Loader2 import
import { Loader2 } from 'lucide-react';
