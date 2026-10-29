import { Link } from "react-router-dom";
import RobotLinkBadges from "../robot/RobotLinkBadges";
import { useControlMode } from "../../hooks/useControlMode";
import { useSimMode } from "../../hooks/useSimMode";
import { useTheme } from "../../state/ThemeContext";
import Badge from "../common/Badge";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      onClick={toggleTheme}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      className="w-8 h-8 flex items-center justify-center rounded-full text-vision-muted hover:bg-vision-hover/10 hover:text-vision-text transition"
    >
      {isLight ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      )}
    </button>
  );
}

export default function Topbar() {
  const { mode } = useControlMode();
  const sim = useSimMode();

  return (
    <header className="h-14 flex items-center justify-between px-6 border-vision-border/5 bg-vision-panel/30 backdrop-blur-sm x1">
      <div className="text-sm font-medium text-vision-text"></div>

      <div className="flex items-center gap-2.5">
        <Link to="/dashboard/compiler" title="Change on the Compiler page">
          <Badge tone={mode === "MANUAL" ? "ok" : "warn"}>{mode ?? "…"}</Badge>
        </Link>
        {sim.available && (
          <Link to="/dashboard/simulation" title="Simulation view — change on the Simulation page">
            <Badge tone="neutral">SIM · {sim.mode === "autonomous" ? "AUTONOMOUS" : "COMPILER"}</Badge>
          </Link>
        )}
        <RobotLinkBadges />
      </div>
    </header>
  );
}