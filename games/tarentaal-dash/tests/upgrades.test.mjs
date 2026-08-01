import assert from "node:assert/strict";
import {
  UPGRADE_DEFINITIONS,
  applyUpgrade,
  createDefaultModifiers,
  draftUpgradeChoices
} from "../js/upgrades.js";
import { createSeededRng } from "../js/obstacles.js";

const rng = createSeededRng(5082026);
const levels = {};
for (let round = 0; round < 1000; round += 1) {
  const choices = draftUpgradeChoices({ levels, count: 3, rng });
  assert.equal(new Set(choices.map(choice => choice.id)).size, choices.length, "Drafts may not contain duplicates");
  assert.ok(choices.length <= 3, "Drafts are capped at three choices");
  for (const choice of choices) {
    assert.ok(choice.description((levels[choice.id] ?? 0) + 1).length > 5, "Every upgrade needs readable copy");
  }
}

for (const definition of Object.values(UPGRADE_DEFINITIONS)) {
  const modifiers = createDefaultModifiers();
  const localLevels = {};
  for (let level = 1; level <= definition.maxLevel; level += 1) {
    const result = applyUpgrade({ modifiers, levels: localLevels, id: definition.id });
    assert.equal(result.level, level);
    assert.equal(localLevels[definition.id], level);
  }
  assert.throws(
    () => applyUpgrade({ modifiers, levels: localLevels, id: definition.id }),
    /maksimum vlak/,
    "Maxed upgrades must be rejected"
  );
}

const modifiers = createDefaultModifiers();
const progression = {};
applyUpgrade({ modifiers, levels: progression, id: "mieliekoors" });
applyUpgrade({ modifiers, levels: progression, id: "comboKoning" });
applyUpgrade({ modifiers, levels: progression, id: "dikVere" });
assert.ok(modifiers.cornMultiplier > 1);
assert.equal(modifiers.comboStep, 3);
assert.equal(modifiers.maxHealth, 4);

console.log(JSON.stringify({ upgrades: Object.keys(UPGRADE_DEFINITIONS).length, sampleModifiers: modifiers }, null, 2));
