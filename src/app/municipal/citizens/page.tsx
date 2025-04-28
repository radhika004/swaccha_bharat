'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore'; // Added where
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User as UserIcon, Phone, CalendarDays, Trash2, Search } from 'lucide-react'; // Added Trash2, Search
import { Button } from '@/components/ui/button'; // Added Button
import { Input } from '@/components/ui/input'; // Added Input
import { format } from 'date-fns'; // For date formatting
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Added Alert
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog"; // Added Alert Dialog
import { useToast } from '@/hooks/use-toast'; // Added useToast

interface CitizenUser {
  id: string; // Firestore document ID (UID)
  phoneNumber: string | null;
  role?: string; // Should be 'citizen'
  createdAt?: Timestamp; // Added creation timestamp
  // Add other relevant fields like name if stored
  name?: string;
}

export default function MunicipalCitizensPage() {
  const [citizens, setCitizens] = useState<CitizenUser[]>([]);
  const [filteredCitizens, setFilteredCitizens] = useState<CitizenUser[]>([]); // For search results
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchCitizens = async () => {
      setLoading(true);
      setError(null);
      try {
        const usersCol = collection(db, 'users');
        // Query specifically for users with the 'citizen' role
        const q = query(usersCol, where('role', '==', 'citizen'), orderBy('createdAt', 'desc')); // Order by creation date
        const querySnapshot = await getDocs(q);

        const citizenData: CitizenUser[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          citizenData.push({
            id: doc.id,
            phoneNumber: data.phoneNumber || null,
            role: data.role,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt : undefined,
            name: data.name, // Include name if available
          });
        });

        setCitizens(citizenData);
        setFilteredCitizens(citizenData); // Initialize filtered list

        if (citizenData.length === 0) {
          console.warn("No citizen users found in 'users' collection with role='citizen'.");
        }
      } catch (err: any) {
        console.error("Error fetching citizens:", err);
        setError(`Failed to load citizen list: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCitizens();
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


  // Placeholder for delete functionality
  const handleDeleteCitizen = async (userId: string) => {
     console.warn(`Delete functionality for user ${userId} is not implemented.`);
     // IMPORTANT: Deleting Firebase Auth users requires Admin SDK (backend).
     // Deleting the Firestore document alone does NOT delete the Auth user.
     // This requires a Cloud Function or dedicated backend endpoint.
     // Example Firestore doc deletion (DOES NOT DELETE AUTH USER):
     // try {
     //   await deleteDoc(doc(db, 'users', userId));
     //   setCitizens(prev => prev.filter(c => c.id !== userId)); // Update UI optimistically
     //   toast({ title: "Citizen Record Removed", description: "Firestore document deleted (Auth user remains)." });
     // } catch (err) { toast({ title: "Deletion Error", variant: "destructive" }); }
      toast({ title: "Delete Not Implemented", description: "Deleting users requires backend logic.", variant: "destructive" });
  };

  const CitizenRowSkeleton = () => (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell> {/* ID */}
      <TableCell><Skeleton className="h-4 w-24" /></TableCell> {/* Name */}
      <TableCell><Skeleton className="h-4 w-32" /></TableCell> {/* Phone */}
      <TableCell><Skeleton className="h-4 w-24" /></TableCell> {/* Registered */}
      <TableCell><Skeleton className="h-9 w-9 rounded-md" /></TableCell> {/* Actions */}
    </TableRow>
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Card className="shadow-lg border border-border/50">
        <CardHeader>
          <CardTitle>Citizen Management</CardTitle>
          <CardDescription>View and manage registered citizen users.</CardDescription>
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
                                {/* <AvatarImage src={citizen.avatarUrl} /> Placeholder */}
                                <AvatarFallback className='text-xs'><UserIcon size={14} /></AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{citizen.name || 'N/A'}</span>
                          </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {citizen.phoneNumber || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <CalendarDays className="h-4 w-4" />
                          {citizen.createdAt ? format(citizen.createdAt.toDate(), 'PP') : 'N/A'}
                         </div>
                      </TableCell>
                      <TableCell className="text-right">
                         {/* Delete Citizen Button (Requires Confirmation) */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" title="Delete Citizen (Disabled)">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Deletion (Disabled)</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action is currently disabled. Deleting a user requires backend implementation and removes their authentication access and data permanently.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                {/* <AlertDialogAction onClick={() => handleDeleteCitizen(citizen.id)} className="bg-destructive hover:bg-destructive/90" disabled>
                                  Confirm Delete
                                </AlertDialogAction> */}
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
          {/* TODO: Add Pagination if the list grows large */}
        </CardContent>
      </Card>
    </div>
  );
}

// Added Timestamp import
import { Timestamp } from 'firebase/firestore';
