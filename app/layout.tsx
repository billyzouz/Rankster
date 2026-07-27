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

const SITE_TITLE = "Rankster — crée tes tier lists et classe celles des autres";
const SITE_DESCRIPTION =
  "Crée des tier lists avec tes images et vidéos YouTube, classe celles des autres à ta façon, et compare tes classements avec tes amis — sans même créer de compte.";

export const metadata: Metadata = {
  metadataBase: new URL("https://rankster.fr"),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "Rankster",
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Rankster",
  url: "https://rankster.fr",
  description: SITE_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ink text-zinc-100">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>
          <SearchProvider>
            <AppChrome>{children}</AppChrome>
          </SearchProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
