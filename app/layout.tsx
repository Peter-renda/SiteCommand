import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import DemoProvider from "@/components/DemoProvider";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sitecommand.com"),
  title: {
    default: "SiteCommand – Construction Management Software",
    template: "%s | SiteCommand",
  },
  description:
    "SiteCommand is modern construction management software for contractors and project managers. Track RFIs, submittals, daily logs, drawings, and schedules — all in one place.",
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={barlow.variable}>
      <body className="antialiased">
        <DemoProvider />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
