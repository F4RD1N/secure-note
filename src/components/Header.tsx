import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function Header() {
  return (
    <header className="py-4 px-4 md:px-6">
      <div className="mx-auto max-w-md flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <Zap className="w-6 h-6 text-primary" />
          <h1>
            یادداشت سریع
          </h1>
        </Link>
      </div>
    </header>
  );
}
