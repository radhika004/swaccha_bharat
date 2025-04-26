
'use client';

import type { ChangeEvent, FormEvent } from 'react';
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Declare RecaptchaVerifier in the window interface
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export default function AuthPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();
  const userType = params.userType as string; // 'citizen' or 'municipal'
  const { toast } = useToast();

  // Initialize reCAPTCHA
  useEffect(() => {
    if (!recaptchaContainerRef.current) return;

    // Cleanup previous instance if exists
    if (window.recaptchaVerifier && window.recaptchaVerifier.clear) {
      window.recaptchaVerifier.clear();
    }

    try {
      console.log("Initializing RecaptchaVerifier...");
      window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        size: 'invisible', // Use invisible reCAPTCHA
        callback: (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
          console.log('reCAPTCHA verified');
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
          console.warn('reCAPTCHA verification expired.');
          setError('reCAPTCHA verification expired. Please try sending OTP again.');
          setIsLoading(false);
          // Optionally reset reCAPTCHA here if needed
        },
      });
       // Render the reCAPTCHA explicitly if needed, or rely on signInWithPhoneNumber trigger
       window.recaptchaVerifier.render().then(() => {
           console.log("reCAPTCHA rendered.");
       }).catch((err) => {
           console.error("Error rendering reCAPTCHA:", err);
           setError("Failed to initialize reCAPTCHA. Please refresh and try again.");
           toast({ title: "reCAPTCHA Error", description: "Failed to render reCAPTCHA. Please refresh.", variant: "destructive" });
       });

    } catch (err: any) {
        console.error("Error creating RecaptchaVerifier:", err);
        setError(`Failed to initialize reCAPTCHA: ${err.message}. Please check your Firebase setup and ensure the domain is authorized.`);
        toast({ title: "Setup Error", description: "Failed to initialize reCAPTCHA. Check console for details.", variant: "destructive" });
    }


    // Cleanup function
    return () => {
        console.log("Cleaning up RecaptchaVerifier...");
      if (window.recaptchaVerifier && window.recaptchaVerifier.clear) {
        try {
            window.recaptchaVerifier.clear();
            console.log("RecaptchaVerifier cleared");
        } catch (clearError) {
            console.error("Error clearing RecaptchaVerifier:", clearError);
        }
        window.recaptchaVerifier = undefined;
        // Attempt to remove the reCAPTCHA widget from the DOM
        const recaptchaWidgets = document.querySelectorAll('.grecaptcha-badge');
        recaptchaWidgets.forEach(widget => widget.remove());
         console.log("Removed reCAPTCHA badges.");
      }
    };
  }, []); // Run only once on mount

  const handlePhoneNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Basic validation/formatting can be added here
    setPhoneNumber(e.target.value);
  };

  const handleOtpChange = (e: ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value);
  };

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
     console.log("Attempting to send OTP...");
    if (!phoneNumber) {
       setError('Please enter a valid phone number.');
       console.warn("Send OTP attempt with empty phone number.");
       return;
     }
    if (!window.recaptchaVerifier) {
      setError('reCAPTCHA not ready. Please wait a moment and try again.');
      console.warn("Send OTP attempt before reCAPTCHA is ready.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // Ensure phone number has country code (e.g., +91 for India)
      const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      console.log(`Sending OTP to: ${formattedPhoneNumber}`);

      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult; // Store confirmationResult globally or in state
      setIsOtpSent(true);
      toast({ title: "OTP Sent", description: "Check your phone for the verification code." });
      console.log('OTP sent successfully.');
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      // Handle specific error codes
      let userMessage = 'Failed to send OTP. Please try again.';
      if (err.code === 'auth/invalid-phone-number') {
        userMessage = 'Invalid phone number format. Please include the country code (e.g., +91).';
      } else if (err.code === 'auth/too-many-requests') {
        userMessage = 'Too many requests. Please wait a while before trying again.';
      } else if (err.code === 'auth/network-request-failed') {
         userMessage = 'Network error. Please check your internet connection and Firebase setup, then try again.'; // Improved message
      } else if (err.code === 'auth/captcha-check-failed' || err.message.includes('reCAPTCHA')) {
         userMessage = 'reCAPTCHA verification failed. Please try again.';
         console.warn("reCAPTCHA check failed during OTP send.");
         // Attempt to reset reCAPTCHA (might need page refresh depending on state)
         if (window.recaptchaVerifier?.clear) {
             console.log("Attempting to clear reCAPTCHA after failure...");
             window.recaptchaVerifier.clear();
             // Re-render might be needed, but often a retry by user is simplest
         }
      }
      setError(userMessage + ` (Code: ${err.code})`);
      toast({ title: "Error Sending OTP", description: userMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
       console.log("Send OTP process finished.");
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    console.log("Attempting to verify OTP...");
    if (!otp) {
       setError('Please enter the OTP.');
       console.warn("Verify OTP attempt with empty OTP.");
       return;
    }
    if(!window.confirmationResult) {
       setError('OTP confirmation context lost. Please request a new OTP.');
       console.error("Verify OTP attempt without confirmationResult.");
        setIsOtpSent(false); // Go back to phone number input
        return;
    }
    setIsLoading(true);
    setError(null);

    try {
      await window.confirmationResult.confirm(otp);
      // OTP Verified Successfully
      console.log('OTP verified successfully!');
      toast({ title: "Success!", description: "Authentication successful." });

      // Redirect based on user type
      const redirectPath = userType === 'citizen' ? '/citizen/home' : '/municipal/dashboard';
      console.log(`Redirecting to ${redirectPath}...`);
      router.push(redirectPath);

    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      let userMessage = 'Failed to verify OTP. Please check the code and try again.';
      if (err.code === 'auth/invalid-verification-code') {
          userMessage = 'Invalid OTP code entered.';
      } else if (err.code === 'auth/code-expired') {
          userMessage = 'The OTP code has expired. Please request a new one.';
          setIsOtpSent(false); // Force user to request again
      } else if (err.code === 'auth/network-request-failed') {
          userMessage = 'Network error during verification. Please check your internet connection and try again.'; // Improved message
      }
      setError(userMessage + ` (Code: ${err.code})`);
       toast({ title: "Verification Failed", description: userMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
      console.log("Verify OTP process finished.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
             {userType === 'citizen' ? 'Citizen Login' : 'Municipal Authority Login'}
          </CardTitle>
           <CardDescription>
            Verify your mobile number to proceed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!isOtpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number (with country code)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91XXXXXXXXXX"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  required
                  className="mt-1"
                />
              </div>
              {/* reCAPTCHA container - kept hidden by size: 'invisible' */}
              <div ref={recaptchaContainerRef} id="recaptcha-container"></div>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text" // Use text for better input handling on some devices
                  inputMode="numeric" // Hint for numeric keyboard
                  pattern="\d{6}" // Basic pattern for 6 digits
                  maxLength={6}
                  placeholder="XXXXXX"
                  value={otp}
                  onChange={handleOtpChange}
                  required
                  className="mt-1 tracking-widest text-center" // Style OTP input
                />
              </div>
               <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify OTP'}
              </Button>
               <Button variant="link" type="button" onClick={() => setIsOtpSent(false)} className="w-full text-sm text-muted-foreground">
                Change Phone Number
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
