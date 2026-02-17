import { useEffect, useRef, useState, type ReactNode } from "react";
import * as PIXI from "pixi.js";
import { PixiAppContext } from "./PixiAppContext";

type CanvasViewProps = {
  children?: ReactNode;
};

export function CanvasView({ children }: CanvasViewProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [app, setApp] = useState<PIXI.Application | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let destroyed = false;
    const pixi = new PIXI.Application();

    (async () => {
      await pixi.init({
        resizeTo: host,
        backgroundColor: 0xffffff,
        antialias: true,
      });

      if (destroyed) return;

      host.appendChild(pixi.canvas);
      setApp(pixi);
    })();

    return () => {
      destroyed = true;
      setApp(null);

      if (host.contains(pixi.canvas)) host.removeChild(pixi.canvas);
      pixi.destroy(true);
    };
  }, []);

  return (
    <div ref={hostRef} style={{ position: "fixed", inset: 0 }}>
      {app ? (
        <PixiAppContext.Provider value={app}>
          {children}
        </PixiAppContext.Provider>
      ) : null}
    </div>
  );
}
