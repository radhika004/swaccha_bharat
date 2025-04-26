// TODO: Add error page
'use client'; // Error components must be Client Components

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'sans-serif',
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: '#fef2f2', // Light red background
            color: '#b91c1c', // Dark red text
          }}
        >
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '600' }}>
            Something went wrong!
          </h2>
          <p style={{ marginBottom: '1.5rem', color: '#dc2626' }}>
             An unexpected error occurred. We apologize for the inconvenience.
          </p>
           {/* Optional: Display error details during development */}
           {process.env.NODE_ENV === 'development' && (
             <pre
               style={{
                 maxWidth: '80%',
                 overflowX: 'auto',
                 padding: '1rem',
                 border: '1px solid #fecaca',
                 borderRadius: '0.375rem',
                 backgroundColor: '#fee2e2',
                 color: '#991b1b',
                 textAlign: 'left',
                 fontSize: '0.875rem',
                 marginBottom: '1.5rem',
               }}
             >
               {error?.message}
               {error?.digest && `\nDigest: ${error.digest}`}
               {error?.stack && `\nStack: ${error.stack}`}
             </pre>
           )}
          <button
            onClick={
              // Attempt to recover by trying to re-render the segment
              () => reset()
            }
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '0.375rem',
              backgroundColor: '#dc2626', // Red background
              color: 'white',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
          >
            Try again
          </button>
           <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#ef4444' }}>
             If the problem persists, please contact support or return to the <a href="/" style={{ color: '#b91c1c', textDecoration: 'underline' }}>homepage</a>.
           </p>
        </div>
      </body>
    </html>
  );
}
