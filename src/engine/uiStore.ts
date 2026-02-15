import { create } from "zustand";

type UIState = {
    selectedNodeId: string | null;
    setSelectedNodeId: (id: string | null) => void;
};

export const useUIStore = create<UIState>((set) => ({
    selectedNodeId: null,
    setSelectedNodeId: (id) => set({ selectedNodeId: id }),
}));
