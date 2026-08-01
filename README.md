# Tarentaal Dash V5

Tarentaal Dash V5 is a static HTML5 endless runner designed for GitHub Pages. It keeps V4's validated Google Dino-style obstacle generation and adds a light roguelite layer: recoverable collisions, Veerharte and run-specific Plaaspad Talente.

## What is new in V5

- **Veerharte:** each run starts with three hearts. A normal collision removes one heart, breaks the combo, deducts points and grants a short recovery window. The final collision ends the run.
- **Plaaspad Talente:** entering each major difficulty stage queues a safe checkpoint. Choose one of three upgrades using click/tap or keys 1–3.
- **10 upgrade types:** collection magnets, scoring specialisations, combo improvements, stronger shields, extra health and collision protection.
- **Run variety:** talent drafts are weighted and cannot contain duplicate cards. Upgrade levels are capped.
- **V4 score migration:** the stored V4 high score is read automatically and can become the initial V5 best score.
- **Improved feedback:** heart HUD, talent counter, collision flashing, new sound cues and a results summary of chosen talents.
- **Cleanup:** the duplicate background hadeda entry from V4 was removed.

## Play locally

The project uses browser ES modules, so serve the folder through a small local web server rather than opening `index.html` with a `file://` URL.

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Controls

- **Jump:** Space, Up Arrow, W, click/tap, or the mobile **SPRING** button.
- **Duck:** hold Down Arrow, D, or the mobile **DUIK** button.
- **Fast drop:** hold duck while airborne.
- **Choose a talent:** click/tap a card or press 1, 2 or 3.
- **Pause:** P, Escape, the pause button, or leaving the browser tab.
- **Music/SFX/fullscreen:** use the visible buttons.

## GitHub Pages deployment

1. Create a GitHub repository.
2. Upload the contents of this folder to the repository root, or place the contents in `/docs`.
3. Open **Settings → Pages**.
4. Choose **Deploy from a branch**.
5. Select the relevant branch and either `/ (root)` or `/docs`.
6. Save.

All paths are relative, so the game works from a repository subdirectory such as `https://username.github.io/tarentaal-dash/`.

## Project structure

- `index.html` — game shell, HUD, talent overlay and results screen.
- `css/game.css` — responsive layout, mobile controls and upgrade cards.
- `js/config.js` — central physics, difficulty, health, progression and scoring values.
- `js/difficulty.js` — long-term trend plus calm/surge intensity variation.
- `js/obstacles.js` — obstacle definitions, generation, spacing mathematics and validation.
- `js/upgrades.js` — upgrade registry, weighted drafting and upgrade application.
- `js/input.js` — keyboard, pointer and mobile input.
- `js/audio.js` — Dusty Farm Sprint and generated sound effects.
- `js/game.js` — game state, collisions, progression, scoring and rendering.
- `assets/` — player, obstacle, collectible, scenery and audio assets.
- `tests/spacing.test.mjs` — generates 30,000 validated obstacle groups.
- `tests/upgrades.test.mjs` — validates drafts, level caps and modifier effects.
- `tests/runtime-smoke.test.mjs` — loads all assets and runs a long physics-aware autoplay simulation.

## Validation

```bash
npm run check
npm test
```

The automated suite checks JavaScript syntax, 30,000 obstacle groups, transition spacing, duck hitboxes, upgrade rules and a long physics-aware run through multiple talent choices.

## Mobile packaging later

The project has no server-side dependencies and can later be wrapped with Capacitor. Keep the relative paths unchanged and point Capacitor's web directory to this folder.
