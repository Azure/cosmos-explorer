import create from "zustand";

interface QueryMetadataStore {
  userQuery: string;
  databaseId: string;
  containerId: string;
  setMetadata: (query1: string, db: string, container: string) => void;
}

export const useQueryMetadataStore = create<QueryMetadataStore>((set) => ({
  userQuery: "",
  databaseId: "",
  containerId: "",
  setMetadata: (query1, db, container) => set({ userQuery: query1, databaseId: db, containerId: container }),
}));
