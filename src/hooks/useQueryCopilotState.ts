import { MinimalQueryIterator } from "Common/IteratorUtilities";
import { QueryResults } from "Contracts/ViewModels";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import { useRef, useState } from "react";

export interface QueryCopilotState {
  hideFeedbackModalForLikedQueries: boolean;
  userPrompt: string;
  setUserPrompt: React.Dispatch<React.SetStateAction<string>>;
  generatedQuery: string;
  setGeneratedQuery: React.Dispatch<React.SetStateAction<string>>;
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  selectedQuery: string;
  setSelectedQuery: React.Dispatch<React.SetStateAction<string>>;
  isGeneratingQuery: boolean;
  setIsGeneratingQuery: React.Dispatch<React.SetStateAction<boolean>>;
  isExecuting: boolean;
  setIsExecuting: React.Dispatch<React.SetStateAction<boolean>>;
  likeQuery: boolean | undefined;
  setLikeQuery: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  dislikeQuery: boolean | undefined;
  setDislikeQuery: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  showCallout: boolean;
  setShowCallout: React.Dispatch<React.SetStateAction<boolean>>;
  showSamplePrompts: boolean;
  setShowSamplePrompts: React.Dispatch<React.SetStateAction<boolean>>;
  queryIterator: MinimalQueryIterator | undefined;
  setQueryIterator: React.Dispatch<React.SetStateAction<MinimalQueryIterator | undefined>>;
  queryResults: QueryResults | undefined;
  setQueryResults: React.Dispatch<React.SetStateAction<QueryResults | undefined>>;
  errorMessage: string;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  inputEdited: boolean;
  isSamplePromptsOpen: boolean;
  setIsSamplePromptsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showDeletePopup: boolean;
  setShowDeletePopup: React.Dispatch<React.SetStateAction<boolean>>;
  showFeedbackBar: boolean;
  setShowFeedbackBar: React.Dispatch<React.SetStateAction<boolean>>;
  showCopyPopup: boolean;
  setshowCopyPopup: React.Dispatch<React.SetStateAction<boolean>>;
  showErrorMessageBar: boolean;
  setShowErrorMessageBar: React.Dispatch<React.SetStateAction<boolean>>;
  generatedQueryComments: string;
  setGeneratedQueryComments: React.Dispatch<React.SetStateAction<string>>;
  resetQueryCopilotStates: () => void;
}

export const useQueryCopilotState = (): QueryCopilotState => {
  const hideFeedbackModalForLikedQueries = useQueryCopilot((state) => state.hideFeedbackModalForLikedQueries);
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [generatedQuery, setGeneratedQuery] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [selectedQuery, setSelectedQuery] = useState<string>("");
  const [isGeneratingQuery, setIsGeneratingQuery] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [likeQuery, setLikeQuery] = useState<boolean>();
  const [dislikeQuery, setDislikeQuery] = useState<boolean>();
  const [showCallout, setShowCallout] = useState<boolean>(false);
  const [showSamplePrompts, setShowSamplePrompts] = useState<boolean>(false);
  const [queryIterator, setQueryIterator] = useState<MinimalQueryIterator>();
  const [queryResults, setQueryResults] = useState<QueryResults>();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const inputEdited = useRef(false).current;
  const [isSamplePromptsOpen, setIsSamplePromptsOpen] = useState<boolean>(false);
  const [showDeletePopup, setShowDeletePopup] = useState<boolean>(false);
  const [showFeedbackBar, setShowFeedbackBar] = useState<boolean>(false);
  const [showCopyPopup, setshowCopyPopup] = useState<boolean>(false);
  const [showErrorMessageBar, setShowErrorMessageBar] = useState<boolean>(false);
  const [generatedQueryComments, setGeneratedQueryComments] = useState<string>("");

  const resetQueryCopilotStates = () => {
    setUserPrompt("");
    setGeneratedQuery("");
    setQuery("");
    setSelectedQuery("");
    setIsGeneratingQuery(false);
    setIsExecuting(false);
    setLikeQuery(undefined);
    setDislikeQuery(undefined);
    setShowCallout(false);
    setShowSamplePrompts(false);
    setQueryIterator(undefined);
    setQueryResults(undefined);
    setErrorMessage("");
    setIsSamplePromptsOpen(false);
    setShowDeletePopup(false);
    setShowFeedbackBar(false);
    setshowCopyPopup(false);
    setShowErrorMessageBar(false);
    setGeneratedQueryComments("");
  };

  return {
    hideFeedbackModalForLikedQueries,
    userPrompt,
    setUserPrompt,
    generatedQuery,
    setGeneratedQuery,
    query,
    setQuery,
    selectedQuery,
    setSelectedQuery,
    isGeneratingQuery,
    setIsGeneratingQuery,
    isExecuting,
    setIsExecuting,
    likeQuery,
    setLikeQuery,
    dislikeQuery,
    setDislikeQuery,
    showCallout,
    setShowCallout,
    showSamplePrompts,
    setShowSamplePrompts,
    queryIterator,
    setQueryIterator,
    queryResults,
    setQueryResults,
    errorMessage,
    setErrorMessage,
    inputEdited,
    isSamplePromptsOpen,
    setIsSamplePromptsOpen,
    showDeletePopup,
    setShowDeletePopup,
    showFeedbackBar,
    setShowFeedbackBar,
    showCopyPopup,
    setshowCopyPopup,
    showErrorMessageBar,
    setShowErrorMessageBar,
    generatedQueryComments,
    setGeneratedQueryComments,
    resetQueryCopilotStates,
  };
};
