import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import DemoProvider from "@/components/DemoProvider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sitecommand.com"),
  title: {
    default: "SiteCommand – Learn Construction Project Management by Doing It",
    template: "%s | SiteCommand",
  },
  description:
    "SiteCommand is a hands-on training ground for construction project management. Run a real, sandboxed project day by day with the actual tools — a living inbox, AI counterparties, an audio coach, scored meetings, milestone reviews, and a 70-lesson curriculum.",
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <DemoProvider />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
