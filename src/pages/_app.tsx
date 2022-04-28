import React from "react";
import { AppProps } from "next/app";
import "../theme/styles.css";

const App: React.VFC<AppProps> = ({ Component, pageProps }) => (
  <Component {...pageProps} />
);

export default App;
