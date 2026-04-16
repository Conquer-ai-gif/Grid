import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';

import '@stream-io/video-react-sdk/dist/css/styles.css';
import 'react-datepicker/dist/react-datepicker.css';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Grid — Intelligent Lecture Platform',
  description: 'AI-powered lecture infrastructure for universities at scale',
  icons: { icon: '/icons/logo.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <ClerkProvider
        appearance={{
          layout: {
            socialButtonsVariant: 'iconButton',
            logoImageUrl: '/images/grid-logo.jpeg',
          },
          variables: {
            colorText: '#E5E7EB',
            colorPrimary: '#3B82F6',
            colorBackground: '#050505',
            colorInputBackground: '#0A0A0A',
            colorInputText: '#E5E7EB',
          },
        }}
      >
        <body className={`${inter.className} bg-black text-text-2`}>
          <Toaster />
          {children}
        </body>
      </ClerkProvider>
    </html>
  );
}
