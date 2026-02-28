import { useEffect, useRef, useState, type ReactNode } from "react";
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import { PixiAppContext } from "./PixiAppContext";
import { ViewportContext } from "./ViewportContext";
import { uiTheme } from "../theme/uiTheme";

type CanvasViewProps = {
  children?: ReactNode;
};

export function CanvasView({ children }: CanvasViewProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [app, setApp] = useState<PIXI.Application | null>(null);
  const [viewport, setViewport] = useState<Viewport | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let destroyed = false;
    const pixi = new PIXI.Application();
    let viewportInstance: Viewport | null = null;
    let resizeHandler: (() => void) | null = null;

    (async () => {
      await pixi.init({
        resizeTo: host,
        backgroundColor: uiTheme.pixi.canvasBackground,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });

      if (destroyed) return;

      viewportInstance = new Viewport({
        screenWidth: host.clientWidth,
        screenHeight: host.clientHeight,
        worldWidth: 5000,
        worldHeight: 5000,
        events: pixi.renderer.events,
      });

      viewportInstance
        .drag()
        .wheel({ smooth: 2 })
        .pinch()
        .decelerate();

      viewportInstance.moveCenter(2500, 2500);
      pixi.stage.addChild(viewportInstance);

      resizeHandler = () => {
        if (!viewportInstance) return;
        viewportInstance.resize(
          host.clientWidth,
          host.clientHeight,
          viewportInstance.worldWidth,
          viewportInstance.worldHeight,
        );
      };
      pixi.renderer.on("resize", resizeHandler);

      host.appendChild(pixi.canvas);
      setApp(pixi);
      setViewport(viewportInstance);
    })();

    return () => {
      destroyed = true;
      setViewport(null);
      setApp(null);

      if (resizeHandler) {
        pixi.renderer.off("resize", resizeHandler);
      }

      if (viewportInstance) {
        pixi.stage.removeChild(viewportInstance);
        viewportInstance.destroy({ children: true });
      }

      if (host.contains(pixi.canvas)) host.removeChild(pixi.canvas);
      pixi.destroy(true);
    };
  }, []);

  return (
    <div ref={hostRef} style={{ position: "fixed", inset: 0 }}>
      {app && viewport ? (
        <PixiAppContext.Provider value={app}>
          <ViewportContext.Provider value={viewport}>
            {children}
          </ViewportContext.Provider>
        </PixiAppContext.Provider>
      ) : null}
    </div>
  );
}
