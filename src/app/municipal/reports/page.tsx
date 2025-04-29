'use client';

import React, { useState } from 'react';
// Removed Firebase imports (collection, query, where, getDocs, orderBy, Timestamp, db)
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar as CalendarIcon, Download, Loader2, AlertCircle, FileText, Search } from 'lucide-react';
import { format, parseISO, isWithinInterval } from 'date-fns'; // Added parseISO, isWithinInterval
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// Reusing MockPost interface from issues page, ensure consistency
interface MockPost {
  id: string;
  imageUrl?: string; // Optional for report
  caption: string;
  address?: string;
  status: 'pending' | 'solved';
  timestamp: string; // ISO String
  deadline?: string; // ISO String
  municipalReply?: string;
  userName?: string;
  userId: string;
}

// Use the same sample data as issues page for consistency
const allMockPosts: MockPost[] = [
 {
    id: 'mock1',
    imageUrl: 'https://picsum.photos/600/600?random=1',
    caption: 'Overflowing bin near the park entrance. Needs immediate attention.',
    address: 'Near Central Park Entrance, Mock City',
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
    userId: 'mock_citizen_1',
    userName: 'Concerned Citizen A',
    status: 'pending',
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
  },
   {
    id: 'mock3',
    imageUrl: 'https://picsum.photos/600/600?random=3',
    caption: 'Street light not working on Elm Street.',
    address: '456 Elm Street, Mock City',
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    userId: 'mock_citizen_3',
    userName: 'Resident C',
    status: 'pending',
  },
   {
    id: 'mock_local_1',
    imageUrl: 'https://picsum.photos/600/600?random=4',
    caption: 'Pothole on Oak Avenue',
    address: 'Oak Avenue, Mock City',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    userId: 'mock_citizen_user',
    userName: 'Citizen User (Mock)',
    status: 'pending',
    deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
  },
  {
    id: 'mock2',
    imageUrl: 'https://picsum.photos/600/600?random=2',
    caption: 'Drainage blocked on Main Street. Water logging during rains.',
    address: '123 Main Street, Mock City',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    userId: 'mock_citizen_2',
    userName: 'Resident B',
    status: 'solved',
    municipalReply: 'The drainage has been cleared by our team.',
    solvedTimestamp: new Date(Date.now() - 86400000).toISOString(),
  },
    // Add more mock posts spanning different dates if needed
     {
    id: 'mock4_older',
    imageUrl: 'https://picsum.photos/600/600?random=5',
    caption: 'Broken pavement causing hazard.',
    address: 'Maple Lane',
    timestamp: new Date(Date.now() - 86400000 * 15).toISOString(), // 15 days ago
    userId: 'mock_citizen_4',
    userName: 'Pedestrian D',
    status: 'solved',
    municipalReply: 'Repaired.',
    solvedTimestamp: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
  },
];

