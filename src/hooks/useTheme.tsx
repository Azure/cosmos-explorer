import { sendMessage } from "Common/MessageHandler";
import { MessageTypes } from "Contracts/MessageTypes";
import { shouldProcessMessage } from "Utils/MessageValidation";
import create from "zustand";

// Theme mode constants matching Portal's theme values
export const THEME_MODE_LIGHT = 0;
export const THEME_MODE_DARK = 1;

export interface ThemeStore {
  isDarkMode: boolean;
  themeMode: number;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  isDarkMode: false,
  themeMode: THEME_MODE_LIGHT,
  toggleTheme: () =>
    set((state) => {
      const newIsDarkMode = !state.isDarkMode;
      const newThemeMode = newIsDarkMode ? THEME_MODE_DARK : THEME_MODE_LIGHT;

      if (newIsDarkMode) {
        document.body.classList.add("isDarkMode");
      } else {
        document.body.classList.remove("isDarkMode");
      }
      sendMessage({
        type: MessageTypes.UpdateTheme,
        params: {
          theme: {
            mode: newThemeMode,
          },
        },
      });

      return {
        isDarkMode: newIsDarkMode,
        themeMode: newThemeMode,
      };
    }),
}));

// Portal theme communication
if (typeof window !== "undefined") {
  window.addEventListener("message", (event) => {
    if (
      !shouldProcessMessage(event) ||
      event.data.data.type !== MessageTypes.UpdateTheme ||
      !event.data.data.theme ||
      event.data.data.theme.mode === undefined
    ) {
      return;
    }

    const themeMode = event.data.data.theme.mode;
    const isDark = themeMode === THEME_MODE_DARK;

    useThemeStore.setState({
      isDarkMode: isDark,
      themeMode: themeMode,
    });

    if (isDark) {
      document.body.classList.add("isDarkMode");
    } else {
      document.body.classList.remove("isDarkMode");
    }
  });
}

// Exports
export const isDarkMode = () => useThemeStore.getState().isDarkMode;

export const useTheme = () => {
  const { isDarkMode } = useThemeStore();
  return { isDarkMode };
};

export const useMonacoTheme = () => {
  const { isDarkMode } = useThemeStore();
  return isDarkMode ? "vs-dark" : "vs";
};

export const monacoTheme = () => (useThemeStore.getState().isDarkMode ? "vs-dark" : "vs");
