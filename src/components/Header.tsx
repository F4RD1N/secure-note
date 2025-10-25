import Link from 'next/link';

export default function Header() {
  return (
    <header className="py-4 px-4 md:px-6">
      <div className="mx-auto max-w-md flex justify-center items-center relative">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <h1>
            یادداشت سریع
          </h1>
        </Link>
      </div>
    </header>
  );
}
