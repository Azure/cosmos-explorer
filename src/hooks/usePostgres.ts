import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface TeachingBubbleState {
  showPostgreTeachingBubble: boolean;
  showResetPasswordBubble: boolean;
  setShowPostgreTeachingBubble: (showPostgreTeachingBubble: boolean) => void;
  setShowResetPasswordBubble: (showResetPasswordBubble: boolean) => void;
}

export const usePostgres = create<TeachingBubbleState>()(
  subscribeWithSelector(
    (set) => ({
      showPostgreTeachingBubble: false,
      showResetPasswordBubble: false,
      setShowPostgreTeachingBubble: (showPostgreTeachingBubble: boolean) => set({ showPostgreTeachingBubble }),
      setShowResetPasswordBubble: (showResetPasswordBubble: boolean) => set({ showResetPasswordBubble }),
    })
  )
);
