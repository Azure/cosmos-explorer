import { FluentProvider, webDarkTheme, webLightTheme } from "@fluentui/react-components";
import React from "react";
import { ErrorBoundary } from "../Explorer/ErrorBoundary";
import { useThemeStore } from "../hooks/useTheme";
import App from "./App";

const Root: React.FC = () => {
  // Use React state to track isDarkMode and subscribe to changes
  const [isDarkMode, setIsDarkMode] = React.useState(useThemeStore.getState().isDarkMode);
  const currentTheme = isDarkMode ? webDarkTheme : webLightTheme;

  // Subscribe to theme changes
  React.useEffect(() => {
    return useThemeStore.subscribe((state) => {
      setIsDarkMode(state.isDarkMode);
    });
  }, []);

  return (
    <ErrorBoundary>
      <FluentProvider theme={currentTheme}>
        <App />
      </FluentProvider>
    </ErrorBoundary>
  );
};

export default Root;
