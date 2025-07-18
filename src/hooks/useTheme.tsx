import { useFluent } from "@fluentui/react-components";
import React, { createContext, FC, ReactNode, useEffect, useState } from "react";

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
export const isDarkMode = true;
export const monacoTheme = isDarkMode ? "vs-dark" : "vs";

export const useTheme = () => {
  const { targetDocument } = useFluent();
  const context = React.useContext(ThemeContext);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    // First check if we're in a theme context
    if (context) {
      return context.isDarkMode;
    }
    // Fallback to checking body class
    return targetDocument?.body.classList.contains("isDarkMode") ?? true;
  });

  useEffect(() => {
    if (!targetDocument) return;

    const checkTheme = () => {
      // First check if we're in a theme context
      if (context) {
        setIsDarkMode(context.isDarkMode);
        return;
      }
      // Fallback to checking body class
      const hasDarkMode = targetDocument.body.classList.contains("isDarkMode");
      setIsDarkMode(hasDarkMode);
    };

    // Initial check
    checkTheme();

    // Create a MutationObserver to watch for class changes
    const observer = new MutationObserver((mutations) => {
      checkTheme();
    });
    observer.observe(targetDocument.body, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, [targetDocument, context]);

  return {
    isDarkMode,
  };
};
