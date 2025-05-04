
'use client';

import React, { useState, useEffect } from 'react';
// Removed Firebase imports
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User as UserIcon, Phone, CalendarDays, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

// Mock Citizen User Interface
interface CitizenUser {
  id: string; // Mock UID
  phoneNumber: string | null;
  role?: string; // Should be 'citizen'
  createdAt?: string; // ISO String for mock data
  name?: string;
  avatarUrl?: string; // Optional avatar URL
}

// Sample Mock Citizen Data
const sampleMockCitizens: CitizenUser[] = [
  {
    id: 'mock_citizen_1',
    phoneNumber: '+91 98765 43210',
    role: 'citizen',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
    name: 'Concerned Citizen A',
  },
  {
    id: 'mock_citizen_2',
    phoneNumber: '+91 12345 67890',
    role: 'citizen',
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(), // 25 days ago
    name: 'Resident B',
  },
   {
    id: 'mock_citizen_3',
    phoneNumber: '+91 55555 55555',
    role: 'citizen',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    name: 'Resident C',
  },
   {
    id: 'mock_citizen_user', // From AddPostPage mock
    phoneNumber: '+91 11111 22222',
    role: 'citizen',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    name: 'Citizen User (Mock)',
  },
];

export default function MunicipalCitizensPage() {
  const [citizens, setCitizens] = useState<CitizenUser[]>([]);
  const [filteredCitizens, setFilteredCitizens] = useState<CitizenUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    setError(null);
    console.log("Frontend-only mode: Loading mock citizens...");

    // Simulate fetching data
    const timer = setTimeout(() => {
      try {
        // Use sample mock data directly
        const citizenData = [...sampleMockCitizens];
        // Sort by creation date descending
        citizenData.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        setCitizens(citizenData);
        setFilteredCitizens(citizenData); // Initialize filtered list
        console.log("Mock citizens loaded.");
      } catch (err: any) {
        console.error("Error setting mock citizens:", err);
        setError(`Failed to load citizen list (mock): ${err.message}`);
      } finally {
        setLoading(false);
      }
    }, 800); // Simulate delay

    return () => clearTimeout(timer); // Cleanup timer
  }, []);

   // Handle search filtering
   useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    if (!lowerCaseSearchTerm) {
      setFilteredCitizens(citizens); // Show all if search is empty
    } else {
      const filtered = citizens.filter(citizen =>
        citizen.phoneNumber?.includes(lowerCaseSearchTerm) ||
        citizen.id.toLowerCase().includes(lowerCaseSearchTerm) ||
        citizen.name?.toLowerCase().includes(lowerCaseSearchTerm)
      );
      setFilteredCitizens(filtered);
    }
  }, [searchTerm, citizens]);


  // Mock delete functionality (shows toast, doesn't actually delete)
  const handleDeleteCitizen = async (userId: string) => {
     console.warn(`Simulating delete for user ${userId}.`);
     // In a real scenario, this would involve backend calls.
     // For mock: Filter out the user from the local state for demo purposes
     setCitizens(prev => prev.filter(c => c.id !== userId));
     toast({ title: "Citizen Removed (Simulated)", description: `User ${userId.substring(0,6)}... removed from the list.`, variant: "default" });
     // Note: This deletion won't persist without backend/localStorage update
  };

  const CitizenRowSkeleton = () => (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-32 bg-muted" /></TableCell> {/* ID */}
      <TableCell>
         <div className="flex items-center gap-2">
           <Skeleton className="h-8 w-8 rounded-full bg-muted" />
           <Skeleton className="h-4 w-24 bg-muted" />
         </div>
      </TableCell> {/* Name + Avatar */}
      <TableCell><Skeleton className="h-4 w-32 bg-muted" /></TableCell> {/* Phone */}
      <TableCell><Skeleton className="h-4 w-24 bg-muted" /></TableCell> {/* Registered */}
      <TableCell><Skeleton className="h-9 w-9 rounded-md bg-muted" /></TableCell> {/* Actions */}
    </TableRow>
  );

  // Helper to parse ISO string safely for date formatting
  const safeFormatDate = (isoString?: string): string => {
     if (!isoString) return 'N/A';
     try {
        return format(parseISO(isoString), 'PP');
     } catch {
        return 'Invalid Date';
     }
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Card className="shadow-lg border border-border/50">
        <CardHeader>
          <CardTitle>Citizen Management</CardTitle>
          <CardDescription>View registered citizen users (Mock Data).</CardDescription>
           {/* Search Input */}
           <div className="relative mt-4">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input
               type="search"
               placeholder="Search by phone, UID, or name..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-8 w-full sm:w-64 md:w-80"
             />
           </div>
        </CardHeader>
        <CardContent>
          {error && (
             <Alert variant="destructive" className="mb-4">
               <AlertTitle>Error</AlertTitle>
               <AlertDescription>{error}</AlertDescription>
             </Alert>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Citizen UID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Registered On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <> <CitizenRowSkeleton /> <CitizenRowSkeleton /> <CitizenRowSkeleton /> </>
                ) : filteredCitizens.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                       {searchTerm ? 'No citizens match your search.' : 'No citizen users found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCitizens.map((citizen) => (
                    <TableRow key={citizen.id}>
                      <TableCell className="font-mono text-xs" title={citizen.id}>{citizen.id.substring(0, 12)}...</TableCell>
                       <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 border">
                                <AvatarImage src={citizen.avatarUrl} alt={citizen.name || 'Citizen'}/>
                                <AvatarFallback className='text-xs bg-secondary'>
                                  {citizen.name ? citizen.name.charAt(0).toUpperCase() : <UserIcon size={14} />}
                                </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{citizen.name || 'N/A'}</span>
                          </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {citizen.phoneNumber || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <CalendarDays className="h-4 w-4" />
                           {safeFormatDate(citizen.createdAt)}
                         </div>
                      </TableCell>
                      <TableCell className="text-right">
                         {/* Delete Citizen Button */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" title="Delete Citizen">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Removal</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove this citizen from the list? This action is for demonstration purposes only in frontend mode.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCitizen(citizen.id)} className="bg-destructive hover:bg-destructive/90">Remove Citizen</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
