import create, { UseStore } from "zustand";

export interface NotebookSnapshotHooks {
  snapshot: string;
  error: string;
  setSnapshot: (imageSrc: string) => void;
  setError: (error: string) => void;
}

export const useNotebookSnapshotStore: UseStore<NotebookSnapshotHooks> = create((set) => ({
  snapshot: "",
  error: "",
  setSnapshot: (imageSrc: string) => set((state) => ({ ...state, snapshot: imageSrc })),
  setError: (error: string) => set((state) => ({ ...state, error })),
}));
