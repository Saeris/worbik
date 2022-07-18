import React from "react";
import type { AppProps } from "next/app";
import { ThemeProvider } from "styled-components";
import Head from "next/head";
import { Global, theme } from "../theme";

const meta = {
  title: `Worbik`,
  description: `Word Puzzle Mini-Game`,
  locale: `en_US`,
  twitter: `@saeris`,
  image: `/share-card.webp`,
  color: `#ffffff`
};

const _app: React.FC<AppProps> = ({ Component, pageProps }) => (
  <ThemeProvider theme={theme}>
    <Head>
      <title>{meta.title}</title>
      <link rel="shortcut icon" href="/favicon.ico" />
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content={meta.color} />
      <meta name="description" content={meta.description} />
      <meta name="image" content={meta.image} />
      {/* OpenGraph */}
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:locale" content={meta.locale} />
      <meta property="og:image" content={meta.image} />
      <meta property="og:image:alt" content={meta.image} />
      {/* Twitter */}
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:creator" content={meta.twitter} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content={meta.image} />
      <meta name="twitter:image:alt" content={meta.title} />
      {/* iOS */}
      <link
        rel="apple-touch-icon"
        type="image/png"
        sizes="192x192"
        href="/logo192.png"
      />
      <meta
        name="apple-mobile-web-app-status-bar"
        content="black-translucent"
      />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />
      <meta
        name="viewport"
        content="viewport-fit=cover, width=device-width, initial-scale=1"
      />
    </Head>
    <Global />
    <Component {...pageProps} />
  </ThemeProvider>
);

export default _app;
