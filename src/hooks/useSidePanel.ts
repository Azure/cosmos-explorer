import create, { UseStore } from "zustand";

export interface SidePanelState {
  isOpen: boolean;
  panelWidth: string;
  panelContent?: JSX.Element;
  headerText?: string;
  openSidePanel: (headerText: string, panelContent: JSX.Element, panelWidth?: string, onClose?: () => void) => void;
  closeSidePanel: () => void;
  getRef?: React.RefObject<HTMLElement>; // Optional ref for focusing the last element.
}
export const useSidePanel: UseStore<SidePanelState> = create((set) => ({
  isOpen: false,
  panelWidth: "440px",
  openSidePanel: (headerText, panelContent, panelWidth = "440px") =>
    set((state) => ({ ...state, headerText, panelContent, panelWidth, isOpen: true })),
  closeSidePanel: () => {
    const lastFocusedElement = useSidePanel.getState().getRef;
    set((state) => ({ ...state, isOpen: false }));
    const timeoutId = setTimeout(() => {
      lastFocusedElement?.current?.focus();
      set({ getRef: undefined });
    }, 300);
    return () => clearTimeout(timeoutId);
  },
}));
