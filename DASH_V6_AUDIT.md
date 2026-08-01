# Tarentaal Dash V6 — Design and Architecture Audit

## Source-file findings

### 1. Presentation and gameplay were too tightly coupled
The main game class was responsible for regional backgrounds, generic scenery, road tinting, player rendering, effects, scoring and obsolete upgrade logic. This made visual iteration risky because changes to the environment were mixed into the collision/gameplay file.

**V6 response:** regional background state remains in `regions.js`, while moving environment layers and the dirt road now live in `environment.js`. The validated obstacle scheduler remains isolated and unchanged in principle.

### 2. The regional backgrounds were attractive but largely static
The four painted backgrounds were being cross-faded, but every region still received the same corn, grass and sign assets. This weakened the identity of Pretoria, Bloemfontein, the Karoo and the Lowveld.

**V6 response:** each region now has a dedicated moving layer:
- Pretoria: jacarandas, fence lines and drifting petals
- Bloemfontein: Free State grass, sandstone rocks, fences and windpumps
- Karoo: scrub, aloes, heat shimmer, fences and windpumps
- Lowveld: acacias, aloes, termite mounds and bushveld scrub

### 3. The player did not consistently appear to run on a road
The old road renderer was a transparent colour wash below the gameplay ground line. Some backgrounds visually read as grass or landscape directly beneath the player.

**V6 response:** the road is now a dedicated full-width gameplay layer in every region, with a coloured verge, compacted dirt gradient, moving ruts, stones, patches and region-blended dust colours.

### 4. Shadows were embedded in character art
The jump sprite contained a baked ground shadow. Because the sprite moves upward, the shadow moved with the bird and looked physically incorrect.

**V6 response:** baked player shadows were removed from the active animation assets. The runtime now draws a separate shadow on the road that shrinks and fades according to jump height. Grounded running and ducking also use the same shadow system.

### 5. Obsolete roguelite code remained in the endless-runner build
The upgrade module, upgrade overlay, talent state and tests remained even though talents had been disabled.

**V6 response:** the dead upgrade path was removed from the Dash module. The production architecture now reflects the actual endless-runner design.

### 6. The reward loop needed a stronger mid-run peak
Combos and collectibles were useful, but the run lacked a short, high-energy payoff that encourages players to maintain clean play.

**V6 response:** Krrr-Rush is a continuous flow meter. Collectibles, near misses, duck-under bonuses and shield saves fill it. A full meter triggers a temporary x2 scoring state, stronger speed effects and collectible attraction without pausing gameplay.

### 7. Asset weight was higher than necessary
Four regional PNGs accounted for roughly 9–10 MB.

**V6 response:** regional art is now stored as high-quality 1600×900 WebP files. The four backgrounds are approximately 1 MB combined while retaining strong visual quality.

### 8. The repository contained duplicated standalone Dash files
Old root-level Dash assets, scripts and tests duplicated the modular `/games/tarentaal-dash/` implementation and made the deployment structure ambiguous.

**V6 response:** the release structure is clean: the hub remains at root and each game is isolated beneath `/games/`.

## Gameplay principles retained

- Validated jump/duck spacing and physics envelope
- Smooth long-run difficulty escalation
- Three-heart recovery model
- Near-miss and duck-under skill bonuses
- Fast restart and local high-score persistence
- Desktop and mobile controls

## Quality and performance measures

- High-quality canvas image smoothing
- Device-aware particle scaling
- Automatic pause when the tab is hidden
- Compressed regional backgrounds
- Deterministic road and parallax decoration rather than storing many extra images
- Separate module tests for regions, environment data, Krrr-Rush and runtime survival

## Release status

Dash V6 is the flagship-quality minigame in this release. Tussle and Fladder are preserved unchanged so they can receive their own focused production passes later.


## V6.1 tutorial refinement
Jump and duck arrows are now shown only for the first 10 obstacle groups in each run. After that, the game relies on visual recognition and rhythm, reducing HUD clutter and making later play feel more skill-based.
