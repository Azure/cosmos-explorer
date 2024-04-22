import * as React from "react";
import { PropsWithChildren, useEffect } from "react";
import { KeyBindingMap, tinykeys } from "tinykeys";
import create, { UseStore } from "zustand";

/**
 * Represents a keyboard shortcut handler.
 * Return `true` to prevent the default action of the keyboard shortcut.
 * Any other return value will allow the default action to proceed.
 */
export type KeyboardActionHandler = (e: KeyboardEvent) => boolean | void;

export type KeyboardHandlerMap = Partial<Record<KeyboardAction, KeyboardActionHandler>>;

/**
 * The groups of keyboard actions that can be managed by the application.
 * Each group can be updated separately, but, when updated, must be completely replaced.
 */
export enum KeyboardActionGroup {
  TABS = "TABS",
  COMMAND_BAR = "COMMAND_BAR",
}

/**
 * The possible actions that can be triggered by keyboard shortcuts.
 */
export enum KeyboardAction {
  NEW_QUERY = "NEW_QUERY",
  EXECUTE_ITEM = "EXECUTE_ITEM",
  CANCEL_OR_DISCARD = "CANCEL_OR_DISCARD",
  SAVE_ITEM = "SAVE_ITEM",
  OPEN_QUERY = "OPEN_QUERY",
  OPEN_QUERY_FROM_DISK = "OPEN_QUERY_FROM_DISK",
  NEW_SPROC = "NEW_SPROC",
  NEW_UDF = "NEW_UDF",
  NEW_TRIGGER = "NEW_TRIGGER",
  NEW_DATABASE = "NEW_DATABASE",
  NEW_COLLECTION = "NEW_CONTAINER",
  NEW_ITEM = "NEW_ITEM",
  DELETE_ITEM = "DELETE_ITEM",
  TOGGLE_COPILOT = "TOGGLE_COPILOT",
  SELECT_LEFT_TAB = "SELECT_LEFT_TAB",
  SELECT_RIGHT_TAB = "SELECT_RIGHT_TAB",
  CLOSE_TAB = "CLOSE_TAB",
}

/**
 * The keyboard shortcuts for the application.
 * This record maps each action to the keyboard shortcuts that trigger the action.
 * Even if an action is specified here, it will not be triggered unless a handler is set for it.
 */
const bindings: Record<KeyboardAction, string[]> = {
  // NOTE: The "$mod" special value is used to represent the "Control" key on Windows/Linux and the "Command" key on macOS.
  // See https://www.npmjs.com/package/tinykeys#commonly-used-keys-and-codes for more information on the expected values for keyboard shortcuts.

  [KeyboardAction.NEW_QUERY]: ["$mod+J", "Alt+N Q"],
  [KeyboardAction.EXECUTE_ITEM]: ["Shift+Enter"],
  [KeyboardAction.CANCEL_OR_DISCARD]: ["Escape"],
  [KeyboardAction.SAVE_ITEM]: ["$mod+S"],
  [KeyboardAction.OPEN_QUERY]: ["$mod+O"],
  [KeyboardAction.OPEN_QUERY_FROM_DISK]: ["$mod+Shift+O"],
  [KeyboardAction.NEW_SPROC]: ["Alt+N P"],
  [KeyboardAction.NEW_UDF]: ["Alt+N F"],
  [KeyboardAction.NEW_TRIGGER]: ["Alt+N T"],
  [KeyboardAction.NEW_DATABASE]: ["Alt+N D"],
  [KeyboardAction.NEW_COLLECTION]: ["Alt+N C"],
  [KeyboardAction.NEW_ITEM]: ["Alt+N I"],
  [KeyboardAction.DELETE_ITEM]: ["Alt+D"],
  [KeyboardAction.TOGGLE_COPILOT]: ["$mod+P"],
  [KeyboardAction.SELECT_LEFT_TAB]: ["$mod+Alt+["],
  [KeyboardAction.SELECT_RIGHT_TAB]: ["$mod+Alt+]"],
  [KeyboardAction.CLOSE_TAB]: ["$mod+Alt+W"],
};

interface KeyboardShortcutState {
  /**
   * A set of all the keyboard shortcuts handlers.
   */
  allHandlers: KeyboardHandlerMap;

  /**
   * A set of all the groups of keyboard shortcuts handlers.
   */
  groups: Partial<Record<KeyboardActionGroup, KeyboardHandlerMap>>;

  /**
   * Sets the keyboard shortcut handlers for the given group.
   */
  setHandlers: (group: KeyboardActionGroup, handlers: KeyboardHandlerMap) => void;
}

/**
 * Defines the calling component as the manager of the keyboard actions for the given group.
 * @param group The group of keyboard actions to manage.
 * @returns A function that can be used to set the keyboard action handlers for the given group.
 */
export const useKeyboardActionGroup = (group: KeyboardActionGroup) => (handlers: KeyboardHandlerMap) =>
  useKeyboardActionHandlers.getState().setHandlers(group, handlers);

const useKeyboardActionHandlers: UseStore<KeyboardShortcutState> = create((set, get) => ({
  allHandlers: {},
  groups: {},
  setHandlers: (group: KeyboardActionGroup, handlers: KeyboardHandlerMap) => {
    const state = get();
    const groups = { ...state.groups, [group]: handlers };

    // Combine all the handlers from all the groups in the correct order.
    const allHandlers: KeyboardHandlerMap = {};
    eachKey(groups).forEach((group) => {
      const groupHandlers = groups[group];
      if (groupHandlers) {
        eachKey(groupHandlers).forEach((action) => {
          // Check for duplicate handlers in development mode.
          // We don't want to raise an error here in production, but having duplicate handlers is a mistake.
          if (process.env.NODE_ENV === "development" && allHandlers[action]) {
            throw new Error(`Duplicate handler for Keyboard Action "${action}".`);
          }
          allHandlers[action] = groupHandlers[action];
        });
      }
    });
    set({ groups, allHandlers });
  },
}));

function createHandler(action: KeyboardAction): KeyboardActionHandler {
  return (e) => {
    const state = useKeyboardActionHandlers.getState();
    const handler = state.allHandlers[action];
    if (handler && handler(e)) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
}

const allHandlers: KeyBindingMap = {};
eachKey(bindings).forEach((action) => {
  const shortcuts = bindings[action];
  shortcuts.forEach((shortcut) => {
    allHandlers[shortcut] = createHandler(action);
  });
});

export function KeyboardShortcutRoot({ children }: PropsWithChildren<unknown>) {
  useEffect(() => {
    // We bind to the body because Fluent UI components sometimes shift focus to the body, which is above the root React component.
    tinykeys(document.body, allHandlers);
  }, []);

  return <>{children}</>;
}

/** A _typed_ version of `Object.keys` that preserves the original key type */
function eachKey<K extends string | number | symbol, V>(record: Partial<Record<K, V>>): K[] {
  return Object.keys(record) as K[];
}
