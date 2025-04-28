'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getCountFromServer, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, ListTodo, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartTooltipContent, ChartContainer, ChartTooltip, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { Alert, AlertTitle } from '@/components/ui/alert'; // Import Alert

interface IssueStats {
  total: number;
  solved: number;
  pending: number;
}

// Example data structure for chart (replace with actual data fetching)
const chartDataExample = [
  { month: 'Jan', total: 12, solved: 8, pending: 4 },
  { month: 'Feb', total: 19, solved: 10, pending: 9 },
  { month: 'Mar', total: 15, solved: 12, pending: 3 },
  { month: 'Apr', total: 22, solved: 18, pending: 4 },
  { month: 'May', total: 18, solved: 11, pending: 7 },
  { month: 'Jun', total: 25, solved: 20, pending: 5 },
];

// Chart config for ShadCN charts using theme colors
const chartConfig = {
  total: { label: 'Total', color: 'hsl(var(--chart-1))' },
  solved: { label: 'Solved', color: 'hsl(var(--chart-2))' },
  pending: { label: 'Pending', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig;

export default function MunicipalDashboardPage() {
  const [stats, setStats] = useState<IssueStats>({ total: 0, solved: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState(chartDataExample); // Use example data for now

  useEffect(() => {
    setLoading(true);
    setError(null);

    const postsCol = collection(db, 'posts');
    let initialLoadComplete = false;
    let fetchedStats: Partial<IssueStats> = {}; // Store intermediate results

    const updateLoadingState = () => {
      // Check if all stats have been fetched at least once
      if (fetchedStats.total !== undefined && fetchedStats.solved !== undefined && fetchedStats.pending !== undefined && !initialLoadComplete) {
        setLoading(false);
        initialLoadComplete = true;
        console.log("Initial stats load complete.");
      }
    };

     // Use getCountFromServer for initial load (less efficient but simpler for initial count)
     const fetchInitialCounts = async () => {
      try {
        const totalSnapshot = await getCountFromServer(postsCol);
        const solvedQuery = query(postsCol, where('status', '==', 'solved'));
        const solvedSnapshot = await getCountFromServer(solvedQuery);
        const pendingQuery = query(postsCol, where('status', '==', 'pending'));
        const pendingSnapshot = await getCountFromServer(pendingQuery);

        fetchedStats = {
          total: totalSnapshot.data().count,
          solved: solvedSnapshot.data().count,
          pending: pendingSnapshot.data().count,
        };
        setStats(fetchedStats as IssueStats);
        updateLoadingState();

      } catch (err: any) {
         console.error("Error fetching initial counts:", err);
         if (err.code === 'failed-precondition' && err.message.includes('Cloud Firestore API')) {
             setError("Firestore API is not enabled. Please enable it in your Google Cloud console.");
         } else {
            setError("Failed to load initial dashboard statistics.");
         }
         setLoading(false); // Stop loading on initial fetch error
         // Don't proceed to setup listeners if initial fetch fails catastrophically
         return false; // Indicate failure
      }
      return true; // Indicate success
    };

    // Set up real-time listeners after initial fetch
    const setupListeners = () => {
      const listeners: (() => void)[] = []; // Array to hold unsubscribe functions

      // Listener for ALL posts (more accurate total count)
      const unsubscribeTotal = onSnapshot(postsCol, (snap) => {
        const totalCount = snap.size;
        console.log("Realtime update: Total posts =", totalCount);
        setStats(prev => {
            const newSolved = prev.solved ?? 0; // Use 0 if undefined
            return { ...prev, total: totalCount, pending: totalCount - newSolved };
        });
         fetchedStats.total = totalCount; // Update intermediate tracker
         updateLoadingState(); // Check if initial load complete
      }, (err) => {
        console.error("Total count listener error:", err);
        setError("Error listening for total issue updates.");
        // Potentially stop loading or show specific error state
      });
      listeners.push(unsubscribeTotal);

      // Listener for SOLVED posts
      const solvedQuery = query(postsCol, where('status', '==', 'solved'));
      const unsubscribeSolved = onSnapshot(solvedQuery, (snap) => {
        const solvedCount = snap.size;
         console.log("Realtime update: Solved posts =", solvedCount);
        setStats(prev => {
            const newTotal = prev.total ?? 0; // Use 0 if undefined
            return { ...prev, solved: solvedCount, pending: newTotal - solvedCount };
        });
         fetchedStats.solved = solvedCount; // Update intermediate tracker
         updateLoadingState(); // Check if initial load complete
      }, (err) => {
        console.error("Solved count listener error:", err);
        setError("Error listening for solved issue updates.");
      });
      listeners.push(unsubscribeSolved);

       // Listener for PENDING posts (explicit listener for redundancy/clarity)
       const pendingQuery = query(postsCol, where('status', '==', 'pending'));
       const unsubscribePending = onSnapshot(pendingQuery, (snap) => {
           const pendingCount = snap.size;
            console.log("Realtime update: Pending posts =", pendingCount);
           setStats(prev => ({ ...prev, pending: pendingCount }));
            fetchedStats.pending = pendingCount; // Update intermediate tracker
            updateLoadingState(); // Check if initial load complete
       }, (err) => {
            console.error("Pending count listener error:", err);
            setError("Error listening for pending issue updates.");
        });
        listeners.push(unsubscribePending);


      // Return cleanup function
      return () => {
        console.log("Cleaning up dashboard Firestore listeners...");
        listeners.forEach(unsub => unsub());
      };
    };

     // Run initial fetch, then setup listeners if successful
     fetchInitialCounts().then(success => {
        if (success) {
            // Assign cleanup function for useEffect return
             // eslint-disable-next-line react-hooks/exhaustive-deps
            cleanupListeners = setupListeners();
        }
     });

     let cleanupListeners = () => {}; // Placeholder cleanup

    // Cleanup listeners on component unmount
    return () => cleanupListeners();

  }, []); // Run effect only once on mount


  // TODO: Replace chartDataExample with actual fetched data
  // useEffect(() => {
  //   // Fetch real chart data based on time ranges or categories
  //   // Example: Fetch issues per month for the last 6 months
  //   const fetchChartData = async () => { ... };
  //   fetchChartData().then(data => setChartData(data));
  // }, []);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <h1 className="text-3xl font-bold text-primary">Municipal Dashboard</h1>

      {error && (
         <Alert variant="destructive" className="mb-6">
             <AlertTriangle className="h-4 w-4" />
             <AlertTitle>Error Loading Data</AlertTitle>
             <CardDescription>{error}</CardDescription>
         </Alert>
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:gap-6">
        {/* Total Issues Card */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Issues</CardTitle>
            <ListTodo className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20 bg-muted" />
            ) : (
              <div className="text-3xl font-bold text-primary">{stats.total ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground pt-1">Total issues reported</p>
          </CardContent>
        </Card>

        {/* Solved Issues Card */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Solved Issues</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16 bg-muted" />
            ) : (
              <div className="text-3xl font-bold text-green-600">{stats.solved ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground pt-1">
              {stats.total > 0 ? `${((stats.solved / stats.total) * 100 || 0).toFixed(1)}% resolved` : '0% resolved'}
            </p>
          </CardContent>
        </Card>

        {/* Pending Issues Card */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Issues</CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
               <Skeleton className="h-8 w-16 bg-muted" />
            ) : (
              <div className="text-3xl font-bold text-orange-600">{stats.pending ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground pt-1">Issues requiring action</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card className="shadow-md border-border/50">
        <CardHeader>
          <CardTitle>Issue Trends (Example Data)</CardTitle>
          <CardDescription>Monthly reported vs. solved issues (replace with real data).</CardDescription>
        </CardHeader>
        <CardContent className="pl-2"> {/* Adjust padding for axis labels */}
          {loading ? (
             <Skeleton className="h-[300px] w-full bg-muted" />
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}> {/* Adjusted margins */}
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)} // Abbreviate month
                  />
                  <YAxis
                     tickLine={false}
                     axisLine={false}
                     tickMargin={8}
                     width={30} // Allocate space for Y-axis labels
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                   <ChartLegend content={<ChartLegendContent />} />
                  {/* Using theme colors */}
                  <Bar dataKey="pending" stackId="a" fill="var(--color-pending)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="solved" stackId="a" fill="var(--color-solved)" radius={[4, 4, 0, 0]} />
                  {/* Optionally show total: <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} /> */}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
