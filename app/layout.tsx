import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "700"] });

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
      <body className={`${jetbrainsMono.className} h-full antialiased overflow-hidden`} style={{ background: 'var(--c-bg)', color: 'var(--c-text)' }}>
        {children}
      </body>
    </html>
  );
}
