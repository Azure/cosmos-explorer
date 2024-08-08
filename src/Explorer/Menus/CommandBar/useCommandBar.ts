import { CommandButtonComponentProps } from "Explorer/Controls/CommandButton/CommandButtonComponent";
import create, { UseStore } from "zustand";

export interface CommandBarStore {
  contextButtons: CommandButtonComponentProps[];
  setContextButtons: (contextButtons: CommandButtonComponentProps[]) => void;
  isHidden: boolean;
  setIsHidden: (isHidden: boolean) => void;
}

export const useCommandBar: UseStore<CommandBarStore> = create((set) => ({
  contextButtons: [],
  setContextButtons: (contextButtons: CommandButtonComponentProps[]) => set((state) => ({ ...state, contextButtons })),
  isHidden: false,
  setIsHidden: (isHidden: boolean) => set((state) => ({ ...state, isHidden })),
}));
