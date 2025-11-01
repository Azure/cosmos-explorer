import { useCallback, useMemo, useReducer, useState } from "react";
import { useSidePanel } from "../../../../hooks/useSidePanel";
import { submitCreateCopyJob } from "../../Actions/CopyJobActions";
import { useCopyJobContext } from "../../Context/CopyJobContext";
import { useCopyJobPrerequisitesCache } from "./useCopyJobPrerequisitesCache";
import { SCREEN_KEYS, useCreateCopyJobScreensList } from "./useCreateCopyJobScreensList";

type NavigationState = {
  screenHistory: string[];
};

type Action = { type: "NEXT"; nextScreen: string } | { type: "PREVIOUS" } | { type: "RESET" };

function navigationReducer(state: NavigationState, action: Action): NavigationState {
  switch (action.type) {
    case "NEXT":
      return {
        screenHistory: [...state.screenHistory, action.nextScreen],
      };
    case "PREVIOUS":
      return {
        screenHistory: state.screenHistory.length > 1 ? state.screenHistory.slice(0, -1) : state.screenHistory,
      };
    case "RESET":
      return {
        screenHistory: [SCREEN_KEYS.SelectAccount],
      };
    default:
      return state;
  }
}

export function useCopyJobNavigation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { copyJobState, resetCopyJobState } = useCopyJobContext();
  const screens = useCreateCopyJobScreensList();
  const { validationCache: cache } = useCopyJobPrerequisitesCache();
  const [state, dispatch] = useReducer(navigationReducer, { screenHistory: [SCREEN_KEYS.SelectAccount] });

  const currentScreenKey = state.screenHistory[state.screenHistory.length - 1];
  const currentScreen = screens.find((screen) => screen.key === currentScreenKey);

  const isPrimaryDisabled = useMemo(() => {
    if (isLoading) {
      return true;
    }
    const context = currentScreenKey === SCREEN_KEYS.AssignPermissions ? cache : copyJobState;
    return !currentScreen?.validations.every((v) => v.validate(context));
  }, [currentScreen.key, copyJobState, cache, isLoading]);

  const primaryBtnText = useMemo(() => {
    if (currentScreenKey === SCREEN_KEYS.PreviewCopyJob) {
      return "Copy";
    }
    return "Next";
  }, [currentScreenKey]);

  const isPreviousDisabled = state.screenHistory.length <= 1;

  const handleCancel = useCallback(() => {
    dispatch({ type: "RESET" });
    resetCopyJobState();
    useSidePanel.getState().closeSidePanel();
  }, []);

  const handlePrimary = useCallback(() => {
    const transitions = {
      [SCREEN_KEYS.SelectAccount]: SCREEN_KEYS.AssignPermissions,
      [SCREEN_KEYS.AssignPermissions]: SCREEN_KEYS.SelectSourceAndTargetContainers,
      [SCREEN_KEYS.SelectSourceAndTargetContainers]: SCREEN_KEYS.PreviewCopyJob,
    };

    const nextScreen = transitions[currentScreenKey];
    if (nextScreen) {
      dispatch({ type: "NEXT", nextScreen });
    } else if (currentScreenKey === SCREEN_KEYS.PreviewCopyJob) {
      (async () => {
        try {
          setIsLoading(true);
          await submitCreateCopyJob(copyJobState, handleCancel);
        } catch (error: unknown) {
          if (error instanceof Error) {
            setError(error.message || "Failed to create copy job. Please try again later.");
          } else {
            setError("Failed to create copy job. Please try again later.");
          }
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [currentScreenKey, copyJobState]);

  const handlePrevious = useCallback(() => {
    dispatch({ type: "PREVIOUS" });
  }, []);

  return {
    currentScreen,
    isPrimaryDisabled,
    isPreviousDisabled,
    handlePrimary,
    handlePrevious,
    handleCancel,
    primaryBtnText,
    error,
    setError,
  };
}
