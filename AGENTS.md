# AGENTS.md

## What this repository is

A single-page Three.js viewer that renders the residence in
`Rajib_Bisoi_2D_Builing_Design.pdf`. No build step, no npm install: Three.js
r160 is vendored under `app/vendor/` and `app/index.html` uses an import map,
so the site runs offline from any static server.

## Run it

```bash
python3 -m http.server 12000 --bind 0.0.0.0
```

Then open `/` (redirects to `app/`). It must be served over HTTP, not opened as
a `file://` URL, because ES modules and the import map require an origin.

## Verify a change

The viewer fails silently if a module import breaks: the page loads, the
canvas stays blank, and only the console shows the error. Always confirm a
render instead of trusting an HTTP 200.

```bash
# DOM is up and the controls exist
curl -s localhost:12000/app/ | grep -c button

# real render: a blank canvas has very few distinct colours
chromium --headless --no-sandbox --disable-gpu --virtual-time-budget=20000 \
  --screenshot=/tmp/shot.png http://localhost:12000/app/
python3 -c "from PIL import Image; \
print(len(Image.open('/tmp/shot.png').getcolors(maxcolors=10**7)))"
```

A working view yields >10k distinct colours. A blank one yields a few hundred.

The GLB export can be checked headlessly by importing `buildBuilding` and
`makeMaterials` from `app/src/building.js` in a scratch page and asserting the
buffer starts with the `glTF` magic; it should be about 2.7 MB.

## Durability: this is the important part

The sandbox is ephemeral. A previous session's entire project was lost when its
sandbox was reclaimed, because the work existed only as files on that
container's disk — never committed, and with no git remote configured.

So: commit as you go, and push to a remote if one exists. A local commit alone
only protects the work until this sandbox is reclaimed. Before reporting work
as delivered, run `git status` and `git remote -v` and say plainly whether the
result survives the sandbox being torn down.

## Layout

`app/src/spec.js` is the single source of truth for every dimension; the
geometry, camera framing and level readouts all derive from it. Change a
number there rather than in `building.js` or `main.js`.

`GROUND_COLUMNS` is the one list that came straight off the drawing rather than
from a round number. It holds the 33 ground-floor columns as the plan numbers
them, C1-C33, each with its measured section size: 12 across the front bay, 12
across the rear bay, 4 around the staircase, 4 around the lift and 1 standing
alone on the west edge beside the stair. `code` is a directional alias
(`FR`/`BR` + row counted from the street + `L`/`C`/`R`; `ST`/`LF`/`SG`) so a
column can be named without quoting a drawing number. Positions are column
centres in feet from the west and rear walls, taken from the centre-line plan
by matching each `C<n>` label to the nearest column section. Do not re-space
them onto a tidy grid - the drawing is not a tidy grid, and the stair and lift
clusters are what the enclosures below are built around.

Numbering runs from the street inwards: C1-C3 are the front row, the count
carries back through the stair and lift cluster (C13-C21), and C31-C33 are the
rear row. Left to right within a row. The array is written in C1..C33 order so
build order and drawing order agree; the `code` aliases still count rows from
the street, which is why the last entries carry the `BR8` codes.

Orientation: `+Z` is the front, towards the street, so the front facade sits at
`FRONT_Z` (= depth) and the rear at `REAR_Z` (= 0). Use those two constants
rather than a bare `0` or `depth`, and remember that `+X` is east, which is
screen-right when looking at the front elevation. Anything that names a facade
or a corner should follow from these, not from a hand-written sign.

Roof eaves added by the revised design live in `ROOF_EXTENSIONS` (also in
`spec.js`) and are built by `roofExtension()` in `building.js`. They attach to
the level group named by `level`, so level isolation hides them with their
floor. Each slab sits flush with the top of the roof over that level and starts
at that slab's outer edge; keep it that way, or the extension will z-fight with
the roof it abuts.

The corner box is separate: `CORNER_FRAME` names the two roof extensions that
bracket it and the finish, and `CORNER_STYLES` holds the two palettes, while
`app/src/corner.js` builds it.

The box is made of those two extensions. `floorLevel` is the extension whose
slab it stands on and `roofLevel` the extension whose slab caps it, so the box
fills exactly the storey between them: its base is the floor slab's top face
and its top stops below the roof slab's fascia lip.

