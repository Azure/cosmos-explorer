import { Collection } from "Contracts/ViewModels";
import create, { UseStore } from "zustand";

interface TeachingBubbleState {
  step: number;
  isSampleDBExpanded: boolean;
  isDocumentsTabOpened: boolean;
  sampleCollection: Collection;
  setStep: (step: number) => void;
  setIsSampleDBExpanded: (isReady: boolean) => void;
  setIsDocumentsTabOpened: (isOpened: boolean) => void;
  setSampleCollection: (sampleCollection: Collection) => void;
}

export const useTeachingBubble: UseStore<TeachingBubbleState> = create((set) => ({
  step: 1,
  isSampleDBExpanded: false,
  isDocumentsTabOpened: false,
  sampleCollection: undefined,
  setStep: (step: number) => set({ step }),
  setIsSampleDBExpanded: (isSampleDBExpanded: boolean) => set({ isSampleDBExpanded }),
  setIsDocumentsTabOpened: (isDocumentsTabOpened: boolean) => set({ isDocumentsTabOpened }),
  setSampleCollection: (sampleCollection: Collection) => set({ sampleCollection }),
}));
