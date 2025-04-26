
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
    if (!recaptchaContainerRef.current) {
        console.log("reCAPTCHA container ref not available yet.");
        return;
    }
    if (window.recaptchaVerifier) {
        console.log("reCAPTCHA verifier already exists, clearing old one.");
        window.recaptchaVerifier.clear();
    }

    try {
      console.log("Initializing RecaptchaVerifier...");
      window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        size: 'invisible', // Use invisible reCAPTCHA
        callback: (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
          console.log('reCAPTCHA verified successfully via callback.');
          // Usually OTP sending is triggered elsewhere, but this confirms verification
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
          console.warn('reCAPTCHA verification expired. User needs to retry.');
          setError('reCAPTCHA verification expired. Please try sending OTP again.');
          setIsLoading(false);
          // Optionally reset reCAPTCHA here if needed
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            console.log("Cleared expired reCAPTCHA. Ready for retry.");
          }
        },
      });
      // Render the reCAPTCHA explicitly. Important for invisible reCAPTCHA.
      window.recaptchaVerifier.render().then((widgetId) => {
          console.log(`reCAPTCHA rendered successfully. Widget ID: ${widgetId}`);
          // Ensure container is visible, although reCAPTCHA itself is invisible
           if (recaptchaContainerRef.current) {
               recaptchaContainerRef.current.style.display = 'block'; // Make sure container is in DOM flow
           }
      }).catch((err) => {
          console.error("Error rendering reCAPTCHA:", err);
          setError(`Failed to render reCAPTCHA: ${err.message}. Please refresh and try again.`);
          toast({ title: "reCAPTCHA Error", description: "Could not initialize verification. Please refresh.", variant: "destructive" });
      });

    } catch (err: any) {
        console.error("Error creating RecaptchaVerifier instance:", err);
        setError(`Failed to initialize security check: ${err.message}. Check Firebase setup and authorized domains.`);
        toast({ title: "Setup Error", description: "Failed to initialize security features. Check console.", variant: "destructive" });
    }

    // Cleanup function
    return () => {
      console.log("Cleaning up RecaptchaVerifier on component unmount...");
      if (window.recaptchaVerifier && typeof window.recaptchaVerifier.clear === 'function') {
        try {
            window.recaptchaVerifier.clear();
            console.log("RecaptchaVerifier instance cleared.");
        } catch (clearError) {
            // Catch potential errors during cleanup, though usually not critical
            console.error("Error during RecaptchaVerifier cleanup:", clearError);
        }
        window.recaptchaVerifier = undefined; // Ensure it's marked as undefined
        // Remove the reCAPTCHA badge if it exists
        const badge = document.querySelector('.grecaptcha-badge');
        if (badge && badge.parentElement) {
            badge.parentElement.remove();
            console.log("Removed reCAPTCHA badge from DOM.");
        }
      } else {
          console.log("No active RecaptchaVerifier instance found to clear.");
      }
    };
  }, [auth]); // Add auth instance as dependency, ensures re-init if auth changes (unlikely but good practice)


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
    setError(null); // Clear previous errors

    if (!phoneNumber.trim()) {
       setError('Please enter a valid phone number.');
       console.warn("Send OTP attempt with empty phone number.");
       return;
     }

    // Check if reCAPTCHA verifier is initialized and rendered
    if (!window.recaptchaVerifier || !window.recaptchaVerifier.auth) {
        // Attempt to re-render or prompt user? Often a refresh is the practical solution.
        console.error('reCAPTCHA verifier not ready or rendered.');
        setError('Security check not ready. Please wait a moment or refresh the page.');
        toast({ title: "Verification Error", description: "Security check failed to initialize. Try refreshing.", variant: "destructive" });
        return;
    }

    setIsLoading(true);


    try {
      // Ensure phone number has country code (e.g., +91 for India)
      const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      console.log(`Sending OTP to: ${formattedPhoneNumber} using Firebase Auth.`);

      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult; // Store confirmationResult globally or in state
      setIsOtpSent(true);
      toast({ title: "OTP Sent", description: "Check your phone for the verification code." });
      console.log('OTP sent successfully. Confirmation result stored.');
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      // Handle specific error codes
      let userMessage = 'Failed to send OTP. Please try again.';
      if (err.code === 'auth/invalid-phone-number') {
        userMessage = 'Invalid phone number format. Please include the country code (e.g., +91).';
      } else if (err.code === 'auth/too-many-requests') {
        userMessage = 'Too many requests. Please wait a while before trying again.';
      } else if (err.code === 'auth/network-request-failed') {
         userMessage = 'Network error: Could not connect to Firebase. Check your internet connection and ensure Firebase services are reachable.';
         console.error("Network request failed detail:", err.message); // Log more details if available
      } else if (err.code === 'auth/captcha-check-failed' || err.message?.includes('reCAPTCHA')) {
         userMessage = 'reCAPTCHA verification failed. Please try again.';
         console.warn("reCAPTCHA check failed during OTP send. Error details:", err);
         // Attempt to reset reCAPTCHA (might need page refresh depending on state)
         if (window.recaptchaVerifier?.clear) {
             console.log("Attempting to clear reCAPTCHA after failure...");
             try {
                 window.recaptchaVerifier.clear();
                 // Re-render might be needed, but often a user retry is simplest
                 window.recaptchaVerifier.render().catch(renderErr => console.error("Failed to re-render reCAPTCHA after clear:", renderErr));
             } catch(clearErr) {
                 console.error("Failed to clear reCAPTCHA:", clearErr);
             }
         }
      } else if (err.message?.includes('auth/configuration-not-found')) {
           userMessage = 'Firebase configuration error. Phone Auth might not be enabled or set up correctly in your Firebase project.';
           console.error("Potential Firebase configuration issue. Check Phone Auth provider in Firebase console.");
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
    setError(null); // Clear previous errors

    if (!otp.trim()) {
       setError('Please enter the OTP.');
       console.warn("Verify OTP attempt with empty OTP.");
       return;
    }
    if(!window.confirmationResult) {
       setError('OTP confirmation context lost. Please request a new OTP.');
       console.error("Verify OTP attempt without confirmationResult. User might have refreshed or context was lost.");
        setIsOtpSent(false); // Go back to phone number input
        setPhoneNumber(''); // Clear phone number as well
        setOtp(''); // Clear OTP input
        return;
    }
    setIsLoading(true);


    try {
      const credential = await window.confirmationResult.confirm(otp);
      // OTP Verified Successfully
      const user = credential.user;
      console.log('OTP verified successfully! User:', user.uid);
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
          setOtp(''); // Clear expired OTP
      } else if (err.code === 'auth/network-request-failed') {
          userMessage = 'Network error during verification. Check your connection and try again.';
      } else if (err.code === 'auth/credential-already-in-use') {
           userMessage = 'This phone number is already associated with another account.';
      } else if (err.code === 'auth/user-disabled') {
           userMessage = 'This user account has been disabled.';
      }

      setError(userMessage + ` (Code: ${err.code})`);
      toast({ title: "Verification Failed", description: userMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
      console.log("Verify OTP process finished.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border border-border">
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
                <Label htmlFor="phone">Phone Number (e.g., +919876543210)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91XXXXXXXXXX"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  required
                  className="mt-1"
                  aria-describedby="phone-hint"
                />
                 <p id="phone-hint" className="text-xs text-muted-foreground mt-1">Include your country code.</p>
              </div>
              {/* reCAPTCHA container - crucial for invisible reCAPTCHA initialization */}
              <div ref={recaptchaContainerRef} id="recaptcha-container" style={{ marginTop: '1rem' }}></div>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <Label htmlFor="otp">Enter 6-Digit OTP</Label>
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
                  className="mt-1 tracking-widest text-center text-lg" // Style OTP input
                  autoComplete="one-time-code" // Helps browsers autofill OTP
                />
              </div>
               <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify OTP'}
              </Button>
               <Button variant="link" type="button" onClick={() => {setIsOtpSent(false); setOtp(''); setError(null);}} className="w-full text-sm text-muted-foreground">
                Change Phone Number or Resend OTP
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