Its plan is mostly the eave's, not the box's. The width is the extension's own
`armX` run along the facade, so the box covers exactly as much of the balcony as
the eaves above and below it - the front eaves run over half the balcony, so the
box is half the balcony wide. Only the projection past the wall comes from
`CORNER_FRAME.covers`, the balcony the box takes in, so the box reaches that
balcony's edge and the balcony sits inside it. Nothing about the size is chosen
in `corner.js`, so the box and its eaves cannot drift apart. The two extensions
must be congruent - they are the same L at two levels - and a missing one
throws rather than silently building in the wrong place.

The street face of the box is deliberately open: it is a cantilevered frame over
the balcony, so the balcony parapet is what you see inside it. Do not wall that
face up or the balcony disappears behind it.

`buildCorner(style)` returns `{ levels, footprint, mats, style }`, with one
group per storey it passes through; `main.js` parents each into the matching
level group so level isolation still works even though the box is a single
object.

Add a new finish by adding a palette to `CORNER_STYLES` and branching in
`buildBox()`; do not hard-code colours in `corner.js`.

The ground floor is deliberately unfinished: open structure with the 33
columns from `GROUND_COLUMNS` plus the staircase and lift enclosures, and no
perimeter walls or rooms yet. Do not add walls back to the `level.id === 'GF'`
branch without checking with the owner — the plans show rooms there, but the
building is not built out.

The control panels all collapse through the shared `.panel-head` /
`.panel-body` markup and the `[data-collapse]` handler in `main.js`; the open or
closed state persists in `localStorage`. Below 720px wide they stop being
separate fixed panels and stack into `#dock`, a single scrollable bottom sheet,
and default to collapsed so the model is not buried. `#corner` has no fixed
`bottom` because it is stacked above `#sun`, whose height changes as it
collapses — `stackCornerPanel()` measures it on resize and on every toggle.

A collapsed panel shows a glyph plus the toggle and nothing else: the
`.ph-icon` SVG in the header, the title hidden but left in the accessibility
tree, and `width: auto` so the panel shrinks to those two elements instead of
keeping the width it needs when open. If you add a panel, give it a `.ph-icon`
and add its id to that `width: auto` rule, or it will collapse to a wide bar
with a lonely icon in the corner.

The fourth floor (`fourth.js`) is a concept, not part of the drawing set: the
PDF stops at the third floor. It is built as its own level group appended to
`building.userData.floorGroups` rather than as a `BUILDING.floors` entry, so it
cannot shift the floor count, the built-up area total or `roofDatum()`, which
`corner.js` and the roof extensions all depend on. Its plan comes from
`fourthFloorRects()`, which takes the bounding rectangle of pillars C28, C29,
C31 and C32 plus an arm cantilevered forward; that is the only thing fixing
where it can land, since there is no drawing to measure. Do not fold it into
`BUILDING.floors` — the roof would then be recalculated one storey too high.

Site furniture has to follow the `+Z` front: the road, kerb, gate piers and
gate leaves all sit at the front wall (`PLOT.depth`), and the garden is behind
the rear wall at low `z`. An earlier orientation flip moved the boundary walls
but left the road and gate at `z=0`, so they ended up behind the building and
the gate hung in a wall that had no opening. If the model is ever turned round
again, move all of them together.

Pillar tags are canvas sprites from `labelSprite()`, one per ground column,
built in the `GF` branch and toggled by "Show pillar names". Size them by
`worldHeight` in feet, not by a fraction of the canvas: the sprite scale is a
world-space size, so a magic multiplier makes the tag grow with the texture and
dwarf the column it names. Sprites have no glTF primitive, so the GLB export
clones the building and hides them before parsing.

## Deployment

`.github/workflows/deploy-vercel.yml` deploys on every push to `main`; pull
requests get a preview deployment. There is no build step - Vercel serves the
committed files - so the workflow's `verify` job is the only thing standing
between a broken module and a blank live page. It runs `node --check` on every
`app/src/*.js` and resolves each bare import specifier against `app/vendor/`
using the same mapping as the import map in `app/index.html`. If you add an
import map entry or a vendored file, update that mapping or the check fails.

`.vercelignore` keeps the source PDF and the dev notes out of the deploy. Add
anything else that is source material rather than site content there, not to
`.gitignore`, since it should stay in the repo.

Live project: `3d-design` on Vercel team `tenx5`
(`prj_Fpa5haU3U8NNxe1CgkzYZ432PQbF`, org `team_uRp6sWQQAfTjJMJmfJzWR71E`),
served at https://3d-design-puce.vercel.app. The three IDs are also stored as
repository secrets, so the GitHub workflow deploys without local setup.
`vercel link` writes `.vercel/` and `.env.local` (a short-lived OIDC token);
both are gitignored and both are in `.vercelignore`, so they never reach a
deployment.
