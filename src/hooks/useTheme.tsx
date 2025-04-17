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

export const useTheme = () => {
  const { targetDocument } = useFluent();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const hasDarkMode = targetDocument?.body.classList.contains("isDarkMode") ?? true;
    return hasDarkMode;
  });

  useEffect(() => {
    if (!targetDocument) return;

    const checkTheme = () => {
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
  }, [targetDocument]);

  return {
    isDarkMode
  };
};
