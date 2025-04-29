'use client';

import React, { useState, useEffect } from 'react';
// Removed Firebase imports (collection, query, where, getCountFromServer, onSnapshot, db)
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, ListTodo, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { ChartTooltipContent, ChartContainer, ChartTooltip, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton'; // Keep Skeleton for loading simulation
import { Alert, AlertTitle } from '@/components/ui/alert';

interface IssueStats {
  total: number;
  solved: number;
  pending: number;
}

// Mock data for stats
const mockStats: IssueStats = {
  total: 54,
  solved: 35,
  pending: 19,
};

// Mock data for chart
const mockChartData = [
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
  const [chartData, setChartData] = useState(mockChartData); // Use mock data

  useEffect(() => {
    setLoading(true);
    setError(null);
    console.log("Frontend-only mode: Loading mock dashboard data...");

    // Simulate data fetching delay
    const timer = setTimeout(() => {
      try {
        setStats(mockStats);
        setChartData(mockChartData); // Already set, but could simulate fetching here
        setLoading(false);
        console.log("Mock dashboard data loaded.");
      } catch (err: any) {
        console.error("Error setting mock data:", err);
        setError("Failed to load dashboard statistics (mock).");
        setLoading(false);
      }
    }, 1000); // Simulate 1 second delay

    // Cleanup timer on component unmount
    return () => clearTimeout(timer);

  }, []); // Run effect only once on mount


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
          <CardTitle>Issue Trends</CardTitle>
          <CardDescription>Monthly reported vs. solved issues (Mock Data).</CardDescription>
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
