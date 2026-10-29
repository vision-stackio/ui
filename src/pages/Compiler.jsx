import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { scriptsApi } from "../api/scripts";
import { settingsApi } from "../api/settings";
import { useControlMode } from "../hooks/useControlMode";
import { useSimMode } from "../hooks/useSimMode";
import { simulationApi } from "../api/simulation";
import Card from "../components/common/Card";
import Badge from "../components/common/Badge";

/** iOS-style toggle switch (same look as the Settings page). onChange gets the NEXT value. */
function Switch({ checked, onChange, disabled = false, busy = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled || busy}
      onClick={() => onChange?.(!checked)}
      className="relative w-[40px] h-[24px] rounded-full transition-colors duration-200 ease-out shrink-0 border-0 cursor-pointer p-0 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ backgroundColor: checked ? "#34c759" : "#e9e9eb" }}
    >
      <span
        className="absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white transition-all duration-200 ease-out pointer-events-none"
        style={{
          left: checked ? "18px" : "2px",
          boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.15), 0px 2px 1px rgba(0, 0, 0, 0.06)",
        }}
      />
    </button>
  );
}

const SAMPLES = {
  "look-around.vs": `# Look around, walk a little, say hi
EYE_CENTER
WAIT 500
REPEAT 2 TIMES AS $step
  SET $a $step * 45 + 45
  EYE_SET $a
  WAIT 600
END
WALK_FORWARD 1000
WALK_STOP
AUDIO_SPEAK "Hello!"`,
  "walk-and-talk.vs": `# Announce, walk, glance both ways, finish
AUDIO_SPEAK "Here I go"
WALK_FORWARD 1000
WALK_STOP
EYE_SET 45
WAIT 400
EYE_SET 135
WAIT 400
EYE_CENTER
AUDIO_SPEAK "All done"`,
  "patrol.vs": `# Walk a square
REPEAT 4 TIMES
  WALK_FORWARD 1000
  WALK_STOP
  TURN_RIGHT 300
  WALK_STOP
END
PRINT "patrol done"`,
};

/* ------------------------------------------------------------------ */
/* Editor helpers (VS Code "Dark+" look)                               */
/* ------------------------------------------------------------------ */

