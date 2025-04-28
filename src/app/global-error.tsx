'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary Caught:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          className="flex flex-col items-center justify-center min-h-screen bg-destructive/10 p-6 text-center"
        >
           <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
          <h2 className="text-3xl font-bold text-destructive mb-4">
            Something Went Wrong!
          </h2>
          <p className="text-lg text-destructive/80 mb-8 max-w-lg">
             An unexpected error occurred. We apologize for the inconvenience. Please try again or return to the homepage.
          </p>
           {/* Optional: Display error details during development */}
           {process.env.NODE_ENV === 'development' && (
             <pre
               className="max-w-full overflow-x-auto p-4 border border-destructive/30 rounded-md bg-destructive/5 text-destructive text-left text-xs mb-6"
             >
               {error?.message}
               {error?.digest && `\nDigest: ${error.digest}`}
               {/* Consider limiting stack trace output */}
               {/* {error?.stack && `\nStack: ${error.stack}`} */}
             </pre>
           )}
          <div className="flex gap-4">
            <Button
              onClick={
                // Attempt to recover by trying to re-render the segment
                () => reset()
              }
              variant="destructive"
              size="lg"
            >
              Try Again
            </Button>
             <Button
                asChild
                variant="outline"
                size="lg"
              >
                 <a href="/">Go to Homepage</a>
             </Button>
           </div>
        </div>
      </body>
    </html>
  );
}
