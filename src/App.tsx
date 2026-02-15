import { CanvasView } from "./canvas/CanvasView";
import { Node } from "./canvas/Node";

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <CanvasView>
        <Node id="n1" x={200} y={200} radius={48} title="Ideia 1" />
        <Node id="n2" x={420} y={260} radius={60} title="Portal de Projeto" isPortal />
        <Node id="n3" x={260} y={420} radius={44} title="Rascunho" />
      </CanvasView>
    </div>
  );
}
