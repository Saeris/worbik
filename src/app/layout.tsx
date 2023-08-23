import React from "react";
import type { Metadata } from "next";
import { body } from "../theme/fonts";
import "../theme/theme.css";
import "../theme/global.css";

/* eslint-disable @typescript-eslint/quotes */
export const metadata: Metadata = {
  title: "Worbik",
  description: "Word Puzzle Mini-Game",
  creator: "Drake Costa",
  authors: [{ name: "Drake Costa", url: "https://saeris.gg" }],
  manifest: "/manifest.json",
  themeColor: "#ffffff",
  openGraph: {
    title: "Worbik",
    description: "Word Puzzle Mini-Game",
    url: "https://worbik.saeris.io",
    siteName: "Worbik",
    images: [
      {
        url: "/share-card.webp",
        width: 1200,
        height: 628
      }
    ],
    locale: "en-US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Worbik",
    description: "Word Puzzle Mini-Game",
    creator: "@saeris",
    images: ["/share-card.webp"]
  },
  icons: {
    shortcut: "/favicon.ico",
    apple: [
      { url: "/logo192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo512.png", sizes: "512x512", type: "image/png" }
    ]
  },
  appleWebApp: {
    title: "Worbik",
    statusBarStyle: "black-translucent"
  }
};
/* eslint-enable @typescript-eslint/quotes */

const RootLayout: React.FC<{ readonly children: React.ReactNode }> = ({
  children
}) => (
  <html lang="en" suppressHydrationWarning>
    <head />
    <body className={body.variable}>{children}</body>
  </html>
);

export default RootLayout;
