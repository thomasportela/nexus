export type NodeType =
  | "company"
  | "project"
  | "area"
  | "person"
  | "idea"
  | "system_team";

export type NexusNode = {
  id: string;
  label: string;
  type: NodeType;
  parentId: string | null;
  childrenIds: string[];
  roleLabel?: string;
};

export const graphById: Record<string, NexusNode> = {
  root: {
    id: "root",
    label: "Nexus",
    type: "company",
    parentId: null,
    childrenIds: ["proj_alpha", "proj_beta", "ops", "design", "people_pool"],
  },
  proj_alpha: {
    id: "proj_alpha",
    label: "Projeto Alpha",
    type: "project",
    parentId: "root",
    childrenIds: ["alpha_team", "alpha_area_product", "alpha_area_eng"],
  },
  alpha_team: {
    id: "alpha_team",
    label: "Equipe",
    type: "system_team",
    parentId: "proj_alpha",
    childrenIds: ["joao_alpha", "maria_alpha"],
  },
  joao_alpha: {
    id: "joao_alpha",
    label: "Joao - Projetista",
    type: "person",
    parentId: "alpha_team",
    childrenIds: [],
  },
  maria_alpha: {
    id: "maria_alpha",
    label: "Maria - PM",
    type: "person",
    parentId: "alpha_team",
    childrenIds: [],
  },
  alpha_area_product: {
    id: "alpha_area_product",
    label: "Area Produto",
    type: "area",
    parentId: "proj_alpha",
    childrenIds: ["alpha_idea_roadmap"],
  },
  alpha_idea_roadmap: {
    id: "alpha_idea_roadmap",
    label: "Roadmap Q2",
    type: "idea",
    parentId: "alpha_area_product",
    childrenIds: [],
  },
  alpha_area_eng: {
    id: "alpha_area_eng",
    label: "Area Engenharia",
    type: "area",
    parentId: "proj_alpha",
    childrenIds: [],
  },
  proj_beta: {
    id: "proj_beta",
    label: "Projeto Beta",
    type: "project",
    parentId: "root",
    childrenIds: ["beta_team", "beta_area_ops"],
  },
  beta_team: {
    id: "beta_team",
    label: "Equipe",
    type: "system_team",
    parentId: "proj_beta",
    childrenIds: ["leo_beta"],
  },
  leo_beta: {
    id: "leo_beta",
    label: "Leo - Dev",
    type: "person",
    parentId: "beta_team",
    childrenIds: [],
  },
  beta_area_ops: {
    id: "beta_area_ops",
    label: "Operacao Beta",
    type: "area",
    parentId: "proj_beta",
    childrenIds: [],
  },
  ops: {
    id: "ops",
    label: "Operacoes",
    type: "area",
    parentId: "root",
    childrenIds: [],
  },
  design: {
    id: "design",
    label: "Design",
    type: "area",
    parentId: "root",
    childrenIds: [],
  },
  people_pool: {
    id: "people_pool",
    label: "Pessoas",
    type: "area",
    parentId: "root",
    childrenIds: [],
  },
};
