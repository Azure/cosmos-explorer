import postRobot from "post-robot";
import create, { UseStore } from "zustand";

interface TerminalState {
  terminalWindow: Window;
  setTerminal: (terminalWindow: Window) => void;
  sendMessage: (message: string) => void;
}

export const useTerminal: UseStore<TerminalState> = create((set, get) => ({
  terminalWindow: undefined,
  setTerminal: (terminalWindow: Window) => {
    set({ terminalWindow });
  },
  sendMessage: (message: string) => {
    const terminalWindow = get().terminalWindow;
    postRobot.send(
      terminalWindow,
      "sendMessage",
      { type: "stdin", content: [message] },
      {
        domain: window.location.origin,
      },
    );
  },
}));
