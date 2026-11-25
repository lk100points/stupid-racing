# STUPID RACING

A self-contained arcade 3D racer built with Three.js, Rapier 3D, Vite, Web Audio API and LocalStorage. All visual assets are generated procedurally at runtime; no external asset host or CDN is required.

## Requirements

- Node.js 20.19+ or 22.12+
- npm 10+
- A modern browser with WebGL2 (Chrome, Firefox, Safari, iOS Safari)

## Run locally

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. For a production preview:

```bash
npm run build
npm run preview
```

## Publish to GitHub Pages

1. Create a GitHub repository and upload the contents of this folder to its root (not the containing folder).
2. Push the `main` branch (the workflow also supports `master`).
3. Open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
4. Open the repository's **Actions** tab. The workflow builds the site with `npm ci` and deploys `dist` to Pages.
5. Your site URL appears in the completed deployment job.

Vite uses `base: './'`, so asset paths work for both a user/organization site and a project site under a repository subpath.

## Controls

- `W` / `↑`: accelerate
- `S` / `↓`: brake / reverse
- `A` / `D` or `←` / `→`: steer
- `Space`: hop
- `Shift`: nitro
- `E`: vehicle ability
- `Esc`: pause

On touch screens, rotate to landscape and use the on-screen controls. The controls support multitouch.

## Game notes

- Five themed race tracks and the hidden **THE ABYSS** route.
- Eight vehicle builds with individual stats and special abilities.
- Six modes, upgrade paths, cosmetic shop, achievements, daily reward and persistent progress.
- Enter `1529` in the main menu to activate the alternate infernal presentation and unlock the Abyss route.
- The Abyss chest grants its one-time reward locally when the route is completed.

Progress is saved in the browser's LocalStorage. Clearing site data resets local progress.
