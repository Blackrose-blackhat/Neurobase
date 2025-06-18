import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { siteMetaData } from "@/constants/metadata";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: siteMetaData.title,
  description: siteMetaData.description,
  keywords: [
    "database",
    "AI",
    "GPT",
    "SQL",
    "database assistant",
    "natural language query",
  ],
  authors: [{ name: "Neurobase Team" }],
  creator: "Neurobase Team",
  publisher: "Neurobase",
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
  openGraph: {
    type: "website",
    locale: siteMetaData.locale,
    url: siteMetaData.siteUrl,
    title: siteMetaData.title,
    description: siteMetaData.description,
    siteName: siteMetaData.title,
    images: [
      {
        url: siteMetaData.image,
        width: 1200,
        height: 630,
        alt: siteMetaData.title,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteMetaData.title,
    description: siteMetaData.description,
    creator: "@dbgpt",
    images: [siteMetaData.socialBanner],
    site: "@dbgpt",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  verification: {
    google: "your-google-site-verification",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={siteMetaData.language}>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme={siteMetaData.theme}
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
