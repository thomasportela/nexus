import { create } from "zustand";
import {
  orgMockNodes,
  orgMockProjects,
  type OrgNode,
  type Project,
} from "../data/orgMock";
import { computeUniformAngles, fixedProjectsAngle } from "../utils/layout";
import { normalizeAngle } from "../utils/polar";

export interface UIState {
  focusNodeId: string;
  hoveredNodeId?: string;
  selectedNodeId?: string;
  rightPanelOpen: boolean;
}

type OrgState = {
  nodesById: Record<string, OrgNode>;
  projects: Project[];
  ui: UIState;
  projectSearch: string;
  setHoveredNodeId: (id?: string) => void;
  setSelectedNodeId: (id?: string) => void;
  setProjectSearch: (value: string) => void;
  focusNode: (id: string) => void;
  goBack: () => void;
  setNodeTheta: (id: string, theta: number) => void;
  redistributeFocusedChildren: () => void;
};

function shouldOpenPanel(node?: OrgNode) {
  return !!node && (node.type === "sector" || node.type === "subsector");
}

function redistributeChildren(nodesById: Record<string, OrgNode>, focusNodeId: string) {
  const focus = nodesById[focusNodeId];
  if (!focus) return nodesById;

  const childIds = focus.childrenIds;
  const orbitals = childIds.filter((id) => nodesById[id]?.type !== "projects_container");
  const projectsNodeId = childIds.find((id) => nodesById[id]?.type === "projects_container");
  const targetAngles = computeUniformAngles(orbitals.length);

  const next = { ...nodesById };
  orbitals.forEach((id, index) => {
    next[id] = { ...next[id], theta: targetAngles[index] };
  });
  if (projectsNodeId) {
    next[projectsNodeId] = {
      ...next[projectsNodeId],
      theta: fixedProjectsAngle(),
    };
  }
  return next;
}

export const useOrgStore = create<OrgState>((set) => ({
  nodesById: orgMockNodes,
  projects: orgMockProjects,
  ui: {
    focusNodeId: "company_1",
    hoveredNodeId: undefined,
    selectedNodeId: undefined,
    rightPanelOpen: false,
  },
  projectSearch: "",
  setHoveredNodeId: (id) =>
    set((state) => {
      if (state.ui.hoveredNodeId === id) return state;
      return { ui: { ...state.ui, hoveredNodeId: id } };
    }),
  setSelectedNodeId: (id) =>
    set((state) => {
      if (state.ui.selectedNodeId === id) return state;
      return { ui: { ...state.ui, selectedNodeId: id } };
    }),
  setProjectSearch: (value) => set({ projectSearch: value }),
  focusNode: (id) =>
    set((state) => {
      const nextFocus = state.nodesById[id];
      if (!nextFocus) return state;
      return {
        ui: {
          ...state.ui,
          focusNodeId: id,
          selectedNodeId: id,
          hoveredNodeId: undefined,
          rightPanelOpen: shouldOpenPanel(nextFocus),
        },
      };
    }),
  goBack: () =>
    set((state) => {
      const focus = state.nodesById[state.ui.focusNodeId];
      if (!focus?.parentId) return state;
      const parent = state.nodesById[focus.parentId];
      return {
        ui: {
          ...state.ui,
          focusNodeId: focus.parentId,
          selectedNodeId: focus.parentId,
          hoveredNodeId: undefined,
          rightPanelOpen: shouldOpenPanel(parent),
        },
      };
    }),
  setNodeTheta: (id, theta) =>
    set((state) => {
      const node = state.nodesById[id];
      if (!node) return state;
      return {
        nodesById: {
          ...state.nodesById,
          [id]: { ...node, theta: normalizeAngle(theta) },
        },
      };
    }),
  redistributeFocusedChildren: () =>
    set((state) => ({
      nodesById: redistributeChildren(state.nodesById, state.ui.focusNodeId),
    })),
}));
