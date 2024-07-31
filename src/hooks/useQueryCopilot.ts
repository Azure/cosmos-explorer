import { MinimalQueryIterator } from "Common/IteratorUtilities";
import QueryError from "Common/QueryError";
import { QueryResults } from "Contracts/ViewModels";
import { CopilotMessage, CopilotSchemaAllocationInfo } from "Explorer/QueryCopilot/Shared/QueryCopilotInterfaces";
import { guid } from "Explorer/Tables/Utilities";
import { useTabs } from "hooks/useTabs";
import create, { UseStore } from "zustand";
import * as DataModels from "../Contracts/DataModels";
import { ContainerInfo } from "../Contracts/DataModels";

export interface QueryCopilotState {
  copilotEnabled: boolean;
  copilotUserDBEnabled: boolean;
  copilotSampleDBEnabled: boolean;
  generatedQuery: string;
  likeQuery: boolean;
  userPrompt: string;
  showFeedbackModal: boolean;
  hideFeedbackModalForLikedQueries: boolean;
  correlationId: string;
  query: string;
  selectedQuery: string;
  isGeneratingQuery: boolean;
  isGeneratingExplanation: boolean;
  isExecuting: boolean;
  dislikeQuery: boolean | undefined;
  showCallout: boolean;
  showSamplePrompts: boolean;
  queryIterator: MinimalQueryIterator | undefined;
  queryResults: QueryResults | undefined;
  errors: QueryError[];
  isSamplePromptsOpen: boolean;
  showPromptTeachingBubble: boolean;
  showDeletePopup: boolean;
  showFeedbackBar: boolean;
  showCopyPopup: boolean;
  showErrorMessageBar: boolean;
  showInvalidQueryMessageBar: boolean;
  generatedQueryComments: string;
  wasCopilotUsed: boolean;
  showWelcomeSidebar: boolean;
  showCopilotSidebar: boolean;
  chatMessages: CopilotMessage[];
  shouldIncludeInMessages: boolean;
  showExplanationBubble: boolean;
  notebookServerInfo: DataModels.NotebookWorkspaceConnectionInfo;
  containerStatus: ContainerInfo;
  schemaAllocationInfo: CopilotSchemaAllocationInfo;
  isAllocatingContainer: boolean;
  copilotEnabledforExecution: boolean;

  getState?: () => QueryCopilotState;

  setCopilotEnabled: (copilotEnabled: boolean) => void;
  setCopilotUserDBEnabled: (copilotUserDBEnabled: boolean) => void;
  setCopilotSampleDBEnabled: (copilotSampleDBEnabled: boolean) => void;
  openFeedbackModal: (generatedQuery: string, likeQuery: boolean, userPrompt: string) => void;
  closeFeedbackModal: () => void;
  setHideFeedbackModalForLikedQueries: (hideFeedbackModalForLikedQueries: boolean) => void;
  refreshCorrelationId: () => void;
  setUserPrompt: (userPrompt: string) => void;
  setQuery: (query: string) => void;
  setGeneratedQuery: (generatedQuery: string) => void;
  setSelectedQuery: (selectedQuery: string) => void;
  setIsGeneratingQuery: (isGeneratingQuery: boolean) => void;
  setIsGeneratingExplanation: (isGeneratingExplanation: boolean) => void;
  setIsExecuting: (isExecuting: boolean) => void;
  setLikeQuery: (likeQuery: boolean) => void;
  setDislikeQuery: (dislikeQuery: boolean | undefined) => void;
  setShowCallout: (showCallout: boolean) => void;
  setShowSamplePrompts: (showSamplePrompts: boolean) => void;
  setQueryIterator: (queryIterator: MinimalQueryIterator | undefined) => void;
  setQueryResults: (queryResults: QueryResults | undefined) => void;
  setErrors: (errors: QueryError[]) => void;
  setIsSamplePromptsOpen: (isSamplePromptsOpen: boolean) => void;
  setShowPromptTeachingBubble: (showPromptTeachingBubble: boolean) => void;
  setShowDeletePopup: (showDeletePopup: boolean) => void;
  setShowFeedbackBar: (showFeedbackBar: boolean) => void;
  setshowCopyPopup: (showCopyPopup: boolean) => void;
  setShowErrorMessageBar: (showErrorMessageBar: boolean) => void;
  setShowInvalidQueryMessageBar: (showInvalidQueryMessageBar: boolean) => void;
  setGeneratedQueryComments: (generatedQueryComments: string) => void;
  setWasCopilotUsed: (wasCopilotUsed: boolean) => void;
  setShowWelcomeSidebar: (showWelcomeSidebar: boolean) => void;
  setShowCopilotSidebar: (showCopilotSidebar: boolean) => void;
  setChatMessages: (chatMessages: CopilotMessage[]) => void;
  setShouldIncludeInMessages: (shouldIncludeInMessages: boolean) => void;
  setShowExplanationBubble: (showExplanationBubble: boolean) => void;
  setNotebookServerInfo: (notebookServerInfo: DataModels.NotebookWorkspaceConnectionInfo) => void;
  setContainerStatus: (containerStatus: ContainerInfo) => void;
  setIsAllocatingContainer: (isAllocatingContainer: boolean) => void;
  setSchemaAllocationInfo: (schemaAllocationInfo: CopilotSchemaAllocationInfo) => void;
  setCopilotEnabledforExecution: (copilotEnabledforExecution: boolean) => void;

