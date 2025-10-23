import { useCallback, useMemo, useReducer } from "react";
import { useSidePanel } from "../../../../hooks/useSidePanel";
import { submitCreateCopyJob } from "../../Actions/CopyJobActions";
import { useCopyJobContext } from "../../Context/CopyJobContext";
import { useCopyJobPrerequisitesCache } from "./useCopyJobPrerequisitesCache";
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

export function useCopyJobNavigation() {
    const { copyJobState } = useCopyJobContext();
    const screens = useCreateCopyJobScreensList();
    const { validationCache: cache } = useCopyJobPrerequisitesCache();
    const [state, dispatch] = useReducer(navigationReducer, { screenHistory: [SCREEN_KEYS.SelectAccount] });

    const currentScreenKey = state.screenHistory[state.screenHistory.length - 1];
    const currentScreen = screens.find((screen) => screen.key === currentScreenKey);

    const isPrimaryDisabled = useMemo(
        () => {
            const context = currentScreenKey === SCREEN_KEYS.AssignPermissions ? cache : copyJobState;
            return !currentScreen?.validations.every((v) => v.validate(context));
        },
        [currentScreen.key, copyJobState, cache]
    );
    const primaryBtnText = useMemo(() => {
        if (currentScreenKey === SCREEN_KEYS.PreviewCopyJob) {
            return "Copy";
        }
        return "Next";
    }, [currentScreenKey]);

    const isPreviousDisabled = state.screenHistory.length <= 1;

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
