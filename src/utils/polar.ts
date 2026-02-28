export function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  theta: number,
) {
  return {
    x: centerX + Math.cos(theta) * radius,
    y: centerY + Math.sin(theta) * radius,
  };
}

export function normalizeAngle(theta: number) {
  let a = theta % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  return a;
}

export function angleFromPoint(centerX: number, centerY: number, x: number, y: number) {
  return normalizeAngle(Math.atan2(y - centerY, x - centerX));
}
