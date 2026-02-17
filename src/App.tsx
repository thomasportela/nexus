import { CanvasView } from "./canvas/CanvasView";
import { NavigationOverlay } from "./components/NavigationOverlay";
import { RadialScene } from "./components/RadialScene";

export default function App() {
  return (
    <>
      <CanvasView>
        <RadialScene />
      </CanvasView>
      <NavigationOverlay />
    </>
  );
}
