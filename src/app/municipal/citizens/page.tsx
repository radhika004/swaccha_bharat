'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User as UserIcon, Phone } from 'lucide-react';

interface CitizenUser {
  id: string; // Firestore document ID (usually the UID)
  phoneNumber: string | null;
  // Add other fields you store for users, e.g., name, registrationDate
  // name?: string;
  // registrationDate?: Timestamp;
}

export default function MunicipalCitizensPage() {
  const [citizens, setCitizens] = useState<CitizenUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCitizens = async () => {
      setLoading(true);
      setError(null);
      try {
        // TODO: Adapt this query based on how you store citizen user data.
        // Option 1: Query a specific 'users' collection where role='citizen' (if you store roles)
        // const usersCol = collection(db, 'users');
        // const q = query(usersCol, where('role', '==', 'citizen'), orderBy('registrationDate', 'desc'));

        // Option 2: Query all users and filter client-side (less efficient for large numbers)
        // This assumes you have a 'users' collection keyed by UID with at least 'phoneNumber' field.
        // You might need Firebase Functions to list all Auth users properly or maintain a users collection.
        // The code below is a basic example assuming a 'users' collection exists.

         const usersCol = collection(db, 'users'); // Assuming a 'users' collection keyed by UID
         const q = query(usersCol, orderBy('phoneNumber')); // Example ordering
         const querySnapshot = await getDocs(q);

         const citizenData: CitizenUser[] = [];
         querySnapshot.forEach((doc) => {
           const data = doc.data();
           // Add a check if you store roles: if (data.role === 'citizen') { ... }
           citizenData.push({
             id: doc.id,
             phoneNumber: data.phoneNumber || null,
             // name: data.name,
             // registrationDate: data.registrationDate
           });
         });

         // Fallback if no 'users' collection:
         // If you don't maintain a separate 'users' collection, listing Auth users directly
         // from the client-side SDK is generally not recommended or easily possible without
         // Admin SDK privileges (usually via Firebase Functions).
         // For this example, we'll proceed assuming the 'users' collection exists.
         if (citizenData.length === 0) {
             console.warn("No citizen data found in 'users' collection. Ensure citizen user data is stored correctly in Firestore.");
             // setError("Could not retrieve citizen list. User data might not be stored in Firestore.");
         }


        setCitizens(citizenData);
      } catch (err: any) {
        console.error("Error fetching citizens:", err);
        setError(`Failed to load citizen list: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCitizens();
  }, []);

  const CitizenRowSkeleton = () => (
    <TableRow>
        <TableCell>
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-24" />
            </div>
        </TableCell>
        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
    </TableRow>
  );


  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
       <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Citizen Management</CardTitle>
           <CardDescription>View registered citizens using the application.</CardDescription>
        </CardHeader>
        <CardContent>
           {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Error:</strong>
                <span className="block sm:inline"> {error}</span>
            </div>
          )}

            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Citizen</TableHead>
                    <TableHead>Phone Number</TableHead>
                    {/* Add more headers if needed, e.g., Registration Date */}
                     {/* <TableHead>Registered On</TableHead> */}
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                   <>
                    <CitizenRowSkeleton />
                    <CitizenRowSkeleton />
                    <CitizenRowSkeleton />
                   </>
                ) : citizens.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                            No citizen users found.
                        </TableCell>
                    </TableRow>
                ) : (
                   citizens.map((citizen) => (
                    <TableRow key={citizen.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border">
                                {/* Add AvatarImage if you store profile pics */}
                                <AvatarFallback><UserIcon size={20} /></AvatarFallback>
                                </Avatar>
                                {/* Add Name if available */}
                                {/* <span className="font-medium">{citizen.name || 'N/A'}</span> */}
                                <span className="text-muted-foreground text-sm">{citizen.id}</span>{/* Show UID for identification */}
                            </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-1">
                               <Phone className="h-4 w-4 text-muted-foreground" />
                               {citizen.phoneNumber || 'N/A'}
                            </div>
                        </TableCell>
                         {/* <TableCell>
                            {citizen.registrationDate ? format(citizen.registrationDate.toDate(), 'PP') : 'N/A'}
                         </TableCell> */}
                    </TableRow>
                   ))
                )}
                </TableBody>
            </Table>
             {/* TODO: Add Pagination if the list becomes long */}
        </CardContent>
       </Card>
    </div>
  );
}
