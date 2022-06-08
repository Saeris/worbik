import { breakpoints, colors, fonts, sizes, spacing, weights } from "./tokens";
import { media } from "./utils";

export const theme = Object.defineProperties(
  {
    colors,
    fonts,
    sizes,
    spacing,
    weights
  },
  {
    media: {
      value: media
    },
    breakpoints: {
      value: breakpoints
    }
  }
);

export type Theme = typeof theme;
