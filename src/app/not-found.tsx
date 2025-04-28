import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted/50 to-background p-6 text-center">
       <FileQuestion className="h-20 w-20 text-primary mb-6 animate-pulse" />
      <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">404 - Page Not Found</h1>
      <p className="text-lg text-muted-foreground mb-10 max-w-md">
        Oops! The page you are looking for doesn't seem to exist or may have been moved.
      </p>
      <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
        <Link href="/">Return to Homepage</Link>
      </Button>
    </div>
  );
}
