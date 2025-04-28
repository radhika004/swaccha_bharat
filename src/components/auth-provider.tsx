'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import { auth, db } from '@/lib/firebase/config';
import { Loader2 } from 'lucide-react';

type UserRole = 'citizen' | 'municipal' | null;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: UserRole;
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
  requiredRole?: UserRole; // Optional: Specify required role for nested routes
}

export default function AuthProvider({ children, requiredRole }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Fetch role from Firestore
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const fetchedRole = userData.role as UserRole; // Assume role is stored
             setRole(fetchedRole);
             console.log("User role fetched from Firestore:", fetchedRole);
          } else {
            console.warn(`User document not found for UID: ${currentUser.uid}. Role set to null.`);
            setRole(null); // User doc doesn't exist, maybe new user?
             // Handle case where user doc might be created later or role is inferred
             // For now, determine role based on the current path segment if doc not found
              if (pathname.startsWith('/citizen')) {
                  setRole('citizen');
              } else if (pathname.startsWith('/municipal')) {
                  setRole('municipal');
              }
          }
        } catch (error) {
          console.error("Error fetching user role from Firestore:", error);
          setRole(null); // Error fetching role
        }
      } else {
        setRole(null); // No user, no role
      }

      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [pathname]); // Re-run if pathname changes (though role fetch depends on currentUser)


  useEffect(() => {
    if (loading) return; // Don't run redirection logic while loading

    const isAuthPage = pathname.startsWith('/auth');
    const isLandingPage = pathname === '/';

    if (!user) {
      // Not logged in
      if (!isAuthPage && !isLandingPage) {
        console.log("AuthProvider: No user, not on public page. Redirecting to /");
        router.push('/');
      }
      // Allow access to auth and landing pages
    } else {
      // Logged in
      if (isAuthPage) {
        // If logged in and on auth page, redirect to appropriate dashboard
        const redirectPath = role === 'municipal' ? '/municipal/dashboard' : '/citizen/home';
        console.log(`AuthProvider: User logged in, on auth page. Redirecting to ${redirectPath}`);
        router.push(redirectPath);
      } else if (requiredRole && role && role !== requiredRole) {
        // Logged in, but role mismatch for the required route
        console.warn(`AuthProvider: Role mismatch. User role '${role}', required '${requiredRole}'. Redirecting.`);
        const fallbackPath = role === 'municipal' ? '/municipal/dashboard' : '/citizen/home';
        router.push(fallbackPath);
        // You might want to show a toast message here as well
      }
      // Allow access if user exists and role matches (or no role required), or if on public pages
    }
  }, [user, loading, role, requiredRole, router, pathname]);

  // Render loading indicator while checking auth state or redirecting
  if (loading || (!user && !pathname.startsWith('/auth') && pathname !== '/') || (user && requiredRole && role && role !== requiredRole)) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Render children only when auth state is resolved and access is permitted
  return (
    <AuthContext.Provider value={{ user, loading, role }}>
      {children}
    </AuthContext.Provider>
  );
}
