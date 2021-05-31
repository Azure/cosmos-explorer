import create, { UseStore } from "zustand";

export interface NotificationConsoleState {
  isExpanded: boolean;
  expandConsole: () => void;
  // TODO Remove this method. Add a `closeConsole` method instead
  setIsExpanded: (isExpanded: boolean) => void;
}

export const useNotificationConsole: UseStore<NotificationConsoleState> = create((set) => ({
  isExpanded: false,
  expandConsole: () => set((state) => ({ ...state, isExpanded: true })),
  setIsExpanded: (isExpanded) => set((state) => ({ ...state, isExpanded })),
}));
