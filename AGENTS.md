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
fills exactly the storey between them: its base is the floor slab's top face,
its top stops below the roof slab's fascia lip, and its plan is the same two
rectangles `roofExtension()` lays those slabs on. Nothing about its size is
chosen in `corner.js`, so the box and its eaves cannot drift apart. The two
extensions must be congruent - they are the same L at two levels - and a
missing one throws rather than silently building in the wrong place.

`buildCorner(style)` returns one group per storey it passes through, and
`main.js` parents each into the matching level group so level isolation still
works even though the box is a single object.

Add a new finish by adding a palette to `CORNER_STYLES` and branching in
`buildBox()`; do not hard-code colours in `corner.js`.

The ground floor is deliberately unfinished: open structure with the stilt
columns plus the staircase and lift enclosures, and no perimeter walls or rooms
yet. Do not add walls back to the `level.id === 'GF'` branch without checking
with the owner — the plans show rooms there, but the building is not built out.