const LINE_H = 20; // px — shared by gutter, highlight layer and textarea
const KEYWORDS = new Set(["SET", "REPEAT", "TIMES", "AS", "END", "IF", "ELSE", "THEN", "RANDOM", "PRINT", "WAIT"]);
const TOKEN_RE = /(#.*$)|("(?:[^"\\]|\\.)*"?)|(\$[A-Za-z_]\w*)|(\b\d+(?:\.\d+)?\b)|(\b[A-Z][A-Z0-9_]*\b)|(>=|<=|==|!=|[><+\-*/])/g;
// VS Code "Light+" palette
const COLORS = {
  comment: "#008000",
  string: "#a31515",
  variable: "#001080",
  number: "#098658",
  keyword: "#af00db",
  command: "#795e26",
  operator: "#000000",
};

function highlightLine(line) {
  const out = [];
  let last = 0;
  let first = true; // first word on the line is the command / statement
  const text = line;
  TOKEN_RE.lastIndex = 0;
  let m;
  while ((m = TOKEN_RE.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    let color;
    if (m[1]) color = COLORS.comment;
    else if (m[2]) color = COLORS.string;
    else if (m[3]) color = COLORS.variable;
    else if (m[4]) color = COLORS.number;
    else if (m[5]) color = KEYWORDS.has(m[5]) ? COLORS.keyword : first ? COLORS.command : COLORS.keyword;
    else color = COLORS.operator;
    out.push(<span key={m.index} style={{ color }}>{m[0]}</span>);
    last = m.index + m[0].length;
    if (!m[1]) first = false;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const monoFont = { fontFamily: "ui-monospace, SFMono-Regular, 'Cascadia Code', Menlo, Consolas, monospace", fontSize: 13, lineHeight: `${LINE_H}px` };

function CodeEditor({ value, onChange, disabled, problems, onCursor, onRun, onCompile }) {
  const scrollRef = useRef(null);
  const taRef = useRef(null);
  const [active, setActive] = useState(1);
  const lines = useMemo(() => value.split("\n"), [value]);
  const errorLines = useMemo(() => new Set(problems.map((p) => p.line)), [problems]);

  const syncCursor = () => {
    const ta = taRef.current;
    if (!ta) return;
    const upto = ta.value.slice(0, ta.selectionStart);
    const ln = upto.split("\n").length;
    const col = upto.length - upto.lastIndexOf("\n");
    setActive(ln);
    onCursor?.({ ln, col });
    // keep the caret line visible — the textarea itself never scrolls
    const sc = scrollRef.current;
    if (sc) {
      const top = (ln - 1) * LINE_H + 8;
      if (top < sc.scrollTop) sc.scrollTop = top - 8;
      else if (top + LINE_H + 8 > sc.scrollTop + sc.clientHeight) sc.scrollTop = top + LINE_H + 8 - sc.clientHeight;
    }
  };

  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); onRun?.(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") { e.preventDefault(); onCompile?.(); return; }
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.target;
      const { selectionStart: s, selectionEnd: en } = ta;
      onChange(ta.value.slice(0, s) + "  " + ta.value.slice(en));
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 2; syncCursor(); });
    }
  };

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto bg-white" style={{ minHeight: 0 }}>
      <div className="flex min-h-full" style={{ ...monoFont, width: "max-content", minWidth: "100%" }}>
        {/* gutter */}
        <div className="sticky left-0 z-10 shrink-0 bg-white select-none text-right pr-3 pl-4 py-2" style={{ color: "#237893" }} aria-hidden="true">
          {lines.map((_, i) => (
            <div
              key={i}
              style={{ height: LINE_H, color: errorLines.has(i + 1) ? "#e51400" : i + 1 === active ? "#0b216f" : "#237893" }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* code: highlight layer in flow (sets the size), textarea on top */}
        <div className="relative flex-1 py-2 pr-6">
          <div aria-hidden="true" className="pointer-events-none" style={{ whiteSpace: "pre", color: "#000000" }}>
            {lines.map((l, i) => (
              <div
                key={i}
                style={{
                  height: LINE_H,
                  background: errorLines.has(i + 1) ? "rgba(229,20,0,.09)" : i + 1 === active && !disabled ? "#f5f5f5" : "transparent",
                  boxShadow: errorLines.has(i + 1) ? "inset 2px 0 #e51400" : "none",
                }}
              >
                {l.length ? highlightLine(l) : "​"}
              </div>
            ))}
          </div>
          <textarea
            ref={taRef}
            value={value}
            disabled={disabled}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            wrap="off"
            aria-label="Vision Script editor"
            onChange={(e) => { onChange(e.target.value); }}
            onKeyDown={onKeyDown}
            onKeyUp={syncCursor}
            onClick={syncCursor}
            onSelect={syncCursor}
            className="absolute left-0 top-2 w-full outline-none resize-none border-0 bg-transparent p-0 overflow-hidden"
            style={{ ...monoFont, height: lines.length * LINE_H, whiteSpace: "pre", color: "transparent", caretColor: "#000000" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const stamp = () => new Date().toLocaleTimeString([], { hour12: false });

/**
 * Vision Script compiler — ADMIN-only (see App.jsx RoleRoute + the server's
 * requireRole("ADMIN") on /api/scripts/*). One editor for the whole script:
 *   - Compile (Ctrl/Cmd+B): dry-run (source -> AST -> IR), never touches
 *     hardware, always allowed regardless of Control Mode.
 *   - Run (Ctrl/Cmd+Enter): compiles AND executes every line in order.
 *     Requires Manual Mode, same as any direct hardware control.
 * The editor + terminal are laid out like VS Code (editor on top, bottom
 * panel with TERMINAL / PROBLEMS, status bar underneath).
 */
export default function Compiler() {
  const { mode, isManual, loading, refresh } = useControlMode();
  const sim = useSimMode();

  const [toggling, setToggling] = useState(false);
  const [files, setFiles] = useState(SAMPLES);
  const [tabs, setTabs] = useState(["look-around.vs"]);
  const [activeFile, setActiveFile] = useState("look-around.vs");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const source = files[activeFile] ?? "";
  const setSource = (v) => setFiles((f) => ({ ...f, [activeFile]: v }));
  const openFile = (name) => {
    setTabs((t) => (t.includes(name) ? t : [...t, name]));
    setActiveFile(name);
    setProblems([]);
    setCursor({ ln: 1, col: 1 });
  };
  const closeTab = (name) => {
    if (tabs.length === 1) return;
    const next = tabs.filter((t) => t !== name);
    setTabs(next);
    if (activeFile === name) openFile(next[next.length - 1]);
  };
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState([]); // scrollback of {type, text, time}
  const [problems, setProblems] = useState([]); // [{line, message}]
  const [panelTab, setPanelTab] = useState("terminal");
  const [cursor, setCursor] = useState({ ln: 1, col: 1 });
  const [lastResult, setLastResult] = useState(null); // "ok" | "error" | null
  const [modeToast, setModeToast] = useState(null);
  const scrollRef = useRef(null);

  // Admin-only kill switch — separate from Control Mode. When off, BOTH
  // compiling and executing are rejected server-side for everyone,
  // including admins; this is an emergency "shut the whole feature off",
  // not a hardware gate. See docs/vision-script.md.
  const [compilerEnabled, setCompilerEnabled] = useState(true);
  const [compilerLoading, setCompilerLoading] = useState(true);
  const [killSwitchBusy, setKillSwitchBusy] = useState(false);

  const loadCompilerEnabled = useCallback(async () => {
    try {
      const { enabled } = await settingsApi.getCompilerEnabled();
      setCompilerEnabled(enabled);
    } finally {
      setCompilerLoading(false);
    }
  }, []);

  useEffect(() => { loadCompilerEnabled(); }, [loadCompilerEnabled]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [output, panelTab]);

  const toggleCompilerEnabled = async () => {
    setKillSwitchBusy(true);
    try {
      const { enabled } = await settingsApi.setCompilerEnabled(!compilerEnabled);
      setCompilerEnabled(enabled);
      setModeToast(enabled ? "Compiler re-enabled" : "Compiler disabled — nobody can compile or run scripts until it's re-enabled");
    } finally {
      setKillSwitchBusy(false);
    }
  };

  // "Manual Mode" is what this toggle actually flips — from this page it's
  // referred to as Compiler Mode ON; the other state is Autonomous Mode.
  const toggleMode = async () => {
    setToggling(true);
    try {
      const nextManual = !isManual;
      await settingsApi.setManualMode(nextManual);
      refresh();
      setModeToast(nextManual ? "Compiler mode activated" : "Autonomous mode activated");
    } finally {
      setToggling(false);
    }
  };

  useEffect(() => {
    if (!modeToast) return undefined;
    const id = setTimeout(() => setModeToast(null), 3000);
    return () => clearTimeout(id);
  }, [modeToast]);

  const log = (entry) => setOutput((h) => [...h, { ...entry, time: stamp() }]);

  // In ROBOT_MODE=simulation, hand the compiled script to the simulator's Compiler view
  // (the server compiles it again; nothing here touches the robot). Silent when not simulating.
  const sendToSimulator = async (autoplay) => {
    if (!sim.available) return;
    try {
      await simulationApi.pushProgram(source, activeFile, autoplay);
      log({ type: "output", text: autoplay ? "Sent to the simulator and playing." : "Sent to the simulator — press Play there." });
    } catch (err) {
      // 422 = it didn't compile; the simulator still shows which stage stopped it
      if (err.status !== 422) log({ type: "error", text: `Simulator: ${err.message || "couldn't load the program"}` });
    }
  };

  const showDiagnostics = (diagnostics) => {
    const list = (diagnostics || []).map((d) => ({ line: d.line, message: d.message }));
    setProblems(list);
    setLastResult("error");
    log({ type: "error", text: list.map((d) => `line ${d.line}: ${d.message}`).join("\n") });
    setPanelTab("problems");
  };

  const handleCompile = async () => {
    if (busy || !compilerEnabled || compilerLoading) return;
    setBusy(true);
    setPanelTab("terminal");
    log({ type: "action", text: `vision compile ${activeFile}` });
    try {
      const compiled = await scriptsApi.compile(source);
      if (compiled.success) {
        setProblems([]);
        setLastResult("ok");
        log({ type: "output", text: `Compiled OK — ${compiled.ir?.instructions?.length ?? 0} instruction(s).` });
        await sendToSimulator(false);
      } else {
        showDiagnostics(compiled.diagnostics);
        await sendToSimulator(false);
      }
    } catch (err) {
      setLastResult("error");
      log({ type: "error", text: err.message || "Compile failed" });
    } finally {
      setBusy(false);
    }
  };

  const handleRun = async () => {
    if (busy || !compilerEnabled || compilerLoading || !isManual) return;
    setBusy(true);
    setPanelTab("terminal");
    log({ type: "action", text: `vision run ${activeFile}` });
    try {
      const { compiled, executionResults } = await scriptsApi.execute(source);
      if (!compiled.success) {
        showDiagnostics(compiled.diagnostics);
        await sendToSimulator(false);
      } else {
        setProblems([]);
        setLastResult("ok");
        const summary = executionResults
          .map((r, i) => `[${i + 1}] ${r.type}: ${r.status}${r.error ? ` (${r.error.message})` : ""}`)
          .join("\n") || "(no-op)";
        log({ type: "output", text: summary });
        await sendToSimulator(true);
      }
    } catch (err) {
      setLastResult("error");
      log({ type: "error", text: err.message || "Run failed" });
    } finally {
      setBusy(false);
    }
  };

  const onSourceChange = (v) => {
    setSource(v);
    if (problems.length) setProblems([]); // stale once the text changes
  };

  const disabled = !compilerEnabled || compilerLoading;
  const runDisabled = disabled || !isManual;
  const lineCount = source.split("\n").length;

  return (
    <div className="space-y-6 x1">
      <style>{`
        @keyframes compilerFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
      `}</style>

      {modeToast && (
        <div className="rounded-lg bg-vision-hover/10 text-sm text-vision-text px-4 py-2" role="status">{modeToast}</div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Control Mode">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <Badge tone={isManual ? "ok" : "warn"}>{loading ? "…" : mode}</Badge>
              <p className="text-xs text-vision-muted max-w-xs">
                {isManual
                  ? "Manual: scripts and dashboard controls move the robot directly."
                  : "Autonomous: the brain drives. Switch on Manual to run scripts."}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Switch checked={isManual} onChange={toggleMode} disabled={loading} busy={toggling} label="Manual mode" />
              <span className="text-[10px] uppercase tracking-wide text-vision-muted">{isManual ? "Manual" : "Auto"}</span>
            </div>
          </div>
        </Card>

        <Card title="Compiler">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <Badge tone={compilerEnabled ? "ok" : "danger"}>
                {compilerLoading ? "…" : compilerEnabled ? "ENABLED" : "DISABLED"}
              </Badge>
              <p className="text-xs text-vision-muted max-w-xs">
                Emergency switch: when off, nobody can compile or run scripts.
              </p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Switch checked={compilerEnabled} onChange={toggleCompilerEnabled} disabled={compilerLoading} busy={killSwitchBusy} label="Compiler enabled" />
              <span className="text-[10px] uppercase tracking-wide text-vision-muted">{compilerEnabled ? "On" : "Off"}</span>
            </div>
          </div>
        </Card>
      </div>

      {compilerEnabled && !compilerLoading ? (
        <div
          className="rounded-xl overflow-hidden border border-black/15 shadow-2xl bg-white text-[#333333] flex flex-col"
          style={{ animation: "compilerFadeIn .25s ease-out", height: 660, fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}
        >
          {/* title bar */}
          <div className="flex items-center gap-3 h-9 px-3 bg-[#dddddd] border-b border-[#cccccc] shrink-0 select-none">
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <span className="flex-1 text-center text-[12px] text-[#616161] truncate">{activeFile} — Vision</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCompile}
                disabled={busy}
                title="Compile — dry run (Ctrl/Cmd+B)"
                className="px-2.5 h-6 rounded text-[12px] text-[#333333] hover:bg-black/10 disabled:opacity-40 transition"
              >
                ⚙ Compile
              </button>
              <button
                type="button"
                onClick={handleRun}
                disabled={runDisabled || busy}
                title={!isManual ? "Switch to Manual Mode to run" : "Run (Ctrl/Cmd+Enter)"}
                className="px-2.5 h-6 rounded text-[12px] text-white bg-[#007acc] hover:bg-[#0062a3] disabled:opacity-40 disabled:hover:bg-[#007acc] transition"
              >
                {busy ? "…" : "▶ Run"}
              </button>
            </div>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* activity bar */}
            <div className="w-12 shrink-0 bg-[#2c2c2c] flex flex-col items-center py-2 select-none">
              <button
                type="button"
                onClick={() => setSidebarOpen((o) => !o)}
                title="Explorer"
                aria-label="Toggle explorer"
                className={`w-12 h-12 flex items-center justify-center border-l-2 transition ${sidebarOpen ? "border-white text-white" : "border-transparent text-[#858585] hover:text-white"}`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
                  <path d="M14 3H7a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7l-4-4z" />
                  <path d="M14 3v4h4M3 7v13a1 1 0 0 0 1 1h10" />
                </svg>
              </button>
            </div>

            {/* explorer */}
            {sidebarOpen && (
              <div className="w-[210px] shrink-0 bg-[#f3f3f3] border-r border-[#e5e5e5] flex flex-col select-none">
                <div className="h-9 px-5 flex items-center text-[11px] tracking-wide text-[#6f6f6f]">EXPLORER</div>
                <div className="px-2 text-[11px] font-bold text-[#3b3b3b] flex items-center gap-1 h-6">
                  <span className="text-[9px]">▾</span> SCRIPTS
                </div>
                <div className="flex-1 overflow-y-auto">
                  {Object.keys(files).map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => openFile(name)}
                      className={`w-full flex items-center gap-2 pl-7 pr-2 h-[22px] text-[13px] text-left ${
                        activeFile === name ? "bg-[#e4e6f1] text-[#000000]" : "text-[#3b3b3b] hover:bg-[#e8e8e8]"
                      }`}
                    >
                      <span className="text-[9px] font-bold text-[#007acc]">VS</span>
                      <span className="truncate">{name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* editor column */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* tab strip */}
              <div className="flex h-9 bg-[#f3f3f3] shrink-0 select-none overflow-x-auto">
                {tabs.map((name) => (
                  <div
                    key={name}
                    onClick={() => openFile(name)}
                    className={`group flex items-center gap-2 pl-3 pr-2 text-[13px] cursor-pointer border-r border-[#e5e5e5] ${
                      activeFile === name ? "bg-white text-[#333333] border-t-2 border-t-[#007acc]" : "bg-[#ececec] text-[#6f6f6f] border-t-2 border-t-transparent hover:bg-[#e4e4e4]"
                    }`}
                  >
                    <span className="text-[9px] font-bold text-[#007acc]">VS</span>
                    {name}
                    {busy && activeFile === name ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#007acc] animate-pulse" />
                    ) : (
                      <button
                        type="button"
                        aria-label={`Close ${name}`}
                        onClick={(e) => { e.stopPropagation(); closeTab(name); }}
                        className={`w-4 h-4 rounded flex items-center justify-center text-[12px] leading-none hover:bg-black/10 ${tabs.length === 1 ? "invisible" : activeFile === name ? "" : "opacity-0 group-hover:opacity-100"}`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* breadcrumb */}
              <div className="h-[22px] shrink-0 bg-white flex items-center px-4 text-[12px] text-[#6f6f6f] select-none">
                vision <span className="mx-1.5">›</span> scripts <span className="mx-1.5">›</span> <span className="text-[#333333]">{activeFile}</span>
              </div>

              {/* editor */}
              <CodeEditor
                key={activeFile}
                value={source}
                onChange={onSourceChange}
                disabled={false}
                problems={problems}
                onCursor={setCursor}
                onRun={handleRun}
                onCompile={handleCompile}
              />

              {/* bottom panel */}
              <div className="shrink-0 border-t border-[#d4d4d4] bg-white flex flex-col" style={{ height: 200 }}>
                <div className="flex items-center justify-between h-8 px-4 shrink-0 select-none">
                  <div className="flex gap-5 text-[11px] tracking-wide">
                    {[
                      ["problems", `PROBLEMS${problems.length ? ` ${problems.length}` : ""}`],
                      ["terminal", "TERMINAL"],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPanelTab(id)}
                        className={`h-8 border-b-2 ${panelTab === id ? "text-[#333333] border-[#007acc]" : "text-[#6f6f6f] border-transparent hover:text-[#333333]"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setOutput([]); setProblems([]); setLastResult(null); }}
                    title="Clear output"
                    className="text-[11px] text-[#6f6f6f] hover:text-[#333333]"
                  >
                    ⌫ Clear
                  </button>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-2 text-[12px] space-y-1.5" style={monoFont}>
                  {panelTab === "terminal" ? (
                    <>
                      {output.length === 0 && (
                        <div className="text-[#8a8a8a]">Compile (Ctrl/Cmd+B) or Run (Ctrl/Cmd+Enter) — output appears here.</div>
                      )}
                      {output.map((entry, i) => (
                        <div key={i} className="flex gap-2" style={{ lineHeight: "18px" }}>
                          <span className="text-[#a0a0a0] shrink-0">{entry.time}</span>
                          {entry.type === "action" && <span className="text-[#0451a5]">$ {entry.text}</span>}
                          {entry.type === "output" && <span className="text-[#388a34] whitespace-pre-wrap">✔ {entry.text}</span>}
                          {entry.type === "error" && <span className="text-[#e51400] whitespace-pre-wrap">✖ {entry.text}</span>}
                        </div>
                      ))}
                      {busy && <div className="text-[#0451a5] animate-pulse">…</div>}
                    </>
                  ) : problems.length === 0 ? (
                    <div className="text-[#8a8a8a]">No problems have been detected in the script.</div>
                  ) : (
                    problems.map((p, i) => (
                      <div key={i} className="flex items-start gap-2" style={{ lineHeight: "18px" }}>
                        <span className="text-[#e51400]">✖</span>
                        <span className="text-[#333333]">{p.message}</span>
                        <span className="text-[#8a8a8a]">{activeFile} [Ln {p.line}]</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* status bar */}
          <div
            className="flex items-center justify-between h-6 px-3 text-[12px] text-white shrink-0 select-none"
            style={{ background: isManual ? "#007acc" : "#b5651d" }}
          >
            <div className="flex items-center gap-4">
              <span>{loading ? "…" : isManual ? "⎇ MANUAL" : "⎇ AUTONOMOUS"}</span>
              <span>{problems.length ? `✖ ${problems.length}` : lastResult === "ok" ? "✔ OK" : "✔ 0"}</span>
              {!isManual && <span className="opacity-90">Run needs Manual mode</span>}
            </div>
            <div className="flex items-center gap-4">
              <span>Ln {cursor.ln}, Col {cursor.col}</span>
              <span>{lineCount} lines</span>
              <span>Spaces: 2</span>
              <span>Vision Script</span>
            </div>
          </div>
        </div>
      ) : (
        !compilerLoading && (
          <div className="rounded-xl border border-dashed border-vision-border/20 px-6 py-10 text-center text-sm text-vision-muted">
            The compiler is switched off. Turn it on above to bring back the editor and terminal.
          </div>
        )
      )}
    </div>
  );
}