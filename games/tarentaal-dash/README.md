# Tarentaal Dash V6

A polished Afrikaans endless runner built with Canvas, JavaScript and static assets.

## Architecture

- `config.js` — gameplay constants and balancing
- `difficulty.js` — smooth difficulty and event director
- `obstacles.js` — validated obstacle scheduling and spacing
- `regions.js` — regional route state and background renderer
- `environment.js` — moving parallax layers and dirt-road rendering
- `flow.js` — Krrr-Rush reward loop
- `input.js` — keyboard, pointer and mobile controls
- `audio.js` — music and sound effects
- `game.js` — game state, collision, scoring and render orchestration

## Controls

- Jump: Space, Up, W, click or tap
- Duck / fast drop: Down, D or mobile duck button
- Pause: P or Escape

## Design principles

- Endless forward momentum with no upgrade-screen interruptions
- Readable obstacle silhouettes and fair action transitions
- Fast restarts and locally persisted best scores
- Region-specific visual identity without changing collision physics


## V6.3 visual and control pass

The game now uses a compact top HUD inspired by the approved concept: distance/best on the left, Krrr-Rush in the centre and mielies/multiplier on the right. Phone mode uses a portrait 3:4 frame with landscape gameplay cropped from the left to preserve the player and reaction lane. All duck-under obstacles are comic-style birds.
