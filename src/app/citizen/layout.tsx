'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import AuthProvider from '@/components/auth-provider'; // Assuming AuthProvider handles session/auth state

export default function CitizenLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/citizen/home', label: 'Home', icon: Home },
    { href: '/citizen/add-post', label: 'Add Post', icon: PlusSquare },
    { href: '/citizen/profile', label: 'Profile', icon: User },
  ];

  return (
    <AuthProvider requiredRole="citizen">
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow pb-16">{children}</main> {/* Add padding-bottom to prevent overlap */}

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-md z-50">
          <div className="flex justify-around items-center h-16 max-w-screen-md mx-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center text-center px-2 py-1 rounded-md transition-colors duration-200 ease-in-out',
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="h-6 w-6 mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </AuthProvider>
  );
}
