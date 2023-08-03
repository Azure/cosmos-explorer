import { MinimalQueryIterator } from "Common/IteratorUtilities";
import { QueryResults } from "Contracts/ViewModels";
import { guid } from "Explorer/Tables/Utilities";
import create, { UseStore } from "zustand";

interface QueryCopilotState {
  generatedQuery: string;
  likeQuery: boolean;
  userPrompt: string;
  showFeedbackModal: boolean;
  hideFeedbackModalForLikedQueries: boolean;
  correlationId: string;
  query: string;
  selectedQuery: string;
  isGeneratingQuery: boolean;
  isExecuting: boolean;
  dislikeQuery: boolean | undefined;
  showCallout: boolean;
  showSamplePrompts: boolean;
  queryIterator: MinimalQueryIterator | undefined;
  queryResults: QueryResults | undefined;
  errorMessage: string;
  isSamplePromptsOpen: boolean;
  showDeletePopup: boolean;
  showFeedbackBar: boolean;
  showCopyPopup: boolean;
  showErrorMessageBar: boolean;
  generatedQueryComments: string;

  openFeedbackModal: (generatedQuery: string, likeQuery: boolean, userPrompt: string) => void;
  closeFeedbackModal: () => void;
  setHideFeedbackModalForLikedQueries: (hideFeedbackModalForLikedQueries: boolean) => void;
  refreshCorrelationId: () => void;
  setUserPrompt: (userPrompt: string) => void;
  setQuery: (query: string) => void;
  setGeneratedQuery: (generatedQuery: string) => void;
  setSelectedQuery: (selectedQuery: string) => void;
  setIsGeneratingQuery: (isGeneratingQuery: boolean) => void;
  setIsExecuting: (isExecuting: boolean) => void;
  setLikeQuery: (likeQuery: boolean) => void;
  setDislikeQuery: (dislikeQuery: boolean | undefined) => void;
  setShowCallout: (showCallout: boolean) => void;
  setShowSamplePrompts: (showSamplePrompts: boolean) => void;
  setQueryIterator: (queryIterator: MinimalQueryIterator | undefined) => void;
  setQueryResults: (queryResults: QueryResults | undefined) => void;
  setErrorMessage: (errorMessage: string) => void;
  setIsSamplePromptsOpen: (isSamplePromptsOpen: boolean) => void;
  setShowDeletePopup: (showDeletePopup: boolean) => void;
  setShowFeedbackBar: (showFeedbackBar: boolean) => void;
  setshowCopyPopup: (showCopyPopup: boolean) => void;
  setShowErrorMessageBar: (showErrorMessageBar: boolean) => void;
  setGeneratedQueryComments: (generatedQueryComments: string) => void;
  resetQueryCopilotStates: () => void;
}

type QueryCopilotStore = UseStore<QueryCopilotState>;

export const useQueryCopilot: QueryCopilotStore = create((set) => ({
  generatedQuery: "",
  likeQuery: false,
  userPrompt: "",
  showFeedbackModal: false,
  hideFeedbackModalForLikedQueries: false,
  correlationId: "",
  query: "",
  selectedQuery: "",
  isGeneratingQuery: false,
  isExecuting: false,
  dislikeQuery: undefined,
  showCallout: false,
  showSamplePrompts: false,
  queryIterator: undefined,
  queryResults: undefined,
  errorMessage: "",
  isSamplePromptsOpen: false,
  showDeletePopup: false,
  showFeedbackBar: false,
  showCopyPopup: false,
  showErrorMessageBar: false,
  generatedQueryComments: "",

  openFeedbackModal: (generatedQuery: string, likeQuery: boolean, userPrompt: string) =>
    set({ generatedQuery, likeQuery, userPrompt, showFeedbackModal: true }),
  closeFeedbackModal: () => set({ generatedQuery: "", likeQuery: false, userPrompt: "", showFeedbackModal: false }),
  setHideFeedbackModalForLikedQueries: (hideFeedbackModalForLikedQueries: boolean) =>
    set({ hideFeedbackModalForLikedQueries }),
  refreshCorrelationId: () => set({ correlationId: guid() }),
  setUserPrompt: (userPrompt: string) => set({ userPrompt }),
  setQuery: (query: string) => set({ query }),
  setGeneratedQuery: (generatedQuery: string) => set({ generatedQuery }),
  setSelectedQuery: (selectedQuery: string) => set({ selectedQuery }),
  setIsGeneratingQuery: (isGeneratingQuery: boolean) => set({ isGeneratingQuery }),
  setIsExecuting: (isExecuting: boolean) => set({ isExecuting }),
  setLikeQuery: (likeQuery: boolean) => set({ likeQuery }),
  setDislikeQuery: (dislikeQuery: boolean | undefined) => set({ dislikeQuery }),
  setShowCallout: (showCallout: boolean) => set({ showCallout }),
  setShowSamplePrompts: (showSamplePrompts: boolean) => set({ showSamplePrompts }),
  setQueryIterator: (queryIterator: MinimalQueryIterator | undefined) => set({ queryIterator }),
  setQueryResults: (queryResults: QueryResults | undefined) => set({ queryResults }),
  setErrorMessage: (errorMessage: string) => set({ errorMessage }),
  setIsSamplePromptsOpen: (isSamplePromptsOpen: boolean) => set({ isSamplePromptsOpen }),
  setShowDeletePopup: (showDeletePopup: boolean) => set({ showDeletePopup }),
  setShowFeedbackBar: (showFeedbackBar: boolean) => set({ showFeedbackBar }),
  setshowCopyPopup: (showCopyPopup: boolean) => set({ showCopyPopup }),
  setShowErrorMessageBar: (showErrorMessageBar: boolean) => set({ showErrorMessageBar }),
  setGeneratedQueryComments: (generatedQueryComments: string) => set({ generatedQueryComments }),

  resetQueryCopilotStates: () => {
    set((state) => ({
      ...state,
      generatedQuery: "",
      likeQuery: false,
      userPrompt: "",
      showFeedbackModal: false,
      hideFeedbackModalForLikedQueries: false,
      correlationId: "",
      query: "",
      selectedQuery: "",
      isGeneratingQuery: false,
      isExecuting: false,
      dislikeQuery: undefined,
      showCallout: false,
      showSamplePrompts: false,
      queryIterator: undefined,
      queryResults: undefined,
      errorMessage: "",
      isSamplePromptsOpen: false,
      showDeletePopup: false,
      showFeedbackBar: false,
      showCopyPopup: false,
      showErrorMessageBar: false,
      generatedQueryComments: "",
    }));
  },
}));
