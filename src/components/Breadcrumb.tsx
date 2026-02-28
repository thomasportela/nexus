import { useMemo } from "react";
import { useOrgStore } from "../store/useOrgStore";
import { uiTheme } from "../theme/uiTheme";

export function Breadcrumb() {
  const nodesById = useOrgStore((s) => s.nodesById);
  const focusNodeId = useOrgStore((s) => s.ui.focusNodeId);
  const goBack = useOrgStore((s) => s.goBack);
  const focusNode = useOrgStore((s) => s.focusNode);

  const trail = useMemo(() => {
    const items: { id: string; title: string }[] = [];
    let current = nodesById[focusNodeId];
    while (current) {
      items.unshift({ id: current.id, title: current.title });
      if (!current.parentId) break;
      current = nodesById[current.parentId];
    }
    return items;
  }, [nodesById, focusNodeId]);

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        left: 16,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: uiTheme.css.overlayBg,
        border: `1px solid ${uiTheme.css.panelBorder}`,
        borderRadius: 10,
        padding: "8px 12px",
        boxShadow: `0 6px 18px ${uiTheme.css.panelShadow}`,
      }}
    >
      <button
        type="button"
        onClick={goBack}
        disabled={trail.length <= 1}
        style={{
          border: `1px solid ${uiTheme.css.panelBorder}`,
          borderRadius: 999,
          padding: "6px 11px",
          background: trail.length <= 1 ? uiTheme.css.cardMutedBg : uiTheme.css.cardBg,
          color: uiTheme.css.text,
          cursor: trail.length <= 1 ? "default" : "pointer",
          fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 0.2,
        }}
      >
        Voltar
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {trail.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => focusNode(item.id)}
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              margin: 0,
              color: index === trail.length - 1 ? uiTheme.css.text : uiTheme.css.textSecondary,
              fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
              fontSize: 12,
              fontWeight: index === trail.length - 1 ? 700 : 500,
              cursor: "pointer",
            }}
          >
            {index > 0 ? " / " : ""}
            {item.title}
          </button>
        ))}
      </div>
    </div>
  );
}
