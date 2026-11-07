import { fileURLToPath } from "node:url";
import { fmt, lint, mergeLint, react } from "@saeris/configs";
import { voidMarkdown } from "@void/md/plugin";
import { voidReact } from "@void/react/plugin";
import {
  configDefaults,
  defineConfig,
  type TestProjectInlineConfiguration
} from "vite-plus";
import { playwright } from "vite-plus/test/browser/providers/playwright";
import { voidPlugin } from "void";

/** What runs anywhere: the game's rules, the server, and everything else that has no use for a page */
const nodeProject: TestProjectInlineConfiguration = {
  extends: true,
  test: {
    name: `node`,
    include: [`src/**/*.spec.{ts,tsx}`],
    exclude: [...configDefaults.exclude, `src/**/*.browser.spec.{ts,tsx}`],
    environment: `node`,
    setupFiles: [`src/test/setup.node.ts`]
  }
};

/** What needs a page, which gets a real one, with the network stood in for by a service worker */
const browserProject: TestProjectInlineConfiguration = {
  extends: true,
  // Only for the service worker, which has to be served from the root and must never reach production
  publicDir: `src/test/public`,
  // Found partway through a run otherwise, which makes Vite reload the page that the tests are on
  optimizeDeps: { include: [`hono/http-exception`] },
  test: {
    name: `browser`,
    include: [`src/**/*.browser.spec.{ts,tsx}`],
    exclude: [...configDefaults.exclude],
    setupFiles: [`src/test/setup.browser.ts`],
    browser: {
      enabled: true,
      // Everything that moves respects this, which spares the tests from waiting on every dialog to slide in
      provider: playwright({ contextOptions: { reducedMotion: `reduce` } }),
      headless: true,
      screenshotFailures: false,
      instances: [{ browser: `chromium` }]
    }
  }
};

export default defineConfig({
  // Tests run outside of Void, where booting the Workers runtime that backs its plugin fails
  plugins: process.env.VITEST
    ? []
    : [voidPlugin(), voidReact(), voidMarkdown()],
  // Which also leaves nothing to fill in what Void provides from the environment
  resolve: process.env.VITEST
    ? {
        alias: {
          "void/env": fileURLToPath(new URL(`src/test/env.ts`, import.meta.url))
        }
      }
    : undefined,
  lint: mergeLint(lint, react, {
    overrides: [
      {
        // Void's file-based conventions rely on default exports
        files: [`src/pages/**`, `src/env.ts`],
        rules: { "import/no-default-export": `off` }
      },
      {
        // These assert by way of helpers that wait, which the rule can't see into
        files: [`src/**/*.browser.spec.{ts,tsx}`],
        rules: {
          "vitest/expect-expect": [
            `error`,
            {
              assertFunctionNames: [
                `expect`,
                `neverHappens`,
                `says`,
                `settled`,
                `solve`,
                `won`
              ]
            }
          ]
        }
      }
    ]
  }),
  fmt: {
    ...fmt,
    ignorePatterns: [
      ...(fmt.ignorePatterns ?? []),
      `void.lock.json`,
      `src/test/public/**`
    ]
  },
  server: {
    // Signing in sends a player back to where they came from, and the protocol won't send anyone to `localhost`
    host: `127.0.0.1`
  },
  test: {
    globals: true,
    watch: false,
    // Nothing that one test stands in for is left behind for the next
    mockReset: true,
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    projects: [nodeProject, browserProject]
  }
});
