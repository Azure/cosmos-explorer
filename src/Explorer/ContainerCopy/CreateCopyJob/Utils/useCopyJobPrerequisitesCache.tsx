import create from "zustand";

interface CopyJobPrerequisitesCacheState {
    validationCache: Map<string, boolean>;
    setValidationCache: (cache: Map<string, boolean>) => void;
}

export const useCopyJobPrerequisitesCache = create<CopyJobPrerequisitesCacheState>((set) => ({
    validationCache: new Map<string, boolean>(),
    setValidationCache: (cache) => set({ validationCache: cache })
}));