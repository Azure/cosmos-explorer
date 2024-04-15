import { useSelectedNode } from "Explorer/useSelectedNode";
import { userContext } from "UserContext";
import Mousetrap, { ExtendedKeyboardEvent } from "mousetrap";
import * as React from "react";
import * as ViewModels from "../Contracts/ViewModels";

type KeyboardShortcutRootProps = React.PropsWithChildren<unknown>;
type KeyboardShortcutHandler = (e: ExtendedKeyboardEvent, combo: string) => boolean | void;

export interface KeyboardShortcutBinding {
    /**
     * The keyboard shortcut to bind to. This can be a single string or an array of strings.
     * Any combination supported by Mousetrap (https://craig.is/killing/mice#api.bind) is valid here.
     */
    keys: string | string[],

    /**
     * The handler to run when the keyboard shortcut is pressed.
     * @param e The keyboard event that triggered the shortcut.
     * @param combo The specific keyboard combination that was matched (in case a single handler is used for multiple shortcuts).
     * @returns If the handler returns `false`, the default action for the keyboard shortcut will be prevented AND propagation of the event will be stopped.
     */
    handler: KeyboardShortcutHandler,

    /**
     * The event to bind the keyboard shortcut to (keydown, keyup, etc.). 
     * The default is 'keydown'
     */
    action?: string,
}

/**
 * Wraps the provided keyboard shortcut handler in one that only runs if a collection is selected.
 * @param callback The callback to run if a collection is selected.
 * @returns If the handler returns `false`, the default action for the keyboard shortcut will be prevented AND propagation of the event will be stopped.
 */
function withSelectedCollection(callback: (selectedCollection: ViewModels.Collection, e: ExtendedKeyboardEvent, combo: string) => boolean | void): KeyboardShortcutHandler {
    return (e, combo) => {
        const state = useSelectedNode.getState();
        if (!state.selectedNode) {
            return;
        }

        const selectedCollection = state.findSelectedCollection();
        if (selectedCollection) {
            return callback(selectedCollection, e, combo);
        }
    };

}

const bindings: KeyboardShortcutBinding[] = [
    {
        keys: ["ctrl+j"],
        handler: withSelectedCollection((selectedCollection) => {
            if (userContext.apiType === "SQL" || userContext.apiType === "Gremlin") {
                selectedCollection.onNewQueryClick(selectedCollection);
                return false;
            } else if (userContext.apiType === "Mongo") {
                selectedCollection.onNewMongoQueryClick(selectedCollection);
                return false;
            }
            return true;
        }),
    },
    {
        keys: ["shift+enter"],
        handler: () => {
            alert("TODO: Execute Item");
            return false;
        },
    },
    {
        keys: ["esc"],
        handler: () => {
            alert("TODO: Cancel Query");
            return false;
        },
    },
    {
        keys: ["mod+s"],
        handler: () => {
            alert("TODO: Save Query");
            return false;
        },
    },
    {
        keys: ["mod+o"],
        handler: () => {
            alert("TODO: Open Query");
            return false;
        },
    },
    {
        keys: ["mod+shift+o"],
        handler: () => {
            alert("TODO: Open Query from Disk");
            return false;
        },
    },
    {
        keys: ["mod+s"],
        handler: () => {
            alert("TODO: Save");
            return false;
        },
    },
]

export function KeyboardShortcutRoot({ children }: KeyboardShortcutRootProps) {
    React.useEffect(() => {
        const m = new Mousetrap(document.body);
        const existingStopCallback = m.stopCallback;
        m.stopCallback = (e, element, combo) => {
            // Don't block mousetrap callback in the Monaco editor.
            if (element.matches(".monaco-editor textarea")) {
                return false;
            }
            
            return existingStopCallback(e, element, combo);
        };

        bindings.forEach(b => {
            m.bind(b.keys, b.handler, b.action);
        });
    }, []); // Using an empty dependency array means React will only run this _once_ when the component is mounted.

    return <>
        {children}
    </>;
}