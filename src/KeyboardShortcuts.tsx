import Mousetrap, { ExtendedKeyboardEvent } from "mousetrap";
import * as React from "react";
import create, { UseStore } from "zustand";

// Provides a system of Keyboard Shortcuts that can be contributed to by different parts of the application.
//
// The goals of this system are:
// * Shortcuts can be contributed from different parts of the application (e.g. the command bar, specified editor tabs, etc.)
// * Contributors may only provide some of their shortcuts, others may be out-of-scope for the current context.
// * Contributors don't have to add/remove handlers individually, they can use a declarative pattern to set all their handlers at once.
//
// So, in order to do that, we store handlers in a two-level hierarchy:
// 1. We store a mapping of contributors to their Contributions.
// 2. Each Contribution is a mapping of actions to their handlers.
//
// Thus, a Contributor sets all its handlers at once, replacing all handlers previously contributed by that Contributor.
// The system then merges all Contributions into a single set of handlers, with duplicate handlers being handled in the order that the Contributors are processed.


export type KeyboardShortcutHandler = (e: ExtendedKeyboardEvent, combo: string) => boolean | void;

/**
 * Lists all the possible contributors to keyboard shortcut handlers.
 * 
 * A "Contributor" is a part of the application that can contribute keyboard shortcut handlers.
 * The contributor must set all it's keyboard shortcut handlers at once.
 * This allows the contributor to easily replace all it's keyboard shortcuts at once.
 * 
 * For example, the command bar adds/removes keyboard shortcut handlers based on the current context, using the existing logic that determines which buttons are shown.
 * Isolating contributors like this allow the command bar to easily replace all it's keyboard shortcuts when the context changes without breaking keyboard shortcuts contributed by other parts of the application.
 */
export enum KeyboardShortcutContributor {
    COMMAND_BAR = "COMMAND_BAR",
}

/**
 * The order in which contributors are processed.
 * This is important because the last contributor to set a handler for a given action will be the one that is used.
 */
const contributorOrder: KeyboardShortcutContributor[] = [
    KeyboardShortcutContributor.COMMAND_BAR,
];

/**
 * The possible actions that can be triggered by keyboard shortcuts.
 */
export enum KeyboardShortcutAction {
    NEW_QUERY = "NEW_QUERY",
    EXECUTE_ITEM = "EXECUTE_ITEM",
}

/**
 * The default keyboard shortcuts for the application.
 * This record maps each action to the keyboard shortcuts that trigger the action.
 * Even if an action is specified here though, it will not be triggered unless a handler is set for it.
 */
const bindings: Record<KeyboardShortcutAction, string[]> = {
    [KeyboardShortcutAction.NEW_QUERY]: ["ctrl+j"],
    [KeyboardShortcutAction.EXECUTE_ITEM]: ["shift+enter"],
};

/**
 * Represents all the handlers provided by a contributor.
 */
export type KeyboardShortcutContribution = Partial<Record<KeyboardShortcutAction, KeyboardShortcutHandler>>;

interface KeyboardShortcutState {
    /**
     * Collects all the contributions from different contributors.
     */
    contributions: Partial<Record<KeyboardShortcutContributor, KeyboardShortcutContribution>>;

    /**
     * A merged set of all the handlers from all contributors.
     */
    allHandlers: KeyboardShortcutContribution;

    /**
     * Sets the keyboard shortcut handlers for a given contributor.
     */
    setHandlers: (contributor: KeyboardShortcutContributor, handlers: Partial<Record<KeyboardShortcutAction, KeyboardShortcutHandler>>) => void;
} 

/**
 * Gets the setHandlers function for a given contributor.
 * @param contributor The contributor to get the setHandlers function for.
 * @returns A function that sets the keyboard shortcut handlers for the given contributor.
 */
export const useKeyboardShortcutContributor = (contributor: KeyboardShortcutContributor) => {
    const setHandlers = useKeyboardShortcutHandlers.getState().setHandlers;
    return (handlers: Partial<Record<KeyboardShortcutAction, KeyboardShortcutHandler>>) => {
        setHandlers(contributor, handlers);
    };
}

const useKeyboardShortcutHandlers: UseStore<KeyboardShortcutState> = create((set, get) => ({
    contributions: {},
    allHandlers: {},
    setHandlers: (contributor: KeyboardShortcutContributor, handlers: Partial<Record<KeyboardShortcutAction, KeyboardShortcutHandler>>) => {
        const current = get();

        // Update the list of contributions.
        const newContributions = { ...current.contributions, [contributor]: handlers };

        // Merge all the contributions into a single set of handlers.
        const allHandlers: KeyboardShortcutContribution = {};
        contributorOrder.forEach((contributor) => {
            const contribution = newContributions[contributor];
            if (contribution) {
                (Object.keys(contribution) as KeyboardShortcutAction[]).forEach((action) => {
                    allHandlers[action] = contribution[action];
                });
            }
        });
        set({ contributions: newContributions, allHandlers })
    }
}));

function createHandler(action: KeyboardShortcutAction): KeyboardShortcutHandler {
    return (e, combo) => {
        const handlers = useKeyboardShortcutHandlers.getState().allHandlers;
        const handler = handlers[action];
        if (handler) {
            return handler(e, combo);
        }
    };
}

export function KeyboardShortcutRoot(props: React.HTMLProps<HTMLDivElement>) {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        const m = new Mousetrap(ref.current);
        const existingStopCallback = m.stopCallback;
        m.stopCallback = (e, element, combo) => {
            // Don't block mousetrap callback in the Monaco editor.
            if (element.matches(".monaco-editor textarea")) {
                return false;
            }
            
            return existingStopCallback(e, element, combo);
        };

        (Object.keys(bindings) as KeyboardShortcutAction[]).forEach((action) => {
            m.bind(bindings[action], createHandler(action));
        });
    }, [ref]); // We only need to re-render the component when the ref changes.

    return <div ref={ref} {...props}>
    </div>;
}