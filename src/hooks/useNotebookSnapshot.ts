import { useState } from "react";

export interface NotebookSnapshotHooks {
  snapshot: string;
  error: string;
  setSnapshot: (imageSrc: string) => void;
  setError: (error: string) => void;
}

export const useNotebookSnapshot = (): NotebookSnapshotHooks => {
  const [snapshot, setSnapshot] = useState<string>();
  const [error, setError] = useState<string>();

  return { snapshot, error, setSnapshot, setError };
};
