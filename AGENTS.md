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
