import { sendMessage } from "Common/MessageHandler";
import { MessageTypes } from "Contracts/MessageTypes";
import create from "zustand";

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
    // Only process portal messages
    if (
      event.data &&
      typeof event.data === "object" &&
      event.data.signature === "pcIframe" &&
      event.data.data &&
      event.data.data.type === "UpdateTheme" &&
      event.data.data.theme &&
      event.data.data.theme.mode !== undefined
    ) {
      const themeMode = event.data.data.theme.mode;
      const isDark = themeMode === 1;

      useThemeStore.setState({
        isDarkMode: isDark,
        themeMode: themeMode,
      });

      if (isDark) {
        document.body.classList.add("isDarkMode");
      } else {
        document.body.classList.remove("isDarkMode");
      }
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
