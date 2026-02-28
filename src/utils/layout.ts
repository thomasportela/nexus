import { normalizeAngle } from "./polar";

export function computeUniformAngles(count: number, startAngle = -Math.PI / 2) {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, i) =>
    normalizeAngle(startAngle + (i / count) * Math.PI * 2),
  );
}

export function fixedProjectsAngle() {
  // Lower-right quadrant for predictable panel relationship.
  return normalizeAngle(Math.PI / 4);
}

export function orbitRadiusForDepth(depth: number) {
  if (depth <= 0) return 0;
  return depth === 1 ? 310 : 260;
}
