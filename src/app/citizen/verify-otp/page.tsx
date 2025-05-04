
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// Removed Firebase imports (auth, ConfirmationResult)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = searchParams.get('userType') || 'citizen'; // Default to citizen if not provided
  const phoneNumber = searchParams.get('phone') || ''; // Get phone number if passed
  const { toast } = useToast();

  useEffect(() => {
    // Clear any lingering confirmationResult from window in frontend-only mode
    // (window as any).confirmationResult = null;
  }, []);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) { // Basic 6-digit OTP validation
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setIsLoading(true);
    console.log(`Frontend-only: Simulating OTP verification for ${phoneNumber} with OTP: ${otp}`);

    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate success (e.g., if OTP is '123456') or failure
    if (otp === '123456') { // Mock success condition
      console.log('Simulated OTP verification successful.');
      toast({ title: 'Login Successful (Simulated)', description: 'Welcome!' });

      // Determine redirect path based on userType
      const redirectPath = userType === 'citizen' ? '/citizen/home' : '/municipal/dashboard';
      router.push(redirectPath);

    } else {
      console.error('Simulated OTP verification failed.');
      setError('Invalid OTP. Please try again.');
      toast({ title: 'Verification Failed (Simulated)', description: 'The OTP entered was incorrect.', variant: 'destructive' });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 p-4">
      <Card className="w-full max-w-md shadow-xl border border-primary/10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Verify OTP</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to {phoneNumber ? `***${phoneNumber.slice(-4)}` : 'your phone'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <Label htmlFor="otp" className="sr-only">OTP</Label>
              <Input
                id="otp"
                type="text" // Use text to allow easier input on some devices
                inputMode="numeric" // Hint for numeric keyboard
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Allow only digits
                required
                className="text-center text-lg tracking-[0.5em]" // Spaced out numbers
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><KeyRound className="mr-2 h-4 w-4" /> Verify OTP</>}
            </Button>
          </form>
          {/* Add resend OTP link/button (mocked) */}
           <div className="mt-4 text-center text-sm">
             Didn't receive code?{' '}
             <Button variant="link" className="p-0 h-auto text-primary" onClick={() => toast({title: "Resend OTP (Simulated)", description: "A new OTP has been sent."})} disabled={isLoading}>
               Resend OTP
             </Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
