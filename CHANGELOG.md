# Changelog

## V6.5.0 — Living Road Edition

- Preserved the V6.4 nine-town route at 400 m per location.
- Upgraded player presentation with continuous stride animation, speed lean, jump wing motion, stronger landing squash/stretch, Krrr-Rush ghosts and rim lighting.
- Added feather particles to near misses, shield saves, impacts, landings and high-speed running.
- Replaced simple background-bird line silhouettes with animated full bird shapes, including coastal colour variation.
- Added a late-leg signature landmark reveal for all nine locations.
- Added ambient traffic and region moments such as coastal wind, Lowveld lightning and Upington dust devils.
- Added short comic-style reactions tied to gameplay events and town entries.
- Added kilometre milestone reactions.
- Added an original second soundtrack, `krrr_rush.mp3`, with automatic cross-fade during Krrr-Rush.
- Added a subtle Krrr-Rush camera push.
- Removed temporary/unused polish state and an unused legacy audio method during the cleanup pass.
- Core physics, obstacle hitboxes and difficulty scheduling remain unchanged.

## V6.4.0 — Nine Town Run

- Extended every route leg from about 180 m to about 400 m.
- Expanded the endless route from 4 to 9 South African locations: Pretoria, Bloemfontein, Graaff-Reinet, Mbombela, Cape Town, Durban, Gqeberha, Clarens and Upington.
- Added five new lightweight regional background assets and new region-specific foreground/parallax treatments.
- Replaced the region rendering if/else chain with a region renderer map.
- Removed unused upgrade code, obsolete scenery/obstacle files, PNG duplicates and legacy root-level Dash copies.
- Removed inactive Tussle/Fladder runtime code while retaining their non-playable placeholder pages.
- Updated tests to validate all nine region assets and the 400 m route length.
