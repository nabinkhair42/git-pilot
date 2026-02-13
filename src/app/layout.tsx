import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
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
    default: "Git Commit Manager — Visual Git Client for Commits, Branches & Diffs",
    template: "%s | Git Commit Manager",
  },
  description:
    "Browse and manage Git repositories with a clean visual UI. View commit history, manage branches and tags, compare diffs, and perform git operations — locally or via GitHub.",
  keywords: [
    "git",
    "git client",
    "commit manager",
    "git GUI",
    "branch manager",
    "diff viewer",
    "git history",
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
    siteName: "Git Commit Manager",
    title: "Git Commit Manager — Visual Git Client",
    description:
      "Browse and manage Git repositories with a clean visual UI. View commits, branches, tags, and diffs — locally or via GitHub.",
    images: [
      {
        url: "/online-mode-dark.png",
        width: 1200,
        height: 630,
        alt: "Git Commit Manager — Visual Git Client",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Git Commit Manager — Visual Git Client",
    description:
      "Browse and manage Git repositories with a clean visual UI. View commits, branches, tags, and diffs.",
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
        className={`${plusJakarta.variable} ${ibmPlexMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
