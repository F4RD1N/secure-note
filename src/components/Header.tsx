import Link from 'next/link';
import { LightningBoltIcon } from '@/components/icons';

export default function Header() {
  return (
    <header className="py-4 px-4 md:px-6">
      <div className="mx-auto max-w-md">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <span className="text-primary"><LightningBoltIcon className="w-6 h-6" /></span>
          <h1>
            QuickNote <span className="text-sm font-normal text-muted-foreground">⚡</span>
          </h1>
        </Link>
      </div>
    </header>
  );
}
