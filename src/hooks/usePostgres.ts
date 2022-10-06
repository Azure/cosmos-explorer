import create, { UseStore } from "zustand";

interface TeachingBubbleState {
  showPostgreTeachingBubble: boolean;
  showResetPasswordBubble: boolean;
  setShowPostgreTeachingBubble: (showPostgreTeachingBubble: boolean) => void;
  setShowResetPasswordBubble: (showResetPasswordBubble: boolean) => void;
}

export const usePostgres: UseStore<TeachingBubbleState> = create((set) => ({
  showPostgreTeachingBubble: false,
  showResetPasswordBubble: false,
  setShowPostgreTeachingBubble: (showPostgreTeachingBubble: boolean) => set({ showPostgreTeachingBubble }),
  setShowResetPasswordBubble: (showResetPasswordBubble: boolean) => set({ showResetPasswordBubble }),
}));
