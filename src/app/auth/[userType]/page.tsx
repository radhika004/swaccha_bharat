'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This page now acts as a simple redirector since Firebase Auth is removed.
export default function AuthRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const userType = params.userType as 'citizen' | 'municipal';

  useEffect(() => {
    // Redirect immediately based on the user type in the URL
    const redirectPath = userType === 'citizen' ? '/citizen/home' : '/municipal/dashboard';
    console.log(`Frontend-only mode: Redirecting ${userType} to ${redirectPath}`);
    router.replace(redirectPath); // Use replace to avoid adding this page to history
  }, [userType, router]);

  // Display a loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 p-4">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
