export type RadialPosition = {
  id: string;
  x: number;
  y: number;
};

export function computeRadialPositions(
  ids: string[],
  centerX: number,
  centerY: number,
  radius: number,
): RadialPosition[] {
  if (ids.length === 0) return [];

  return ids.map((id, index) => {
    const angle = (index / ids.length) * Math.PI * 2 - Math.PI / 2;
    return {
      id,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  });
}
