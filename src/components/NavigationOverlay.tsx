import { graphById } from "../data/graph";
import { useNexusStore } from "../state/nexusStore";

export function NavigationOverlay() {
  const currentNodeId = useNexusStore((s) => s.currentNodeId);
  const setCurrentNodeId = useNexusStore((s) => s.setCurrentNodeId);

  const current = graphById[currentNodeId];
  const canGoBack = !!current?.parentId;

  if (!canGoBack || !current) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        left: 16,
        zIndex: 10,
      }}
    >
      <button
        type="button"
        onClick={() => setCurrentNodeId(current.parentId!)}
        style={{
          border: "1px solid #d1d5db",
          borderRadius: 999,
          padding: "8px 14px",
          background: "#ffffff",
          color: "#111827",
          fontSize: 13,
          fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
          cursor: "pointer",
        }}
      >
        Voltar
      </button>
    </div>
  );
}
