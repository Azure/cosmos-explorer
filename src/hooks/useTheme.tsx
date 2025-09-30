import { useFluent } from "@fluentui/react-components";
import React, { createContext, FC, ReactNode, useEffect, useState } from "react";
import create from "zustand";

interface ThemeSettings {
  mode: number;
}

interface FxsTheme {
  (): ThemeSettings;
  subscribe: (context: null, callback: (update: ThemeSettings) => void) => void;
}

interface MsPortalFxSettings {
  "fxs-theme"?: FxsTheme;
  [key: string]: unknown;
}

declare global {
  interface Window {
    MsPortalFx?: {
      Services: {
        getSettings: () => Promise<MsPortalFxSettings>;
      };
    };
  }
}

interface ThemeContextType {
  theme: "Light" | "Dark";
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  theme: "Light" | "Dark";
}

export const CustomThemeProvider: FC<ThemeProviderProps> = ({ children, theme }) => {
  const isDarkMode = theme === "Dark";
  return <ThemeContext.Provider value={{ theme, isDarkMode }}>{children}</ThemeContext.Provider>;
};

export interface ThemeStore {
  isDarkMode: boolean;
  themeMode: number;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  isDarkMode: false,
  themeMode: 0,
  toggleTheme: () =>
    set((state) => {
      const newIsDarkMode = !state.isDarkMode;
      const newThemeMode = newIsDarkMode ? 1 : 0;

      if (newIsDarkMode) {
        document.body.classList.add("isDarkMode");
      } else {
        document.body.classList.remove("isDarkMode");
      }

      // Save to localStorage for persistence
      localStorage.setItem("cosmos-explorer-theme", newIsDarkMode ? "dark" : "light");
      localStorage.setItem("cosmos-explorer-theme-mode", String(newThemeMode));

      return {
        isDarkMode: newIsDarkMode,
        themeMode: newThemeMode,
      };
    }),
}));

// Initialize the theme from localStorage or MsPortalFx if available
if (typeof window !== "undefined") {
  // Try to initialize from MsPortalFx.Services if available
  try {
    if (window.MsPortalFx && window.MsPortalFx.Services) {
      window.MsPortalFx.Services.getSettings()
        .then((settings: MsPortalFxSettings) => {
          if (settings["fxs-theme"]) {
            const theme = settings["fxs-theme"];

            // Initial theme value
            const initialTheme = theme();
            if (initialTheme && typeof initialTheme.mode === "number") {
              const isDark = initialTheme.mode === 1;
              useThemeStore.setState({
                isDarkMode: isDark,
                themeMode: initialTheme.mode,
              });

              if (isDark) {
                document.body.classList.add("isDarkMode");
              } else {
                document.body.classList.remove("isDarkMode");
              }
            }

            theme.subscribe(null, (themeUpdate: ThemeSettings) => {
              if (themeUpdate && typeof themeUpdate.mode === "number") {
                const isDark = themeUpdate.mode === 1;
                useThemeStore.setState({
                  isDarkMode: isDark,
                  themeMode: themeUpdate.mode,
                });

                if (isDark) {
                  document.body.classList.add("isDarkMode");
                } else {
                  document.body.classList.remove("isDarkMode");
                }
              }
            });
          }
        })
        .catch(() => {
          fallbackToLocalStorage();
        });
    } else {
      fallbackToLocalStorage();
    }
  } catch (error) {
    fallbackToLocalStorage();
  }
}

function fallbackToLocalStorage() {
  const savedTheme = localStorage.getItem("cosmos-explorer-theme");
  const savedThemeMode = localStorage.getItem("cosmos-explorer-theme-mode");

  if (savedTheme || savedThemeMode) {
    const isDark = savedTheme === "dark" || savedThemeMode === "1";
    const themeMode = isDark ? 1 : 0;

    useThemeStore.setState({
      isDarkMode: isDark,
      themeMode: themeMode,
    });

    if (isDark) {
      document.body.classList.add("isDarkMode");
    }
  }
}

// Dynamic exports that use the theme store
export const isDarkMode = () => useThemeStore.getState().isDarkMode;

export const useMonacoTheme = () => {
  const { isDarkMode } = useThemeStore();
  return isDarkMode ? "vs-dark" : "vs";
};

export const monacoTheme = () => (useThemeStore.getState().isDarkMode ? "vs-dark" : "vs");

export const useTheme = () => {
  const { targetDocument } = useFluent();
  const context = React.useContext(ThemeContext);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (context) {
      return context.isDarkMode;
    }
    return targetDocument?.body.classList.contains("isDarkMode") ?? true;
  });

  useEffect(() => {
    if (!targetDocument) {
      return undefined;
    }
    const checkTheme = () => {
      if (context) {
        setIsDarkMode(context.isDarkMode);
        return;
      }
      const hasDarkMode = targetDocument.body.classList.contains("isDarkMode");
      setIsDarkMode(hasDarkMode);
    };

    checkTheme();

    const observer = new MutationObserver(() => {
      checkTheme();
    });
    observer.observe(targetDocument.body, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, [targetDocument, context]);

  return {
    isDarkMode,
  };
};
