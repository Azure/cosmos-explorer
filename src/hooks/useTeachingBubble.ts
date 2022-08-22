import { Collection } from "Contracts/ViewModels";
import create, { UseStore } from "zustand";

interface TeachingBubbleState {
  step: number;
  isSampleDBExpanded: boolean;
  isDocumentsTabOpened: boolean;
  sampleCollection: Collection;
  showPostgreTeachingBubble: boolean;
  setStep: (step: number) => void;
  setIsSampleDBExpanded: (isReady: boolean) => void;
  setIsDocumentsTabOpened: (isOpened: boolean) => void;
  setSampleCollection: (sampleCollection: Collection) => void;
  setShowPostgreTeachingBubble: (showPostgreTeachingBubble: boolean) => void;
}

export const useTeachingBubble: UseStore<TeachingBubbleState> = create((set) => ({
  step: 1,
  isSampleDBExpanded: false,
  isDocumentsTabOpened: false,
  sampleCollection: undefined,
  showPostgreTeachingBubble: false,
  setStep: (step: number) => set({ step }),
  setIsSampleDBExpanded: (isSampleDBExpanded: boolean) => set({ isSampleDBExpanded }),
  setIsDocumentsTabOpened: (isDocumentsTabOpened: boolean) => set({ isDocumentsTabOpened }),
  setSampleCollection: (sampleCollection: Collection) => set({ sampleCollection }),
  setShowPostgreTeachingBubble: (showPostgreTeachingBubble: boolean) => set({ showPostgreTeachingBubble }),
}));
