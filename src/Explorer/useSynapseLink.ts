import create, { UseStore } from "zustand";

interface SynapseLinkState {
  isSynapseLinkUpdating: boolean;
  setIsSynapseLinkUpdating: (isSynapseLinkUpdating: boolean) => void;
}

export const useSynapseLink: UseStore<SynapseLinkState> = create((set) => ({
  isSynapseLinkUpdating: false,
  setIsSynapseLinkUpdating: (isSynapseLinkUpdating: boolean) => set({ isSynapseLinkUpdating }),
}));
