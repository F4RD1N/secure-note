'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <header className="py-4 px-4 md:px-6">
      <div className="mx-auto max-w-md flex justify-center items-center relative">
        {!isHomePage && (
          <Button variant="ghost" size="icon" className="absolute left-0" asChild>
            <Link href="/">
              <Home className="h-5 w-5" />
              <span className="sr-only">صفحه اصلی</span>
            </Link>
          </Button>
        )}
        <Link href="/" className="text-xl font-bold tracking-tight">
          <h1>
            یادداشت امن
          </h1>
        </Link>
      </div>
    </header>
  );
}
