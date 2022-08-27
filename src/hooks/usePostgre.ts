import create, { UseStore } from "zustand";

interface TeachingBubbleState {
  showPostgreTeachingBubble: boolean;
  setShowPostgreTeachingBubble: (showPostgreTeachingBubble: boolean) => void;
}

export const usePostgre: UseStore<TeachingBubbleState> = create((set) => ({
  showPostgreTeachingBubble: false,
  setShowPostgreTeachingBubble: (showPostgreTeachingBubble: boolean) => set({ showPostgreTeachingBubble }),
}));
