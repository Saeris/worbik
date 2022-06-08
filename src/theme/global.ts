import { createGlobalStyle, css } from "styled-components";
import { extractCSSProps } from "./utils";
import { theme } from "./theme";
import { reset } from "./reset";

export const Global = createGlobalStyle(
  () => css`
    ${reset}
    ${extractCSSProps(theme)};

    body {
      font-family: ${theme.fonts.body};
      font-size: 1.4rem;
    }

    [data-backdrop] {
      background-color: rgb(0 0 0 / 10%);
    }

    #__next {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100vh;
    }
  `
);
