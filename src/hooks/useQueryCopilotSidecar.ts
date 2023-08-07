import create, { UseStore } from "zustand";

export interface QueryCopilotSidecarState {
  wasCopilotUsed: boolean;
  showWelcomeSidecar: boolean;
  showCopilotSidecar: boolean;
  userInput: string;
  chatMessages: string[];

  setWasCopilotUsed: (wasCopilotUsed: boolean) => void;
  setShowWelcomeSidecar: (showWelcomeSidecar: boolean) => void;
  setShowCopilotSidecar: (showCopilotSidecar: boolean) => void;
  setUserInput: (userInput: string) => void;
  setChatMessages: (chatMessages: string[]) => void;
  resetQueryCopilotSidecarStates: () => void;
}

type QueryCopilotSidecarStore = UseStore<QueryCopilotSidecarState>;

export const useQueryCopilotSidecar: QueryCopilotSidecarStore = create((set) => ({
  wasCopilotUsed: false,
  showWelcomeSidecar: true,
  showCopilotSidecar: false,
  userInput: "",
  chatMessages: [],

  setWasCopilotUsed(wasCopilotUsed) {
    set({ wasCopilotUsed });
  },
  setShowWelcomeSidecar(showWelcomeSidecar) {
    set({ showWelcomeSidecar });
  },
  setShowCopilotSidecar(showCopilotSidecar) {
    set({ showCopilotSidecar });
  },
  setUserInput(userInput) {
    set({ userInput });
  },
  setChatMessages(chatMessages) {
    set({ chatMessages });
  },

  resetQueryCopilotSidecarStates() {
    set((state) => ({
      ...state,
      wasCopilotUsed: false,
      showCopilotSidecar: false,
      userInput: "",
      chatMessages: [],
    }));
  },
}));
