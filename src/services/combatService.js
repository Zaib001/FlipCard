// Helper for rolling random speed
export const rollSpeed = (speed) => {
  if (!speed || typeof speed.min !== 'number' || typeof speed.max !== 'number') {
    throw new Error("Invalid speed range");
  }
  return Math.floor(Math.random() * (speed.max - speed.min + 1)) + speed.min;
};

// Generate turn order
export const makeTurnOrder = (characters) => {
  if (!Array.isArray(characters)) {
    throw new Error("Characters must be an array");
  }

  // Roll speed for each character
  const withSpeed = characters.map(char => ({
    ...char,
    speed: {
      ...char.speed,
      current: rollSpeed(char.speed)
    }
  }));

  // Sort by current speed (descending)
  const sorted = [...withSpeed].sort((a, b) => b.speed.current - a.speed.current);

  // Determine who gets extra turns (fastest on each side)
  const fastestBySide = {};
  sorted.forEach(char => {
    if (!fastestBySide[char.side] || 
        char.speed.current > fastestBySide[char.side].speed.current) {
      fastestBySide[char.side] = char;
    }
  });

  // Mark extra turn recipients
  return sorted.map(char => ({
    ...char,
    getsExtraTurn: fastestBySide[char.side]?._id === char._id
  }));
};

// Calculate skill damage
export const calculateSkillDamage = (skill, attacker) => {
  let damage = skill.basePower;
  const results = {
    base: damage,
    coins: [],
    total: damage
  };

  for (let i = 0; i < skill.coins.length; i++) {
    const isHeads = Math.random() * 100 <= (50 + attacker.sanity);
    if (isHeads) {
      damage += skill.coins[i].value;
    }
    results.coins.push({
      value: skill.coins[i].value,
      damage: damage,
      isHeads
    });
    results.total = damage;
  }

  return results;
};

// Resolve clash between two skills
export const resolveClash = (attacker, defender, attackerSkill, defenderSkill) => {
  const attackerResults = calculateSkillDamage(attackerSkill, attacker);
  const defenderResults = calculateSkillDamage(defenderSkill, defender);

  if (attackerResults.total > defenderResults.total) {
    return {
      winner: attacker,
      winnerSkill: attackerSkill,
      loser: defender,
      loserSkill: defenderSkill,
      damageDealt: attackerResults.total - defenderResults.total,
      coinsBroken: 1
    };
  } else if (defenderResults.total > attackerResults.total) {
    return {
      winner: defender,
      winnerSkill: defenderSkill,
      loser: attacker,
      loserSkill: attackerSkill,
      damageDealt: defenderResults.total - attackerResults.total,
      coinsBroken: 1
    };
  }

  return {
    winner: null,
    damageDealt: 0,
    coinsBroken: 0
  };
};