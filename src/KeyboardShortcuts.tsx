import * as React from "react";
import { HTMLProps, useEffect, useRef } from "react";
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
 * The possible actions that can be triggered by keyboard shortcuts.
 */
export enum KeyboardAction {
  NEW_QUERY = "NEW_QUERY",
  EXECUTE_ITEM = "EXECUTE_ITEM",
  CANCEL_QUERY = "CANCEL_QUERY",
  SAVE_ITEM = "SAVE_ITEM",
  OPEN_QUERY = "OPEN_QUERY",
  OPEN_QUERY_FROM_DISK = "OPEN_QUERY_FROM_DISK",
}

/**
 * The keyboard shortcuts for the application.
 * This record maps each action to the keyboard shortcuts that trigger the action.
 * Even if an action is specified here, it will not be triggered unless a handler is set for it.
 */
const bindings: Record<KeyboardAction, string[]> = {
  // NOTE: The "$mod" special value is used to represent the "Control" key on Windows/Linux and the "Command" key on macOS.
  // See https://www.npmjs.com/package/tinykeys#commonly-used-keys-and-codes for more information on the expected values for keyboard shortcuts.

  [KeyboardAction.NEW_QUERY]: ["$mod+J"],
  [KeyboardAction.EXECUTE_ITEM]: ["Shift+Enter"],
  [KeyboardAction.CANCEL_QUERY]: ["Escape"],
  [KeyboardAction.SAVE_ITEM]: ["$mod+S"],
  [KeyboardAction.OPEN_QUERY]: ["$mod+O"],
  [KeyboardAction.OPEN_QUERY_FROM_DISK]: ["$mod+Shift+O"],
};

interface KeyboardShortcutState {
  /**
   * A set of all the keyboard shortcuts handlers.
   */
  allHandlers: KeyboardHandlerMap;

  /**
   * Sets the keyboard shortcut handlers.
   */
  setHandlers: (handlers: KeyboardHandlerMap) => void;
}

export const useKeyboardActionHandlers: UseStore<KeyboardShortcutState> = create((set) => ({
  allHandlers: {},
  setHandlers: (handlers: Partial<Record<KeyboardAction, KeyboardActionHandler>>) => {
    set({ allHandlers: handlers });
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
(Object.keys(bindings) as KeyboardAction[]).forEach((action) => {
  const shortcuts = bindings[action];
  shortcuts.forEach((shortcut) => {
    allHandlers[shortcut] = createHandler(action);
  });
});

export function KeyboardShortcutRoot(props: HTMLProps<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tinykeys(ref.current, allHandlers);
  }, [ref]); // We only need to re-render the component when the ref changes.

  return <div ref={ref} {...props}></div>;
}