  resetContainerConnection: () => void;
  resetQueryCopilotStates: () => void;
}

type QueryCopilotStore = UseStore<Partial<QueryCopilotState>>;

export const useQueryCopilot: QueryCopilotStore = create((set) => ({
  copilotEnabled: false,
  copilotUserDBEnabled: false,
  copilotSampleDBEnabled: false,
  generatedQuery: "",
  likeQuery: false,
  userPrompt: "",
  showFeedbackModal: false,
  hideFeedbackModalForLikedQueries: false,
  correlationId: "",
  query: "SELECT * FROM c",
  selectedQuery: "",
  isGeneratingQuery: null,
  isGeneratingExplanation: false,
  isExecuting: false,
  dislikeQuery: undefined,
  showCallout: false,
  showSamplePrompts: false,
  queryIterator: undefined,
  queryResults: undefined,
  errors: [],
  isSamplePromptsOpen: false,
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
  schemaAllocationInfo: {
    databaseId: undefined,
    containerId: undefined,
  },
  isAllocatingContainer: false,
  copilotEnabledforExecution: false,

  setCopilotEnabled: (copilotEnabled: boolean) => set({ copilotEnabled }),
  setCopilotUserDBEnabled: (copilotUserDBEnabled: boolean) => set({ copilotUserDBEnabled }),
  setCopilotSampleDBEnabled: (copilotSampleDBEnabled: boolean) => set({ copilotSampleDBEnabled }),
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
  setNotebookServerInfo: (notebookServerInfo: DataModels.NotebookWorkspaceConnectionInfo) =>
    set({ notebookServerInfo }),
  setContainerStatus: (containerStatus: ContainerInfo) => set({ containerStatus }),
  setIsAllocatingContainer: (isAllocatingContainer: boolean) => set({ isAllocatingContainer }),
  setSchemaAllocationInfo: (schemaAllocationInfo: CopilotSchemaAllocationInfo) => set({ schemaAllocationInfo }),
  setCopilotEnabledforExecution: (copilotEnabledforExecution: boolean) => set({ copilotEnabledforExecution }),

  resetContainerConnection: (): void => {
    useTabs.getState().closeAllNotebookTabs(true);
    useQueryCopilot.getState().setNotebookServerInfo(undefined);
    useQueryCopilot.getState().setIsAllocatingContainer(false);
    useQueryCopilot.getState().setContainerStatus({
      status: undefined,
      durationLeftInMinutes: undefined,
      phoenixServerInfo: undefined,
    });
    useQueryCopilot.getState().setSchemaAllocationInfo({
      databaseId: undefined,
      containerId: undefined,
    });
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
      errors: [],
      isSamplePromptsOpen: false,
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
      schemaAllocationInfo: {
        databaseId: undefined,
        containerId: undefined,
      },
      isAllocatingContainer: false,
    }));
  },
}));
