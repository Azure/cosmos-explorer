import { guid } from "Explorer/Tables/Utilities";
import create, { UseStore } from "zustand";

interface QueryCopilotState {
  generatedQuery: string;
  likeQuery: boolean;
  userPrompt: string;
  showFeedbackModal: boolean;
  hideFeedbackModalForLikedQueries: boolean;
  correlationId: string;
  openFeedbackModal: (generatedQuery: string, likeQuery: boolean, userPrompt: string) => void;
  closeFeedbackModal: () => void;
  setHideFeedbackModalForLikedQueries: (hideFeedbackModalForLikedQueries: boolean) => void;
  refreshCorrelationId: () => void;
}

export const useQueryCopilot: UseStore<QueryCopilotState> = create((set) => ({
  generatedQuery: "",
  likeQuery: false,
  userPrompt: "",
  showFeedbackModal: false,
  hideFeedbackModalForLikedQueries: false,
  correlationId: "",
  openFeedbackModal: (generatedQuery: string, likeQuery: boolean, userPrompt: string) =>
    set({ generatedQuery, likeQuery, userPrompt, showFeedbackModal: true }),
  closeFeedbackModal: () => set({ generatedQuery: "", likeQuery: false, userPrompt: "", showFeedbackModal: false }),
  setHideFeedbackModalForLikedQueries: (hideFeedbackModalForLikedQueries: boolean) =>
    set({ hideFeedbackModalForLikedQueries }),
  refreshCorrelationId: () => set({ correlationId: guid() }),
}));
