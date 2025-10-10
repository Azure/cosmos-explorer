import { submitCreateCopyJob } from "Explorer/ContainerCopy/Actions/CopyJobActions";
import { useCallback, useMemo, useReducer } from "react";
import { useSidePanel } from "../../../../hooks/useSidePanel";
import { CopyJobContextState } from "../../Types";
import { SCREEN_KEYS, useCreateCopyJobScreensList } from "./useCreateCopyJobScreensList";

type NavigationState = {
    screenHistory: string[];
};

type Action =
    | { type: "NEXT"; nextScreen: string }
    | { type: "PREVIOUS" }
    | { type: "RESET" };

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

export function useCopyJobNavigation(copyJobState: CopyJobContextState) {
    const screens = useCreateCopyJobScreensList();
    const [state, dispatch] = useReducer(navigationReducer, { screenHistory: [SCREEN_KEYS.SelectAccount] });

    const currentScreenKey = state.screenHistory[state.screenHistory.length - 1];
    const currentScreen = screens.find((screen) => screen.key === currentScreenKey);

    const isPrimaryDisabled = useMemo(
        () => !currentScreen?.validations.every((v) => v.validate(copyJobState)),
        [currentScreen.key, copyJobState]
    );
    const primaryBtnText = useMemo(() => {
        if (currentScreenKey === SCREEN_KEYS.PreviewCopyJob) {
            return "Copy";
        }
        return "Next";
    }, [currentScreenKey]);

    const isPreviousDisabled = state.screenHistory.length <= 1;

    const handlePrimary = useCallback(() => {
        if (currentScreenKey === SCREEN_KEYS.SelectAccount) {
            dispatch({ type: "NEXT", nextScreen: SCREEN_KEYS.SelectSourceAndTargetContainers });
        }
        if (currentScreenKey === SCREEN_KEYS.SelectSourceAndTargetContainers) {
            dispatch({ type: "NEXT", nextScreen: SCREEN_KEYS.PreviewCopyJob });
        }
        if (currentScreenKey === SCREEN_KEYS.PreviewCopyJob) {
            submitCreateCopyJob(copyJobState);
        }
    }, [currentScreenKey, copyJobState]);

    const handlePrevious = useCallback(() => {
        dispatch({ type: "PREVIOUS" });
    }, []);

    const handleCancel = useCallback(() => {
        dispatch({ type: "RESET" });
        useSidePanel.getState().closeSidePanel();
    }, []);

    return {
        currentScreen,
        isPrimaryDisabled,
        isPreviousDisabled,
        handlePrimary,
        handlePrevious,
        handleCancel,
        primaryBtnText,
    };
}
