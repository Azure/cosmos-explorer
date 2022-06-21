import create, { UseStore } from "zustand";

interface CarouselState {
  shouldOpen: boolean;
  showCoachMark: boolean;
  setShouldOpen: (shouldOpen: boolean) => void;
  setShowCoachMark: (showCoachMark: boolean) => void;
}

export const useCarousel: UseStore<CarouselState> = create((set) => ({
  shouldOpen: false,
  showCoachMark: false,
  setShouldOpen: (shouldOpen: boolean) => set({ shouldOpen }),
  setShowCoachMark: (showCoachMark: boolean) => set({ showCoachMark }),
}));
