import { useEffect } from "react";
import * as PIXI from "pixi.js";
import { usePixiApp } from "./PixiAppContext";

type NodeProps = {
  x: number;
  y: number;
  radius: number;
};

export function Node({ x, y, radius }: NodeProps) {
  const app = usePixiApp();

  useEffect(() => {
    const blob = new PIXI.Graphics();
    blob.position.set(x, y);

    const pointsCount = 72;
    const a = radius * 1.15;
    const b = radius * 0.95;
    const n = 3.2;

    const points: PIXI.Point[] = [];
    for (let i = 0; i < pointsCount; i++) {
      const t = (i / pointsCount) * Math.PI * 2;
      const ct = Math.cos(t);
      const st = Math.sin(t);
      const px = Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n) * a;
      const py = Math.sign(st) * Math.pow(Math.abs(st), 2 / n) * b;
      points.push(new PIXI.Point(px, py));
    }

    blob.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      blob.lineTo(points[i].x, points[i].y);
    }
    blob.closePath();
    blob.stroke({ width: 2, color: 0x222222, cap: "round", join: "round" });

    app.stage.addChild(blob);

    return () => {
      app.stage.removeChild(blob);
      blob.destroy();
    };
  }, [app, x, y, radius]);

  return null;
}
