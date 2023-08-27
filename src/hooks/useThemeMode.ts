import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { useMediaQuery, useUpdateEffect } from "usehooks-ts";
import { useLocalStorage } from "./useLocalStorage";

const COLOR_SCHEME_QUERY = `(prefers-color-scheme: dark)`;

const modes = [`system`, `light`, `dark`] as const;
type ThemeMode = (typeof modes)[number];

interface UseThemeModeReturn {
  modes: typeof modes;
  isDarkMode: boolean;
  themeMode: ThemeMode;
  setThemeMode: Dispatch<SetStateAction<ThemeMode>>;
  toggleThemeMode: () => void;
}

export const useThemeMode = (): UseThemeModeReturn => {
  const isDarkOS = useMediaQuery(COLOR_SCHEME_QUERY);
  const [mode, setMode] = useLocalStorage<ThemeMode>(`themeMode`, `system`);
  const [darkMode, setDarkMode] = useState<boolean>(isDarkOS);

  useUpdateEffect(() => {
    if (mode === `system`) {
      setDarkMode(isDarkOS);
    }
  }, [isDarkOS]);

  useEffect(() => {
    switch (mode) {
      case `light`:
        setDarkMode(false);
        break;
      case `dark`:
        setDarkMode(true);
        break;
      default:
        setDarkMode(isDarkOS);
    }
  }, [mode, isDarkOS]);

  useEffect(() => {
    if (typeof document === `undefined`) return;
    document.documentElement.classList.toggle(`dark`, darkMode);
  }, [darkMode]);

  const toggleTernaryDarkMode = (): void => {
    const toggleDict: Record<ThemeMode, ThemeMode> = {
      light: `system`,
      system: `dark`,
      dark: `light`
    };
    setMode((prevMode) => toggleDict[prevMode]);
  };

  return {
    modes,
    isDarkMode: darkMode,
    themeMode: mode,
    setThemeMode: setMode,
    toggleThemeMode: toggleTernaryDarkMode
  };
};