export default function MunicipalReportsPage() {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [reportData, setReportData] = useState<MockPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportGenerated, setReportGenerated] = useState(false);
  const { toast } = useToast();

   // Helper function to safely format dates, returning 'N/A' or empty string on error/undefined
   const safeFormat = (dateString: string | undefined, formatString: string): string => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), formatString);
    } catch {
      return 'Invalid Date';
    }
  };

  const handleGenerateReport = async () => {
    setError(null);
    setReportGenerated(false);

    if (!startDate || !endDate) {
      setError('Please select both start and end dates.');
      toast({ title: "Date Range Required", variant: "destructive" });
      return;
    }
    if (startDate > endDate) {
      setError('Start date cannot be after end date.');
      toast({ title: "Invalid Date Range", variant: "destructive" });
      return;
    }

    setLoading(true);
    setReportData([]);
    console.log("Frontend-only: Generating mock report...");

    // Simulate fetching/filtering delay
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999); // Include the whole end day

      // Filter mock data based on the selected date range
      const filteredData = allMockPosts.filter(post => {
        try {
           const postDate = parseISO(post.timestamp);
           return isWithinInterval(postDate, { start: startDate, end: adjustedEndDate });
        } catch {
            console.warn(`Skipping post ${post.id} due to invalid timestamp during report generation.`);
            return false;
        }
      });

       // Sort the filtered data
       filteredData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());


      setReportData(filteredData);
      setReportGenerated(true);
      toast({ title: "Report Generated (Mock)", description: `Found ${filteredData.length} issues for the selected period.` });

    } catch (err: any) {
      console.error("Error generating mock report:", err);
      setError(`Failed to generate mock report: ${err.message}`);
      toast({ title: "Report Error (Mock)", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (reportData.length === 0 && !reportGenerated) {
      toast({ title: "No Report", description: "Generate a report first before downloading.", variant: "destructive" });
      return;
    }
     if (reportData.length === 0 && reportGenerated) {
         toast({ title: "Empty Report", description: "No data to download for the selected period." });
         return;
     }

    console.log("Simulating CSV download...");

    const headers = ['ID', 'Reported Date', 'Reported By', 'Status', 'Caption', 'Address', 'Deadline', 'Municipal Reply'];
    const csvRows = [
      headers.join(','),
      ...reportData.map(row => [
        `"${row.id}"`,
        `"${safeFormat(row.timestamp, 'yyyy-MM-dd HH:mm')}"`,
        `"${row.userName?.replace(/"/g, '""') || 'N/A'}"`,
        `"${row.status}"`,
        `"${row.caption.replace(/"/g, '""')}"`,
        `"${row.address?.replace(/"/g, '""') || 'N/A'}"`,
        `"${safeFormat(row.deadline, 'yyyy-MM-dd')}"`, // Use safe format
        `"${row.municipalReply?.replace(/"/g, '""') || ''}"`
      ].join(','))
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      const dateString = format(new Date(), 'yyyyMMdd');
      const startString = startDate ? format(startDate, 'yyyyMMdd') : 'start';
      const endString = endDate ? format(endDate, 'yyyyMMdd') : 'end';
      link.setAttribute('href', url);
      link.setAttribute('download', `SwachhConnect_Report_${startString}_to_${endString}_${dateString}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Download Simulated", description: "CSV file download initiated." });
    } else {
      toast({ title: "Download Failed", description: "Browser does not support automatic download.", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-primary">Generate Reports</h1>

      <Card className="shadow-lg border border-primary/10">
        <CardHeader>
          <CardTitle>Select Date Range</CardTitle>
          <CardDescription>Choose the start and end dates for the issue report.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-4 flex-wrap">
          {/* Start Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[240px] justify-start text-left font-normal shadow-sm",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : <span>Pick a start date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single" selected={startDate} onSelect={setStartDate}
                initialFocus disabled={(date) => date > new Date()}
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground hidden sm:block">to</span>

          {/* End Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[240px] justify-start text-left font-normal shadow-sm",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : <span>Pick an end date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single" selected={endDate} onSelect={setEndDate}
                initialFocus disabled={(date) => (startDate && date < startDate) || date > new Date()}
              />
            </PopoverContent>
          </Popover>

          <Button onClick={handleGenerateReport} disabled={loading || !startDate || !endDate} className="w-full sm:w-auto bg-primary hover:bg-primary/90 flex-shrink-0 shadow-md ml-auto">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Generate Report
          </Button>
        </CardContent>
        {error && (
          <CardFooter className="pt-0 pb-4 px-6">
            <div className="text-red-600 flex items-center text-sm bg-red-50 p-2 rounded border border-red-200 w-full">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" /> {error}
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Report Results Section */}
      {reportGenerated && (
        <Card className="shadow-lg border border-border/50">
          <CardHeader className="flex flex-row justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle>Report Results</CardTitle>
              <CardDescription>
                {reportData.length} issues found {startDate && endDate && `between ${format(startDate, "PPP")} and ${format(endDate, "PPP")}`}
              </CardDescription>
            </div>
            <Button onClick={handleDownloadReport} variant="outline" size="sm" disabled={reportData.length === 0 || loading}>
              <Download className="mr-2 h-4 w-4" /> Download CSV
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2 pt-4">
                 <Skeleton className="h-10 w-full bg-muted" />
                 <Skeleton className="h-10 w-full bg-muted" />
                 <Skeleton className="h-10 w-full bg-muted" />
              </div>
            ) : reportData.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                 <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                 <p>No issues found for the selected date range.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reported Date</TableHead>
                      <TableHead>Reported By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Caption</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Reply</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap">{safeFormat(item.timestamp, "PP p")}</TableCell>
                        <TableCell className="whitespace-nowrap">{item.userName}</TableCell>
                        <TableCell>
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border",
                            item.status === 'solved' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'
                          )}>
                            {item.status}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={item.caption}>{item.caption}</TableCell>
                        <TableCell className="max-w-[250px] truncate" title={item.address}>{item.address || 'N/A'}</TableCell>
                        <TableCell className="whitespace-nowrap">{safeFormat(item.deadline, "PP")}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={item.municipalReply}>{item.municipalReply || ''}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
