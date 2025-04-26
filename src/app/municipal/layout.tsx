'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListChecks, BarChart3, LogOut, MountainIcon, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import AuthProvider from '@/components/auth-provider'; // Use AuthProvider to protect routes
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar'; // Import Sidebar components


export default function MunicipalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const navItems = [
    { href: '/municipal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/municipal/issues', label: 'Issues List', icon: ListChecks },
    { href: '/municipal/reports', label: 'Reports', icon: BarChart3 },
    // Add more municipal-specific pages here if needed
     { href: '/municipal/citizens', label: 'Citizen Management', icon: Users },
  ];

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

  return (
    <AuthProvider requiredRole="municipal">
        <SidebarProvider>
         <Sidebar collapsible="icon"> {/* Make sidebar collapsible to icon only */}
           <SidebarHeader className="p-4 items-center gap-2">
               <MountainIcon className="h-8 w-8 text-primary" />
               <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">SwachhConnect</span>
           </SidebarHeader>
           <SidebarContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={{ children: item.label }} // Show label as tooltip when collapsed
                      >
                        <Link href={item.href}>
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
           </SidebarContent>
           <SidebarFooter className="p-4">
                <SidebarMenu>
                 <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleLogout} tooltip={{ children: "Logout" }}>
                      <LogOut className="h-5 w-5" />
                      <span>Logout</span>
                  </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
           </SidebarFooter>
         </Sidebar>
          {/* Main content area that adapts to the sidebar state */}
          <SidebarInset>
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                {/* Mobile sidebar trigger & potentially breadcrumbs/title */}
                 <SidebarTrigger className="md:hidden" /> {/* Show trigger only on mobile */}
                 <h1 className="text-xl font-semibold hidden md:block">
                    {navItems.find(item => pathname.startsWith(item.href))?.label || 'Municipal Portal'}
                 </h1>
            </header>
             <main className="flex-1 p-4 md:p-6">{children}</main>
          </SidebarInset>
       </SidebarProvider>
    </AuthProvider>
  );
}
