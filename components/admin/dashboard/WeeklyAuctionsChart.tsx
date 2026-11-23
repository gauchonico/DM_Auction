export interface WeekBar {
  key: string;
  label: string; // e.g. "18 Nov"
  range: string; // e.g. "18–24 Nov"
  count: number;
  current: boolean;
}

/**
 * Single-series bar chart: auctions scheduled per week.
 * - one hue (company blue): the current week uses the full brand shade, other weeks the
 *   validated tint #5B8BCB (≥3:1 on white); every bar has a direct value label;
 * - 4px rounded data-ends on a shared baseline, 2px gaps, recessive dashed gridlines,
 *   no legend (single series — the caption names it);
 * - hover tooltip per bar; values are also direct-labelled (so keyboard users lose nothing)
 *   and repeated in a visually hidden table for screen readers.
 */
export default function WeeklyAuctionsChart({ weeks }: { weeks: WeekBar[] }) {
  const max = Math.max(0, ...weeks.map((w) => w.count));
  // Headroom above the tallest bar for its value label; even number so the midline is whole.
  const top = Math.max(2, Math.ceil((max * 1.25) / 2) * 2);
  const ticks = [top, top / 2, 0];

  return (
    <figure className="font-report">
      <figcaption className="mb-3 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-slate-800">Auctions per week</span>
        <span className="text-xs text-slate-500">next {weeks.length} weeks</span>
      </figcaption>

      <div className="rounded-xl bg-slate-50/80 px-3 pb-2 pt-3">
        <div className="flex gap-2" aria-hidden>
          {/* y-axis labels */}
          <div className="relative h-28 w-5">
            {ticks.map((t) => (
              <span key={t} className="absolute right-0 translate-y-1/2 text-[10px] tabular-nums text-slate-400" style={{ bottom: `${(t / top) * 100}%` }}>
                {t}
              </span>
            ))}
          </div>

          {/* plot */}
          <div className="relative h-28 flex-1">
            {ticks.map((t) => (
              <span key={t} className={`absolute inset-x-0 border-t ${t === 0 ? "border-slate-300" : "border-dashed border-slate-200"}`} style={{ bottom: `${(t / top) * 100}%` }} />
            ))}
            <div className="absolute inset-0 flex items-end gap-[2px]">
              {weeks.map((w) => (
                <div key={w.key} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                  <span className="mb-1 text-[11px] font-semibold tabular-nums text-slate-700">{w.count}</span>
                  <span
                    className={`block w-3/5 max-w-7 rounded-t-[4px] group-hover:opacity-90 ${w.current ? "bg-brand" : "bg-brand-tint"}`}
                    style={{ height: `${w.count ? (w.count / top) * 100 : 1.5}%` }}
                  />
                  <span className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block">
                    <span className="block font-semibold">{w.range}{w.current ? " · this week" : ""}</span>
                    <span className="tabular-nums">{w.count} auction{w.count === 1 ? "" : "s"}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* x-axis labels */}
        <div className="ml-7 mt-1.5 flex gap-[2px]" aria-hidden>
          {weeks.map((w) => (
            <span key={w.key} className={`flex-1 text-center text-[10px] ${w.current ? "font-semibold text-brand" : "text-slate-400"}`}>
              {w.label}
            </span>
          ))}
        </div>
      </div>

      <table className="sr-only">
        <caption>Auctions scheduled per week</caption>
        <thead><tr><th>Week</th><th>Auctions</th></tr></thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.key}><td>{w.range}{w.current ? " (this week)" : ""}</td><td>{w.count}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
