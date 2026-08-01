# Tarentaal Dash V5 build notes

## Baseline

V5 was built from the supplied Tarentaal Dash V4 package. The V4 obstacle definitions, physics envelopes, sequence validator, soundtrack, player artwork, day/night cycle, responsive controls and GitHub Pages structure were retained.

## Rewritten or added

- Added `js/upgrades.js` as a central, testable run-progression system.
- Added recoverable damage and Veerharte to `js/game.js`.
- Added safe stage checkpoint logic for talent choices.
- Added weighted, unique three-card drafts with upgrade level caps.
- Added V4 high-score migration into the V5 storage key.
- Added health, talent and end-of-run progression UI.
- Added damage and upgrade sound effects.
- Added dedicated upgrade tests and extended the runtime simulation.

## Retained unchanged

- Mathematical jump/duck spacing model.
- Obstacle group validator and scheduler.
- Difficulty trend with random calm and surge events.
- Collision hitboxes and action warnings.
- Collectibles, combo, Veerkrag shield, near-miss and duck-under systems.
- Dusty Farm Sprint music and day/night rendering.

## Test result

- JavaScript syntax checks: passed.
- Random obstacle groups validated: 30,000.
- Long runtime autoplay distance: over 127,000 world units.
- Talent progression encountered: 3 checkpoints during the automated 8,000-frame run.
- Recoverable collision and final-heart game-over logic: passed.
