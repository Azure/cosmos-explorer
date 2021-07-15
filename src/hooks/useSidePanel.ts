import create, { UseStore } from "zustand";

export interface SidePanelState {
  isOpen: boolean;
  panelContent?: JSX.Element;
  headerText?: string;
  openSidePanel: (headerText: string, panelContent: JSX.Element, onClose?: () => void) => void;
  closeSidePanel: () => void;
}

export const useSidePanel: UseStore<SidePanelState> = create((set) => ({
  isOpen: false,
  openSidePanel: (headerText, panelContent) => set((state) => ({ ...state, headerText, panelContent, isOpen: true })),
  closeSidePanel: () => set((state) => ({ ...state, isOpen: false })),
}));
