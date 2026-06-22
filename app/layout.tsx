import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DRISHTI — India Energy Security Intelligence",
  description: "Real-time AI-powered platform for India's oil supply chain resilience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-[#050914] text-slate-100 antialiased overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
