# Rajib Bisoi — 3D Building Elevation

An interactive 3D model of the residence in
`Rajib_Bisoi_2D_Builing_Design.pdf`, built directly from the drawing set
(PROPOSED GROUND / FIRST / TYPICAL SECOND & THIRD FLOOR PLAN, CONCEPT-B
REVISED-1, 1:100, 29-04-2024).

Open `index.html` (or serve the repository root) and the viewer loads at
`app/index.html`. Everything is vendored, so it runs offline — no CDN, no
build step, no `npm install`.

## What you can do

- **Orbit, zoom, pan** — drag, scroll, right-drag.
- **Orthographic elevations** — Front, Rear, West, East. These are true
  parallel-projection elevations, not perspective, so they read like a
  drawing.
- **Three-quarter views** — Front L/R, Rear L/R.
- **Aerial and Roof plan.**
- **Walk around** — continuous turntable orbit to review every facade.
- **Level isolation** — show Ground, First, Second or Third floor alone.
- **Pillar names** — "Show pillar names" in the Level isolation panel tags each
  ground-floor column with its drawing number, C1 to C33. The tags are
  sprites parented to the ground-floor group, so they appear and hide with that
  floor; they are left out of the GLB export, which has no sprite primitive.
- **Collapsible panels** — every control panel collapses to its title bar, and
  the choice is remembered. On a phone the panels start collapsed and stack
  into one bottom sheet, so the building fills the screen instead of being
  covered by the controls.
- **Sun controls** — azimuth and elevation sliders drive the directional
  light and the shadows, so you can check the design at different times of
  day.
- **Export** — PNG screenshot of the current view, or the whole building as
  GLB for Blender / SketchUp / Revit.

Keyboard: `1`–`4` elevations, `5` aerial, `6` plan, `7`/`8` three-quarters,
`A` orbit, `R` reset, `H` hide UI.

## How the drawings were read

The PDF holds vector geometry, so the model is measured, not eyeballed. Wall
segments were extracted with PyMuPDF and converted from page points to feet
using the drawing scale (1:100, 9.53 px/ft). Openings are the **gaps between
drawn wall runs**, which is why the window schedule matches the plan rather
than being invented.

Measured envelope: **27'-1" × 90'-1"**. The plot is 33'-0" × 35'-0" × 100'-0"
with 3'-0" side and 5'-0" front and rear setbacks — those setbacks are exactly
what leaves the 27'-1" × 90'-1" footprint, which confirms the reading.

| Item | From the drawings |
| --- | --- |
| Ground floor | 2,004 sq ft; single rooms 12'-6" × 12'-0", A./C. toilets 7'-0" × 4'-6", staircase 13'-10" × 9'-8", lift 4'-0" × 4'-10", 10'-0" wide driveway |
| First floor | 2,735 sq ft; bedrooms, dining hall 11'-7" × 9'-5", kitchen 6'-0" × 9'-5", drawing hall 12'-6" × 10'-0", balcony 27'-1" × 4'-0", west balcony 10'-10" × 3'-0", east balcony 6'-7" × 8'-2" |
| Second / third | 2,765 sq ft each, same plan |

The lift core projects past the east wall (to x = 29.9 ft) between z = 41.7
and 48.2, and is modelled as a full-height shaft. The rear of the ground floor
is open stilt parking on columns, which is what the plan shows as the open
bay behind the enclosed rooms.

## Deployment

Pushing to `main` deploys to Vercel via GitHub Actions
(`.github/workflows/deploy-vercel.yml`). Pull requests get a preview
deployment with the URL commented on the PR.

There is no build step: `vercel build` just stages the static files, so what
you commit is what is served. `vercel.json` sets long-lived caching for the
vendored Three.js and revalidates `app/src/` so a design change is never
served stale.

Three repository secrets are required:

| Secret | Where to find it |
| --- | --- |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `vercel link`, then `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `vercel link`, then `.vercel/project.json` |

Set them with `gh secret set VERCEL_TOKEN` (and the other two), or under
GitHub → Settings → Secrets and variables → Actions.

## Layout

```
index.html          redirect to the viewer
app/index.html      viewer shell + control panel
app/src/spec.js     the measured building specification (edit here to change the design)
app/src/building.js walls, openings, balconies, slabs, roof
app/src/site.js     plot, boundary wall, gate, driveway, road
app/src/main.js     renderer, camera, views, framing, UI wiring
app/vendor/         Three.js r160 (vendored)
vercel.json         caching headers for the static deploy
.vercelignore       keeps the source PDF and dev notes out of the deploy
```

`app/src/spec.js` is the single source of truth. Change a dimension there and
the geometry, the framing and the level readouts all follow.
