import clsx from "classnames";

const COLORS = {
  Bleed: "bg-rose-500/15 text-rose-300 border-rose-500/40",
  Burn: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  Rupture: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",
  Poise: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  Default: "bg-brand-card/40 text-brand-text border-white/10",
};

export default function StatusBadge({ type, potency, count }) {
  return (
    <span className={clsx(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs",
      COLORS[type] || COLORS.Default
    )}>
      <b>{type}</b>
      <span>×{count}</span>
      {potency ? <span className="opacity-80">({potency})</span> : null}
    </span>
  );
}
