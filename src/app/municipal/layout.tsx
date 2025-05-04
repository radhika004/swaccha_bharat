
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ListChecks, BarChart3, LogOut, MountainIcon, Users, Settings, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
// Removed Firebase imports (signOut, auth)
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

// Mock user data since AuthProvider and useAuth are removed
const mockUser = {
    displayName: 'Municipal User',
    photoURL: undefined, // Or a placeholder image URL
    phoneNumber: '+911234567890'
};
const authLoading = false; // Simulate loading as false

export default function MunicipalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const navItems = [
    { href: '/municipal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/municipal/issues', label: 'Issues List', icon: ListChecks },
    { href: '/municipal/reports', label: 'Reports', icon: BarChart3 },
    { href: '/municipal/citizens', label: 'Citizen Management', icon: Users },
  ];

  const handleLogout = async () => {
    try {
      // Simulate logout
      console.log("Simulating municipal user logout...");
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
      toast({ title: 'Logged Out', description: 'You have been logged out.' });
      router.push('/'); // Redirect to landing page
    } catch (error) {
      console.error('Error logging out:', error);
      toast({ title: 'Logout Failed', variant: 'destructive' });
    }
  };

   // Get user initials for Avatar fallback
   const getInitials = (name?: string | null) => {
     if (!name) return "M"; // Default to M for Municipal
     return name.split(' ').map(n => n[0]).join('').toUpperCase();
   };

   return (
       <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
           {/* Sidebar */}
           <div className="hidden border-r bg-muted/40 md:block">
           <div className="flex h-full max-h-screen flex-col gap-2">
               <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
               <Link href="/municipal/dashboard" className="flex items-center gap-2 font-semibold text-primary">
                   <MountainIcon className="h-6 w-6" />
                   <span className="">SwachhConnect</span>
               </Link>
               {/* Optional: Add notification bell or settings icon here */}
               </div>
               <div className="flex-1">
               <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                   {navItems.map((item) => {
                   const isActive = pathname.startsWith(item.href); // Use startsWith for nested routes
                   return (
                       <Link
                       key={item.href}
                       href={item.href}
                       className={cn(
                           "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                           isActive ? "bg-muted text-primary" : "text-muted-foreground"
                       )}
                       >
                       <item.icon className="h-4 w-4" />
                       {item.label}
                       </Link>
                   );
                   })}
               </nav>
               </div>
               {/* Optional: Sidebar footer content */}
               {/* <div className="mt-auto p-4"> ... </div> */}
           </div>
           </div>

           {/* Main Content Area */}
           <div className="flex flex-col">
           {/* Header */}
           <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
               {/* Mobile Sidebar Trigger */}
               <Sheet>
                   <SheetTrigger asChild>
                   <Button
                       variant="outline"
                       size="icon"
                       className="shrink-0 md:hidden"
                   >
                       <ListChecks className="h-5 w-5" /> {/* Changed Icon */}
                       <span className="sr-only">Toggle navigation menu</span>
                   </Button>
                   </SheetTrigger>
                   <SheetContent side="left" className="flex flex-col p-0">
                   {/* Mobile Navigation */}
                   <nav className="grid gap-2 text-lg font-medium p-6">
                       <Link
                           href="/municipal/dashboard"
                           className="flex items-center gap-2 text-lg font-semibold mb-4 text-primary"
                       >
                           <MountainIcon className="h-6 w-6" />
                           <span className="">SwachhConnect</span>
                       </Link>
                       {navItems.map((item) => {
                       const isActive = pathname.startsWith(item.href);
                       return (
                           <Link
                           key={item.href}
                           href={item.href}
                           className={cn(
                           "flex items-center gap-4 rounded-xl px-3 py-2 transition-all hover:text-primary",
                           isActive ? "bg-muted text-primary" : "text-muted-foreground hover:text-primary"
                           )}
                           >
                           <item.icon className="h-5 w-5" />
                           {item.label}
                           </Link>
                       );
                       })}
                   </nav>
                   {/* Mobile Logout */}
                   <div className="mt-auto p-4 border-t">
                       <Button onClick={handleLogout} variant="ghost" className="w-full justify-start gap-4">
                           <LogOut className="h-5 w-5" /> Logout
                       </Button>
                   </div>
                   </SheetContent>
               </Sheet>

               {/* Header Content (e.g., Search, User Menu) */}
               <div className="w-full flex-1">
               {/* Optional: Add a search bar */}
               {/* <form> ... </form> */}
               </div>
               <DropdownMenu>
               <DropdownMenuTrigger asChild>
                   <Button variant="secondary" size="icon" className="rounded-full">
                   {authLoading ? (
                       <div className="h-8 w-8 rounded-full bg-muted"></div> // Placeholder
                   ) : (
                       <Avatar className="h-8 w-8">
                       <AvatarImage src={mockUser?.photoURL || undefined} alt={mockUser?.displayName || "User"} />
                       <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                           {getInitials(mockUser?.displayName)}
                       </AvatarFallback>
                       </Avatar>
                   )}
                   <span className="sr-only">Toggle user menu</span>
                   </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                   <DropdownMenuLabel>{mockUser?.displayName || mockUser?.phoneNumber || "Municipal User"}</DropdownMenuLabel>
                   <DropdownMenuSeparator />
                   {/* Add Profile/Settings links if needed */}
                   <DropdownMenuItem disabled>
                       <Settings className="mr-2 h-4 w-4"/> Settings (Soon)
                   </DropdownMenuItem>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={handleLogout}>
                       <LogOut className="mr-2 h-4 w-4"/> Logout
                   </DropdownMenuItem>
               </DropdownMenuContent>
               </DropdownMenu>
           </header>

           {/* Page Content */}
           <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
               {authLoading ? (
                   <div className="flex items-center justify-center flex-1">
                       <p>Loading...</p> // Simple loading text
                   </div>
               ) : (
                   children // Render the actual page content
               )}
           </main>
           </div>
       </div>
   );
}
