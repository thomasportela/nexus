import { createContext, useContext } from "react";
import * as PIXI from "pixi.js";

export const PixiAppContext = createContext<PIXI.Application | null>(null);

export function usePixiApp() {
    const app = useContext(PixiAppContext);
    if (!app) throw new Error("usePixiApp must be used inside PixiAppContext.Provider");
    return app;
}
