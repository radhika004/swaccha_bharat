import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
       <FileQuestion className="h-16 w-16 text-primary mb-6" />
      <h1 className="text-4xl font-bold text-foreground mb-3">404 - Page Not Found</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Oops! The page you are looking for does not exist or has been moved.
      </p>
      <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
}
