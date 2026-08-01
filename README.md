# Tarentaal Minigame Centre

A static, dependency-free browser game collection designed for GitHub Pages.

## Included games

- **Tarentaal Dash V5** — the existing endless runner, preserved inside `games/tarentaal-dash/`.
- **Tarentaal Tussle V1** — a top-down arena-survival roguelite with:
  - ten waves;
  - four auto-firing weapon systems;
  - level-up choices;
  - a between-wave shop;
  - two boss encounters;
  - keyboard and mobile joystick controls;
  - pause, sound and fullscreen controls;
  - a local best score.

- **Tarentaal Fladder V1** — a farm-themed rhythm-flight game with:
  - five obstacle styles;
  - stamina-based flapping;
  - mielie pickups and near-miss bonuses;
  - a temporary Veerkrag shield;
  - changing day/night scenery;
  - medals and a local best score.

## Deploy to GitHub Pages

Upload the contents of this folder to the repository root, replacing the old root files. Then use:

1. **Settings → Pages**
2. **Deploy from a branch**
3. Select the branch and `/ (root)`
4. Save

The root `index.html` is now the minigame-centre landing page.

## Run locally

Serve the folder with a local web server:

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

## Structure

```text
/
├── index.html
├── css/hub.css
├── assets/
└── games/
    ├── tarentaal-dash/
    ├── tarentaal-tussle/
    └── tarentaal-fladder/
```

All paths are relative and no database, framework or build step is required.
