import create, { UseStore } from "zustand";

export interface QueryCopilotSidebarState {
  wasCopilotUsed: boolean;
  showWelcomeSidebar: boolean;
  showCopilotSidebar: boolean;
  userInput: string;
  chatMessages: string[];

  setWasCopilotUsed: (wasCopilotUsed: boolean) => void;
  setShowWelcomeSidebar: (showWelcomeSidebar: boolean) => void;
  setShowCopilotSidebar: (showCopilotSidebar: boolean) => void;
  setUserInput: (userInput: string) => void;
  setChatMessages: (chatMessages: string[]) => void;
  resetQueryCopilotSidebarStates: () => void;
}

type QueryCopilotSidebarStore = UseStore<QueryCopilotSidebarState>;

export const useQueryCopilotSidebar: QueryCopilotSidebarStore = create((set) => ({
  wasCopilotUsed: false,
  showWelcomeSidebar: true,
  showCopilotSidebar: false,
  userInput: "",
  chatMessages: [],

  setWasCopilotUsed: (wasCopilotUsed) => set({ wasCopilotUsed }),
  setShowWelcomeSidebar: (showWelcomeSidebar) => set({ showWelcomeSidebar }),
  setShowCopilotSidebar: (showCopilotSidebar) => set({ showCopilotSidebar }),
  setUserInput: (userInput) => set({ userInput }),
  setChatMessages: (chatMessages) => set({ chatMessages }),
  resetQueryCopilotSidebarStates() {
    set((state) => ({
      ...state,
      wasCopilotUsed: false,
      showCopilotSidebar: false,
      userInput: "",
      chatMessages: [],
    }));
  },
}));
