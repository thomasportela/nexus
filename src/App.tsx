import { CanvasView } from "./canvas/CanvasView";
import { Breadcrumb } from "./components/Breadcrumb";
import { OrgCanvas } from "./components/OrgCanvas";
import { RightPanel } from "./components/RightPanel";

export default function App() {
  return (
    <>
      <Breadcrumb />
      <CanvasView>
        <OrgCanvas />
      </CanvasView>
      <RightPanel />
    </>
  );
}
