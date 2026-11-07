import { defineConfig } from "void/config";

export default defineConfig({
  sourceDir: `src`,
  head: {
    title: `Worbik`,
    htmlAttrs: { lang: `en` },
    meta: [
      { charset: `utf-8` },
      {
        name: `viewport`,
        // Lets the page reach the edges of a phone's screen, where it keeps clear of the notch itself
        content: `width=device-width, initial-scale=1, viewport-fit=cover`
      },
      { name: `description`, content: `Word Puzzle Mini-Game` },
      { name: `author`, content: `Drake Costa` },
      { name: `creator`, content: `Drake Costa` },
      { name: `color-scheme`, content: `light dark` },
      // Set to the dark theme's color when that's what is in use, by the script below
      { name: `theme-color`, content: `#fafbff` },
      // Opens the game in a window of its own when it's added to a phone's home screen
      { name: `mobile-web-app-capable`, content: `yes` },
      { name: `apple-mobile-web-app-capable`, content: `yes` },
      { name: `apple-mobile-web-app-title`, content: `Worbik` },
      // The alternative, `black-translucent`, draws white text over the page, which can't be read on the light theme
      { name: `apple-mobile-web-app-status-bar-style`, content: `default` },
      { property: `og:title`, content: `Worbik` },
      { property: `og:description`, content: `Word Puzzle Mini-Game` },
      { property: `og:url`, content: `https://worbik.com` },
      { property: `og:site_name`, content: `Worbik` },
      { property: `og:locale`, content: `en-US` },
      { property: `og:type`, content: `website` },
      // A full address, as whatever reads this is reading it from somewhere else
      { property: `og:image`, content: `https://worbik.com/share-card.png` },
      { property: `og:image:type`, content: `image/png` },
      { property: `og:image:width`, content: `1200` },
      { property: `og:image:height`, content: `630` },
      {
        property: `og:image:alt`,
        content: `The letters of Worbik on solved tiles, and an invitation to play`
      },
      { name: `twitter:card`, content: `summary_large_image` },
      { name: `twitter:title`, content: `Worbik` },
      { name: `twitter:description`, content: `Word Puzzle Mini-Game` },
      { name: `twitter:creator`, content: `@saeris` },
      { name: `twitter:image`, content: `https://worbik.com/share-card.png` }
    ],
    link: [
      { rel: `manifest`, href: `/manifest.json` },
      { rel: `icon`, href: `/favicon.ico`, sizes: `16x16 32x32 48x48` },
      {
        rel: `apple-touch-icon`,
        href: `/apple-touch-icon.png`,
        sizes: `180x180`
      }
    ],
    script: [
      {
        // Signing in can't return a player to `localhost`, so during development the game is always played at the address that it can
        innerHTML: `if(location.hostname==="localhost")location.replace(location.href.replace("//localhost","//127.0.0.1"))`
      },
      {
        // Applies the color scheme chosen in the settings before first paint, to avoid a flash of the wrong theme, and colors the phone's status bar to match
        innerHTML: `let t;try{t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch{}if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.querySelector('meta[name="theme-color"]').content="#131418"`
      }
    ]
  },
  worker: {
    compatibility_date: `2026-02-24`
  },
  cloudflare: {
    name: `worbik`
  }
});
