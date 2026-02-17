import { create } from "zustand";

type NexusState = {
  currentNodeId: string;
  selectedNodeId: string | null;
  setCurrentNodeId: (id: string) => void;
  setSelectedNodeId: (id: string | null) => void;
};

export const useNexusStore = create<NexusState>((set) => ({
  currentNodeId: "root",
  selectedNodeId: null,
  setCurrentNodeId: (id) => set({ currentNodeId: id, selectedNodeId: null }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
}));
