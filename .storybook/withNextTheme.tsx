import React from "react";
import { Decorator } from "@storybook/react";
import { DecoratorHelpers } from "@storybook/addon-themes";
import { ThemeProvider } from "next-themes";

const { initializeThemeState, pluckThemeFromContext, useThemeParameters } =
  DecoratorHelpers;

export interface WithNextThemeProps {
  themes: Record<string, string | undefined>;
  defaultTheme: string;
}

export const withNextTheme = ({
  themes,
  defaultTheme
}: WithNextThemeProps): Decorator => {
  initializeThemeState(Object.keys(themes), defaultTheme);

  return (Story, context) => {
    // @ts-expect-error types for pluckThemeFromContext don't allow for
    // opting into React for the Renderer
    const selectedTheme = pluckThemeFromContext(context);
    const { themeOverride } = useThemeParameters();

    const selected = themeOverride || selectedTheme || defaultTheme;

    return (
      <ThemeProvider
        attribute="class"
        forcedTheme={selected === `dark` ? `dark` : undefined}
      >
        <Story />
      </ThemeProvider>
    );
  };
};
