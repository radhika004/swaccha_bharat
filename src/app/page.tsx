import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MountainIcon } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
      <header className="flex items-center justify-center mb-12">
        <MountainIcon className="h-10 w-10 text-primary mr-3" />
        <h1 className="text-4xl md:text-5xl font-bold text-center text-primary">
          SwachhConnect
        </h1>
      </header>

      <main className="flex flex-col items-center text-center max-w-2xl mb-16">
        <p className="text-lg md:text-xl text-foreground mb-10">
          Connecting citizens and municipal authorities for a cleaner, smarter India.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-md">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-lg transition duration-300 ease-in-out transform hover:scale-105">
            <Link href="/auth/citizen">
              I am a Citizen
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 shadow-md rounded-lg transition duration-300 ease-in-out transform hover:scale-105">
            <Link href="/auth/municipal">
              Municipal Authority
            </Link>
          </Button>
        </div>
      </main>

      <footer className="text-muted-foreground text-sm mt-auto">
        © {new Date().getFullYear()} SwachhConnect. All rights reserved.
      </footer>
    </div>
  );
}
