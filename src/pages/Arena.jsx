import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useArena } from "../store/useArenaStore";
import AnimatedBackground from "../components/layout/AnimatedBackground";
import GameCard from "../components/cards/GameCard";
import TurnOrderBar from "../components/combat/TurnOrderBar";
import SkillButton from "../components/combat/SkillButton";
import ClashVisualizer from "../components/combat/ClashVisualizer";
import { fadeIn, staggerContainer } from "../animations/motion";

export default function Arena() {
  const {
    characters,
    loadCharacters,
    computeTurnOrder,
    turnOrder,
    doClash,
    clashResult,
    loading,
  } = useArena();

  const [attacker, setAttacker] = useState(null);
  const [defender, setDefender] = useState(null);
  const [attackerSkill, setAttackerSkill] = useState(null);
  const [defenderSkill, setDefenderSkill] = useState(null);
  const [flipping, setFlipping] = useState(false);
  const [showTurnOrder, setShowTurnOrder] = useState(false);

  // ---------- helpers ----------
  const idOf = (obj) => obj?._id ?? obj?.id ?? null;

  // ---------- effects ----------
  useEffect(() => {
    console.log("[Arena] mount → loadCharacters()");
    loadCharacters()
      .then((list) => console.log("[Arena] characters loaded:", list?.length ?? characters.length))
      .catch((e) => console.error("[Arena] loadCharacters error:", e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadCharacters]);

  useEffect(() => {
    console.log("[Arena] characters state:", characters);
  }, [characters]);

  useEffect(() => {
    console.log("[Arena] selection → attacker:", attacker, "defender:", defender);
  }, [attacker, defender]);

  useEffect(() => {
    console.log("[Arena] selection → attackerSkill:", attackerSkill, "defenderSkill:", defenderSkill);
  }, [attackerSkill, defenderSkill]);

  const participants = useMemo(() => {
    const p = characters
      .filter(
        (c) =>
          idOf(c) &&
          typeof c?.speed?.min === "number" &&
          typeof c?.speed?.max === "number"
      )
      .map((c, idx) => ({
        _id: idOf(c),
        name: c.name,
        side: c.side ?? (idx % 2 === 0 ? "A" : "B"),
        speed: { min: Number(c.speed.min), max: Number(c.speed.max) },
      }));
    console.log("[Arena] participants built:", p);
    return p;
  }, [characters]);

  async function rollTurnOrder() {
    if (!participants.length) {
      console.warn("[Arena] rollTurnOrder → no participants");
      return;
    }
    setShowTurnOrder(true);
    console.log("[Arena] computeTurnOrder →", participants);
    try {
      const order = await computeTurnOrder(participants);
      console.log("[Arena] turn order result:", order);
    } catch (e) {
      console.error("[Arena] computeTurnOrder error:", e);
    }
  }

  const canResolve = Boolean(idOf(attacker) && idOf(defender) && idOf(attackerSkill));

  useEffect(() => {
    const reasons = [];
    if (!idOf(attacker)) reasons.push("attacker not selected");
    if (!idOf(defender)) reasons.push("defender not selected");
    if (!idOf(attackerSkill)) reasons.push("attacker skill not selected");
    console.log("[Arena] canResolve:", canResolve, reasons.length ? `→ disabled because: ${reasons.join(", ")}` : "→ enabled");
  }, [attacker, defender, attackerSkill, canResolve]);

  async function handleResolve() {
    const attackerId = idOf(attacker);
    const defenderId = idOf(defender);
    const attackerSkillId = idOf(attackerSkill);
    const defenderSkillId = idOf(defenderSkill);

    console.log("[Arena] Resolve button clicked with:", {
      attackerId,
      defenderId,
      attackerSkillId,
      defenderSkillId,
      loading,
      canResolve,
    });

    if (!attackerId || !defenderId || !attackerSkillId) {
      const missing = [];
      if (!attackerId) missing.push("attacker");
      if (!defenderId) missing.push("defender");
      if (!attackerSkillId) missing.push("attacker skill");
      console.warn("[Arena] Resolve blocked → missing:", missing);
      alert(`Please select: ${missing.join(", ")}`);
      return;
    }

    setFlipping(true);
    try {
      console.log("[Arena] doClash payload →", {
        attackerId,
        defenderId,
        attackerSkillId,
        defenderSkillId: defenderSkillId || undefined,
      });

      const res = await doClash({
        attackerId,
        defenderId,
        attackerSkillId,
        defenderSkillId: defenderSkillId || undefined,
      });

      console.log("[Arena] doClash SUCCESS → result:", res);
    } catch (error) {
      console.error("[Arena] doClash ERROR:", error);
      alert(`Clash failed: ${error.message || "Unknown error"}`);
    } finally {
      setFlipping(false);
    }
  }

  // GameCard now calls onClick(characterId)
  const handleCharacterSelect = (characterId) => {
    console.log("[Arena] card click → characterId:", characterId);
    const selectedChar = characters.find((c) => idOf(c) === characterId);
    console.log("[Arena] resolved character:", selectedChar);

    if (!selectedChar) {
      console.warn("[Arena] character not found for id:", characterId);
      return;
    }

    const currentAttackerId = idOf(attacker);

    if (!attacker) {
      setAttacker(selectedChar);
      console.log("[Arena] set attacker:", selectedChar?.name);
      return;
    }
    if (!defender && characterId !== currentAttackerId) {
      setDefender(selectedChar);
      console.log("[Arena] set defender:", selectedChar?.name);
      return;
    }

    // Reset to new attacker
    setAttacker(selectedChar);
    setDefender(null);
    setAttackerSkill(null);
    setDefenderSkill(null);
    console.log("[Arena] reset selections → new attacker:", selectedChar?.name);
  };

  const isSelected = (c) =>
    idOf(attacker) === idOf(c) || idOf(defender) === idOf(c);
  const isAtt = (c) => idOf(attacker) === idOf(c);
  const isDef = (c) => idOf(defender) === idOf(c);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      className="min-h-screen relative overflow-hidden"
    >
      <AnimatedBackground intensity={0.3} />

      <div className="mx-auto max-w-7xl px-4 py-6 relative z-10">
        {/* Header */}
        <motion.div variants={fadeIn("down", "tween", 0.1, 0.5)}>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-accent to-cyan-400">
              Combat Arena
            </h1>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={rollTurnOrder}
                disabled={loading}
                className="rounded-lg px-4 py-2 bg-white/5 border border-white/10 hover:border-brand-accent/60 backdrop-blur-sm transition-all"
              >
                {showTurnOrder ? "Update Order" : "Roll Initiative"}
              </motion.button>
              <motion.button
                whileHover={{ scale: canResolve ? 1.05 : 1 }}
                whileTap={{ scale: canResolve ? 0.95 : 1 }}
                onClick={handleResolve}
                disabled={loading || !canResolve}
                className={`rounded-lg px-4 py-2 backdrop-blur-sm transition-all
                  ${canResolve ? "bg-white/5 border border-white/10 hover:border-brand-accent/60"
                    : "bg-white/5 border border-white/10 opacity-60 cursor-not-allowed"}`}
              >
                Resolve Clash
              </motion.button>
            </div>
          </div>

          {/* Selection Status */}
          <motion.div
            variants={fadeIn("down", "tween", 0.2, 0.5)}
            className="mt-4 flex gap-6 text-sm"
          >
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 backdrop-blur-sm">
              <div className="text-xs opacity-70 mb-1">Attacker</div>
              <div className="font-medium">{attacker?.name || "None selected"}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 backdrop-blur-sm">
              <div className="text-xs opacity-70 mb-1">Defender</div>
              <div className="font-medium">{defender?.name || "None selected"}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 backdrop-blur-sm">
              <div className="text-xs opacity-70 mb-1">Skill</div>
              <div className="font-medium">{attackerSkill?.name || "None selected"}</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Turn Order */}
        <AnimatePresence>
          {showTurnOrder && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              <TurnOrderBar order={turnOrder} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Character Grid */}
        <motion.div
          variants={fadeIn("up", "tween", 0.3, 0.5)}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {characters.map((c, index) => (
            <GameCard
              key={idOf(c)}
              char={c}
              index={index}
              selected={isSelected(c)}
              isAttacker={isAtt(c)}
              isDefender={isDef(c)}
              onClick={handleCharacterSelect} // GameCard passes (characterId)
            />
          ))}
        </motion.div>

        {/* Skills */}
        <motion.div
          variants={fadeIn("up", "tween", 0.4, 0.5)}
          className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-6 border border-white/10 backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
              Attacker Skills
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {attacker?.skills?.length ? (
                attacker.skills.map((s) => (
                  <SkillButton
                    key={idOf(s)}
                    skill={s}
                    flipping={flipping}
                    onUse={(picked) => {
                      // picked is either the skill or null (for deselect)
                      console.log("[Arena] setAttackerSkill:", picked);
                      setAttackerSkill(picked);
                    }}
                    isSelected={idOf(attackerSkill) === idOf(s)}
                  />
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-sm opacity-70">
                  Select an attacker to view skills
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-6 border border-white/10 backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
              Defender Skills (Optional)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {defender?.skills?.length ? (
                defender.skills.map((s) => (
                  <SkillButton
                    key={idOf(s)}
                    skill={s}
                    flipping={flipping}
                    onUse={(picked) => {
                      console.log("[Arena] setDefenderSkill:", picked);
                      setDefenderSkill(picked);
                    }}
                    isSelected={idOf(defenderSkill) === idOf(s)}
                  />
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-sm opacity-70">
                  Select a defender to view skills
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Visualizer */}
      <ClashVisualizer
        result={clashResult}
        onClose={() => {
          console.log("[Arena] close visualizer; reloading page");
          window.location.reload();
        }}
      />
    </motion.div>
  );
}
