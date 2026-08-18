import './globals.css';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { NotificationProvider } from '@/components/notification-provider';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Amori — Find Your Perfect Match',
  description: 'Meet new people, find love, and build meaningful connections with Amori.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className={poppins.variable}>
      <body className="font-sans antialiased min-h-screen">
        {children}
        <NotificationProvider />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
