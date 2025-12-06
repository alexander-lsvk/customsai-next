import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProviderWithLocale } from "@/components/clerk-provider-with-locale";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Customs AI - Smart Customs Classification",
  description: "AI-powered customs classification for ASEAN imports & exports",
  icons: {
    icon: "/favicon.svg",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <ClerkProviderWithLocale>{children}</ClerkProviderWithLocale>
      </body>
    </html>
  );
}
