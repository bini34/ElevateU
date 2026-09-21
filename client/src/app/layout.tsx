import type { Metadata } from "next";
import localFont from "next/font/local";
import { ToastProvider } from '@/components/ui/ToastProvider';
import "./globals.css";
import { DataProvider } from '@/context/DataContext';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ElevateU",
  description: "A place for personal growth, meaningful progress, and shared accountability.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">  
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <NotificationProvider>
            <DataProvider>
              <ToastProvider />
              {children}
            </DataProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
