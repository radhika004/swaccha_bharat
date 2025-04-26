import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter font
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans', // Define CSS variable for the font
});

export const metadata: Metadata = {
  title: 'SwachhConnect', // Updated App Name
  description: 'Connecting citizens and municipal authorities for a cleaner, smarter India.', // Updated Tagline
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable // Apply font variable
        )}
      >
        {/* AuthProvider could wrap here if global auth state is needed,
            or applied within specific route layouts (like /citizen or /municipal) */}
        {children}
        <Toaster /> {/* Add Toaster here to display toasts globally */}
      </body>
    </html>
  );
}