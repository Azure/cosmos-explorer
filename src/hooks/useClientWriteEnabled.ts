import { create } from "zustand";
interface ClientWriteEnabledState {
  clientWriteEnabled: boolean;
  setClientWriteEnabled: (writeEnabled: boolean) => void;
}

export const useClientWriteEnabled = create<ClientWriteEnabledState>((set) => ({
  clientWriteEnabled: true,
  setClientWriteEnabled: (clientWriteEnabled: boolean) => set({ clientWriteEnabled }),
}));
