'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

// This is the header component for the application
export default function Header() {
  // Get the current URL path
  const pathname = usePathname();
  // Check if the current page is the home page
  const isHomePage = pathname === '/';

  return (
    <header className="py-4 px-4 md:px-6">
      <div className="mx-auto max-w-md flex justify-center items-center relative">
        {/* If it's not the home page, show a button to go back home */}
        {!isHomePage && (
          <Button variant="ghost" size="icon" className="absolute left-0" asChild>
            <Link href="/">
              <Home className="h-5 w-5" />
              <span className="sr-only">صفحه اصلی</span>
            </Link>
          </Button>
        )}
        {/* The main title of the app, which is also a link to the home page */}
        <Link href="/" className="text-xl font-bold tracking-tight">
          <h1>
            یادداشت امن
          </h1>
        </Link>
      </div>
    </header>
  );
}
