import { MinimalQueryIterator } from "Common/IteratorUtilities";
import QueryError from "Common/QueryError";
import { QueryResults } from "Contracts/ViewModels";
import { CopilotMessage } from "Explorer/QueryCopilot/Shared/QueryCopilotInterfaces";
import { guid } from "Explorer/Tables/Utilities";
import { QueryCopilotState } from "hooks/useQueryCopilot";

import React, { createContext, useContext, useState } from "react";
import create from "zustand";
const context = createContext(null);
const useCopilotStore = (): Partial<QueryCopilotState> => useContext(context);

const CopilotProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const [useStore] = useState(() =>
    create((set, get) => ({
      generatedQuery: "",
      likeQuery: false,
      userPrompt: "",
      showFeedbackModal: false,
      hideFeedbackModalForLikedQueries: false,
      correlationId: "",
      query: "SELECT * FROM c",
      selectedQuery: "",
      isGeneratingQuery: false,
      isGeneratingExplanation: false,
      isExecuting: false,
      dislikeQuery: undefined,
      showCallout: false,
      showSamplePrompts: false,
      queryIterator: undefined,
      queryResults: undefined,
      errors: [],
      isSamplePromptsOpen: false,
      showPromptTeachingBubble: true,
      showDeletePopup: false,
      showFeedbackBar: false,
      showCopyPopup: false,
      showErrorMessageBar: false,
      showInvalidQueryMessageBar: false,
      generatedQueryComments: "",
      wasCopilotUsed: false,
      showWelcomeSidebar: true,
      showCopilotSidebar: false,
      chatMessages: [],
      shouldIncludeInMessages: true,
      showExplanationBubble: false,
      isAllocatingContainer: false,

      openFeedbackModal: (generatedQuery: string, likeQuery: boolean, userPrompt: string) =>
        set({ generatedQuery, likeQuery, userPrompt, showFeedbackModal: true }),
      closeFeedbackModal: () => set({ showFeedbackModal: false }),
      setHideFeedbackModalForLikedQueries: (hideFeedbackModalForLikedQueries: boolean) =>
        set({ hideFeedbackModalForLikedQueries }),
      refreshCorrelationId: () => set({ correlationId: guid() }),
      setUserPrompt: (userPrompt: string) => set({ userPrompt }),
      setQuery: (query: string) => set({ query }),
      setGeneratedQuery: (generatedQuery: string) => set({ generatedQuery }),
      setSelectedQuery: (selectedQuery: string) => set({ selectedQuery }),
      setIsGeneratingQuery: (isGeneratingQuery: boolean) => set({ isGeneratingQuery }),
      setIsGeneratingExplanation: (isGeneratingExplanation: boolean) => set({ isGeneratingExplanation }),
      setIsExecuting: (isExecuting: boolean) => set({ isExecuting }),
      setLikeQuery: (likeQuery: boolean) => set({ likeQuery }),
      setDislikeQuery: (dislikeQuery: boolean | undefined) => set({ dislikeQuery }),
      setShowCallout: (showCallout: boolean) => set({ showCallout }),
      setShowSamplePrompts: (showSamplePrompts: boolean) => set({ showSamplePrompts }),
      setQueryIterator: (queryIterator: MinimalQueryIterator | undefined) => set({ queryIterator }),
      setQueryResults: (queryResults: QueryResults | undefined) => set({ queryResults }),
      setErrors: (errors: QueryError[]) => set({ errors }),
      setIsSamplePromptsOpen: (isSamplePromptsOpen: boolean) => set({ isSamplePromptsOpen }),
      setShowPromptTeachingBubble: (showPromptTeachingBubble: boolean) => set({ showPromptTeachingBubble }),
      setShowDeletePopup: (showDeletePopup: boolean) => set({ showDeletePopup }),
      setShowFeedbackBar: (showFeedbackBar: boolean) => set({ showFeedbackBar }),
      setshowCopyPopup: (showCopyPopup: boolean) => set({ showCopyPopup }),
      setShowErrorMessageBar: (showErrorMessageBar: boolean) => set({ showErrorMessageBar }),
      setShowInvalidQueryMessageBar: (showInvalidQueryMessageBar: boolean) => set({ showInvalidQueryMessageBar }),
      setGeneratedQueryComments: (generatedQueryComments: string) => set({ generatedQueryComments }),
      setWasCopilotUsed: (wasCopilotUsed: boolean) => set({ wasCopilotUsed }),
      setShowWelcomeSidebar: (showWelcomeSidebar: boolean) => set({ showWelcomeSidebar }),
      setShowCopilotSidebar: (showCopilotSidebar: boolean) => set({ showCopilotSidebar }),
      setChatMessages: (chatMessages: CopilotMessage[]) => set({ chatMessages }),
      setShouldIncludeInMessages: (shouldIncludeInMessages: boolean) => set({ shouldIncludeInMessages }),
      setShowExplanationBubble: (showExplanationBubble: boolean) => set({ showExplanationBubble }),

      getState: () => {
        return get();
      },

      resetQueryCopilotStates: () => {
        set((state) => ({
          ...state,
          generatedQuery: "",
          likeQuery: false,
          userPrompt: "",
          showFeedbackModal: false,
          hideFeedbackModalForLikedQueries: false,
          correlationId: "",
          query: "SELECT * FROM c",
          selectedQuery: "",
          isGeneratingQuery: false,
          isGeneratingExplanation: false,
          isExecuting: false,
          dislikeQuery: undefined,
          showCallout: false,
          showSamplePrompts: false,
          queryIterator: undefined,
          queryResults: undefined,
          errorMessage: "",
          isSamplePromptsOpen: false,
          showPromptTeachingBubble: true,
          showDeletePopup: false,
          showFeedbackBar: false,
          showCopyPopup: false,
          showErrorMessageBar: false,
          showInvalidQueryMessageBar: false,
          generatedQueryComments: "",
          wasCopilotUsed: false,
          showCopilotSidebar: false,
          chatMessages: [],
          shouldIncludeInMessages: true,
          showExplanationBubble: false,
          notebookServerInfo: {
            notebookServerEndpoint: undefined,
            authToken: undefined,
            forwardingId: undefined,
          },
          containerStatus: {
            status: undefined,
            durationLeftInMinutes: undefined,
            phoenixServerInfo: undefined,
          },
          isAllocatingContainer: false,
        }));
      },
    })),
  );
  return <context.Provider value={useStore()}>{children}</context.Provider>;
};

export { CopilotProvider, useCopilotStore };

