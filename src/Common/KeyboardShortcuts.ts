import { KeyMap } from "react-hotkeys";

export const keyMap: KeyMap = {
  NEW_QUERY: {
    name: "New Query",
    sequence: "ctrl+j",
    action: "keydown",
  },
  CANCEL_QUERY: {
    name: "Cancel Query",
    sequence: "f8",
    action: "keydown",
  },
  DISCARD: {
    name: "Discard Changes",
    sequence: "ctrl+x",
    action: "keydown"
  }
};

export type KeyboardShortcutName = keyof typeof keyMap;

export type KeyboardShortcutHandlers = Partial<{
  [key in KeyboardShortcutName]: (keyEvent?: KeyboardEvent) => void;
}>;
