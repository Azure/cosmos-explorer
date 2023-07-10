import create, { UseStore } from "zustand";

interface QueryCopilotState {
  generatedQuery: string;
  likeQuery: boolean;
  userPrompt: string;
  showFeedbackModal: boolean;
  hideFeedbackModalForLikedQueries: boolean;
  openFeedbackModal: (generatedQuery: string, likeQuery: boolean, userPrompt: string) => void;
  closeFeedbackModal: () => void;
  setHideFeedbackModalForLikedQueries: (hideFeedbackModalForLikedQueries: boolean) => void;
}

export const useQueryCopilot: UseStore<QueryCopilotState> = create((set) => ({
  generatedQuery: "",
  likeQuery: false,
  userPrompt: "",
  showFeedbackModal: false,
  hideFeedbackModalForLikedQueries: false,
  openFeedbackModal: (generatedQuery: string, likeQuery: boolean, userPrompt: string) =>
    set({ generatedQuery, likeQuery, userPrompt, showFeedbackModal: true }),
  closeFeedbackModal: () => set({ generatedQuery: "", likeQuery: false, userPrompt: "", showFeedbackModal: false }),
  setHideFeedbackModalForLikedQueries: (hideFeedbackModalForLikedQueries: boolean) =>
    set({ hideFeedbackModalForLikedQueries }),
}));
