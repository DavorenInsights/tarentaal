# Tarentaal Dash V6.5 — Living Road Edition

The active Tarentaal endless runner.

## Route system

The world cycles through nine South African locations. Every leg is `40,000` internal distance units, which equals about `400 m` on the in-game HUD. The final `4,500` units cross-fade toward the next environment.

1. Pretoria
2. Bloemfontein
3. Graaff-Reinet
4. Mbombela
5. Cape Town
6. Durban
7. Gqeberha
8. Clarens
9. Upington

Each location has its own background, road palette and foreground/parallax treatment. V6.5 adds a progress-timed landmark reveal and ambient-life layer without affecting collision logic.

## Visual polish

The original tarentaal sprite set remains the art direction. V6.5 adds continuous movement transforms, jump wing motion, landing squash/stretch, high-speed feather trails, Krrr-Rush motion ghosts, richer background birds and event reactions around those sprites.

## Audio

- Normal run: `assets/audio/dusty_farm_sprint.mp3`
- Krrr-Rush: `assets/audio/krrr_rush.mp3`

The AudioManager cross-fades between the two loops based on Rush state.

## Test

```bash
npm test
```
