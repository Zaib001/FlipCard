export default function TurnOrderBar({ order }) {
  if (!order?.length) return null;
  return (
    <div className="mt-4 flex gap-2 overflow-x-auto py-2">
      {order.map((p) => (
        <div key={p._id} className="min-w-[160px] rounded-lg border border-white/10 bg-brand-card/70 p-2">
          <div className="flex items-center justify-between text-xs opacity-70">
            <span>{p.side}</span>
            <span>SPD {p.speed?.current ?? "-"}</span>
          </div>
          <div className="font-medium">{p.name}</div>
          {p.getsExtraTurn && (
            <div className="mt-1 text-[10px] text-indigo-300">Extra Turn</div>
          )}
        </div>
      ))}
    </div>
  );
}
