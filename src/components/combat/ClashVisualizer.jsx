import { motion } from "framer-motion";

function ModeLabel({ mode }) {
  const modeStyles = {
    direct: "bg-red-500/20 text-red-300",
    total: "bg-blue-500/20 text-blue-300",
    coin: "bg-purple-500/20 text-purple-300",
    tie: "bg-gray-500/20 text-gray-300"
  };

  const modeText = {
    direct: "DIRECT ATTACK",
    total: "CLASH (TOTAL POWER)",
    coin: "CLASH (COIN TIEBREAK)",
    tie: "CLASH (TIE)"
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider ${modeStyles[mode] || "bg-gray-500/20"}`}>
      {modeText[mode] || "COMBAT RESULT"}
    </span>
  );
}

function CoinList({ coins }) {
  if (!Array.isArray(coins) || coins.length === 0) return null;
  
  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {coins.map((c, i) => (
        <div 
          key={i} 
          className={`rounded-md p-2 text-xs font-mono border ${
            c.success 
              ? "border-emerald-500/30 bg-emerald-900/20 text-emerald-300" 
              : "border-rose-500/30 bg-rose-900/20 text-rose-300"
          }`}
        >
          <div className="flex justify-between">
            <span className="font-bold">COIN {typeof c.index === "number" ? c.index + 1 : i + 1}</span>
            <span className={c.success ? "text-emerald-300" : "text-rose-300"}>
              {c.success ? "HIT" : "MISS"}
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Value:</span>
            <span className="font-bold">+{c.value}</span>
          </div>
          <div className="flex justify-between">
            <span>Total:</span>
            <span className="font-bold">{c.totalAfter}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TraceBlock({ title, trace }) {
  if (!trace) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-gray-700 bg-gradient-to-b from-gray-900/80 to-gray-800/80 p-3 shadow-lg"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">{title}</h3>
        <div className="flex gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-400">BASE</div>
            <div className="text-lg font-bold text-white">{trace.base}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">TOTAL</div>
            <div className="text-lg font-bold text-white">{trace.total}</div>
          </div>
        </div>
      </div>
      <CoinList coins={trace.coins} />
    </motion.div>
  );
}

export default function ClashVisualizer({ result, onClose }) {
  if (!result) return null;

  const isTie = !result.winner && (result.mode === "tie" || result.damageDealt === 0);
  const isDirect = result.mode === "direct";
  const attackerTrace = result?.traces?.attacker;
  const defenderTrace = result?.traces?.defender;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="w-full max-w-2xl rounded-xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mb-3">
            <ModeLabel mode={result.mode} />
          </div>

          {isTie ? (
            <div className="mt-2 mb-4">
              <div className="text-3xl font-bold text-gray-300 mb-1">STANDOFF</div>
              <div className="text-sm text-gray-400">No damage dealt</div>
            </div>
          ) : (
            <>
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="inline-block mb-4"
              >
                <div className="text-xs uppercase tracking-widest text-gray-400 mb-1">VICTOR</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                  {result?.winner?.name ?? "UNKNOWN"}
                </div>
              </motion.div>

              {result?.winnerSkill?.name && (
                <div className="text-sm text-gray-300 mb-4">
                  <span className="text-gray-400">Skill:</span> {result.winnerSkill.name}
                </div>
              )}

              <div className="flex justify-center gap-6 mb-4">
                <div className="text-center">
                  <div className="text-xs text-rose-300 mb-1">DAMAGE</div>
                  <div className="text-2xl font-bold text-white">{result?.damageDealt ?? 0}</div>
                </div>
                {Number(result?.reflected) > 0 && (
                  <div className="text-center">
                    <div className="text-xs text-purple-300 mb-1">REFLECTED</div>
                    <div className="text-2xl font-bold text-white">{result.reflected}</div>
                  </div>
                )}
              </div>

              {result?.loser?.name && (
                <div className="text-sm text-gray-400">
                  <span className="text-gray-300">Target:</span> {result.loser.name}
                </div>
              )}
            </>
          )}
        </div>

        {/* Traces */}
        <div className="mb-6">
          {isDirect ? (
            attackerTrace && (
              <div className="space-y-4">
                <div className="text-xs uppercase tracking-wider text-gray-400">ATTACK DETAILS</div>
                <TraceBlock title="Attacker" trace={attackerTrace} />
              </div>
            )
          ) : (
            (attackerTrace || defenderTrace) && (
              <div className="space-y-4">
                <div className="text-xs uppercase tracking-wider text-gray-400">CLASH BREAKDOWN</div>
                <div className="grid md:grid-cols-2 gap-4">
                  {attackerTrace && <TraceBlock title="Attacker" trace={attackerTrace} />}
                  {defenderTrace && <TraceBlock title="Defender" trace={defenderTrace} />}
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-center">
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600 hover:border-amber-400/50 text-white font-medium shadow-lg transition-all"
          >
            CLOSE RESULTS
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}