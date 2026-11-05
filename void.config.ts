import { defineConfig } from "void/config";

export default defineConfig({
  sourceDir: `src`,
  head: {
    title: `Worbik`,
    htmlAttrs: { lang: `en` },
    meta: [
      { charset: `utf-8` },
      { name: `viewport`, content: `width=device-width, initial-scale=1` },
      { name: `description`, content: `Word Puzzle Mini-Game` },
      { name: `author`, content: `Drake Costa` },
      { name: `creator`, content: `Drake Costa` },
      { name: `color-scheme`, content: `light dark` },
      { name: `theme-color`, content: `#ffffff` },
      { name: `apple-mobile-web-app-title`, content: `Worbik` },
      {
        name: `apple-mobile-web-app-status-bar-style`,
        content: `black-translucent`
      },
      { property: `og:title`, content: `Worbik` },
      { property: `og:description`, content: `Word Puzzle Mini-Game` },
      { property: `og:url`, content: `https://worbik.saeris.io` },
      { property: `og:site_name`, content: `Worbik` },
      { property: `og:locale`, content: `en-US` },
      { property: `og:type`, content: `website` },
      { property: `og:image`, content: `/share-card.webp` },
      { property: `og:image:width`, content: `1200` },
      { property: `og:image:height`, content: `628` },
      { name: `twitter:card`, content: `summary_large_image` },
      { name: `twitter:title`, content: `Worbik` },
      { name: `twitter:description`, content: `Word Puzzle Mini-Game` },
      { name: `twitter:creator`, content: `@saeris` },
      { name: `twitter:image`, content: `/share-card.webp` }
    ],
    link: [
      { rel: `manifest`, href: `/manifest.json` },
      { rel: `shortcut icon`, href: `/favicon.ico` },
      {
        rel: `apple-touch-icon`,
        href: `/logo192.png`,
        sizes: `192x192`,
        type: `image/png`
      },
      {
        rel: `apple-touch-icon`,
        href: `/logo512.png`,
        sizes: `512x512`,
        type: `image/png`
      }
    ],
    script: [
      {
        // Applies the color scheme chosen in the settings before first paint, to avoid a flash of the wrong theme
        innerHTML: `try{const t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch{}`
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
