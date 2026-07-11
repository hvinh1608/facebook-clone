import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import { SocketProvider } from '../context/SocketContext';
import ThemeProvider from '../components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Facebook',
  description: 'Kết nối bạn bè và thế giới xung quanh bạn trên Facebook.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-[#f0f2f5] text-slate-900 antialiased min-h-screen overflow-x-hidden`}>
        <ThemeProvider>
          <SocketProvider>
            {children}
            <Toaster position="top-center" richColors closeButton />
          </SocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
