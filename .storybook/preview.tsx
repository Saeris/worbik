import React from "react";
import type { ArgTypes, Decorator, Loader, Parameters } from "@storybook/react";
import { body } from "../src/theme/fonts";
import "../src/theme/global.css";
import "../src/theme/theme.css";
import { withNextTheme } from "./withNextTheme";
import { initialize, mswLoader } from "msw-storybook-addon";

// Initialize MSW
initialize();

export const argTypes: ArgTypes = {
  as: { control: false, table: { disable: true } },
  store: { control: false, table: { disable: true } },
  wrapElement: { control: false, table: { disable: true } },
  render: { control: false, table: { disable: true } },
  setValue: { control: false, table: { disable: true } },
  className: { control: false, table: { disable: true } },
  ref: { control: false, table: { disable: true } }
};

export const parameters: Parameters = {
  nextjs: {
    appDirectory: true
  },
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    expanded: true,
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/
    },
    exclude: `(?:\b|')(as|wrapElement|render)(?:\b|')`
  }
};

export const loaders: Loader[] = [mswLoader];

export const decorators: Decorator[] = [
  withNextTheme({
    themes: {
      system: undefined,
      light: ``,
      dark: `dark`
    },
    defaultTheme: `system`
  }),
  (Story) => {
    document.body.classList.add(body.variable);
    return <Story />;
  }
];
