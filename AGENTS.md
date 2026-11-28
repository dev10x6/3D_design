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

`faceDepth` is how far the band reaches from the wall face - which is what the
drawing dimensions - and `armW` is the width of the return down the side wall;
they are independent, so an eave can be deep over the facade and narrow down the
side. `depth`, measured from the slab's own edge instead, still works for eaves
that only project a little. The two west-corner front eaves are the balcony's
floor and roof there, so both reach 6'-0" from the wall face - the balcony's
drawn 4'-0" plus a 2'-0" overhang - with the C1-C4 return left at the drawn
2'-0". The band's end follows `armW`, not `faceDepth`, so the band and the return
still close on the same outer face.

The corner box is separate: `CORNER_FRAME` names the two roof extensions that
bracket it and the finish, and `CORNER_STYLES` holds the two palettes, while
`app/src/corner.js` builds it.

The box is made of those two extensions. `floorLevel` is the extension whose
slab it stands on and `roofLevel` the extension whose slab caps it, so the box
fills exactly the storey between them: its base is the floor slab's top face
and its walls and capping band together run up to the underside of the roof
slab.

Its plan is the eave's, in both directions: the band supplies the depth out from
the facade and `armX` the run along it, so the box, its floor and its roof close
on the same outer faces and the balcony sits inside it. Nothing about the size is
chosen in `corner.js`, so the box and its eaves cannot drift apart. The two
extensions are both set to reach 6'-0" from the wall face with a 2'-0" return,
which makes the box 6'-0" deep by 2'-0" wide. A missing extension throws rather
than silently building in the wrong place.

The street face of the box is deliberately open: it is a cantilevered frame over
the balcony, so the balcony parapet is what you see inside it. Do not wall that
face up or the balcony disappears behind it. The other three faces are closed:
the side wall runs from the return's far end right on to the box's own front
face, so the face the band leaves past the wall line is walled too.

Because the box reaches further than the drawn balcony, `balcony()` carries the
balcony's railing out to the box wherever `cornerCoveredRun()` says the box
roofs it: the railing then joins the box's side wall at one end and the
dividing wall at the other instead of stopping at the drawn edge and leaving a
strip of bare floor inside the box.

The band that caps the box is the box's top. The walls stop at its underside
instead of running through it, or the two would share faces and fight for the
same pixels; it then runs up into the roof slab for the same reason.

The side wall is solid except for one large glazed opening, set from
`CORNER_FRAME.sideWindow`: the insets are measured from the wall's own ends and
from its floor and head, so the opening follows the wall when the eave or the
balcony changes, and `panes` only splits it into lights. `sideWall()` builds the
wall as piers and spandrels round that opening rather than as one box, because a
single box cannot be glazed.

Above the box roof the wall stops: it does not carry on up. Instead its street
end runs out onto the pillar named by `CORNER_FRAME.sideWallPillar` — a return
crosses from the wall to that pillar's footprint, so the wall lands on the
pillar rather than stopping 2.6 ft short of it in plan. `cornerWallPillar()`
reads the footprint from `GROUND_COLUMNS`, and the glazing's `endInset` is
clamped clear of that pier, so neither can drift from the pillar.

`buildCorner(style)` returns `{ levels, footprint, mats, style }`, with one
group per storey it passes through; `main.js` parents each into the matching
level group so level isolation still works even though the box is a single
object.

The front and rear balconies are covered the same way, in `balconyCover()` in
`building.js`: one solid band on the storey above, closed ends above the
parapet, and a wall standing on the middle row pillar (`BALCONY_COVERS.divides`
- C2 front, C32 rear) so each balcony reads as two covered bays. The band takes
the same section and the same level as the corner box's capping band - it runs
up to the underside of the slab above - so a covered bay and the boxed one read
as one roof across the facade. Every height is read from the floor above.
`cornerCoveredRun()` returns the run the corner box already roofs, and the
covers stop there, so the box and the covers never build a ceiling in the same
place.

The cover's plan is the balcony's own 27'-1" x 4'-0", so the balcony keeps its
drawn size; only the depth gains `BALCONY_COVERS.lip`, which is small. The two
roofs that reach further are the C1-C2 bay at the second and third floors and
the C2-C3 bay at the third: they are the balcony's roof there, so they are drawn
6'-0" from the wall face - 4'-0" of balcony plus 2'-0". The second floor's is a
roof extension, the third floor's are boxes. No other roof is 6'-0" wide.

