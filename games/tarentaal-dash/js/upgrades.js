export const BASE_MODIFIERS = Object.freeze({
  cornMultiplier: 1,
  potatoMultiplier: 1,
  comboStep: 4,
  maxMultiplier: 5,
  shieldDurationMultiplier: 1,
  nearMissMultiplier: 1,
  duckBonusMultiplier: 1,
  collectionPadding: 0,
  maxHealth: 3,
  damagePenaltyMultiplier: 1,
  damageInvulnerabilityMultiplier: 1,
  featherChanceBonus: 0
});

export function createDefaultModifiers() {
  return { ...BASE_MODIFIERS };
}

export const UPGRADE_DEFINITIONS = Object.freeze({
  mieliekoors: Object.freeze({
    id: "mieliekoors", icon: "🌽", name: "Mieliekoors", maxLevel: 3, weight: 1.1,
    description: level => `Mielies gee ${35 * level}% meer punte.`,
    apply: modifiers => { modifiers.cornMultiplier += 0.35; }
  }),
  aartappelkrag: Object.freeze({
    id: "aartappelkrag", icon: "🥔", name: "Aartappelkrag", maxLevel: 3, weight: 1,
    description: level => `Aartappels gee ${45 * level}% meer punte.`,
    apply: modifiers => { modifiers.potatoMultiplier += 0.45; }
  }),
  comboKoning: Object.freeze({
    id: "comboKoning", icon: "🔥", name: "Combo-koning", maxLevel: 2, weight: 0.9,
    description: level => level === 1 ? "Bou elke multiplier met net 3 versamelitems." : "Verhoog die maksimum combo na x6.",
    apply: (modifiers, level) => {
      if (level === 1) modifiers.comboStep = 3;
      if (level === 2) modifiers.maxMultiplier = 6;
    }
  }),
  veerkragPlus: Object.freeze({
    id: "veerkragPlus", icon: "🪶", name: "Veerkrag Plus", maxLevel: 3, weight: 0.95,
    description: level => `Skilde hou ${35 * level}% langer. Kry nou ook 'n skild.`,
    apply: modifiers => { modifiers.shieldDurationMultiplier += 0.35; },
    instant: Object.freeze({ grantShield: true })
  }),
  nabyvoet: Object.freeze({
    id: "nabyvoet", icon: "⚡", name: "Nabyvoet", maxLevel: 3, weight: 0.85,
    description: level => `Naby-spring bonusse is ${50 * level}% groter.`,
    apply: modifiers => { modifiers.nearMissMultiplier += 0.5; }
  }),
  laagvlieg: Object.freeze({
    id: "laagvlieg", icon: "↘", name: "Laagvlieg", maxLevel: 3, weight: 0.85,
    description: level => `Onderdeur-bonusse is ${50 * level}% groter.`,
    apply: modifiers => { modifiers.duckBonusMultiplier += 0.5; }
  }),
  mielieMagneet: Object.freeze({
    id: "mielieMagneet", icon: "🧲", name: "Plaasmagneet", maxLevel: 3, weight: 1,
    description: level => `Versamelitems trek van ${18 * level}px verder af.`,
    apply: modifiers => { modifiers.collectionPadding += 18; }
  }),
  dikVere: Object.freeze({
    id: "dikVere", icon: "❤️", name: "Dik Vere", maxLevel: 2, weight: 0.8,
    description: level => `Voeg Veerhart ${level + 3} by en herstel een hart.`,
    apply: modifiers => { modifiers.maxHealth += 1; },
    instant: Object.freeze({ heal: 1 })
  }),
  stofjas: Object.freeze({
    id: "stofjas", icon: "🛡️", name: "Stofjas", maxLevel: 2, weight: 0.75,
    description: level => level === 1 ? "Botsings kos die helfte minder punte." : "Langer hersteltyd ná 'n botsing.",
    apply: (modifiers, level) => {
      if (level === 1) modifiers.damagePenaltyMultiplier = 0.5;
      if (level === 2) modifiers.damageInvulnerabilityMultiplier = 1.35;
    }
  }),
  geluksveer: Object.freeze({
    id: "geluksveer", icon: "🍀", name: "Geluksveer", maxLevel: 3, weight: 0.75,
    description: level => `Veerkrag verskyn ${Math.round(2.5 * level)}% meer gereeld.`,
    apply: modifiers => { modifiers.featherChanceBonus += 0.025; }
  })
});

const ALL_UPGRADES = Object.values(UPGRADE_DEFINITIONS);

function weightedPick(pool, rng) {
  const total = pool.reduce((sum, definition) => sum + definition.weight, 0);
  let roll = rng() * total;
  for (const definition of pool) {
    roll -= definition.weight;
    if (roll <= 0) return definition;
  }
  return pool.at(-1);
}

export function draftUpgradeChoices({ levels = {}, count = 3, rng = Math.random } = {}) {
  const pool = ALL_UPGRADES.filter(definition => (levels[definition.id] ?? 0) < definition.maxLevel);
  const choices = [];
  while (choices.length < count && pool.length > 0) {
    const picked = weightedPick(pool, rng);
    choices.push(picked);
    pool.splice(pool.indexOf(picked), 1);
  }
  return choices;
}

export function applyUpgrade({ modifiers, levels, id }) {
  const definition = UPGRADE_DEFINITIONS[id];
  if (!definition) throw new Error(`Onbekende opgradering: ${id}`);
  const currentLevel = levels[id] ?? 0;
  if (currentLevel >= definition.maxLevel) throw new Error(`${definition.name} is reeds maksimum vlak`);
  const level = currentLevel + 1;
  definition.apply(modifiers, level);
  levels[id] = level;
  return Object.freeze({ definition, level, instant: definition.instant ?? null });
}
