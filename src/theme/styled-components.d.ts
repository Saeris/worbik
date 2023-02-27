import type { CSSProp } from "styled-components";
import type { Theme } from "./theme";

declare module "styled-components" {
  export interface DefaultTheme extends Theme {}
}

declare module "react" {
  interface DOMAttributes<T> {
    css?: CSSProp;
  }
}
