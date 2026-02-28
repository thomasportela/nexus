import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { usePixiApp } from "../canvas/PixiAppContext";
import { useViewport } from "../canvas/ViewportContext";
import { type OrgNode } from "../data/orgMock";
import { useOrgStore } from "../store/useOrgStore";
import { angleFromPoint, polarToCartesian } from "../utils/polar";
import {
  createNodeLabel,
  drawNodeCard,
  getNodeCardSize,
  NODE_CARD_TOKENS,
} from "./canvas/nodeCard";
import { uiTheme } from "../theme/uiTheme";

const BG = uiTheme.pixi.sceneBackground;
const DOT = uiTheme.pixi.gridDot;
const WIRE = uiTheme.pixi.wire;

type DisplayNode = {
  node: OrgNode;
  isCenter: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};

function getShadowOffsetFromCenter(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  isCenter: boolean,
) {
  if (isCenter) return { x: 0, y: 1.4 };
  const dx = x - centerX;
  const dy = y - centerY;
  const len = Math.hypot(dx, dy) || 1;
  const strength = 2.8;
  return {
    x: (dx / len) * strength,
    y: (dy / len) * strength,
  };
}

function isFocusPanelNode(node: OrgNode) {
  return node.type === "sector" || node.type === "subsector";
}

function drawGrid(g: PIXI.Graphics, width: number, height: number, spacing = 58) {
  g.clear();
  g.rect(0, 0, width, height).fill(BG);
  for (let x = 6; x < width; x += spacing) {
    for (let y = 6; y < height; y += spacing) {
      g.circle(x, y, 1.35).fill({ color: DOT, alpha: 0.2 });
    }
  }
}

function drawWire(
  g: PIXI.Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  alpha: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const sag = Math.min(28, Math.max(10, len * 0.08));
  const cx = (x1 + x2) / 2 + nx * sag;
  const cy = (y1 + y2) / 2 + ny * sag;

  g.moveTo(x1, y1);
  g.quadraticCurveTo(cx, cy, x2, y2);
  g.stroke({ width: 1.35, color: WIRE, alpha, cap: "round" });
}

function toWorldPoint(viewport: ReturnType<typeof useViewport>, point: PIXI.PointData) {
  const world = viewport.toWorld(point.x, point.y);
  return { x: world.x, y: world.y };
}

