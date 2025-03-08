import create, { UseStore } from "zustand";
interface ClientWriteEnabledState {
  clientWriteEnabled: boolean;
  setClientWriteEnabled: (writeEnabled: boolean) => void;
}

export const useClientWriteEnabled: UseStore<ClientWriteEnabledState> = create((set) => ({
  clientWriteEnabled: true,
  setClientWriteEnabled: (clientWriteEnabled: boolean) => set({ clientWriteEnabled }),
}));
