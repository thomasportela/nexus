import {
  computeUniformAngles,
  fixedProjectsAngle,
  orbitRadiusForDepth,
} from "../utils/layout";

export type NodeType =
  | "company"
  | "sector"
  | "subsector"
  | "projects_container";

export interface OrgNode {
  id: string;
  type: NodeType;
  title: string;
  parentId: string | null;
  childrenIds: string[];
  theta: number;
  radius: number;
}

export interface Project {
  id: string;
  sectorNodeId: string;
  title: string;
  status?: "active" | "paused" | "done";
  sharedWithNodeIds?: string[];
}

function makeNodes(): Record<string, OrgNode> {
  const rootChildren = ["sector_tech", "sector_marketing", "sector_ops", "sector_people"];
  const rootAngles = computeUniformAngles(rootChildren.length);

  const nodes: Record<string, OrgNode> = {
    company_1: {
      id: "company_1",
      type: "company",
      title: "Nexus Corp",
      parentId: null,
      childrenIds: rootChildren,
      theta: 0,
      radius: 0,
    },
  };

  rootChildren.forEach((id, index) => {
    const titleMap: Record<string, string> = {
      sector_tech: "Tech",
      sector_marketing: "Marketing",
      sector_ops: "Operations",
      sector_people: "People",
    };
    nodes[id] = {
      id,
      type: "sector",
      title: titleMap[id],
      parentId: "company_1",
      childrenIds: [],
      theta: rootAngles[index],
      radius: orbitRadiusForDepth(1),
    };
  });

  const techChildren = [
    "sub_platform",
    "sub_product_eng",
    "sub_data",
    "projects_sector_tech",
  ];
  const techAngles = computeUniformAngles(3);
  nodes.sector_tech.childrenIds = techChildren;
  nodes.sub_platform = {
    id: "sub_platform",
    type: "subsector",
    title: "Platform",
    parentId: "sector_tech",
    childrenIds: [],
    theta: techAngles[0],
    radius: orbitRadiusForDepth(2),
  };
  nodes.sub_product_eng = {
    id: "sub_product_eng",
    type: "subsector",
    title: "Product Eng",
    parentId: "sector_tech",
    childrenIds: [],
    theta: techAngles[1],
    radius: orbitRadiusForDepth(2),
  };
  nodes.sub_data = {
    id: "sub_data",
    type: "subsector",
    title: "Data",
    parentId: "sector_tech",
    childrenIds: [],
    theta: techAngles[2],
    radius: orbitRadiusForDepth(2),
  };
  nodes.projects_sector_tech = {
    id: "projects_sector_tech",
    type: "projects_container",
    title: "Projetos",
    parentId: "sector_tech",
    childrenIds: [],
    theta: fixedProjectsAngle(),
    radius: orbitRadiusForDepth(2),
  };

  // Example deeper hierarchy
  const platformChildren = ["sub_platform_core", "projects_sub_platform"];
  nodes.sub_platform.childrenIds = platformChildren;
  nodes.sub_platform_core = {
    id: "sub_platform_core",
    type: "subsector",
    title: "Core Services",
    parentId: "sub_platform",
    childrenIds: [],
    theta: computeUniformAngles(1)[0],
    radius: orbitRadiusForDepth(2),
  };
  nodes.projects_sub_platform = {
    id: "projects_sub_platform",
    type: "projects_container",
    title: "Projetos",
    parentId: "sub_platform",
    childrenIds: [],
    theta: fixedProjectsAngle(),
    radius: orbitRadiusForDepth(2),
  };

  return nodes;
}

function makeProjects(): Project[] {
  return [
    "Infra Refresh",
    "Observability v2",
    "API Gateway Rollout",
    "Data Contracts",
    "CI Runtime Upgrade",
    "Permissions Revamp",
    "Platform Docs",
    "Incident Automation",
    "Service Template",
    "Billing Sync",
  ].map((title, i) => ({
    id: `project_${i + 1}`,
    sectorNodeId: i < 7 ? "sector_tech" : "sub_platform",
    title,
    status: i % 3 === 0 ? "active" : i % 3 === 1 ? "paused" : "done",
  }));
}

export const orgMockNodes = makeNodes();
export const orgMockProjects = makeProjects();
