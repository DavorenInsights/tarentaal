TARENTAAL MINIGAME CENTRE — REGIONAL ROUTES PATCH
Patch target: Tarentaal_Minigame_Centre_V3_Polish
Dash version after patch: V5.2

INSTALL
1. Extract this ZIP.
2. Copy all extracted files and folders into the root of your existing GitHub Pages repository.
3. Allow files with the same names to be replaced/overwritten.
4. Commit and push the changes.
5. Hard-refresh the published page (Ctrl+F5) after GitHub Pages deploys.

WHAT CHANGES
- Adds a looping regional route system to Tarentaal Dash.
- Regions: Pretoria, Bloemfontein, Die Karoo and Laeveld.
- Each region has a distinct procedural skyline, vegetation and colour palette.
- Regions change every 18,000 distance units.
- A 2,200-unit blend creates smooth transitions between regions.
- Adds a route label to the desktop HUD.
- Adds a location announcement as the dominant region changes.
- Keeps Dash as a pure endless runner without talent-selection pauses.

PATCH CONTENTS
- Root hub index and package test configuration.
- Dash HTML/CSS.
- Updated Dash config and game controller.
- New js/regions.js regional rendering module.
- Regional tests and updated smoke-test fixture.

All automated tests passed before packaging.