A bay listed in `BALCONY_BOXES` takes the corner box's treatment, in the grey
palette (`mats.grey` / `mats.greyShade`) rather than the corner's timber -
`balconyBox()` in `building.js`: the balcony's own projection, a capping band
reaching the slab above, walls on the pillars either side and posts at the open
face.
`boxedBays()` hands back the plan rect, `balconyRoofFace()` reports how far the
roof reaches so the dividing wall and the railing meet it, and both the cover
and the railing use `clearSpans()` to stay clear of the runs a box has taken.
Adding a bay is one entry there, not new geometry.

The ends above the parapet are `BALCONY_COVERS.wallT` broad and plaster like the
rest of the building, so the C2 and C3 ends of a bay read as white walls in
elevation rather than as thin upstands.

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
`corner.js` and the roof extensions all depend on. Do not fold it into
`BUILDING.floors` — the roof would then be recalculated one storey too high.

It stands on the third-floor rear-west eave, named by `FOURTH_FLOOR.from` /
`floorLevel` exactly as in `ROOF_EXTENSIONS`, so the room and the eave cannot
drift apart. `fourthFloorRects()` takes the outer corner and the forward reach
from that eave and the far edges from the pillars it lands on (C28, C31, C32).
An eave alone is 2 ft deep and could not hold a room; the floor is the eave plus
the roof slab behind it, which is why the plan runs inwards from the eave's
outer edge rather than sitting on the eave alone.

Because the room stands on the roof, `building.js` stops the roof parapet and
its capping where the room covers them — see the `open.rear` / `open.west` runs.
The forward arm is capped at 6.5 ft so it clears the water tank at x=6.5.

`roofDatum()` and `extensionRects()` live in `spec.js`, not `building.js`: the
fourth floor needs them and importing from `building.js` would drag in `three`
and the whole geometry layer. `building.js` and `corner.js` both import them
from spec. Do not reintroduce local copies — there were two, and they had
already drifted.

The roof frame (`frame.js`) is the other concept addition: front-bay pillars
C1/C4 and C3/C6 carry on up through the roof for 10 ft, each pair is capped by a
concrete roof beam, and iron beams span between the two roof beams. It is built
on the `roof` group rather than as a level, for the same reason as the fourth
floor — it has no floor area or storey height, so it must not become a
`BUILDING.floors` entry. Because it hangs off the roof group it shows and hides
with the roof and needs no change to level isolation.

`ROOF_FRAME` in `spec.js` names the pairs by pillar id, and `roofFrameLayout()`
reads their positions and sections back from `GROUND_COLUMNS`, so the frame
stands exactly over the pillars it continues and follows any correction to the
pillar survey. The iron beam count is `ROOF_FRAME.tieCount`; the positions are
derived evenly between the two roof beams and insetted from both ends, so
changing the count needs no other edit. The frame stands on `roofTopFace()`,
which `building.js` also builds the roof slab and coping from — change the deck
thickness there, not in two places.

Iron rods hang from both ends of every iron beam down to the roof deck, tying
the frame back to the building instead of leaving it a free portal. Their length
is derived from the beam underside, so changing `columnHeight` or `beamDepth`
moves the rods with the beams.

The roof garden (`garden.js`) is the third concept addition: iron posts on C26,
C27, C33, C32 and C29 hold a glazed roof with planting beds under it. It is on
the roof group for the same reason as the frame.

`roofGardenLayout()` needs one thing that is easy to get wrong. The named
pillars are all rear-row, but C32 and C29 sit *inside* the fourth-floor room's
plan — the room's east wall is set by C32's own outer face — so a post on those
pillar centres would stand inside the room. The layout moves the whole west line
of posts out to that wall's face, keeping the line straight; it does not nudge
the two offending posts alone, which would leave a staggered row. The glazed
roof is then clipped to `parapetInner()` and to the room's face, so it cannot
pass through the parapet capping or the room's walls.

The water tanks stand on the stair machine room's roof, not on the main roof, so
the terrace stays clear. `stairRoom()` owns that roof's plan and height and
`building.js` builds the room from it; the tanks read `roofY` back from the same
function, so the room and the tanks cannot disagree. `stairTankPositions()`
derives the 2 x 2 grid from `STAIR_TANKS.radius` and `gap` rather than listing
centres, so the tanks cannot overlap if they are resized.

`parapetInner()` and `ROOF_PARAPET` are the single source for the parapet's
width and inset. The garden clips to them, so do not reintroduce the literal
0.6 / 0.1 that used to be in `building.js`.

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
