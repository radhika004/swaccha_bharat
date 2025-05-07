'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, ListTodo, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { ChartTooltipContent, ChartContainer, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle } from '@/components/ui/alert';

interface IssueStats {
  total: number;
  solved: number;
  pending: number;
  byCategory: Record<string, number>; // For category-wise breakdown
}

// MockPost interface to ensure consistency
interface MockPost {
  id: string;
  category: string; // AI determined category
  status: 'pending' | 'solved';
  timestamp: string; // ISO String for date processing
}


// Sample Mock Data (if localStorage is empty or for initialization)
const sampleMockPostsForStats: MockPost[] = [
  { id: 'mock1', category: 'garbage', status: 'pending', timestamp: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: 'mock2', category: 'drainage', status: 'solved', timestamp: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'mock3', category: 'potholes', status: 'pending', timestamp: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 'mock4', category: 'streetlights', status: 'pending', timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'mock5', category: 'garbage', status: 'solved', timestamp: new Date(Date.now() - 86400000 * 10).toISOString() },
  { id: 'mock6', category: 'other', status: 'pending', timestamp: new Date(Date.now() - 86400000 * 1).toISOString() },
];


const generateStatsFromPosts = (posts: MockPost[]): IssueStats => {
  const stats: IssueStats = {
    total: posts.length,
    solved: posts.filter(p => p.status === 'solved').length,
    pending: posts.filter(p => p.status === 'pending').length,
    byCategory: {},
  };
  posts.forEach(post => {
    stats.byCategory[post.category] = (stats.byCategory[post.category] || 0) + 1;
  });
  return stats;
};

// Generate initial mock stats from sample posts
const initialMockStats = generateStatsFromPosts(sampleMockPostsForStats);


// Mock data for monthly chart (can be adapted based on actual data structure)
const mockMonthlyChartData = [
  { month: 'Jan', garbage: 5, drainage: 2, potholes: 3, streetlights: 1, other: 1 },
  { month: 'Feb', garbage: 7, drainage: 3, potholes: 4, streetlights: 2, other: 2 },
  { month: 'Mar', garbage: 6, drainage: 4, potholes: 2, streetlights: 1, other: 3 },
  { month: 'Apr', garbage: 8, drainage: 3, potholes: 5, streetlights: 3, other: 1 },
  { month: 'May', garbage: 5, drainage: 5, potholes: 3, streetlights: 2, other: 2 },
  { month: 'Jun', garbage: 9, drainage: 4, potholes: 4, streetlights: 3, other: 3 },
];


// Chart config for ShadCN charts using theme colors
const chartConfig = {
  garbage: { label: 'Garbage', color: 'hsl(var(--chart-1))' },
  drainage: { label: 'Drainage', color: 'hsl(var(--chart-2))' },
  potholes: { label: 'Potholes', color: 'hsl(var(--chart-3))' },
  streetlights: { label: 'Streetlights', color: 'hsl(var(--chart-4))' },
  other: { label: 'Other', color: 'hsl(var(--chart-5))' },
} satisfies ChartConfig;

