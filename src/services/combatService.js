/** ---------------- RNG ---------------- **/
export function makeRNG(seed = null) {
  if (!seed) return Math.random;
  // simple LCG
  let s = 0;
  for (let i = 0; i < String(seed).length; i++) s = (s * 31 + String(seed).charCodeAt(i)) >>> 0;
  return function rng() {
    s = (1664525 * s + 1013904223) >>> 0;
    return (s & 0xfffffff) / 0xfffffff;
  };
}

/** -------------- Speed roll -------------- **/
export function rollSpeed(speed, rng = Math.random) {
  if (!speed || typeof speed.min !== "number" || typeof speed.max !== "number") {
    throw new Error("Invalid speed range");
  }
  const { min, max } = speed;
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** -------------- Turn Order -------------- **/
export function makeTurnOrder(characters, { rng = makeRNG() } = {}) {
  if (!Array.isArray(characters)) {
    throw new Error("Characters must be an array");
  }
  const withSpeed = characters.map((c) => ({
    ...c,
    speed: { ...c.speed, current: rollSpeed(c.speed, rng) },
  }));
  const sorted = [...withSpeed].sort((a, b) => b.speed.current - a.speed.current);
  const fastestBySide = {};
  sorted.forEach((c) => {
    if (!fastestBySide[c.side] || c.speed.current > fastestBySide[c.side].speed.current) {
      fastestBySide[c.side] = c;
    }
  });
  return sorted.map((c) => ({
    ...c,
    getsExtraTurn: fastestBySide[c.side]?._id === c._id,
  }));
}

/** -------------- Coin / Skill Rolls -------------- **/
function flipCoin({ sanity = 0, isNegative = false, rng = Math.random }) {
  const base = 0.5;
  const mod = (sanity || 0) / 100; // sanity ∈ [-45,45] → ±0.45 max
  const chance = Math.max(0, Math.min(1, base + (isNegative ? -mod : mod)));
  return rng() <= chance;
}

export function resolveCoins({ skill, sanity = 0, rng = Math.random }) {
  const coins = [];
  let total = skill.basePower || 0;

  (skill.coins || []).forEach((coin, idx) => {
    const success = flipCoin({ sanity, isNegative: !!coin.isNegative, rng });
    if (success) total += Number(coin.value || 0);
    coins.push({
      index: idx,
      value: Number(coin.value || 0),
      success,
      totalAfter: total,
    });
  });

  return { base: Number(skill.basePower || 0), coins, total };
}

/**
 * Roll damage for a skill.
 * mode: "clash" | "damage" (the math can be same, but the trace tag helps UI/logging)
 */
export function calculateSkillDamage(skill, actor, { rng = makeRNG(), mode = "damage" } = {}) {
  const roll = resolveCoins({ skill, sanity: actor?.sanity ?? 0, rng });
  return { ...roll, mode };
}

/** -------------- Clash (winner only) -------------- **/
export function resolveClash(attacker, defender, attackerSkill, defenderSkill, { rng = makeRNG() } = {}) {
  const atk = resolveCoins({ skill: attackerSkill, sanity: attacker?.sanity ?? 0, rng });
  const def = resolveCoins({ skill: defenderSkill, sanity: defender?.sanity ?? 0, rng });

  // Decide by total
  if (atk.total !== def.total) {
    const atkWins = atk.total > def.total;
    return {
      mode: "clash",
      phase: "total",
      winner: atkWins ? attacker : defender,
      loser: atkWins ? defender : attacker,
      winnerSkill: atkWins ? attackerSkill : defenderSkill,
      loserSkill: atkWins ? defenderSkill : attackerSkill,
      coinsBroken: 1,
      traces: { attacker: atk, defender: def },
    };
  }

  // Coin-by-coin tiebreak
  const len = Math.max(atk.coins.length, def.coins.length);
  for (let i = 0; i < len; i++) {
    const a = atk.coins[i]?.success ?? false;
    const d = def.coins[i]?.success ?? false;
    if (a !== d) {
      const atkWins = a && !d;
      return {
        mode: "clash",
        phase: "coin",
        tiebreakIndex: i,
        winner: atkWins ? attacker : defender,
        loser: atkWins ? defender : attacker,
        winnerSkill: atkWins ? attackerSkill : defenderSkill,
        loserSkill: atkWins ? defenderSkill : attackerSkill,
        coinsBroken: 1,
        traces: { attacker: atk, defender: def },
      };
    }
  }

  // True tie
  return {
    mode: "clash",
    phase: "tie",
    winner: null,
    loser: null,
    winnerSkill: null,
    loserSkill: null,
    coinsBroken: 0,
    traces: { attacker: atk, defender: def },
  };
}

/** -------------- Effects / Stagger / Sanity -------------- **/

// Split immediate vs scheduled; return applied+scheduled arrays (for UI/log)
export function applyImmediateEffects(target, effects = []) {
  const applied = [];
  const scheduled = [];
  for (const e of effects) {
    if (e.type === "Burn") {
      const dmg = 3 * Number(e.potency || 0);
      if (dmg > 0) {
        applied.push({ type: "Burn", amount: dmg, note: "immediate" });
      }
    } else {
      scheduled.push({ ...e });
    }
  }
  return { applied, scheduled };
}

export function tickScheduledEffects(character) {
  const updates = { hpDelta: 0, removed: [], remaining: [] };
  for (const eff of character.statusEffects || []) {
    let consumed = false;
    if (eff.type === "Bleed") {
      // Example: bleed ticks on action; here just decrement
      updates.remaining.push({ ...eff, count: eff.count - 1 });
      consumed = true;
    } else if (eff.type === "Burn") {
      // burn halves next time, already applied immediate above; schedule decay
      const nextPot = Math.floor(Number(eff.potency || 0) / 2);
      updates.remaining.push({ ...eff, potency: nextPot, count: eff.count - 1 });
      consumed = true;
    } else {
      updates.remaining.push({ ...eff, count: eff.count - 1 });
      consumed = true;
    }
    if (consumed && (eff.count - 1) <= 0) {
      updates.removed.push(eff.type);
    }
  }
  updates.remaining = updates.remaining.filter((e) => e.count > 0);
  return updates;
}

export function updateStagger(character) {
  const { thresholds } = character.stagger || {};
  const hpFrac = Math.max(0, Math.min(1, (character.hp?.current || 0) / (character.hp?.max || 1)));
  let to = null;
  if (!thresholds) return { from: character.stagger?.state ?? null, to: null };

  if (hpFrac <= (thresholds.third ?? 0.83)) to = "Stagger++";
  else if (hpFrac <= (thresholds.second ?? 0.66)) to = "Stagger+";
  else if (hpFrac <= (thresholds.first ?? 0.33)) to = "Stagger";
  else to = null;
  const from = character.stagger?.state ?? null;
  return { from, to };
}

export function updateSanity(actor, delta = 0) {
  const from = Number(actor.sanity || 0);
  let to = from + Number(delta || 0);
  if (to > 45) to = 45;
  if (to < -45) to = -45;
  return { from, to, delta: to - from };
}

/** -------------- Log helper -------------- **/
export function logPush(log, type, payload = {}) {
  log.push({ t: type, ...payload, ts: Date.now() });
  return log;
}
