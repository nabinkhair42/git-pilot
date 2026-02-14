import { Providers } from "@/components/providers";

import type { Metadata } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const siteUrl = "https://git.nabinkhair.com.np";

export const metadata: Metadata = {
  title: {
    default:
      "GitPilot — AI-Powered Visual Git Client for GitHub Repos",
    template: "%s | GitPilot",
  },
  description:
    "Visual Git client with AI chat. Browse history, manage branches and tags, cherry-pick, revert, reset, and compare diffs via GitHub.",
  keywords: [
    "git",
    "git client",
    "git GUI",
    "AI git assistant",
    "branch manager",
    "diff viewer",
    "git history",
    "cherry-pick",
    "github browser",
    "visual git",
    "git web UI",
  ],
  authors: [{ name: "Nabin Khair", url: siteUrl }],
  creator: "Nabin Khair",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "GitPilot",
    title: "GitPilot — AI-Powered Visual Git Client",
    description:
      "Visual Git client with AI chat. Browse history, manage branches and tags, cherry-pick, revert, reset, and compare diffs via GitHub.",
    images: [
      {
        url: "/online-mode-dark.png",
        width: 1200,
        height: 630,
        alt: "GitPilot — AI-Powered Visual Git Client",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GitPilot — AI-Powered Visual Git Client",
    description:
      "Visual Git client with AI chat. Browse history, manage branches and tags, cherry-pick, revert, reset, and compare diffs via GitHub.",
    images: ["/online-mode-dark.png"],
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/icon.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${ibmPlexMono.variable} flex h-screen flex-col overflow-hidden font-sans antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
