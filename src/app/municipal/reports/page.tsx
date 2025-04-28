'use client';

import React, { useState } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar as CalendarIcon, Download, Loader2, AlertCircle, FileText, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

interface ReportData {
  id: string;
  caption: string;
  address?: string;
  status: 'pending' | 'solved';
  timestamp: Timestamp;
  deadline?: Timestamp;
  municipalReply?: string;
  userName?: string; // Added userName
  userId: string; // Added userId
}

export default function MunicipalReportsPage() {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportGenerated, setReportGenerated] = useState(false); // Track if report was generated
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    setError(null);
    setReportGenerated(false); // Reset generated state

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

    try {
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999); // Include the whole end day

      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(adjustedEndDate);

      const postsCol = collection(db, 'posts');
      const q = query(
        postsCol,
        where('timestamp', '>=', startTimestamp),
        where('timestamp', '<=', endTimestamp),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const data: ReportData[] = [];
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        if (docData.timestamp instanceof Timestamp) { // Validate timestamp
          data.push({
            id: doc.id,
            caption: docData.caption || 'N/A',
            address: docData.address,
            status: docData.status || 'pending',
            timestamp: docData.timestamp,
            deadline: docData.deadline instanceof Timestamp ? docData.deadline : undefined,
            municipalReply: docData.municipalReply,
            userName: docData.userName || 'Citizen User', // Add userName
            userId: docData.userId || 'N/A', // Add userId
          });
        } else {
          console.warn(`Skipping doc ${doc.id} in report: invalid timestamp.`);
        }
      });

      setReportData(data);
      setReportGenerated(true); // Mark report as generated
      toast({ title: "Report Generated", description: `Found ${data.length} issues for the selected period.` });

    } catch (err: any) {
      console.error("Error generating report:", err);
      setError(`Failed to generate report: ${err.message}`);
      toast({ title: "Report Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (reportData.length === 0 && !reportGenerated) { // Check if report was generated even if empty
      toast({ title: "No Report", description: "Generate a report first before downloading.", variant: "destructive" });
      return;
    }
     if (reportData.length === 0 && reportGenerated) {
         toast({ title: "Empty Report", description: "No data to download for the selected period." });
         return;
     }


    const headers = ['ID', 'Reported Date', 'Reported By', 'Status', 'Caption', 'Address', 'Deadline', 'Municipal Reply'];
    const csvRows = [
      headers.join(','),
      ...reportData.map(row => [
        `"${row.id}"`,
        `"${format(row.timestamp.toDate(), 'yyyy-MM-dd HH:mm')}"`,
        `"${row.userName?.replace(/"/g, '""') || 'N/A'}"`, // Include userName
        `"${row.status}"`,
        `"${row.caption.replace(/"/g, '""')}"`,
        `"${row.address?.replace(/"/g, '""') || 'N/A'}"`,
        `"${row.deadline ? format(row.deadline.toDate(), 'yyyy-MM-dd') : ''}"`,
        `"${row.municipalReply?.replace(/"/g, '""') || ''}"`
      ].join(','))
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility
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
      URL.revokeObjectURL(url); // Clean up blob URL
      toast({ title: "Download Started", description: "Report CSV download initiated." });
    } else {
      toast({ title: "Download Failed", variant: "destructive" });
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
                        <TableCell className="whitespace-nowrap">{format(item.timestamp.toDate(), "PP p")}</TableCell>
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
                        <TableCell className="whitespace-nowrap">{item.deadline ? format(item.deadline.toDate(), "PP") : 'N/A'}</TableCell>
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
