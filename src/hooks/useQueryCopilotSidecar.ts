import create, { UseStore } from "zustand";

interface QueryCopilotSidecarState {
  showWelcomeSidecar: boolean;

  setShowWelcomeSidecar: (showWelcomeSidecar: boolean) => void;
}

type QueryCopilotSidecarStore = UseStore<QueryCopilotSidecarState>;

export const useQueryCopilotSidecar: QueryCopilotSidecarStore = create((set) => ({
  showWelcomeSidecar: true,

  setShowWelcomeSidecar(showWelcomeSidecar) {
    set({ showWelcomeSidecar });
  },
}));
