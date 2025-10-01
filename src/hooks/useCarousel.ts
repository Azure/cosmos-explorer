import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface CarouselState {
  shouldOpen: boolean;
  showCoachMark: boolean;
  showCopilotCarousel: boolean;
  setShouldOpen: (shouldOpen: boolean) => void;
  setShowCoachMark: (showCoachMark: boolean) => void;
  setShowCopilotCarousel: (showCopilotCarousel: boolean) => void;
}

export const useCarousel = create<CarouselState>()(
  subscribeWithSelector(
    (set) => ({
      shouldOpen: false,
      showCoachMark: false,
      showCopilotCarousel: false,
      setShouldOpen: (shouldOpen: boolean) => set({ shouldOpen }),
      setShowCoachMark: (showCoachMark: boolean) => set({ showCoachMark }),
      setShowCopilotCarousel: (showCopilotCarousel: boolean) => set({ showCopilotCarousel }),
    })
  )
);
