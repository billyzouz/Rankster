import type { Metadata } from "next";
import { Bebas_Neue, Geist, Geist_Mono } from "next/font/google";
import { AppChrome } from "@/components/AppChrome";
import { AuthProvider } from "@/components/AuthProvider";
import { SearchProvider } from "@/components/SearchProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rankster — crée et classe tes tier lists",
  description: "Un créateur de tier list avec images, GIFs et vidéos YouTube.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ink text-zinc-100">
        <AuthProvider>
          <SearchProvider>
            <AppChrome>{children}</AppChrome>
          </SearchProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
