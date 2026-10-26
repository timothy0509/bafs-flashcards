import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { RATIOS, CATEGORIES, shuffle } from "./data.js";

const CAT_CODE = {
  profitability: "PR",
  liquidity: "LQ",
  efficiency: "EF",
  solvency: "SV",
  investment: "IN",
};

const CAT_INK = {
  profitability: "text-ledger",
  liquidity: "text-ink",
  efficiency: "text-seal",
  solvency: "text-seal-deep",
  investment: "text-ink",
};

const entryNo = (id) => String(RATIOS.findIndex((r) => r.id === id) + 1).padStart(2, "0");

function Tex({ latex, dark }) {
  const html = useMemo(
    () => katex.renderToString(latex, { throwOnError: false, displayMode: true }),
    [latex]
  );
  const outer = useRef(null);
  const inner = useRef(null);

  // The math gets exactly the space it needs: never a scrollbar, never an
  // overlap. If a formula is wider than its column it scales down to fit.
  useLayoutEffect(() => {
    const o = outer.current;
    const g = inner.current;
    if (!o || !g) return;
    const fit = () => {
      g.style.transform = "none";
      o.style.height = "auto";
      const k = g.querySelector(".katex");
      if (!k) return;
      // This KaTeX version lays .katex out as a block, so it reports the
      // column width instead of the formula width. Briefly shrink-to-fit it
      // to measure the true width, then restore.
      k.style.display = "inline-block";
      const avail = o.clientWidth;
      const need = k.getBoundingClientRect().width;
      k.style.display = "";
      if (avail > 0 && need > avail) {
        const s = avail / need;
        g.style.transform = `scale(${s})`;
        g.style.transformOrigin = "center top";
        o.style.height = `${g.getBoundingClientRect().height * s}px`;
      }
    };
    fit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(o);
    return () => ro.disconnect();
  }, [html]);

  return (
    <div ref={outer} className="shrink-0" style={{ overflow: "hidden" }}>
      <div
        ref={inner}
        className={`py-2 text-[1.1rem] ${dark ? "[&_span]:!text-[#f5efe0]" : ""}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }, [key, val]);
  return [val, setVal];
}

function Direction({ dir, light }) {
  return (
    <span className={`font-ledger text-xs font-bold ${dir === "higher" ? (light ? "text-emerald-300" : "text-ledger") : light ? "text-red-300" : "text-seal"}`}>
      {dir === "higher" ? "▲ higher better" : "▼ lower better"}
    </span>
  );
}

function Flashcard({ ratio, flipped, onFlip, status }) {
  const c = CATEGORIES.find((x) => x.id === ratio.category);
  return (
    <button
      onClick={onFlip}
      className="w-full text-left [perspective:1400px] cursor-pointer"
      aria-label={flipped ? "Show question" : "Show answer"}
    >
      <div
        className={`grid min-h-[360px] transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front: the journal entry */}
        <div className="[grid-area:1/1] [backface-visibility:hidden] rounded-sm border-2 border-ink bg-paper-card ledger-shadow p-2 flex flex-col">
          <div className="flex-1 border border-ink/25 rounded-[2px] px-6 py-5 sm:px-8 flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <span className={`stamp -rotate-2 ${CAT_INK[ratio.category]}`}>
                {CAT_CODE[ratio.category]} · {c.label}
              </span>
              <span className="font-ledger text-xs text-ink-soft">Entry No. {entryNo(ratio.id)}</span>
            </div>

            <div className="pt-9">
              <p className="font-ledger text-xs uppercase tracking-[0.2em] text-ink-soft mb-3">
                Post the formula for
              </p>
              <h2 className="font-display text-3xl sm:text-[2.6rem] font-bold leading-tight">{ratio.name}</h2>
            </div>
            <div className="ledger-dotted mt-6" />
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <span className="font-ledger text-sm">
                unit <span className="font-bold">{ratio.unit}</span>
              </span>
              <Direction dir={ratio.direction} />
            </div>

            <p className="font-ledger text-xs text-ink-soft uppercase tracking-widest text-center mt-auto pt-6">
              Say it aloud, then tap to turn the page
            </p>
          </div>

          {status === "known" && (
            <span className="stamp stamp-in absolute bottom-24 right-8 text-ledger border-ledger rotate-[-8deg] text-sm">
              ✓ Posted to memory
            </span>
          )}
          {status === "unknown" && (
            <span className="stamp stamp-in absolute bottom-24 right-8 text-seal border-seal rotate-[-8deg] text-sm">
              ✗ Still learning
            </span>
          )}
        </div>

        {/* Back: the posted entry, ink on dark */}
        <div className="[grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-sm bg-ink text-paper ledger-shadow p-7 sm:p-9 flex flex-col border-2 border-ink">
          <div className="flex items-center justify-between mb-3">
            <span className="stamp rotate-1 text-gold">Entry No. {entryNo(ratio.id)} · posted</span>
            <span className="font-ledger text-xs text-paper/70 uppercase tracking-widest">tap to turn back</span>
          </div>
          <Tex latex={ratio.latex} dark />
          <p className="mt-1 font-ledger text-sm text-gold">{ratio.plain}</p>
          <p className="mt-4 font-display text-[1.05rem] leading-relaxed text-paper/90">{ratio.meaning}</p>
          <div className="mt-4 border-l-[3px] border-seal pl-4 py-1">
            <p className="font-ledger text-[11px] font-bold uppercase tracking-[0.18em] text-red-300 mb-1">
              Auditor's note
            </p>
            <p className="text-sm leading-relaxed text-paper/85">{ratio.tip}</p>
          </div>
          {ratio.extra && (
            <p className="mt-3 font-ledger text-xs leading-relaxed text-paper/75">{ratio.extra}</p>
          )}
          <div className="mt-auto pt-4 flex items-center gap-4">
            <span className="font-ledger text-xs text-paper/75">unit {ratio.unit}</span>
            <Direction dir={ratio.direction} light />
          </div>
        </div>
      </div>
    </button>
  );
}

