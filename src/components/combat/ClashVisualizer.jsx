import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ---------- UI helpers ---------- */
function Section({ title, children }) {
  return (
    <div className="mt-4">
      <div className="text-xs uppercase tracking-wide opacity-70 mb-2">{title}</div>
      <div className="rounded-lg border border-white/10 bg-black/20/80 p-3">{children}</div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <div className="opacity-70">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function CoinsList({ roll }) {
  if (!roll) return null;
  return (
    <div className="grid gap-2">
      <div className="text-xs opacity-70">
        Base Power: <b className="opacity-100">{roll.base ?? 0}</b>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {(roll.coins ?? []).map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded border border-white/10 bg-black/20 px-2 py-1 text-sm flex items-center justify-between"
          >
            <div>
              Coin {i + 1}:{" "}
              <span className={c.success ? "text-emerald-400" : "text-rose-400"}>
                {c.success ? "Heads" : "Tails"}
              </span>
            </div>
            <div className="opacity-80">+{c.value} → {c.totalAfter}</div>
          </motion.div>
        ))}
      </div>
      <div className="text-right text-sm mt-1">
        <span className="opacity-70">Total:</span>{" "}
        <span className="font-semibold">{roll.total}</span>
      </div>
    </div>
  );
}

function Badge({ children, tone = "default" }) {
  const toneCls = {
    default: "bg-white/10 border-white/15",
    win: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
    lose: "bg-rose-500/15 border-rose-500/30 text-rose-300",
    info: "bg-sky-500/15 border-sky-500/30 text-sky-300",
    warn: "bg-amber-500/15 border-amber-500/30 text-amber-300",
  }[tone] || "bg-white/10 border-white/15";

  return (
    <motion.span
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border ${toneCls}`}
    >
      {children}
      <motion.span
        className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-current opacity-70"
        animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.span>
  );
}

function TabButton({ id, active, onClick, children }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={() => onClick(id)}
      className={`relative px-3 py-2 text-sm rounded-md border transition
        ${active ? "border-brand-accent/60 bg-white/5" : "border-white/10 hover:border-white/20"}`}
    >
      {children}
      {active && (
        <motion.span
          layoutId="tab-underline"
          className="absolute left-2 right-2 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-brand-accent to-cyan-400"
        />
      )}
    </button>
  );
}

/* ---------- Main ---------- */
export default function ClashVisualizer({ result, onClose }) {
  // Hooks: always called unconditionally to avoid hook-order bugs
  const [tab, setTab] = useState("clash"); // clash | damage | effects | log

  // Safe derivations from possibly-null result
  const mode = result?.mode;
  const winner = result?.winner;
  const loser = result?.loser;
  const winnerSkill = result?.winnerSkill;
  const loserSkill = result?.loserSkill;
  const phase = result?.phase;
  const traces = result?.traces;
  const coinsBroken = result?.coinsBroken ?? 0;

  const damageRoll =
    mode === "clash+damage" ? result?.detail?.damage
      : mode === "direct" ? result?.traces?.attacker
      : null;

  const effects = result?.effects || { immediate: [], scheduled: [] };
  const stagger = result?.stagger;
  const sanity = result?.sanity;
  const damageDealt = result?.damageDealt ?? 0;
  const reflected = result?.reflected ?? 0;

  const hasClash = mode === "clash" || mode === "clash+damage";
  const hasDamage = mode === "clash+damage" || mode === "direct";

  const headerTitle = useMemo(() => {
    if (mode === "direct") return "Direct Attack";
    if (mode === "clash+damage") return "Clash → Damage";
    if (mode === "clash") return "Clash Result";
    return "Combat Result";
  }, [mode]);

  // Early return after hooks → safe
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur">
      {/* ambient animated backdrop */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        initial={{ opacity: 0.25 }}
        animate={{ opacity: [0.25, 0.35, 0.25], backgroundPositionX: ["0%", "100%", "0%"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(60% 80% at 20% 20%, rgba(59,130,246,0.20), transparent 60%), " +
            "radial-gradient(60% 80% at 80% 30%, rgba(168,85,247,0.16), transparent 60%), " +
            "radial-gradient(60% 80% at 40% 80%, rgba(34,197,94,0.14), transparent 60%)",
          backgroundRepeat: "no-repeat",
        }}
      />

      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-3xl rounded-xl border border-white/10 bg-brand-card/95"
        role="dialog"
        aria-modal="true"
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-brand-card/95 backdrop-blur rounded-t-xl p-5 border-b border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs opacity-70">{headerTitle}</div>
              <div className="mt-1 text-2xl font-bold">
                {winner?.name ?? (phase === "tie" ? "Tie" : "—")}
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                {winner && <Badge tone="win">Winner</Badge>}
                {loser && <Badge tone="lose">Loser: {loser.name}</Badge>}
                {coinsBroken > 0 && <Badge tone="info">Coins Broken: {coinsBroken}</Badge>}
                {typeof damageDealt === "number" && hasDamage && (
                  <Badge tone="warn">
                    Damage Dealt: {damageDealt}
                    {reflected ? ` (Reflected: ${reflected})` : ""}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {winnerSkill?.name && <Badge tone="info">Winner Skill: {winnerSkill.name}</Badge>}
              {loserSkill?.name && <Badge>Defender Skill: {loserSkill.name}</Badge>}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-5 flex items-center gap-2" role="tablist" aria-label="Combat details">
            <TabButton id="clash"   active={tab === "clash"}   onClick={setTab}>Clash</TabButton>
            <TabButton id="damage"  active={tab === "damage"}  onClick={setTab}>Damage</TabButton>
            <TabButton id="effects" active={tab === "effects"} onClick={setTab}>Effects</TabButton>
            <TabButton id="log"     active={tab === "log"}     onClick={setTab}>Log</TabButton>
            <div className="ml-auto">
              <button
                onClick={onClose}
                className="rounded-lg border border-white/10 px-3 py-2 hover:border-brand-accent/60 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="px-5 pb-5 max-h-[75vh] overflow-y-auto" style={{ WebkitOverflowScrolling: "touch" }}>
          <AnimatePresence mode="wait">
            {tab === "clash" && (
              <motion.div key="clash" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                {!hasClash ? (
                  <div className="text-sm opacity-80">No clash data (direct attack).</div>
                ) : (
                  <>
                    <Section title="Summary">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Stat label="Phase" value={phase ?? "—"} />
                        <Stat label="Winner" value={winner?.name ?? "—"} />
                        <Stat label="Loser" value={loser?.name ?? (phase === "tie" ? "Tie" : "—")} />
                      </div>
                    </Section>

                    <Section title="Attacker Roll">
                      <CoinsList roll={traces?.attacker} />
                    </Section>

                    <Section title="Defender Roll">
                      <CoinsList roll={traces?.defender} />
                    </Section>
                  </>
                )}
              </motion.div>
            )}

            {tab === "damage" && (
              <motion.div key="damage" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                {!hasDamage ? (
                  <div className="text-sm opacity-80">No damage was applied (clash tie).</div>
                ) : (
                  <>
                    <Section title="Damage Summary">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Stat label="Dealer" value={winner?.name ?? "—"} />
                        <Stat label="Target" value={loser?.name ?? "—"} />
                        <Stat label="Damage Dealt" value={damageDealt} />
                      </div>
                      {reflected > 0 && (
                        <div className="mt-2 text-sm">Reflected: <b>{reflected}</b></div>
                      )}
                    </Section>

                    <Section title="Damage Roll">
                      <CoinsList roll={damageRoll} />
                    </Section>
                  </>
                )}
              </motion.div>
            )}

            {tab === "effects" && (
              <motion.div key="effects" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <Section title="Immediate Effects">
                  {effects.immediate?.length ? (
                    <ul className="grid gap-2">
                      {effects.immediate.map((e, i) => (
                        <li key={`${e.type}-${i}`} className="rounded border border-white/10 bg-black/20 px-2 py-1 text-sm flex items-center justify-between">
                          <span className="opacity-90">{e.type}</span>
                          {"amount" in e ? <span className="font-semibold">-{e.amount} HP</span> : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm opacity-80">None</div>
                  )}
                </Section>

                <Section title="Scheduled Effects (after EoT)">
                  {effects.scheduled?.length ? (
                    <ul className="grid gap-2">
                      {effects.scheduled.map((e, i) => (
                        <li key={`${e.type}:${e.potency ?? "np"}:${i}`} className="rounded border border-white/10 bg-black/20 px-2 py-1 text-sm flex items-center justify-between">
                          <span className="opacity-90">{e.type}</span>
                          <span className="text-xs opacity-70">
                            {e.potency != null ? `Potency ${e.potency}` : ""}
                            {e.potency != null && e.count != null ? " • " : ""}
                            {e.count != null ? `Count ${e.count}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm opacity-80">None</div>
                  )}
                </Section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Section title="Stagger">
                    <div className="text-sm">
                      From: <b>{stagger?.from ?? "—"}</b> → To: <b>{stagger?.to ?? "—"}</b>
                    </div>
                  </Section>

                  <Section title="Sanity">
                    <div className="text-sm">
                      {sanity ? (
                        <>
                          From: <b>{sanity.from}</b> → To: <b>{sanity.to}</b>{" "}
                          (<span className={sanity.delta >= 0 ? "text-emerald-300" : "text-rose-300"}>
                            {sanity.delta >= 0 ? "+" : ""}
                            {sanity.delta}
                          </span>)
                        </>
                      ) : (
                        "—"
                      )}
                    </div>
                  </Section>
                </div>
              </motion.div>
            )}

            {tab === "log" && (
              <motion.div key="log" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <Section title="Combat Log">
                  {Array.isArray(result?.log) && result.log.length ? (
                    <ol className="space-y-2 text-sm">
                      {result.log.map((entry, i) => (
                        <li key={i} className="rounded border border-white/10 bg-black/20 p-2">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold">{entry.t}</div>
                            <div className="text-xs opacity-60">
                              {new Date(entry.ts).toLocaleTimeString()}
                            </div>
                          </div>
                          <pre className="mt-1 text-xs opacity-80 whitespace-pre-wrap">
                            {JSON.stringify(
                              Object.fromEntries(
                                Object.entries(entry).filter(([k]) => !["t", "ts"].includes(k))
                              ),
                              null,
                              2
                            )}
                          </pre>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="text-sm opacity-80">No log entries.</div>
                  )}
                </Section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
