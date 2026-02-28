import * as PIXI from "pixi.js";
import { type OrgNode } from "../../data/orgMock";
import { uiTheme } from "../../theme/uiTheme";

export const NODE_CARD_TOKENS = {
  text: uiTheme.card.text,
  textSecondary: uiTheme.card.textSecondary,
  border: uiTheme.card.border,
  borderHover: uiTheme.card.borderHover,
  borderSelected: uiTheme.card.borderSelected,
  fill: uiTheme.card.fill,
  fillHover: uiTheme.card.fillHover,
  fillProjects: uiTheme.card.fillProjects,
  shadow: uiTheme.card.shadow,
  shadowHover: 0x8ea2ff,
  shadowAlpha: 0.055,
  shadowAlphaHover: 0.085,
  shadowBlur: 10,
  shadowSpread: 1,
  shadowLayers: 7,
  glowHover: 0x9aaeff,
  glowSelected: 0x000000,
  glowAlphaHover: 0.26,
  glowAlphaSelected: 0.08,
  radiusCenter: 12,
  radiusDefault: 10,
} as const;

export type NodeCardSize = {
  width: number;
  height: number;
};

export type NodeShadowOffset = {
  x: number;
  y: number;
};

export function getNodeCardSize(node: OrgNode, isCenter: boolean): NodeCardSize {
  if (isCenter) return { width: 236, height: 92 };
  if (node.type === "sector") return { width: 200, height: 78 };
  if (node.type === "subsector") return { width: 176, height: 70 };
  if (node.type === "projects_container") return { width: 164, height: 66 };
  return { width: 188, height: 74 };
}

export function drawNodeCard(
  g: PIXI.Graphics,
  node: OrgNode,
  size: NodeCardSize,
  highlighted: boolean,
  selected: boolean,
  shadowOffset: NodeShadowOffset = { x: 0, y: 0 },
) {
  g.clear();

  const fill = node.type === "projects_container"
    ? NODE_CARD_TOKENS.fillProjects
    : highlighted
      ? NODE_CARD_TOKENS.fillHover
      : NODE_CARD_TOKENS.fill;
  const shadowColor = highlighted ? NODE_CARD_TOKENS.shadowHover : NODE_CARD_TOKENS.shadow;
  const shadowAlpha = highlighted
    ? NODE_CARD_TOKENS.shadowAlphaHover
    : NODE_CARD_TOKENS.shadowAlpha;
  const glowColor = selected
    ? NODE_CARD_TOKENS.glowSelected
    : NODE_CARD_TOKENS.glowHover;
  const glowAlpha = selected
    ? NODE_CARD_TOKENS.glowAlphaSelected
    : NODE_CARD_TOKENS.glowAlphaHover;
  const radius = node.type === "company"
    ? NODE_CARD_TOKENS.radiusCenter
    : NODE_CARD_TOKENS.radiusDefault;

  if (highlighted || selected) {
    g.roundRect(
      -size.width / 2 - 2,
      -size.height / 2 - 2,
      size.width + 4,
      size.height + 4,
      radius + 1,
    ).stroke({
      width: selected ? 1.6 : 1.2,
      color: glowColor,
      alpha: glowAlpha,
    });
  }

  // Figma-like shadow: centered (x=0, y=0) with soft blur + slight spread.
  for (let i = 0; i < NODE_CARD_TOKENS.shadowLayers; i += 1) {
    const t = NODE_CARD_TOKENS.shadowLayers <= 1
      ? 1
      : i / (NODE_CARD_TOKENS.shadowLayers - 1);
    const spread = NODE_CARD_TOKENS.shadowSpread + t * NODE_CARD_TOKENS.shadowBlur;
    const alpha = shadowAlpha * (1 - t) * (1 - t);

    g.roundRect(
      -size.width / 2 - spread + shadowOffset.x,
      -size.height / 2 - spread + shadowOffset.y,
      size.width + spread * 2,
      size.height + spread * 2,
      radius + spread * 0.35,
    ).fill({
      color: shadowColor,
      alpha,
    });
  }

  g.roundRect(-size.width / 2, -size.height / 2, size.width, size.height, radius).fill(fill);
}

export function createNodeLabel(
  app: PIXI.Application,
  text: string,
  size: number,
  width?: number,
  color: number = NODE_CARD_TOKENS.text,
  weight: "500" | "600" | "700" = "700",
) {
  const label = new PIXI.Text({
    text,
    style: new PIXI.TextStyle({
      fill: color,
      fontSize: size,
      fontWeight: weight,
      fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
      align: "center",
      wordWrap: !!width,
      wordWrapWidth: width,
    }),
  });
  label.anchor.set(0.5);
  label.resolution = Math.min(4, Math.max(2, (app.renderer.resolution || 1) * 1.5));
  label.roundPixels = false;
  return label;
}
