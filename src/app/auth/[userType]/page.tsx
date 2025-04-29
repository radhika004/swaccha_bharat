'use client';

import type { ChangeEvent, FormEvent } from 'react';
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; // Import Firestore functions
import { auth, db } from '@/lib/firebase/config';
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
  const userType = params.userType as 'citizen' | 'municipal'; // Ensure type safety
  const { toast } = useToast();

   // Function to save user role to Firestore
   const saveUserRole = async (userId: string, role: 'citizen' | 'municipal', phone: string) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, {
        role: role,
        phoneNumber: phone,
        // Add other user details if needed, like creation timestamp
        createdAt: new Date(),
      }, { merge: true }); // Use merge: true to avoid overwriting existing data if any
      console.log(`User role '${role}' saved for userId: ${userId}`);
    } catch (err) {
      console.error("Error saving user role to Firestore:", err);
      // Optionally show a toast or log this error more visibly
       toast({
        title: "Data Sync Error",
        description: "Could not save user profile information.",
        variant: "destructive",
      });
    }
  };

  // Initialize reCAPTCHA
  useEffect(() => {
    let verifier: RecaptchaVerifier | null = null; // Local variable for cleanup

    const initializeRecaptcha = () => {
      if (!recaptchaContainerRef.current) {
        console.log("reCAPTCHA container ref not available yet.");
        return;
      }
      if (window.recaptchaVerifier && typeof window.recaptchaVerifier.clear === 'function') {
        console.log("reCAPTCHA verifier already exists, clearing old one.");
         try {
            window.recaptchaVerifier.clear();
            console.log("Cleared previous window.recaptchaVerifier instance.");
         } catch (clearError) {
            console.error("Error clearing previous window.recaptchaVerifier:", clearError);
         }
        window.recaptchaVerifier = undefined;
      }

      try {
        console.log("Initializing RecaptchaVerifier...");
        verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
          size: 'invisible',
          callback: (response: any) => {
            console.log('reCAPTCHA verified successfully via callback.');
            // Consider automatically triggering OTP send here if desired
          },
          'expired-callback': () => {
            console.warn('reCAPTCHA verification expired. User needs to retry.');
            setError('reCAPTCHA verification expired. Please try sending OTP again.');
            setIsLoading(false);
            if (verifier && typeof verifier.clear === 'function') {
               try {
                  verifier.clear();
                  console.log("Cleared expired reCAPTCHA. Ready for retry.");
               } catch (clearError) {
                  console.error("Error clearing expired reCAPTCHA:", clearError);
               }
            }
          },
        });
        window.recaptchaVerifier = verifier;

        verifier.render().then((widgetId) => {
          console.log(`reCAPTCHA rendered successfully. Widget ID: ${widgetId}`);
          if (recaptchaContainerRef.current) {
            recaptchaContainerRef.current.style.display = 'block'; // Ensure visibility if needed
          }
        }).catch((err) => {
          console.error("Error rendering reCAPTCHA:", err);
          setError(`Failed to render reCAPTCHA: ${err.message}. Please refresh and try again.`);
          toast({ title: "reCAPTCHA Error", description: "Could not initialize verification. Please refresh.", variant: "destructive" });
           if (verifier && typeof verifier.clear === 'function') {
                try {
                    verifier.clear();
                } catch (clearError) {
                    console.error("Error clearing verifier after render error:", clearError);
                }
           }
          window.recaptchaVerifier = undefined;
        });

      } catch (err: any) {
        console.error("Error creating RecaptchaVerifier instance:", err);
        if (err.message?.includes('auth instance')) {
          setError(`Security check initialization error. Please wait a moment and try again. (Details: ${err.message})`);
          // setTimeout(initializeRecaptcha, 1000); // Optional retry
        } else {
          setError(`Failed to initialize security check: ${err.message}. Check Firebase setup and authorized domains.`);
        }
        toast({ title: "Setup Error", description: "Failed to initialize security features. Check console.", variant: "destructive" });
        window.recaptchaVerifier = undefined;
      }
    };

    initializeRecaptcha();

    return () => {
      console.log("Cleaning up RecaptchaVerifier on component unmount...");
      if (verifier && typeof verifier.clear === 'function') {
        try {
          verifier.clear();
          console.log("Local RecaptchaVerifier instance cleared.");
        } catch (clearError) {
          console.error("Error during local RecaptchaVerifier cleanup:", clearError);
        }
      }
      if (window.recaptchaVerifier && typeof window.recaptchaVerifier.clear === 'function') {
        try {
            window.recaptchaVerifier.clear();
            console.log("Window RecaptchaVerifier instance cleared.");
         } catch (e) {
             console.error("Error clearing window.recaptchaVerifier:", e);
         }
        window.recaptchaVerifier = undefined;
      }
      const badge = document.querySelector('.grecaptcha-badge');
      if (badge?.parentElement) {
         try {
             badge.parentElement.remove();
             console.log("Removed reCAPTCHA badge from DOM.");
         }
         catch (removeError) {
             console.error("Error removing reCAPTCHA badge:", removeError);
         }
      }
    };
  }, [auth]); // Re-run only if auth instance changes

  const handlePhoneNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^+\d]/g, ''); // Allow '+' and digits
    setPhoneNumber(value);
  };

  const handleOtpChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Allow only digits
    setOtp(value);
  };

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    console.log("Attempting to send OTP...");
    setError(null);
    setIsLoading(true);

    if (!phoneNumber.trim() || !/^\+?\d{10,}$/.test(phoneNumber.replace(/\s+/g, ''))) {
      setError('Please enter a valid phone number (e.g., +919876543210).');
      setIsLoading(false);
      return;
    }

    const activeVerifier = window.recaptchaVerifier;
    if (!activeVerifier) {
      setError('Security check not ready. Please wait or refresh.');
      toast({ title: "Verification Error", description: "Security check failed to initialize. Try refreshing.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      // Ensure phone number has country code (default to +91 if missing)
      let formattedPhoneNumber = phoneNumber.trim();
      if (!formattedPhoneNumber.startsWith('+')) {
        formattedPhoneNumber = `+91${formattedPhoneNumber}`;
      }
      console.log(`Sending OTP to: ${formattedPhoneNumber}`);

      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, activeVerifier);
      window.confirmationResult = confirmationResult;
      setIsOtpSent(true);
      toast({ title: "OTP Sent", description: "Check your phone for the verification code." });
      console.log('OTP sent successfully.');
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      let userMessage = `Failed to send OTP: ${err.message}. Please try again.`;
       if (err.code === 'auth/invalid-phone-number') {
        userMessage = 'Invalid phone number format. Please include the country code (e.g., +91).';
      } else if (err.code === 'auth/too-many-requests') {
        userMessage = 'Too many requests. Please wait before trying again.';
      } else if (err.code === 'auth/network-request-failed') {
        userMessage = 'Network error. Check connection and firewall.';
      } else if (err.code === 'auth/captcha-check-failed' || err.code === 'auth/internal-error') {
        userMessage = 'reCAPTCHA verification failed. Please try again.';
        // Reset reCAPTCHA if needed
         if (activeVerifier && typeof activeVerifier.render === 'function') {
             activeVerifier.render().catch(renderErr => console.error("Failed to re-render reCAPTCHA:", renderErr));
         }
      } else if (err.code === 'auth/missing-client-identifier') {
         userMessage = 'Firebase setup issue: Missing client identifier. Ensure Phone Auth is enabled correctly.';
      }
      setError(`${userMessage} (Code: ${err.code})`);
      toast({ title: "Error Sending OTP", description: userMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    console.log("Attempting to verify OTP...");
    setError(null);

    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    if (!window.confirmationResult) {
      setError('OTP confirmation context lost. Please request a new OTP.');
      setIsOtpSent(false); setPhoneNumber(''); setOtp('');
      return;
    }

    setIsLoading(true);

    try {
      const credential = await window.confirmationResult.confirm(otp);
      const user = credential.user;
      console.log('OTP verified successfully! User:', user.uid);

       // Save user role to Firestore right after successful verification
       await saveUserRole(user.uid, userType, user.phoneNumber || phoneNumber); // Use confirmed phone number if available


      toast({ title: "Success!", description: "Authentication successful." });

      // Redirect based on user type
      const redirectPath = userType === 'citizen' ? '/citizen/home' : '/municipal/dashboard';
      console.log(`Redirecting to ${redirectPath}...`);
      router.push(redirectPath);

    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      let userMessage = `Failed to verify OTP: ${err.message}. Check the code and try again.`;
      if (err.code === 'auth/invalid-verification-code') {
        userMessage = 'Invalid OTP code entered.';
      } else if (err.code === 'auth/code-expired') {
        userMessage = 'The OTP code has expired. Please request a new one.';
        setIsOtpSent(false); setOtp(''); // Go back to OTP request
      } else if (err.code === 'auth/session-expired') {
         userMessage = 'Verification session expired. Please request a new OTP.';
         setIsOtpSent(false); setOtp('');
      } else if (err.code === 'auth/internal-error') {
          userMessage = 'An internal Firebase error occurred during verification. Please try again.';
      }
      setError(`${userMessage} (Code: ${err.code})`);
      toast({ title: "Verification Failed", description: userMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 p-4">
      <Card className="w-full max-w-md shadow-xl border border-primary/20 rounded-lg">
        <CardHeader className="text-center bg-primary/10 p-6 rounded-t-lg">
          <CardTitle className="text-2xl font-bold text-primary">
            {userType === 'citizen' ? 'Citizen Login' : 'Municipal Authority Login'}
          </CardTitle>
          <CardDescription className="text-muted-foreground pt-1">
            Verify your mobile number to proceed
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!isOtpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <Label htmlFor="phone" className="font-medium">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel" // Use 'tel' type for better mobile input
                  placeholder="+91 98765 43210"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  required
                  className="mt-1"
                  aria-describedby="phone-hint"
                />
                <p id="phone-hint" className="text-xs text-muted-foreground mt-1">Include your country code (e.g., +91).</p>
              </div>
              {/* reCAPTCHA container - Must exist in the DOM for initialization */}
              <div ref={recaptchaContainerRef} id="recaptcha-container" style={{ marginTop: '1rem', minHeight: '1px' }}></div>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send OTP (Complete reCAPTCHA)'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <Label htmlFor="otp" className="font-medium">Enter 6-Digit OTP</Label>
                <Input
                  id="otp"
                  type="text" // Use text for better control
                  inputMode="numeric" // Suggest numeric keyboard
                  pattern="\d{6}" // Basic pattern check
                  maxLength={6}
                  placeholder="XXXXXX"
                  value={otp}
                  onChange={handleOtpChange}
                  required
                  className="mt-1 tracking-[0.3em] text-center text-lg font-semibold" // Style OTP input
                  autoComplete="one-time-code" // Help browsers autofill
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify OTP'}
              </Button>
              <Button variant="link" type="button" onClick={() => { setIsOtpSent(false); setOtp(''); setError(null); }} className="w-full text-sm text-muted-foreground hover:text-accent">
                Change Phone Number or Resend OTP?
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
