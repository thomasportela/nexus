import { useMemo } from "react";
import { useOrgStore } from "../store/useOrgStore";
import { uiTheme } from "../theme/uiTheme";

export function RightPanel() {
  const nodesById = useOrgStore((s) => s.nodesById);
  const projects = useOrgStore((s) => s.projects);
  const ui = useOrgStore((s) => s.ui);
  const projectSearch = useOrgStore((s) => s.projectSearch);
  const setProjectSearch = useOrgStore((s) => s.setProjectSearch);

  const focus = nodesById[ui.focusNodeId];
  const panelNodeIds = useMemo(() => {
    if (!focus) return [];
    return [focus.id, ...(focus.childrenIds ?? [])];
  }, [focus]);

  const filteredProjects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase();
    return projects
      .filter((p) => panelNodeIds.includes(p.sectorNodeId))
      .filter((p) => (query ? p.title.toLowerCase().includes(query) : true));
  }, [projects, panelNodeIds, projectSearch]);

  const shouldShowHint = !focus || !ui.rightPanelOpen;

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 392,
        maxWidth: "min(392px, 92vw)",
        height: "100vh",
        background: uiTheme.css.panelBg,
        borderLeft: `1px solid ${uiTheme.css.panelBorder}`,
        boxShadow: `-8px 0 22px ${uiTheme.css.panelShadow}`,
        padding: 20,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        transform: ui.rightPanelOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 220ms ease-in-out",
        zIndex: 15,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
            fontSize: 11,
            color: uiTheme.css.textSecondary,
            marginBottom: 6,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          Setor
        </div>
        <div
          style={{
            fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
            fontSize: 20,
            color: uiTheme.css.text,
            fontWeight: 700,
            letterSpacing: -0.2,
          }}
        >
          {focus?.title ?? "Projetos"}
        </div>
      </div>

      {shouldShowHint ? (
        <div
          style={{
            marginTop: 12,
            color: uiTheme.css.textSecondary,
            fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
            fontSize: 14,
            lineHeight: 1.4,
          }}
        >
          Selecione um setor para ver os projetos.
        </div>
      ) : (
        <>
          <input
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            placeholder="Buscar projeto..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: `1px solid ${uiTheme.css.panelBorder}`,
              borderRadius: 10,
              padding: "11px 12px",
              background: uiTheme.css.cardBg,
              outline: "none",
              fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
              fontSize: 14,
              color: uiTheme.css.text,
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              overflowY: "auto",
              paddingRight: 4,
              flex: 1,
              minHeight: 0,
            }}
          >
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                style={{
                  background: uiTheme.css.cardBg,
                  border: `1px solid ${uiTheme.css.panelBorder}`,
                  borderRadius: 10,
                  padding: "11px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: `0 4px 12px ${uiTheme.css.panelShadow}`,
                }}
              >
                <div
                  style={{
                    color: uiTheme.css.text,
                    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {project.title}
                </div>
                <span
                  style={{
                    borderRadius: 999,
                    padding: "3px 8px",
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
                    color: uiTheme.css.textTertiary,
                    background:
                      project.status === "active"
                        ? uiTheme.css.badgeBg
                        : project.status === "paused"
                          ? uiTheme.css.cardMutedBg
                          : uiTheme.css.badgeBg,
                    border: `1px solid ${uiTheme.css.panelBorder}`,
                  }}
                >
                  {project.status ?? "active"}
                </span>
              </div>
            ))}
            {filteredProjects.length === 0 ? (
              <div
                style={{
                  color: uiTheme.css.textSecondary,
                  fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
                  fontSize: 13,
                  padding: "8px 2px",
                }}
              >
                Nenhum projeto encontrado.
              </div>
            ) : null}
          </div>
        </>
      )}
    </aside>
  );
}
