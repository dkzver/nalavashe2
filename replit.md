# LAVA DASH

LAVA DASH is a playable Three.js endless runner for the «На LAVAше» restaurant, with a 3D shawarma hero, mobile controls, and a restaurant-order link.

## Run & Operate

- `pnpm --filter @workspace/lava-dash run dev` — run the game in development
- `pnpm --filter @workspace/lava-dash run build` — build the game
- `pnpm --filter @workspace/lava-dash run typecheck` — check the web app types
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, React, Vite, Three.js
- Three.js creates the city, shawarma mascot, obstacles, and collectible models in the browser
- Browser localStorage stores the best score; the game has no API or database dependency

## Where things live

- `artifacts/lava-dash/src/App.tsx` — Russian game menu, HUD, help, pause, and game-over screens
- `artifacts/lava-dash/src/game/` — scene, world, player, controls, collisions, collectibles, obstacles, sound, and score storage
- `artifacts/lava-dash/src/index.css` — responsive game interface
- `artifacts/lava-dash/index.html` — Russian page metadata and social preview text

## Architecture decisions

- Keep game rules in small JavaScript modules so the temporary geometry mascot can later be replaced with a GLB/GLTF model.
- Never create or award promo codes in the browser; future offers must come from a server-side verification flow.

## Product

Players run through a colorful three-lane city, dodge hazards, collect food for points, save their best score, and can open the restaurant’s order page.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
