'use client';

import React, { useState, useEffect } from 'react';
// Removed Firebase imports (auth, db, doc, getDoc, signOut, User)
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User as UserIcon, Phone, Loader2, ShieldCheck, Edit, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns'; // Keep format for mock data

// Mock User Data
const mockUser = {
  uid: 'mock_citizen_user_123',
  displayName: 'Mock Citizen',
  photoURL: null, // Or a placeholder image URL
  phoneNumber: '+91 98765 43210',
};

const mockUserData = {
  role: 'citizen',
  createdAt: new Date(Date.now() - 86400000 * 10), // Joined 10 days ago
};

export default function CitizenProfilePage() {
  const [user, setUser] = useState<any>(mockUser); // Use mock user
  const [userData, setUserData] = useState<any>(mockUserData); // Use mock user data
  const [loading, setLoading] = useState(false); // Start with loading false in mock mode
  const router = useRouter();
  const { toast } = useToast();

  // Removed useEffect for onAuthStateChanged

  const handleLogout = async () => {
    setLoading(true); // Show loading on logout button
    try {
      // Simulate logout
      // await signOut(auth); // Removed Firebase signout
      console.log("Simulating user logout...");
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/'); // Redirect to landing page after logout
    } catch (error) {
      console.error('Error logging out:', error);
      toast({ title: 'Logout Failed', description: 'Could not log you out. Please try again.', variant: 'destructive' });
       setLoading(false); // Hide loading on error
    }
    // No need to set loading to false explicitly if redirecting
  };

  // Removed loading skeleton as we start with mock data ready
  // if (loading) { ... }

  if (!user) {
    // This case might not be reached in mock mode unless explicitly set
    return <div className="p-4 text-center text-muted-foreground">Please log in.</div>;
  }

  // Determine role display based on mock data
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

           {/* Display mock joined date */}
          {userData?.createdAt && (
              <div className="flex items-center space-x-3 p-3 border border-input rounded-md bg-background shadow-sm">
                <CalendarIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground text-sm">
                    Joined: {format(userData.createdAt, 'PPP')} {/* Format timestamp */}
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
