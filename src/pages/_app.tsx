import React from "react";
import type { AppProps } from "next/app";
import { ThemeProvider } from "styled-components";
import Head from "next/head";
import { Global, theme } from "../theme";

const _app: React.FC<AppProps> = ({ Component, pageProps }) => (
  <ThemeProvider theme={theme}>
    <Head>
      <title>Worbik</title>
      <meta property="og:title" content="Worbik" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="white-translucent"
      />
      <meta
        name="viewport"
        content="viewport-fit=cover, user-scalable=no, width=device-width, initial-scale=1, maximum-scale=1"
      />
    </Head>
    <Global />
    <Component {...pageProps} />
  </ThemeProvider>
);

export default _app;
