import { createGlobalStyle, css } from "styled-components";
import { theme } from "./theme";
import { reset } from "./reset";

export const Global = createGlobalStyle(
  () => css`
    ${reset}

    body {
      background-color: #fefefe;
      font-family: ${theme.fonts.body};
      font-size: 1.4rem;
    }

    [data-backdrop] {
      background-color: rgb(0 0 0 / 15%);
    }

    #__next {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
    }
  `
);
