import type { Metadata } from "next";
import "./globals.css";
import { MockProvider } from '@/components/mock-provider';

export const metadata: Metadata = {
  title: "Ownership — Your things, in one place",
  description: "A calm personal record for the things you own.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-[#cbd5ff] selection:text-[#171914]"><MockProvider>{children}</MockProvider></body>
    </html>
  );
}
