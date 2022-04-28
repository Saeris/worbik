import React from "react";
import type { AppProps } from "next/app";
import "../theme/styles.css";

const _app: React.FC<AppProps> = ({ Component, pageProps }) => (
  <>
    <Component {...pageProps} />
  </>
);

export default _app;
