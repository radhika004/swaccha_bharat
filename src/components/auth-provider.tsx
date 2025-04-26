'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config'; // Adjust path as needed
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  // Add role if you implement role-based access control
  role: 'citizen' | 'municipal' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
  requiredRole?: 'citizen' | 'municipal'; // Optional: Specify required role for nested routes
}

export default function AuthProvider({ children, requiredRole }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'citizen' | 'municipal' | null>(null); // Basic role state
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
          // --- Role Determination Logic ---
          // This is a placeholder. Implement actual role checking, e.g.,
          // - Check custom claims on the user token (preferred method, set via backend/Firebase Functions)
          // - Check a 'role' field in the user's Firestore document
          // For now, determine role based on the current path segment
          if (pathname.startsWith('/citizen')) {
              setRole('citizen');
          } else if (pathname.startsWith('/municipal')) {
              setRole('municipal');
          } else {
               setRole(null); // Or determine default role
          }
           // Example using Custom Claims (Requires backend setup)
           /*
           try {
               const idTokenResult = await currentUser.getIdTokenResult();
               if (idTokenResult.claims.role === 'municipal') {
                   setRole('municipal');
               } else {
                   setRole('citizen'); // Default to citizen if no specific role claim
               }
           } catch (error) {
               console.error("Error getting user role from claims:", error);
               setRole(null); // Handle error case
           }
           */

      } else {
         setRole(null);
      }

      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [pathname]); // Re-run if pathname changes, helps with role determination

  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname.startsWith('/auth');
      const isLandingPage = pathname === '/';

       if (!user && !isAuthPage && !isLandingPage) {
        // If not logged in and not on auth/landing page, redirect to landing
        console.log("User not logged in, redirecting to /");
        router.push('/');
      } else if (user && isAuthPage) {
         // If logged in and trying to access auth page, redirect based on determined role
         const redirectPath = role === 'municipal' ? '/municipal/dashboard' : '/citizen/home';
         console.log(`User logged in, redirecting from auth to ${redirectPath}`);
         router.push(redirectPath);
      } else if (user && requiredRole && role && role !== requiredRole) {
          // If logged in but role doesn't match required role for the layout/page
          console.warn(`Role mismatch: User role '${role}', required '${requiredRole}'. Redirecting.`);
          // Redirect to appropriate home or show unauthorized message
          const fallbackPath = role === 'municipal' ? '/municipal/dashboard' : '/citizen/home';
          router.push(fallbackPath);
      }
      // Allow access if user exists and role matches (or no role required), or if on public pages
    }
  }, [user, loading, role, requiredRole, router, pathname]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

   // Prevent rendering children if user is null and not on a public/auth route during initial load/redirect phase
   const isAuthPage = pathname.startsWith('/auth');
   const isLandingPage = pathname === '/';
   if (!user && !isAuthPage && !isLandingPage) {
     return null; // Or return the loader again while redirecting
   }
   // Prevent rendering children if role mismatch is detected and redirect is pending
   if (user && requiredRole && role && role !== requiredRole) {
      return null; // Or show an 'Unauthorized' component
   }


  return (
    <AuthContext.Provider value={{ user, loading, role }}>
      {children}
    </AuthContext.Provider>
  );
}
