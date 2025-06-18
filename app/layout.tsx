import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Neurobase - AI-Powered Database Assistant",
  description:
    "An intelligent database assistant powered by AI that helps you interact with your databases using natural language.",
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
    locale: "en_US",
    url: "db-gpt-seven.vercel.app",
    title: "Neurobase - AI-Powered Database Assistant",
    description:
      "An intelligent database assistant powered by AI that helps you interact with your databases using natural language.",
    siteName: "Neurobase",
   
  },
  twitter: {
    card: "summary_large_image",
    title: "Neurobase - AI-Powered Database Assistant",
    description:
      "An intelligent database assistant powered by AI that helps you interact with your databases using natural language.",
    creator: "@dbgpt",
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
    <html lang="en">
      <body className={inter.className}>
        {" "}
        <ThemeProvider attribute="class" defaultTheme="dark" >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
