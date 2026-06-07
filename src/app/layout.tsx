import type {Metadata, Viewport} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from "@/components/ui/toaster";
import { ActivityTracker } from '@/components/layout/ActivityTracker';

export const metadata: Metadata = {
  title: 'Al Batul Matrimony | Trusted Muslim Matchmaking',
  description: 'A serene and professional matrimonial platform for the Muslim community.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Al Batul',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#478572',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <ActivityTracker />
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}