import * as React from "react";
import MoonBlueIcon from "../../../../images/moon-blue.svg";
import SunBlueIcon from "../../../../images/sun-blue.svg";
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
    iconSrc: darkMode ? SunBlueIcon : MoonBlueIcon,
    iconAlt: "Theme Toggle",
    onCommandClick: useThemeStore.getState().toggleTheme,
    commandButtonLabel: undefined,
    ariaLabel: tooltipText,
    tooltipText: tooltipText,
    hasPopup: false,
    disabled: false,
  };
};
