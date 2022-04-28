import React from "react";
import type { AppProps } from "next/app";
import { ClickToComponent } from "click-to-react-component";
import "../theme/styles.css";

const _app: React.FC<AppProps> = ({ Component, pageProps }) => (
  <>
    <ClickToComponent />
    <Component {...pageProps} />
  </>
);

export default _app;
