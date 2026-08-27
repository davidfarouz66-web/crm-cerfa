import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";
import OpenInBrowser from "@/components/OpenInBrowser";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.trouma-pro.fr"),
  title: "Trouma-Pro — Gestion des dons",
  description: "CRM de gestion des donateurs et génération de reçus fiscaux CERFA",
  manifest: "/manifest.json",
  openGraph: {
    title: "Trouma-Pro — Gestion des dons",
    description: "Gérez vos donateurs et générez vos reçus fiscaux CERFA en quelques clics.",
    url: "https://www.trouma-pro.fr",
    siteName: "Trouma-Pro",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Trouma-Pro — Gestion des dons & CERFA",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trouma-Pro — Gestion des dons",
    description: "Gérez vos donateurs et générez vos reçus fiscaux CERFA en quelques clics.",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#1e40af",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="h-full bg-slate-50 antialiased">
        <Providers>{children}</Providers>
        <OpenInBrowser />
      </body>
    </html>
  );
}
