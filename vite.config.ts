import { fmt, lint, mergeLint, react } from "@saeris/configs";
import { voidReact } from "@void/react/plugin";
import { defineConfig } from "vite-plus";
import { voidPlugin } from "void";

export default defineConfig({
  // Unit tests run in plain Node, where booting the Workers runtime that backs Void's plugin fails
  plugins: process.env.VITEST ? [] : [voidPlugin(), voidReact()],
  lint: mergeLint(lint, react, {
    overrides: [
      {
        // Invoker Commands aren't yet known to the React plugin
        files: [`**/*.tsx`],
        rules: {
          "react/no-unknown-property": [
            `error`,
            { ignore: [`command`, `commandfor`] }
          ]
        }
      },
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
  test: {
    name: `worbik`,
    globals: true,
    watch: false
  }
});
