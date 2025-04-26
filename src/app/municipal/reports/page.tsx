'use client';

import React, { useState } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar as CalendarIcon, Download, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ReportData {
  id: string;
  caption: string;
  address?: string;
  status: 'pending' | 'solved';
  timestamp: Timestamp;
  municipalReply?: string;
}

export default function MunicipalReportsPage() {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select both a start and end date.');
       toast({ title: "Date Range Required", description: "Please select both start and end dates.", variant: "destructive" });
      return;
    }
    if (startDate > endDate) {
       setError('Start date cannot be after end date.');
       toast({ title: "Invalid Date Range", description: "Start date cannot be after end date.", variant: "destructive" });
       return;
    }

    setLoading(true);
    setError(null);
    setReportData([]); // Clear previous report

    try {
      // Adjust end date to include the whole day
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);

      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(adjustedEndDate);

      const postsCol = collection(db, 'posts');
      const q = query(
        postsCol,
        where('timestamp', '>=', startTimestamp),
        where('timestamp', '<=', endTimestamp),
        orderBy('timestamp', 'desc') // Order by date within the report
      );

      const querySnapshot = await getDocs(q);
      const data: ReportData[] = [];
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        data.push({
           id: doc.id,
           caption: docData.caption,
           address: docData.address,
           status: docData.status,
           timestamp: docData.timestamp,
           municipalReply: docData.municipalReply,
        });
      });

      setReportData(data);
       toast({ title: "Report Generated", description: `Found ${data.length} issues for the selected period.` });
    } catch (err: any) {
      console.error("Error generating report:", err);
      setError(`Failed to generate report: ${err.message}`);
      toast({ title: "Report Error", description: "Could not generate the report.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (reportData.length === 0) {
      toast({ title: "No Data", description: "Generate a report first before downloading.", variant: "destructive" });
      return;
    }

    // Convert data to CSV format
    const headers = ['ID', 'Reported Date', 'Status', 'Caption', 'Address', 'Municipal Reply'];
    const csvRows = [
      headers.join(','),
      ...reportData.map(row => [
        `"${row.id}"`,
        `"${format(row.timestamp.toDate(), 'yyyy-MM-dd HH:mm')}"`,
        `"${row.status}"`,
        `"${row.caption.replace(/"/g, '""')}"`, // Escape double quotes
        `"${row.address?.replace(/"/g, '""') || 'N/A'}"`,
        `"${row.municipalReply?.replace(/"/g, '""') || ''}"`
      ].join(','))
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const dateString = format(new Date(), 'yyyyMMdd');
      const startString = startDate ? format(startDate, 'yyyyMMdd') : 'start';
      const endString = endDate ? format(endDate, 'yyyyMMdd') : 'end';
      link.setAttribute('download', `swachhconnect_report_${startString}_to_${endString}_${dateString}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Download Started", description: "Report CSV download initiated." });
    } else {
       toast({ title: "Download Failed", description: "CSV download not supported by your browser.", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <h1 className="text-3xl font-bold text-primary">Generate Reports</h1>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Select Date Range</CardTitle>
           <CardDescription>Choose the start and end dates for the issue report.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-4">
           {/* Start Date Picker */}
           <Popover>
            <PopoverTrigger asChild>
                <Button
                variant={"outline"}
                className={cn(
                    "w-full sm:w-[280px] justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                )}
                >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : <span>Pick a start date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                 disabled={(date) => date > new Date()} // Disable future dates
                />
            </PopoverContent>
           </Popover>

            <span className="text-muted-foreground hidden sm:block">-</span>

            {/* End Date Picker */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                    variant={"outline"}
                    className={cn(
                        "w-full sm:w-[280px] justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                    )}
                    >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick an end date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => (startDate && date < startDate) || date > new Date()} // Disable dates before start date or future dates
                    />
                </PopoverContent>
            </Popover>


           <Button onClick={handleGenerateReport} disabled={loading || !startDate || !endDate} className="w-full sm:w-auto bg-primary hover:bg-primary/90 flex-shrink-0">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Generate Report'}
          </Button>
        </CardContent>
         {error && (
            <CardContent>
                 <div className="text-red-600 flex items-center text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" /> {error}
                 </div>
            </CardContent>
        )}
      </Card>

      {/* Report Results */}
      {(reportData.length > 0 || loading) && (
        <Card className="shadow-md">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
                <CardTitle>Report Results</CardTitle>
                <CardDescription>
                  {startDate && endDate && `Issues reported between ${format(startDate, "PPP")} and ${format(endDate, "PPP")}`}
                </CardDescription>
            </div>
             <Button onClick={handleDownloadReport} variant="outline" size="sm" disabled={reportData.length === 0 || loading}>
                <Download className="mr-2 h-4 w-4" /> Download CSV
             </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
               <div className="flex justify-center items-center py-10">
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : reportData.length === 0 ? (
               <p className="text-center text-muted-foreground py-10">No issues found for the selected date range.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reported Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Caption</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Municipal Reply</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{format(item.timestamp.toDate(), "PP pp")}</TableCell>
                      <TableCell>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                            item.status === 'solved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        )}>
                           {item.status}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.caption}>{item.caption}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.address}>{item.address || 'N/A'}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.municipalReply}>{item.municipalReply || ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
