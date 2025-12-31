'use client';

import './globals.css';
import { Outfit } from 'next/font/google';
import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { FinanceProvider } from '@/context/FinanceContext';
import ThemeEffect from '@/components/ThemeEffect';
import { usePathname, useRouter } from 'next/navigation';

const outfit = Outfit({ subsets: ['latin'] });


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isLandingPage = pathname === '/';

  React.useEffect(() => {
    // Redirect to landing page on initial load/refresh if not already there
    if (pathname !== '/') {
      router.push('/');
    }
  }, []); // Empty dependency array ensures this runs only on mount (refresh/initial load)

  return (
    <html lang="en" data-theme="dark">
      <head>
        <title>Finance Tracker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={outfit.className}>
        <FinanceProvider>
          <ThemeEffect />
          <div className="background-blobs">
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            <div className="blob blob-3"></div>
          </div>

          {!isLandingPage && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

          <div className="main-wrapper">
            {!isLandingPage && <Navbar onMenuClick={() => setSidebarOpen(true)} />}

            <main className={!isLandingPage ? "content-container" : ""}>
              {children}
            </main>
          </div>
        </FinanceProvider>
      </body>
    </html>
  );
}
