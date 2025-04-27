'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getCountFromServer, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, ListTodo, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts'; // Using recharts, added TooltipProps
import { ChartTooltipContent, ChartContainer, ChartTooltip } from '@/components/ui/chart'; // Import ChartTooltip and Content
import type { ChartConfig } from '@/components/ui/chart'; // Import ChartConfig type

interface IssueStats {
  total: number;
  solved: number;
  pending: number;
}

// Example data structure for chart
const chartDataExample = [
  { name: 'Jan', total: 12, solved: 8, pending: 4 },
  { name: 'Feb', total: 19, solved: 10, pending: 9 },
  { name: 'Mar', total: 15, solved: 12, pending: 3 },
  // Add more months or categories
];

// Chart config for ShadCN charts
const chartConfig = {
  total: { label: 'Total Issues', color: 'hsl(var(--chart-1))' }, // Use theme colors
  solved: { label: 'Solved Issues', color: 'hsl(var(--chart-2))' },
  pending: { label: 'Pending Issues', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig;

export default function MunicipalDashboardPage() {
  const [stats, setStats] = useState<IssueStats>({ total: 0, solved: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState(chartDataExample); // Use example data for now

  useEffect(() => {
    setLoading(true); // Set loading to true at the beginning
    setError(null); // Clear previous errors

    const fetchCounts = async () => {
      try {
        const postsCol = collection(db, 'posts');

        // Get total count
        const totalSnapshot = await getCountFromServer(postsCol);

        // Get solved count
        const solvedQuery = query(postsCol, where('status', '==', 'solved'));
        const solvedSnapshot = await getCountFromServer(solvedQuery);

        // Get pending count
        const pendingQuery = query(postsCol, where('status', '==', 'pending'));
        const pendingSnapshot = await getCountFromServer(pendingQuery);


        setStats({
          total: totalSnapshot.data().count,
          solved: solvedSnapshot.data().count,
          pending: pendingSnapshot.data().count, // Use explicit pending count
        });
      } catch (err: any) { // Specify 'any' type for caught error
        console.error("Error fetching issue counts: ", err);
        // Check for specific Firestore API disabled error
        if (err.code === 'failed-precondition' && err.message.includes('Cloud Firestore API')) {
             setError("Firestore API is not enabled. Please enable it in your Google Cloud console.");
             // Provide link or instructions if possible
             console.error("Action needed: Enable Cloud Firestore API at https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=" + db.app.options.projectId);
         } else {
            setError("Failed to load dashboard statistics.");
         }

      } finally {
        // Only set loading to false here if not using realtime listeners below
        // setLoading(false);
      }
    };

     fetchCounts();

      // Set up real-time listeners for counts (more efficient than re-fetching all counts)
      const postsCol = collection(db, 'posts');
      let initialLoadComplete = false; // Flag to track initial stats load


      const setupListeners = () => {
        const listeners: (() => void)[] = []; // Array to hold unsubscribe functions

        // Listener for ALL posts (to get total count efficiently)
        const unsubscribeTotal = onSnapshot(postsCol, (snap) => {
             const totalCount = snap.size;
             setStats(prev => {
                const newStats = { ...prev, total: totalCount };
                // If solved is known, recalculate pending based on total
                if (prev.solved !== undefined) {
                   newStats.pending = totalCount - prev.solved;
                }
                 return newStats;
             });
              // Mark initial load complete after first total count snapshot
             if (!initialLoadComplete && stats.solved !== undefined && stats.pending !== undefined) {
                  setLoading(false);
                  initialLoadComplete = true;
              }
        }, (err) => {
             console.error("Total count listener error:", err);
              setError("Error listening for total issue count updates.");
              setLoading(false); // Stop loading on listener error
         });
        listeners.push(unsubscribeTotal);


        // Listener for SOLVED posts
        const solvedQuery = query(postsCol, where('status', '==', 'solved'));
        const unsubscribeSolved = onSnapshot(solvedQuery, (snap) => {
            const solvedCount = snap.size;
            setStats(prev => {
                 const newStats = { ...prev, solved: solvedCount };
                 // If total is known, recalculate pending based on solved
                 if (prev.total !== undefined) {
                    newStats.pending = prev.total - solvedCount;
                 }
                  return newStats;
             });
            // Mark initial load complete if all counts are now available
             if (!initialLoadComplete && stats.total !== undefined && stats.pending !== undefined) {
                  setLoading(false);
                  initialLoadComplete = true;
              }
        }, (err) => {
             console.error("Solved count listener error:", err);
              setError("Error listening for solved issue count updates.");
              setLoading(false); // Stop loading on listener error
         });
         listeners.push(unsubscribeSolved);

        // Optional: Listener for PENDING posts (can be derived, but explicit listener is okay too)
         // const pendingQuery = query(postsCol, where('status', '==', 'pending'));
         // const unsubscribePending = onSnapshot(pendingQuery, (snap) => {
         //      setStats(prev => ({ ...prev, pending: snap.size }));
         //      if (!initialLoadComplete && stats.total !== undefined && stats.solved !== undefined) {
         //           setLoading(false);
         //           initialLoadComplete = true;
         //       }
         // }, (err) => {
         //      console.error("Pending count listener error:", err);
         //      setError("Error listening for pending issue count updates.");
         //      setLoading(false); // Stop loading on listener error
         //  });
         //  listeners.push(unsubscribePending);


        // Cleanup function to unsubscribe all listeners
        return () => {
            console.log("Cleaning up dashboard listeners...");
            listeners.forEach(unsub => unsub());
        };
      }

     const cleanupListeners = setupListeners();


       // Cleanup listeners on component unmount
       return cleanupListeners;


  }, []); // Run effect only once on mount

   // TODO: Fetch actual data for the chart based on time ranges or categories
   useEffect(() => {
    // Placeholder for fetching real chart data
    // Example: Fetch issues per month for the last 6 months
    // setChartData(fetchedData);
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6 text-primary">Municipal Dashboard</h1>

       {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            <ListTodo className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-3xl font-bold">{stats.total ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Total issues reported</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solved Issues</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
             {loading ? (
               <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-3xl font-bold">{stats.solved ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? `${((stats.solved / stats.total) * 100).toFixed(1)}% resolved` : '0% resolved'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Issues</CardTitle>
             <AlertTriangle className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
             {loading ? (
               <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-3xl font-bold">{stats.pending ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Issues requiring action</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card className="shadow-md">
         <CardHeader>
            <CardTitle>Issue Trends (Example)</CardTitle>
         </CardHeader>
         <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        // tickFormatter={(value) => value.slice(0, 3)} // Abbreviate month names if needed
                    />
                     <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Legend />
                    <Bar dataKey="pending" stackId="a" fill="var(--color-pending)" radius={[4, 4, 0, 0]} name={chartConfig.pending.label}/>
                     <Bar dataKey="solved" stackId="a" fill="var(--color-solved)" radius={[4, 4, 0, 0]} name={chartConfig.solved.label}/>
                    {/* Optionally show total as a separate bar or line */}
                    {/* <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} /> */}
                </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
         </CardContent>
      </Card>

    </div>
  );
}
