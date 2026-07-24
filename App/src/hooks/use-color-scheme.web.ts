import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme, ColorSchemeName } from 'react-native';

let currentTheme: ColorSchemeName | null = 'dark';
const listeners = new Set<(theme: ColorSchemeName | null) => void>();

export const getThemeMode = (): ColorSchemeName | null => {
  return currentTheme;
};

export const setThemeMode = (mode: ColorSchemeName | null) => {
  currentTheme = mode;
  listeners.forEach((listener) => listener(mode));
};

export function useColorScheme(): ColorSchemeName {
  const [hasHydrated, setHasHydrated] = useState(false);
  const colorScheme = useRNColorScheme();
  const [scheme, setScheme] = useState<ColorSchemeName>(
    currentTheme || colorScheme || 'dark'
  );

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setHasHydrated(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  useEffect(() => {
    let active = true;
    if (!currentTheme) {
      Promise.resolve().then(() => {
        if (active) setScheme(colorScheme);
      });
    }
    return () => {
      active = false;
    };
  }, [colorScheme]);

  useEffect(() => {
    const handleThemeChange = (newTheme: ColorSchemeName | null) => {
      setScheme(newTheme || colorScheme);
    };

    listeners.add(handleThemeChange);
    return () => {
      listeners.delete(handleThemeChange);
    };
  }, [colorScheme]);

  if (hasHydrated) {
    return scheme;
  }

  return 'dark'; // Default to dark mode for Drivix premium theme
}