export default function MunicipalDashboardPage() {
  const [stats, setStats] = useState<IssueStats | null>(initialMockStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState(mockMonthlyChartData); // Using mock for now

  useEffect(() => {
    setLoading(true);
    setError(null);
    console.log("Frontend-only mode: Simulating loading dashboard stats from localStorage...");

    const timer = setTimeout(() => {
      try {
        const storedPostsRaw = localStorage.getItem('mockPosts');
        if (storedPostsRaw) {
          const storedPosts: MockPost[] = JSON.parse(storedPostsRaw);
          const currentStats = generateStatsFromPosts(storedPosts.filter(p => p.category && p.status && p.timestamp)); // Basic validation
          setStats(currentStats);
          console.log("Dashboard stats updated from localStorage.", currentStats);

          // TODO: Implement logic to generate monthly chart data from storedPosts if needed
          // For now, we continue using mockMonthlyChartData for the bar chart
        } else {
          setStats(initialMockStats); // Fallback to initial mock if no data in storage
          console.log("Using initial mock stats for dashboard (localStorage empty).");
        }
      } catch (err: any) {
        console.error("Error processing dashboard stats:", err);
        setError(`Failed to load dashboard stats (mock): ${err.message}`);
        setStats(initialMockStats); // Fallback on error
      } finally {
        setLoading(false);
      }
    }, 800); // Simulate network delay

    return () => clearTimeout(timer);

  }, []);


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

      <div className="grid gap-4 md:grid-cols-3 lg:gap-6">
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Issues</CardTitle>
            <ListTodo className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading || stats === null ? (
              <Skeleton className="h-8 w-20 bg-muted" />
            ) : (
              <div className="text-3xl font-bold text-primary">{stats.total}</div>
            )}
            <p className="text-xs text-muted-foreground pt-1">Total issues reported</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Solved Issues</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading || stats === null ? (
              <Skeleton className="h-8 w-16 bg-muted" />
            ) : (
              <div className="text-3xl font-bold text-green-600">{stats.solved}</div>
            )}
            <p className="text-xs text-muted-foreground pt-1">
              {stats && stats.total > 0 ? `${((stats.solved / stats.total) * 100 || 0).toFixed(1)}% resolved` : '0% resolved'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Issues</CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            {loading || stats === null ? (
               <Skeleton className="h-8 w-16 bg-muted" />
            ) : (
              <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
            )}
            <p className="text-xs text-muted-foreground pt-1">Issues requiring action</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown Cards */}
       <Card className="shadow-md border-border/50">
         <CardHeader>
           <CardTitle>Issues by Category</CardTitle>
           <CardDescription>Breakdown of reported issues by their AI-determined category.</CardDescription>
         </CardHeader>
         <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
           {loading || !stats ? (
             Array.from({ length: 5 }).map((_, idx) => (
               <Card key={idx} className="p-4">
                 <Skeleton className="h-5 w-24 mb-1 bg-muted" />
                 <Skeleton className="h-8 w-12 bg-muted" />
               </Card>
             ))
           ) : Object.keys(chartConfig).map((categoryKey) => (
             stats.byCategory[categoryKey] !== undefined && (
                <Card key={categoryKey} className="p-4 border-l-4" style={{ borderLeftColor: chartConfig[categoryKey as keyof typeof chartConfig].color }}>
                  <p className="text-sm font-medium text-muted-foreground capitalize">{chartConfig[categoryKey as keyof typeof chartConfig].label}</p>
                  <p className="text-2xl font-bold" style={{ color: chartConfig[categoryKey as keyof typeof chartConfig].color }}>
                    {stats.byCategory[categoryKey] || 0}
                  </p>
                </Card>
             )))}
             {stats && Object.keys(stats.byCategory).length === 0 && !loading && (
                <p className="text-muted-foreground col-span-full text-center py-4">No issues reported yet to show category breakdown.</p>
             )}
         </CardContent>
       </Card>


      <Card className="shadow-md border-border/50">
        <CardHeader>
          <CardTitle>Issue Trends by Category</CardTitle>
          <CardDescription>Monthly reported issues by AI-determined category (Mock Data).</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          {loading ? ( <Skeleton className="h-[300px] w-full bg-muted" /> ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <YAxis
                     tickLine={false}
                     axisLine={false}
                     tickMargin={8}
                     width={30}
                  />
                   <ChartTooltipContent
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />}
                   />
                   <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="garbage" stackId="a" fill="var(--color-garbage)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="drainage" stackId="a" fill="var(--color-drainage)" radius={[0, 0, 0, 0]}/>
                  <Bar dataKey="potholes" stackId="a" fill="var(--color-potholes)" radius={[0, 0, 0, 0]}/>
                  <Bar dataKey="streetlights" stackId="a" fill="var(--color-streetlights)" radius={[0, 0, 0, 0]}/>
                  <Bar dataKey="other" stackId="a" fill="var(--color-other)" radius={[0, 0, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
           )}
        </CardContent>
      </Card>
    </div>
  );
}