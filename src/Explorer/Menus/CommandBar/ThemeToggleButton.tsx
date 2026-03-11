import * as React from "react";
import MoonIcon from "../../../../images/MoonIcon.svg";
import SunIcon from "../../../../images/SunIcon.svg";
import { useThemeStore } from "../../../hooks/useTheme";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";

export const ThemeToggleButton = (isPortal?: boolean): CommandButtonComponentProps => {
  const [darkMode, setDarkMode] = React.useState(useThemeStore.getState().isDarkMode);

  React.useEffect(() => {
    const unsubscribe = useThemeStore.subscribe((state) => {
      setDarkMode(state.isDarkMode);
    });
    return unsubscribe;
  }, []);

  const tooltipText = darkMode ? "Switch to Light Theme" : "Switch to Dark Theme";

  if (isPortal) {
    return {
      iconSrc: darkMode ? SunIcon : MoonIcon,
      iconAlt: "Theme Toggle",
      onCommandClick: undefined,
      commandButtonLabel: undefined,
      ariaLabel: "Dark Mode is managed in Azure Portal Settings.\nOpen settings",
      tooltipText: "Dark Mode is managed in Azure Portal Settings.\nOpen settings",
      hasPopup: false,
      disabled: true,
    };
  }

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
