import create, { UseStore } from "zustand";

export interface QueryCopilotSidecarState {
  showWelcomeSidecar: boolean;
  showCopilotSidecar: boolean;

  setShowWelcomeSidecar: (showWelcomeSidecar: boolean) => void;
  setShowCopilotSidecar: (showCopilotSidecar: boolean) => void;
}

type QueryCopilotSidecarStore = UseStore<QueryCopilotSidecarState>;

export const useQueryCopilotSidecar: QueryCopilotSidecarStore = create((set) => ({
  showWelcomeSidecar: true,
  showCopilotSidecar: false,

  setShowWelcomeSidecar(showWelcomeSidecar) {
    set({ showWelcomeSidecar });
  },
  setShowCopilotSidecar(showCopilotSidecar) {
    set({ showCopilotSidecar });
  },
}));
