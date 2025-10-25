import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

export default function Header() {
  return (
    <header className="py-4 px-4 md:px-6">
      <div className="mx-auto max-w-md flex justify-center items-center relative">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <h1>
            یادداشت سریع
          </h1>
        </Link>
        <div className="absolute left-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
