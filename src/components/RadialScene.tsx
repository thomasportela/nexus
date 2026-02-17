import { useEffect } from "react";
import * as PIXI from "pixi.js";
import { usePixiApp } from "../canvas/PixiAppContext";
import { graphById, type NexusNode } from "../data/graph";
import { computeRadialPositions } from "../engine/radialLayout";
import { useNexusStore } from "../state/nexusStore";

const BACKGROUND = 0xf4f5f7;
const STROKE = 0x1f2937;
const FILL = 0xffffff;
const SYSTEM_FILL = 0xe7eefc;

function drawNodeShape(
  g: PIXI.Graphics,
  node: NexusNode,
  radius: number,
  isCenter: boolean,
) {
  g.clear();
  const fill = node.type === "system_team" ? SYSTEM_FILL : FILL;
  const width = isCenter ? 2.5 : 2;
  g.circle(0, 0, radius).fill(fill).stroke({ width, color: STROKE });
}

export function RadialScene() {
  const app = usePixiApp();
  const currentNodeId = useNexusStore((s) => s.currentNodeId);
  const selectedNodeId = useNexusStore((s) => s.selectedNodeId);
  const setCurrentNodeId = useNexusStore((s) => s.setCurrentNodeId);
  const setSelectedNodeId = useNexusStore((s) => s.setSelectedNodeId);

  useEffect(() => {
    const root = new PIXI.Container();
    const current = graphById[currentNodeId];
    if (!current) return;

    app.renderer.background.color = BACKGROUND;

    const centerX = app.screen.width / 2;
    const centerY = app.screen.height / 2;

    const visibleChildren = current.childrenIds.slice(0, 8);
    const childRadius = Math.min(240, Math.max(130, app.screen.width * 0.22));
    const childPositions = computeRadialPositions(
      visibleChildren,
      centerX,
      centerY,
      childRadius,
    );
    const childById = new Map(childPositions.map((p) => [p.id, p]));

    if (selectedNodeId) {
      const selected = graphById[selectedNodeId];
      const line = new PIXI.Graphics();

      if (selectedNodeId === currentNodeId) {
        for (const p of childPositions) {
          line.moveTo(centerX, centerY);
          line.lineTo(p.x, p.y);
          line.stroke({ width: 1.25, color: 0x9ca3af, alpha: 0.85 });
        }
      } else if (selected && childById.has(selected.id)) {
        const p = childById.get(selected.id)!;
        line.moveTo(centerX, centerY);
        line.lineTo(p.x, p.y);
        line.stroke({ width: 1.25, color: 0x9ca3af, alpha: 0.85 });
      }

      root.addChild(line);
    }

    const centerNode = new PIXI.Container();
    centerNode.position.set(centerX, centerY);
    centerNode.eventMode = "static";
    centerNode.cursor = "pointer";

    const centerShape = new PIXI.Graphics();
    drawNodeShape(centerShape, current, 56, true);
    centerNode.addChild(centerShape);

    const centerLabel = new PIXI.Text({
      text: current.label,
      style: new PIXI.TextStyle({
        fill: STROKE,
        fontSize: 20,
        fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
        align: "center",
      }),
    });
    centerLabel.anchor.set(0.5);
    centerNode.addChild(centerLabel);

    centerNode.on("pointertap", () => setSelectedNodeId(current.id));
    root.addChild(centerNode);

    for (const p of childPositions) {
      const child = graphById[p.id];
      if (!child) continue;

      const childNode = new PIXI.Container();
      childNode.position.set(p.x, p.y);
      childNode.eventMode = "static";
      childNode.cursor = "pointer";

      const childShape = new PIXI.Graphics();
      drawNodeShape(childShape, child, 40, false);
      childNode.addChild(childShape);

      const childLabel = new PIXI.Text({
        text: child.label,
        style: new PIXI.TextStyle({
          fill: STROKE,
          fontSize: 14,
          fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
          align: "center",
          wordWrap: true,
          wordWrapWidth: 110,
        }),
      });
      childLabel.anchor.set(0.5);
      childNode.addChild(childLabel);

      childNode.on("pointertap", () => {
        setSelectedNodeId(child.id);
        setCurrentNodeId(child.id);
      });

      root.addChild(childNode);
    }

    app.stage.addChild(root);

    return () => {
      app.stage.removeChild(root);
      root.destroy({ children: true });
    };
  }, [
    app,
    currentNodeId,
    selectedNodeId,
    setCurrentNodeId,
    setSelectedNodeId,
  ]);

  return null;
}
