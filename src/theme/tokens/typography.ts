import "@fontsource/noto-sans/latin-300.css";
import "@fontsource/noto-sans/latin-400.css";
import "@fontsource/noto-sans/latin-700.css";

export const fonts = {
  body: [`Noto Sans`, `-apple-system`, `Helvetica`, `Arial`, `sans-serif`].join(
    `, `
  )
} as const;

export const sizes = {
  title: `3.95rem`,
  subtitle: `2.65rem`,
  header: `2.1rem`,
  label: `1.8rem`,
  body: `1.6rem`,
  small: `1.4rem`,
  tiny: `1.2rem`
} as const;

export const weights = {
  extrabold: 800,
  bold: 700,
  semibold: 600,
  medium: 500,
  regular: 400,
  light: 300,
  extralight: 200,
  thin: 100
} as const;
