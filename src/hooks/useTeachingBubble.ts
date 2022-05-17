import create, { UseStore } from "zustand";

interface TeachingBubbleState {
  step: number;
  isSampleDBExpanded: boolean;
  isDocumentsTabOpened: boolean;
  setStep: (step: number) => void;
  setIsSampleDBExpanded: (isReady: boolean) => void;
  setIsDocumentsTabOpened: (isOpened: boolean) => void;
}

export const useTeachingBubble: UseStore<TeachingBubbleState> = create((set) => ({
  step: 1,
  isSampleDBExpanded: false,
  isDocumentsTabOpened: false,
  setStep: (step: number) => set({ step }),
  setIsSampleDBExpanded: (isSampleDBExpanded: boolean) => set({ isSampleDBExpanded }),
  setIsDocumentsTabOpened: (isDocumentsTabOpened: boolean) => set({ isDocumentsTabOpened }),
}));
