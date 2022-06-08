import React from "react";
import type { AppProps } from "next/app";
import { ThemeProvider } from "styled-components";
import { Global, theme } from "../theme";

const _app: React.FC<AppProps> = ({ Component, pageProps }) => (
  <ThemeProvider theme={theme}>
    <Global />
    <Component {...pageProps} />
  </ThemeProvider>
);

export default _app;
