import * as React from "react";
import MoonIcon from "../../../../images/MoonIcon.svg";
import SunIcon from "../../../../images/SunIcon.svg";
import { useThemeStore } from "../../../hooks/useTheme";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";

export const ThemeToggleButton = (): CommandButtonComponentProps => {
  const [darkMode, setDarkMode] = React.useState(useThemeStore.getState().isDarkMode);

  React.useEffect(() => {
    const unsubscribe = useThemeStore.subscribe((state) => {
      setDarkMode(state.isDarkMode);
    });
    return unsubscribe;
  }, []);

  const tooltipText = darkMode ? "Switch to Light Theme" : "Switch to Dark Theme";

  return {
    iconSrc: darkMode ? SunIcon : MoonIcon,
    iconAlt: "Theme Toggle",
    onCommandClick: useThemeStore.getState().toggleTheme,
    commandButtonLabel: undefined,
    ariaLabel: tooltipText,
    tooltipText: tooltipText,
    hasPopup: false,
    disabled: false,
  };
};
