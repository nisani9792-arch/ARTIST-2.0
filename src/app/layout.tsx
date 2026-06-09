import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export const metadata: Metadata = {
  title: "ARTIST 2.0",
  description: "CRM מסך יחיד לניהול חתימות אומנים",
  applicationName: "ARTIST 2.0",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "ARTIST 2.0",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: [{ url: "/icon-192.png" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <meta name="theme-color" content="#29abe2" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${heebo.variable} font-sans antialiased bg-zinc-50 text-slate-900`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