export function OrgCanvas() {
  const app = usePixiApp();
  const viewport = useViewport();
  const lastCenteredFocusIdRef = useRef<string | null>(null);

  const nodesById = useOrgStore((s) => s.nodesById);
  const projects = useOrgStore((s) => s.projects);
  const focusNodeId = useOrgStore((s) => s.ui.focusNodeId);
  const selectedNodeId = useOrgStore((s) => s.ui.selectedNodeId);
  const setHoveredNodeId = useOrgStore((s) => s.setHoveredNodeId);
  const setSelectedNodeId = useOrgStore((s) => s.setSelectedNodeId);
  const focusNode = useOrgStore((s) => s.focusNode);
  const setNodeTheta = useOrgStore((s) => s.setNodeTheta);

  useEffect(() => {
    const world = new PIXI.Container();
    const grid = new PIXI.Graphics();
    const wires = new PIXI.Graphics();
    world.addChild(grid);
    world.addChild(wires);

    const focus = nodesById[focusNodeId];
    if (!focus) return;

    drawGrid(grid, viewport.worldWidth, viewport.worldHeight, 64);
    grid.eventMode = "static";
    const centerX = Math.round(viewport.worldWidth / 2);
    const centerY = Math.round(viewport.worldHeight / 2);

    const childNodes = focus.childrenIds
      .map((id) => nodesById[id])
      .filter((n): n is OrgNode => !!n);

    const displayNodes: DisplayNode[] = [];
    displayNodes.push({
      node: focus,
      isCenter: true,
      x: centerX,
      y: centerY,
      ...getNodeCardSize(focus, true),
    });

    for (const child of childNodes) {
      const p = polarToCartesian(centerX, centerY, child.radius, child.theta);
      displayNodes.push({
        node: child,
        isCenter: false,
        x: Math.round(p.x),
        y: Math.round(p.y),
        ...getNodeCardSize(child, false),
      });
    }

    const nodePositions = new Map<string, { x: number; y: number }>();
    for (const item of displayNodes) {
      nodePositions.set(item.node.id, { x: item.x, y: item.y });
    }

    const redrawWires = () => {
      wires.clear();
      for (const item of displayNodes) {
        if (item.isCenter) continue;
        const p = nodePositions.get(item.node.id) ?? { x: item.x, y: item.y };
        const highlighted =
          selectedNodeId === focus.id || selectedNodeId === item.node.id;
        drawWire(wires, centerX, centerY, p.x, p.y, highlighted ? 0.3 : 0.16);
      }

      const projectsContainer = displayNodes.find(
        (d) => d.node.type === "projects_container",
      );
      if (projectsContainer && isFocusPanelNode(focus)) {
        const p = nodePositions.get(projectsContainer.node.id) ?? {
          x: projectsContainer.x,
          y: projectsContainer.y,
        };
        const panelTargetX = viewport.worldWidth - 180;
        const panelTargetY = centerY;
        drawWire(wires, p.x, p.y, panelTargetX, panelTargetY, 0.2);
      }
    };

    redrawWires();

    const orbitContainers = new Map<string, PIXI.Container>();
    const nodeCards = new Map<string, PIXI.Graphics>();
    const nodeItems = new Map<string, DisplayNode>();
    const hoverAnimFrames = new Map<string, number>();
    const snapAnimFrames = new Map<string, number>();
    let hoveredNodeId: string | undefined;
    let suppressTapNodeId: string | undefined;
    let suppressTapUntil = 0;
    let activeDrag:
      | {
          nodeId: string;
          centerX: number;
          centerY: number;
          baseRadius: number;
          lastTheta: number;
          startWorldX: number;
          startWorldY: number;
          moved: boolean;
        }
      | null = null;

    const animateNodeScaleTo = (
      nodeId: string,
      container: PIXI.Container,
      targetScale: number,
      durationMs: number,
    ) => {
      const existing = hoverAnimFrames.get(nodeId);
      if (existing) cancelAnimationFrame(existing);
      const startScale = container.scale.x;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = 1 - (1 - t) * (1 - t);
        const nextScale = startScale + (targetScale - startScale) * eased;
        container.scale.set(nextScale);
        if (t < 1) {
          const raf = requestAnimationFrame(tick);
          hoverAnimFrames.set(nodeId, raf);
        } else {
          container.scale.set(targetScale);
          hoverAnimFrames.delete(nodeId);
        }
      };
      const raf = requestAnimationFrame(tick);
      hoverAnimFrames.set(nodeId, raf);
    };

    const setHoveredVisual = (nextId?: string) => {
      if (hoveredNodeId === nextId) return;

      if (hoveredNodeId) {
        const prevCard = nodeCards.get(hoveredNodeId);
        const prevItem = nodeItems.get(hoveredNodeId);
        const prevContainer = orbitContainers.get(hoveredNodeId);
        if (prevCard && prevItem) {
          drawNodeCard(
            prevCard,
            prevItem.node,
            { width: prevItem.width, height: prevItem.height },
            false,
            selectedNodeId === prevItem.node.id,
            getShadowOffsetFromCenter(
              prevItem.x,
              prevItem.y,
              centerX,
              centerY,
              prevItem.isCenter,
            ),
          );
        }
        if (prevContainer) {
          animateNodeScaleTo(hoveredNodeId, prevContainer, 1, 140);
        }
      }

      hoveredNodeId = nextId;

      if (nextId) {
        const nextCard = nodeCards.get(nextId);
        const nextItem = nodeItems.get(nextId);
        const nextContainer = orbitContainers.get(nextId);
        if (nextCard && nextItem) {
          drawNodeCard(
            nextCard,
            nextItem.node,
            { width: nextItem.width, height: nextItem.height },
            true,
            selectedNodeId === nextItem.node.id,
            getShadowOffsetFromCenter(
              nextItem.x,
              nextItem.y,
              centerX,
              centerY,
              nextItem.isCenter,
            ),
          );
        }
        if (nextContainer) {
          animateNodeScaleTo(nextId, nextContainer, 1.045, 140);
        }
      }
    };

    const redrawCardAtPosition = (nodeId: string, x: number, y: number) => {
      const card = nodeCards.get(nodeId);
      const item = nodeItems.get(nodeId);
      if (!card || !item) return;
      drawNodeCard(
        card,
        item.node,
        { width: item.width, height: item.height },
        hoveredNodeId === nodeId,
        selectedNodeId === nodeId,
        getShadowOffsetFromCenter(x, y, centerX, centerY, item.isCenter),
      );
    };

    grid.on("pointermove", () => {
      setHoveredNodeId(undefined);
      setHoveredVisual(undefined);
    });
    grid.on("pointerdown", () => {
      setHoveredNodeId(undefined);
      setHoveredVisual(undefined);
    });

    for (const item of displayNodes) {
      const c = new PIXI.Container();
      c.position.set(item.x, item.y);
      c.eventMode = "static";
      c.cursor = item.isCenter ? "default" : "pointer";

      const isSelected = selectedNodeId === item.node.id;
      const card = new PIXI.Graphics();
      drawNodeCard(
        card,
        item.node,
        { width: item.width, height: item.height },
        false,
        isSelected,
        getShadowOffsetFromCenter(item.x, item.y, centerX, centerY, item.isCenter),
      );
      c.addChild(card);
      nodeCards.set(item.node.id, card);
      nodeItems.set(item.node.id, item);

      if (item.node.type === "projects_container") {
        const relatedCount = projects.filter(
          (project) => project.sectorNodeId === item.node.parentId,
        ).length;
        const isEmpty = relatedCount === 0;

        const icon = new PIXI.Graphics();
        icon.roundRect(-item.width / 2 + 12, -9, 18, 18, 4)
          .stroke({ width: 1, color: uiTheme.pixi.projectsIcon, alpha: isEmpty ? 0.6 : 1 });
        icon.moveTo(-item.width / 2 + 18, -9);
        icon.lineTo(-item.width / 2 + 18, 9);
        icon.moveTo(-item.width / 2 + 12, -3);
        icon.lineTo(-item.width / 2 + 30, -3);
        icon.lineTo(-item.width / 2 + 30, -3);
        icon.stroke({ width: 1, color: uiTheme.pixi.projectsIcon, alpha: isEmpty ? 0.6 : 1 });
        c.addChild(icon);

        const title = createNodeLabel(
          app,
          item.node.title,
          12,
          88,
          NODE_CARD_TOKENS.text,
          "600",
        );
        title.anchor.set(0, 0.5);
        title.position.set(-item.width / 2 + 38, isEmpty ? -8 : -10);
        title.alpha = isEmpty ? 0.6 : 1;
        c.addChild(title);

        const meta = createNodeLabel(
          app,
          isEmpty ? "Nenhum projeto ativo" : `${relatedCount} projeto${relatedCount > 1 ? "s" : ""}`,
          10,
          110,
          NODE_CARD_TOKENS.textSecondary,
          "500",
        );
        meta.anchor.set(0, 0.5);
        meta.position.set(-item.width / 2 + 38, 10);
        meta.alpha = isEmpty ? 0.6 : 1;
        c.addChild(meta);

        const badge = new PIXI.Graphics();
        badge.roundRect(item.width / 2 - 36, -12, 24, 18, 9).fill({
          color: uiTheme.pixi.white,
          alpha: 1,
        }).stroke({ width: 1, color: NODE_CARD_TOKENS.border });
        c.addChild(badge);

        const badgeText = createNodeLabel(
          app,
          String(relatedCount),
          10,
          undefined,
          NODE_CARD_TOKENS.textSecondary,
          "600",
        );
        badgeText.position.set(item.width / 2 - 24, -3);
        c.addChild(badgeText);
      } else {
        const label = createNodeLabel(
          app,
          item.node.title,
          item.isCenter ? 20 : item.node.type === "sector" ? 15 : 13,
          item.isCenter ? 180 : 146,
          NODE_CARD_TOKENS.text,
          item.isCenter ? "700" : "600",
        );
        c.addChild(label);
      }

      if (!item.isCenter) {
        c.scale.set(1);
      }

      if (item.isCenter) {
        c.on("pointertap", (e) => {
          e.stopPropagation();
          setSelectedNodeId(item.node.id);
        });
      } else {
        c.on("pointerenter", () => {
          setHoveredNodeId(item.node.id);
          setHoveredVisual(item.node.id);
        });
        c.on("pointerleave", () => {
          setHoveredNodeId(undefined);
          if (hoveredNodeId === item.node.id) {
            setHoveredVisual(undefined);
          }
        });

        c.on("pointertap", (e) => {
          e.stopPropagation();
          if (
            suppressTapNodeId === item.node.id
            && performance.now() < suppressTapUntil
          ) {
            return;
          }
          if (activeDrag) return;
          setSelectedNodeId(item.node.id);
          if (item.node.type !== "projects_container") {
            focusNode(item.node.id);
          }
        });

        c.on("pointerdown", (e) => {
          e.stopPropagation();
          const world = toWorldPoint(viewport, e.global);
          activeDrag = {
            nodeId: item.node.id,
            centerX,
            centerY,
            baseRadius: item.node.radius,
            lastTheta: item.node.theta,
            startWorldX: world.x,
            startWorldY: world.y,
            moved: false,
          };
          c.cursor = "grabbing";
        });
      }

      orbitContainers.set(item.node.id, c);
      world.addChild(c);
    }

    const onPointerMove = (e: PIXI.FederatedPointerEvent) => {
      if (!activeDrag) return;
      const world = toWorldPoint(viewport, e.global);
      const theta = angleFromPoint(activeDrag.centerX, activeDrag.centerY, world.x, world.y);
      activeDrag.lastTheta = theta;
      const movedDistance = Math.hypot(
        world.x - activeDrag.startWorldX,
        world.y - activeDrag.startWorldY,
      );
      if (!activeDrag.moved && movedDistance > 4) {
        activeDrag.moved = true;
      }

      const rawRadius = Math.hypot(world.x - activeDrag.centerX, world.y - activeDrag.centerY);
      const delta = rawRadius - activeDrag.baseRadius;
      const resistedDelta = delta / (1 + Math.abs(delta) / 180);
      const previewRadius = Math.max(80, activeDrag.baseRadius + resistedDelta);
      const p = polarToCartesian(
        activeDrag.centerX,
        activeDrag.centerY,
        previewRadius,
        theta,
      );

      const c = orbitContainers.get(activeDrag.nodeId);
      if (c) {
        c.position.set(Math.round(p.x), Math.round(p.y));
      }
      const px = Math.round(p.x);
      const py = Math.round(p.y);
      nodePositions.set(activeDrag.nodeId, { x: px, y: py });
      redrawCardAtPosition(activeDrag.nodeId, px, py);
      redrawWires();
    };

    const endDrag = () => {
      if (!activeDrag) return;
      const draggedId = activeDrag.nodeId;
      const theta = activeDrag.lastTheta;
      const baseRadius = activeDrag.baseRadius;
      const moved = activeDrag.moved;
      activeDrag = null;
      const c = orbitContainers.get(draggedId);
      if (c) c.cursor = "pointer";
      if (!c) {
        setNodeTheta(draggedId, theta);
        return;
      }

      if (moved) {
        suppressTapNodeId = draggedId;
        suppressTapUntil = performance.now() + 260;
      }

      const existing = snapAnimFrames.get(draggedId);
      if (existing) {
        cancelAnimationFrame(existing);
        snapAnimFrames.delete(draggedId);
      }

      const target = polarToCartesian(centerX, centerY, baseRadius, theta);
      const startX = c.position.x;
      const startY = c.position.y;
      const endX = Math.round(target.x);
      const endY = Math.round(target.y);
      const durationMs = 170;
      const start = performance.now();

      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3);
        const x = startX + (endX - startX) * eased;
        const y = startY + (endY - startY) * eased;
        c.position.set(x, y);
        const px = Math.round(x);
        const py = Math.round(y);
        nodePositions.set(draggedId, { x: px, y: py });
        redrawCardAtPosition(draggedId, px, py);
        redrawWires();
        if (t < 1) {
          const raf = requestAnimationFrame(tick);
          snapAnimFrames.set(draggedId, raf);
        } else {
          c.position.set(endX, endY);
          nodePositions.set(draggedId, { x: endX, y: endY });
          redrawCardAtPosition(draggedId, endX, endY);
          redrawWires();
          snapAnimFrames.delete(draggedId);
          setNodeTheta(draggedId, theta);
        }
      };

      const raf = requestAnimationFrame(tick);
      snapAnimFrames.set(draggedId, raf);
    };
    const clearHover = () => {
      setHoveredNodeId(undefined);
      setHoveredVisual(undefined);
    };

    viewport.on("pointermove", onPointerMove);
    viewport.on("pointerup", endDrag);
    viewport.on("pointerupoutside", endDrag);
    viewport.on("pointerleave", clearHover);

    viewport.addChild(world);
    if (lastCenteredFocusIdRef.current !== focus.id) {
      viewport.moveCenter(centerX, centerY);
      lastCenteredFocusIdRef.current = focus.id;
    }

    return () => {
      viewport.off("pointermove", onPointerMove);
      viewport.off("pointerup", endDrag);
      viewport.off("pointerupoutside", endDrag);
      viewport.off("pointerleave", clearHover);
      for (const raf of hoverAnimFrames.values()) {
        cancelAnimationFrame(raf);
      }
      hoverAnimFrames.clear();
      for (const raf of snapAnimFrames.values()) {
        cancelAnimationFrame(raf);
      }
      snapAnimFrames.clear();
      viewport.removeChild(world);
      world.destroy({ children: true });
    };
  }, [
    app,
    viewport,
    nodesById,
    projects,
    focusNodeId,
    selectedNodeId,
    setHoveredNodeId,
    setSelectedNodeId,
    focusNode,
    setNodeTheta,
  ]);

  return null;
}
