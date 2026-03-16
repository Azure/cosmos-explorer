import { Link, Text } from "@fluentui/react";
import * as React from "react";
import MoonIcon from "../../../../images/MoonIcon.svg";
import SunIcon from "../../../../images/SunIcon.svg";
import { useThemeStore } from "../../../hooks/useTheme";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";

const PORTAL_SETTINGS_URL = "https://learn.microsoft.com/en-us/azure/azure-portal/set-preferences";

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
      ariaLabel: "Dark Mode is managed in Azure Portal Settings",
      tooltipText: undefined,
      tooltipContent: React.createElement(
        "div",
        { style: { padding: "4px 0" } },
        React.createElement(Text, { block: true, variant: "small" }, "Dark Mode is managed in Azure Portal Settings"),
        React.createElement(
          Link,
          {
            href: PORTAL_SETTINGS_URL,
            target: "_blank",
            rel: "noopener noreferrer",
            style: { display: "inline-block", marginTop: "4px", fontSize: "12px" },
          },
          "Open settings",
        ),
      ),
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
