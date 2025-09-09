import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { Toaster } from "sonner";
import NavBar from "@/components/NavBar";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Mappl',
    default: 'Mappl - Discover Events Near You',
  },
  description: "Discover and join exciting events happening around you. Create, share, and connect with your community through Mappl - your local event discovery platform.",
  keywords: ['events', 'local events', 'event discovery', 'community', 'meetups', 'activities', 'nearby events'],
  authors: [{ name: 'Mappl Team' }],
  creator: 'Mappl',
  publisher: 'Mappl',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APPWRITE_SITE_URL || 'https://mappl.appwrite.network'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Mappl - Discover Events Near You',
    description: 'Discover and join exciting events happening around you. Create, share, and connect with your community.',
    url: '/',
    siteName: 'Mappl',
    images: [
      {
        url: '/logos/mappl_logo.svg',
        width: 1200,
        height: 630,
        alt: 'Mappl - Event Discovery Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mappl - Discover Events Near You',
    description: 'Discover and join exciting events happening around you. Create, share, and connect with your community.',
    images: ['/logos/mappl_logo.svg'],
    creator: '@mappl',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${notoSans.variable} ${notoSans.className} antialiased`}
      >
        <AuthProvider>
        <header className="border-b">
          <NavBar />
        </header>
        <main>{children}</main>
        <Toaster richColors position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
