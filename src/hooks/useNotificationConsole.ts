import create, { UseStore } from "zustand";
import { ConsoleData } from "../Explorer/Menus/NotificationConsole/NotificationConsoleComponent";

export interface NotificationConsoleState {
  isExpanded: boolean;
  inProgressConsoleDataIdToBeDeleted: string;
  consoleData: ConsoleData;
  expandConsole: () => void;
  // TODO Remove this method. Add a `closeConsole` method instead
  setIsExpanded: (isExpanded: boolean) => void;
  // TODO These two methods badly need a refactor. Not very react friendly.
  setNotificationConsoleData: (consoleData: ConsoleData) => void;
  setInProgressConsoleDataIdToBeDeleted: (id: string) => void;
}

export const useNotificationConsole: UseStore<NotificationConsoleState> = create((set) => ({
  isExpanded: false,
  consoleData: undefined,
  inProgressConsoleDataIdToBeDeleted: "",
  expandConsole: () => set((state) => ({ ...state, isExpanded: true })),
  setIsExpanded: (isExpanded) => set((state) => ({ ...state, isExpanded })),
  setNotificationConsoleData: (consoleData: ConsoleData) => set((state) => ({ ...state, consoleData })),
  setInProgressConsoleDataIdToBeDeleted: (id: string) =>
    set((state) => ({ ...state, inProgressConsoleDataIdToBeDeleted: id })),
}));
