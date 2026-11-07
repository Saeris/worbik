import { fmt, lint, mergeLint, react } from "@saeris/configs";
import { voidMarkdown } from "@void/md/plugin";
import { voidReact } from "@void/react/plugin";
import { defineConfig } from "vite-plus";
import { voidPlugin } from "void";

export default defineConfig({
  // Unit tests run in plain Node, where booting the Workers runtime that backs Void's plugin fails
  plugins: process.env.VITEST
    ? []
    : [voidPlugin(), voidReact(), voidMarkdown()],
  lint: mergeLint(lint, react, {
    overrides: [
      {
        // Void's file-based conventions rely on default exports
        files: [`src/pages/**`, `src/env.ts`],
        rules: { "import/no-default-export": `off` }
      }
    ]
  }),
  fmt: {
    ...fmt,
    ignorePatterns: [...(fmt.ignorePatterns ?? []), `void.lock.json`]
  },
  server: {
    // Signing in sends a player back to where they came from, and the protocol won't send anyone to `localhost`
    host: `127.0.0.1`
  },
  test: {
    name: `worbik`,
    globals: true,
    watch: false
  }
});
