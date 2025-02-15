import create, { UseStore } from "zustand";
import { userContext } from "../UserContext";

interface ClientWriteEnabledState {
  clientWriteEnabled: boolean;
  setClientWriteEnabled: (writeEnabled: boolean) => void;
}

export const useClientWriteEnabled: UseStore<ClientWriteEnabledState> = create((set) => ({
  clientWriteEnabled: userContext.writeEnabledInSelectedRegion ?? true,
  setClientWriteEnabled: (clientWriteEnabled: boolean) => set({ clientWriteEnabled }),
}));
