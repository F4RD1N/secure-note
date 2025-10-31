// Import necessary types and components for the layout
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import { cn } from '@/lib/utils';

// Define metadata for the application, like title and description
export const metadata: Metadata = {
  title: 'یادداشت امن',
  description: 'اشتراک‌ گذاری سریع، امن و ساده‌ی یادداشت.',
  applicationName: 'یادداشت امن',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'یادداشت امن',
  },
};

// This is the main layout component for the entire app
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Set up the HTML document with language, direction, and dark theme
    <html lang="fa" dir="rtl" className="dark" suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Link to the Vazirmatn font */}
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&display=swap" rel="stylesheet" />
        {/* Link to the web app manifest file for PWA capabilities */}
        <link rel="manifest" href="/manifest.json" />
        {/* Set the theme color for the browser UI */}
        <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: light)" />
      </head>
      {/* The body of the app with appropriate styling */}
      <body className={cn('font-body antialiased min-h-screen flex flex-col bg-transparent')}>
          {/* Render the header component */}
          <Header />
          {/* Main content area */}
          <main className="flex flex-1 flex-col items-center justify-start p-4 md:p-6">
            <div className="w-full max-w-md flex-1 flex flex-col">
              {/* Render the children components passed to the layout */}
              {children}
            </div>
          </main>
          {/* Toaster component to show pop-up notifications */}
          <Toaster />
      </body>
    </html>
  );
}
