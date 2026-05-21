import create, { UseStore } from "zustand";

interface TerminalState {
  socket: WebSocket | undefined;
  setSocket: (socket: WebSocket) => void;
  sendMessage: (message: string) => void;
}

export const useTerminal: UseStore<TerminalState> = create((set, get) => ({
  socket: undefined,
  setSocket: (socket: WebSocket) => {
    set({ socket });
  },
  sendMessage: (message: string) => {
    const socket = get().socket;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(message + "\r");
    }
  },
}));
