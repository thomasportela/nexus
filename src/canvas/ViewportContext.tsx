import { createContext, useContext } from "react";
import type { Viewport } from "pixi-viewport";

export const ViewportContext = createContext<Viewport | null>(null);

export function useViewport() {
  const viewport = useContext(ViewportContext);
  if (!viewport) {
    throw new Error("useViewport must be used inside ViewportContext.Provider");
  }
  return viewport;
}
