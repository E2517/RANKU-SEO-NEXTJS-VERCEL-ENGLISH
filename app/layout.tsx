import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RANKU ✌️ Local & Organic SEO Tool with Smart Analytics',
  description:
    'RANKU is more than just a rank tracker: it gives you actionable insights for real local and organic SEO decisions ⭐ Rankings, trends, competitor analysis, and more. Master Google with intelligence!',
  metadataBase: new URL('https://ranku.es'),
  openGraph: {
    title: 'RANKU ✌️ Local & Organic SEO Tool with Smart Analytics',
    description:
      'RANKU is more than just a rank tracker: it gives you actionable insights for real local and organic SEO decisions ⭐ Rankings, trends, competitor analysis, and more. Master Google with intelligence!',
    url: 'https://ranku.es/',
    siteName: 'ranku.es',
    images: [
      {
        url: '/assets/ranku.webp',
        width: 1200,
        height: 630,
        alt: 'RANKU - Local & Organic SEO Analysis',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RANKU ✌️ Local & Organic SEO Tool with Smart Analytics',
    description:
      'RANKU is more than just a rank tracker: it gives you actionable insights for real local and organic SEO decisions ⭐ Rankings, trends, competitor analysis, and more. Master Google with intelligence!',
    images: ['/assets/ranku.webp'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}