function StudyMode({ marks, markKnown, markUnknown, clearMark }) {
  const [cat, setCat] = useState("all");
  const [progress, setProgress] = useState("all");
  const [order, setOrder] = useState(() => RATIOS.map((r) => r.id));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const filtered = useMemo(
    () =>
      order
        .map((id) => RATIOS.find((r) => r.id === id))
        .filter((r) => cat === "all" || r.category === cat)
        .filter((r) => {
          const s = marks[r.id];
          if (progress === "known") return s === "known";
          if (progress === "unknown") return s === "unknown";
          if (progress === "new") return !s;
          return true;
        }),
    [order, cat, progress, marks]
  );
  const safeIdx = Math.min(idx, Math.max(0, filtered.length - 1));
  const current = filtered[safeIdx];
  const currentStatus = current ? marks[current.id] : undefined;

  useEffect(() => {
    setIdx(0);
    setFlipped(false);
  }, [cat, progress]);

  useEffect(() => {
    const h = (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
      if (e.key === "ArrowRight") {
        setFlipped(false);
        setTimeout(() => setIdx((i) => Math.min(i + 1, filtered.length - 1)), 60);
      }
      if (e.key === "ArrowLeft") {
        setFlipped(false);
        setTimeout(() => setIdx((i) => Math.max(i - 1, 0)), 60);
      }
      if ((e.key === "1" || e.key.toLowerCase() === "k") && current) {
        markKnown(current.id);
      }
      if ((e.key === "2" || e.key.toLowerCase() === "x") && current) {
        markUnknown(current.id);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [filtered.length, current, markKnown, markUnknown]);

  if (!current)
    return (
      <div>
        <ProgressFilter progress={progress} setProgress={setProgress} marks={marks} cat={cat} setCat={setCat} order={order} setOrder={setOrder} setIdx={setIdx} setFlipped={setFlipped} />
        <p className="font-display italic text-ink-soft mt-6">No entries under this tab. Clear the progress filter to see the rest.</p>
      </div>
    );

  const go = (d) => {
    setFlipped(false);
    setTimeout(() => setIdx((i) => Math.min(Math.max(i + d, 0), filtered.length - 1)), 60);
  };

  const grade = (fn) => {
    fn(current.id);
    setFlipped(false);
    setTimeout(() => setIdx((i) => Math.min(i + 1, filtered.length - 1)), 120);
  };

  const statusMark = (s, i, isActive) => {
    if (s === "known") return <span className="ml-auto shrink-0 text-xs font-bold text-ledger">✓</span>;
    if (s === "unknown") return <span className="ml-auto shrink-0 text-xs font-bold text-seal">✗</span>;
    return <span className={`ml-auto shrink-0 text-xs ${isActive ? "text-paper/50" : "text-ink-faint"}`}>○</span>;
  };

  return (
    <div>
      <ProgressFilter progress={progress} setProgress={setProgress} marks={marks} cat={cat} setCat={setCat} order={order} setOrder={setOrder} setIdx={setIdx} setFlipped={setFlipped} />

      <div className="lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8 lg:items-start">
        <aside className="hidden lg:block rounded-sm border-2 border-ink bg-paper-card ledger-shadow-sm sticky top-24 max-h-[70vh] overflow-y-auto">
          <p className="font-ledger text-[11px] uppercase tracking-[0.2em] text-ink-soft px-4 pt-4 pb-2">
            Register of entries · {filtered.length}
          </p>
          {CATEGORIES.filter((c) => filtered.some((r) => r.category === c.id)).map((c) => (
            <div key={c.id} className="pb-2">
              <p className={`font-ledger text-[11px] font-bold uppercase tracking-[0.18em] px-4 py-1.5 ${CAT_INK[c.id]}`}>
                {CAT_CODE[c.id]} · {c.label}
              </p>
              {filtered.map((r, i) =>
                r.category !== c.id ? null : (
                  <button
                    key={r.id}
                    onClick={() => {
                      setFlipped(false);
                      setTimeout(() => setIdx(i), 60);
                    }}
                    className={`w-full text-left px-4 py-1.5 flex items-baseline gap-2.5 transition ${
                      i === safeIdx ? "bg-ink text-paper-card" : "hover:bg-paper-deep/50"
                    }`}
                  >
                    <span className={`font-ledger text-xs shrink-0 ${i === safeIdx ? "text-paper/80" : "text-ink-faint"}`}>
                      {entryNo(r.id)}
                    </span>
                    <span className="text-[13px] font-semibold truncate">{r.name}</span>
                    {statusMark(marks[r.id], i, i === safeIdx)}
                  </button>
                )
              )}
            </div>
          ))}
        </aside>

        <div className="min-w-0">
          <Flashcard ratio={current} flipped={flipped} onFlip={() => setFlipped((f) => !f)} status={currentStatus} />
          <div className="flex items-center justify-between gap-3 mt-6">
            <button onClick={() => go(-1)} disabled={safeIdx === 0} className="px-5 py-2.5 rounded-sm font-bold bg-paper-card border-2 border-ink text-ink ledger-shadow-sm ledger-press font-ledger text-sm disabled:border-dashed disabled:border-ink/40 disabled:text-ink-faint disabled:shadow-none disabled:cursor-default disabled:bg-transparent">
              ← Prev
            </button>
            <span className="font-ledger text-sm text-ink-soft">
              folio {safeIdx + 1} / {filtered.length}
            </span>
            <button onClick={() => go(1)} disabled={safeIdx === filtered.length - 1} className="px-5 py-2.5 rounded-sm font-bold bg-paper-card border-2 border-ink text-ink ledger-shadow-sm ledger-press font-ledger text-sm disabled:border-dashed disabled:border-ink/40 disabled:text-ink-faint disabled:shadow-none disabled:cursor-default disabled:bg-transparent">
              Next →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              onClick={() => grade(markUnknown)}
              className={`py-3 rounded-sm font-bold text-sm border-2 border-ink ledger-shadow-sm ledger-press font-ledger uppercase tracking-wider ${
                currentStatus === "unknown" ? "bg-seal text-paper-card" : "bg-paper-card text-seal"
              }`}
            >
              ✗ Don't know
            </button>
            <button
              onClick={() => grade(markKnown)}
              className={`py-3 rounded-sm font-bold text-sm border-2 border-ink ledger-shadow-sm ledger-press font-ledger uppercase tracking-wider ${
                currentStatus === "known" ? "bg-ledger text-paper-card" : "bg-paper-card text-ledger"
              }`}
            >
              ✓ I know this
            </button>
          </div>
          {currentStatus && (
            <button onClick={() => clearMark(current.id)} className="block mx-auto mt-2 font-ledger text-[11px] uppercase tracking-[0.18em] text-ink-faint underline underline-offset-4 hover:text-seal">
              Clear mark (back to unseen)
            </button>
          )}
          <p className="font-ledger text-xs text-ink-soft mt-4 text-center uppercase tracking-widest">
            Space = turn page · ← → = move · 1/K = know · 2/X = don't know
          </p>
        </div>
      </div>
    </div>
  );
}

function ProgressFilter({ progress, setProgress, marks, cat, setCat, order, setOrder, setIdx, setFlipped }) {
  const countFor = (p) => {
    const inCat = order
      .map((id) => RATIOS.find((r) => r.id === id))
      .filter((r) => cat === "all" || r.category === cat);
    if (p === "all") return inCat.length;
    if (p === "known") return inCat.filter((r) => marks[r.id] === "known").length;
    if (p === "unknown") return inCat.filter((r) => marks[r.id] === "unknown").length;
    return inCat.filter((r) => !marks[r.id]).length;
  };
  const items = [
    { id: "all", label: `All · ${countFor("all")}` },
    { id: "known", label: `✓ Known · ${countFor("known")}` },
    { id: "unknown", label: `✗ Don't know · ${countFor("unknown")}` },
    { id: "new", label: `○ New · ${countFor("new")}` },
  ];
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        <FilterTab active={cat === "all"} onClick={() => setCat("all")} label={`All · ${order.length}`} />
        {CATEGORIES.map((c) => (
          <FilterTab
            key={c.id}
            active={cat === c.id}
            onClick={() => setCat(c.id)}
            label={c.id === "investment" ? "IN · INVESTMENT" : `${CAT_CODE[c.id]} · ${c.label}`}
          />
        ))}
        <button
          onClick={() => {
            setOrder(shuffle(order));
            setIdx(0);
            setFlipped(false);
          }}
          className="px-4 py-1.5 rounded-sm text-sm font-bold bg-seal text-paper-card ledger-shadow-sm ledger-press border-2 border-ink font-ledger uppercase tracking-wider text-xs"
        >
          ↻ Shuffle
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {items.map((t) => (
          <FilterTab key={t.id} active={progress === t.id} onClick={() => setProgress(t.id)} label={t.label} />
        ))}
      </div>
    </div>
  );
}

function FilterTab({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-sm text-xs font-bold border-2 font-ledger uppercase tracking-wider ledger-press ${
        active ? "bg-ink text-paper-card border-ink ledger-shadow-sm" : "bg-paper-card text-ink-soft border-ink/25 hover:border-ink"
      }`}
    >
      {label}
    </button>
  );
}

function QuizMode() {
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [marks, setMarks] = useState([]);
  const [questions] = useState(() =>
    shuffle(RATIOS).map((r) => {
      const distractors = shuffle(RATIOS.filter((x) => x.id !== r.id)).slice(0, 3);
      return { answer: r, options: shuffle([r, ...distractors]) };
    })
  );
  const q = questions[qIdx];
  const done = qIdx >= questions.length;

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    const verdict =
      pct >= 80 ? "Clean audit. Sign it off." : pct >= 50 ? "A few adjustments needed. Rework the red items." : "Qualified opinion. Back to the ledger, then re-audit.";
    return (
      <div className="text-center rounded-sm border-2 border-ink bg-paper-card ledger-shadow p-10">
        <span className={`stamp stamp-in inline-block text-base ${pct >= 50 ? "text-ledger border-ledger" : "text-seal border-seal"}`}>
          {pct >= 80 ? "✓ Passed" : pct >= 50 ? "≈ Adjusted" : "✗ Rework"}
        </span>
        <h2 className="font-display text-5xl font-bold mt-5">{score}<span className="text-2xl text-ink-faint">/{questions.length}</span></h2>
        <p className="font-display italic text-lg text-ink-soft mt-3">{verdict}</p>
        <button onClick={() => window.location.reload()} className="mt-6 px-6 py-3 rounded-sm font-bold bg-seal text-paper-card border-2 border-ink ledger-shadow-sm ledger-press font-ledger uppercase tracking-wider text-sm">
          Re-audit ↻
        </button>
      </div>
    );
  }

  const numerals = ["i", "ii", "iii", "iv"];

  const rail = (
    <aside className="hidden lg:block rounded-sm border-2 border-ink bg-paper-card ledger-shadow-sm p-4 sticky top-24">
      <p className="font-ledger text-[11px] uppercase tracking-[0.2em] text-ink-soft mb-3">Audit trail</p>
      <div className="grid grid-cols-4 gap-1.5">
        {questions.map((item, i) => {
          const m = marks[i];
          const cls =
            m === true
              ? "bg-ledger text-paper-card border-ledger"
              : m === false
                ? "bg-seal text-paper-card border-seal"
                : i === qIdx
                  ? "bg-paper-card border-ink"
                  : "bg-paper-card border-ink/25 text-ink-faint";
          return (
            <div key={item.answer.id} title={item.answer.name} className={`aspect-square rounded-[3px] border-2 flex items-center justify-center font-ledger text-xs font-bold ${cls}`}>
              {i + 1}
            </div>
          );
        })}
      </div>
    </aside>
  );

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_172px] lg:gap-8 lg:items-start">
      <div className="min-w-0">
      <div className="flex items-center justify-between mb-2">
        <span className="font-ledger text-xs uppercase tracking-[0.18em] text-ink-soft">
          Audit item {qIdx + 1} / {questions.length}
        </span>
        <span className="font-ledger text-xs uppercase tracking-[0.18em] text-ink-soft">
          Confirmed <span className="text-ledger font-bold">{score}</span> · Queried <span className="text-seal font-bold">{picked ? qIdx + 1 - score - (picked === q.answer.id ? 1 : 0) : qIdx - score}</span>
        </span>
      </div>
      <div className="h-3 bg-paper-card border-2 border-ink rounded-sm mb-6 overflow-hidden">
        <div className="h-full bg-seal transition-all" style={{ width: `${(qIdx / questions.length) * 100}%` }} />
      </div>

      <p className="font-ledger text-xs uppercase tracking-[0.2em] text-ink-faint">Which entry is booked as</p>
      <p className="font-display text-3xl font-bold mb-6">{q.answer.name}?</p>

      <div className="space-y-3">
        {q.options.map((opt, i) => {
          const isAnswer = opt.id === q.answer.id;
          const isPicked = picked === opt.id;
          let cls = "bg-paper-card border-ink/30 hover:border-ink hover:bg-paper-deep/40";
          if (picked) {
            if (isAnswer) cls = "bg-ledger/10 border-ledger";
            else if (isPicked) cls = "bg-seal/10 border-seal";
            else cls = "bg-paper-card border-ink/15 opacity-50";
          }
          return (
            <button
              key={opt.id}
              disabled={!!picked}
              onClick={() => {
                setPicked(opt.id);
                if (isAnswer) setScore((s) => s + 1);
                setMarks((prev) => {
                  const next = [...prev];
                  next[qIdx] = isAnswer;
                  return next;
                });
              }}
              className={`w-full text-left px-5 py-4 rounded-sm border-2 transition flex gap-4 items-baseline ${cls}`}
            >
              <span className="font-ledger text-sm text-ink-faint shrink-0">({numerals[i]})</span>
              <span className="font-ledger text-sm sm:text-[15px]">{opt.plain}</span>
              {picked && isAnswer && <span className="ml-auto font-bold text-ledger">✓</span>}
              {picked && isPicked && !isAnswer && <span className="ml-auto font-bold text-seal">✗</span>}
            </button>
          );
        })}
      </div>

      {picked && (
        <div className="mt-4">
          <div className="rounded-sm bg-ink text-paper p-5 border-2 border-ink">
            <Tex latex={q.answer.latex} dark />
            <div className="border-l-[3px] border-seal pl-4 mt-2">
              <p className="font-ledger text-[11px] font-bold uppercase tracking-[0.18em] text-red-300 mb-1">Auditor's note</p>
              <p className="text-sm text-paper/85">{q.answer.tip}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setQIdx((i) => i + 1);
              setPicked(null);
            }}
            className="w-full mt-3 py-3 rounded-sm font-bold bg-ink text-paper-card border-2 border-ink ledger-shadow-sm ledger-press font-ledger uppercase tracking-wider text-sm"
          >
            {qIdx + 1 === questions.length ? "Sign off the audit →" : "Next item →"}
          </button>
        </div>
      )}
      </div>
      {rail}
    </div>
  );
}

function BrowseMode({ marks, markKnown, markUnknown, clearMark }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [progress, setProgress] = useState("all");
  const list = RATIOS.filter(
    (r) =>
      (cat === "all" || r.category === cat) &&
      (progress === "all" ||
        (progress === "known" && marks[r.id] === "known") ||
        (progress === "unknown" && marks[r.id] === "unknown") ||
        (progress === "new" && !marks[r.id])) &&
      (r.name.toLowerCase().includes(q.toLowerCase()) || r.plain.toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search the index, e.g. receivables…"
          className="flex-1 px-4 py-2.5 rounded-sm border-2 border-ink/30 bg-paper-card text-sm outline-none focus:border-ink font-body placeholder:text-ink-faint"
        />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="px-4 py-2.5 rounded-sm border-2 border-ink/30 bg-paper-card text-sm font-bold font-ledger">
          <option value="all">Whole book</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{CAT_CODE[c.id]} · {c.label}</option>
          ))}
        </select>
        <select value={progress} onChange={(e) => setProgress(e.target.value)} className="px-4 py-2.5 rounded-sm border-2 border-ink/30 bg-paper-card text-sm font-bold font-ledger">
          <option value="all">All marks</option>
          <option value="known">✓ Known</option>
          <option value="unknown">✗ Don't know</option>
          <option value="new">○ New</option>
        </select>
      </div>
      <p className="font-ledger text-[11px] uppercase tracking-[0.18em] text-ink-faint mb-4">{list.length} entries on record</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((r) => (
          <div key={r.id} className="rounded-sm border-2 border-ink bg-paper-card p-5 ledger-shadow-sm hover:-translate-y-0.5 transition">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-ledger text-xs text-ink-faint w-7 shrink-0">{entryNo(r.id)}</span>
              <h3 className="font-display text-xl font-bold">{r.name}</h3>
              <span className={`stamp ml-auto ${CAT_INK[r.category]}`}>{CAT_CODE[r.category]}</span>
            </div>
            <div className="mt-1">
              <Tex latex={r.latex} />
            </div>
            <p className="font-ledger text-xs text-seal mt-1">{r.plain}</p>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="font-ledger text-xs text-ink-soft">unit {r.unit}</span>
              <Direction dir={r.direction} />
              {marks[r.id] === "known" && <span className="font-ledger text-xs font-bold text-ledger">✓ Known</span>}
              {marks[r.id] === "unknown" && <span className="font-ledger text-xs font-bold text-seal">✗ Don't know</span>}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => markKnown(r.id)}
                className={`flex-1 py-1.5 rounded-sm text-xs font-bold border-2 border-ink font-ledger uppercase tracking-wider ledger-press ${marks[r.id] === "known" ? "bg-ledger text-paper-card" : "bg-paper-card text-ledger"}`}
              >
                ✓ Know
              </button>
              <button
                onClick={() => markUnknown(r.id)}
                className={`flex-1 py-1.5 rounded-sm text-xs font-bold border-2 border-ink font-ledger uppercase tracking-wider ledger-press ${marks[r.id] === "unknown" ? "bg-seal text-paper-card" : "bg-paper-card text-seal"}`}
              >
                ✗ Don't know
              </button>
              {marks[r.id] && (
                <button
                  onClick={() => clearMark(r.id)}
                  title="Clear mark"
                  className="px-3 py-1.5 rounded-sm text-xs font-bold border-2 border-ink/25 text-ink-faint font-ledger ledger-press hover:border-ink"
                >
                  ○
                </button>
              )}
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="font-display italic text-center text-ink-soft py-10">Nothing on record. Try another search.</p>}
      </div>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("study");
  const [marks, setMarks] = useLocalStorage("bafs-known", {});
  // Migrate the old boolean map (true = known) to the known/unknown map.
  const [migrated, setMigrated] = useState(false);
  useEffect(() => {
    if (migrated) return;
    setMigrated(true);
    setMarks((m) => {
      if (!m || typeof m !== "object" || Array.isArray(m)) return {};
      let changed = false;
      const next = {};
      for (const [k, v] of Object.entries(m)) {
        if (v === "known" || v === "unknown") next[k] = v;
        else if (v === true) {
          next[k] = "known";
          changed = true;
        } else {
          changed = true;
        }
      }
      return changed ? next : m;
    });
  }, [migrated]);

  const vals = Object.values(marks);
  const knownCount = vals.filter((v) => v === "known").length;
  const unknownCount = vals.filter((v) => v === "unknown").length;
  const newCount = RATIOS.length - knownCount - unknownCount;

  const markKnown = (id) => setMarks((m) => ({ ...m, [id]: "known" }));
  const markUnknown = (id) => setMarks((m) => ({ ...m, [id]: "unknown" }));
  const clearMark = (id) =>
    setMarks((m) => {
      const next = { ...m };
      delete next[id];
      return next;
    });

  const tabs = [
    { id: "study", label: "Ledger", sub: "flashcards" },
    { id: "quiz", label: "Audit", sub: "quiz" },
    { id: "browse", label: "Index", sub: "all 16" },
  ];

  return (
    <div className="min-h-screen">
      {/* Masthead */}
      <header className="max-w-6xl mx-auto px-5 pt-8">
        <div className="flex items-baseline justify-between font-ledger text-[11px] uppercase tracking-[0.2em] text-ink-soft">
          <span>HKDSE · BAFS</span>
          <span>Vol. 01 — Ratios</span>
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-bold leading-none mt-3 tracking-tight">
          The Ratio Ledger
        </h1>
        <p className="font-display italic text-lg sm:text-xl text-ink-soft mt-2">
          Sixteen ratios. One sitting. No mercy from the examiner.
        </p>
        <div className="rule-thick mt-5" />
        <div className="rule-thin mt-[3px]" />
        <div className="flex items-center gap-4 mt-3">
          <span className="font-ledger text-xs uppercase tracking-[0.18em] text-ink-soft whitespace-nowrap">
            ✓ {knownCount} · ✗ {unknownCount} · ○ {newCount}
          </span>
          <div className="flex-1 h-3 bg-paper-card border-2 border-ink rounded-sm overflow-hidden flex">
            <div className="h-full bg-ledger transition-all" style={{ width: `${(knownCount / RATIOS.length) * 100}%` }} />
            <div className="h-full bg-seal transition-all" style={{ width: `${(unknownCount / RATIOS.length) * 100}%` }} />
          </div>
          <span className={`stamp ${knownCount === RATIOS.length ? "text-ledger border-ledger stamp-in" : "text-ink-soft border-ink/60"}`}>
            {knownCount === RATIOS.length ? "✓ Balanced" : `${knownCount}/${RATIOS.length} known`}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-7">
        {/* Ledger tabs */}
        <div className="flex gap-2 mb-6 sticky top-0 z-10 bg-paper/95 backdrop-blur-sm py-3 -mx-1 px-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className={`flex-1 rounded-sm border-2 py-2 px-2 transition ledger-press ${
                mode === t.id
                  ? "bg-ink text-paper-card border-ink ledger-shadow-sm"
                  : "bg-paper-card text-ink-soft border-ink/25 hover:border-ink"
              }`}
            >
              <span className="block font-display text-lg font-bold leading-none">{t.label}</span>
              <span className={`block font-ledger text-[10px] uppercase tracking-[0.18em] mt-1 ${mode === t.id ? "text-paper/80" : "text-ink-faint"}`}>{t.sub}</span>
            </button>
          ))}
        </div>

        {mode === "study" && <StudyMode marks={marks} markKnown={markKnown} markUnknown={markUnknown} clearMark={clearMark} />}
        {mode === "quiz" && <QuizMode />}
        {mode === "browse" && <BrowseMode marks={marks} markKnown={markKnown} markUnknown={markUnknown} clearMark={clearMark} />}

        <footer className="mt-12 pb-6">
          <div className="rule-thin" />
          <p className="font-display italic text-center text-ink-soft mt-4">
            Debits must equal credits. Averages take (opening + closing) ÷ 2.
          </p>
          <button onClick={() => { localStorage.removeItem("bafs-known"); window.location.reload(); }} className="block mx-auto mt-3 font-ledger text-[11px] uppercase tracking-[0.18em] text-ink-faint underline underline-offset-4 hover:text-seal">
            Close the books (reset progress)
          </button>
        </footer>
      </main>
    </div>
  );
}
