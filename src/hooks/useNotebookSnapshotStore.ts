import { create } from "zustand";

export interface NotebookSnapshotHooks {
  snapshot?: string;
  error?: string;
  setSnapshot: (imageSrc: string) => void;
  setError: (error: string) => void;
}

export const useNotebookSnapshotStore = create<NotebookSnapshotHooks>((set) => ({
  snapshot: undefined,
  error: undefined,
  setSnapshot: (imageSrc: string) => set((state) => ({ ...state, snapshot: imageSrc })),
  setError: (error: string) => set((state) => ({ ...state, error })),
}));
