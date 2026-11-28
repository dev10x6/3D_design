import * as THREE from 'three';
import {
  BUILDING, OPENINGS, BALCONIES, LIFT, STAIR, GROUND_COLUMNS, ROOF_EXTENSIONS, FRONT_Z,
  EAVE_FASCIA, ROOF_SLAB_T, ROOF_COPING_T, ROOF_PARAPET,
  STAIR_TANKS, stairRoom, stairTankPositions,
  roofDatum, extensionRects, fourthFloorRects,
  BALCONY_COVERS, columnFootprint, cornerCoveredRun, CORNER_FRAME,
  boxedBays, balconyRoofFace,
} from './spec.js';

const T = BUILDING.wallT;

export function makeMaterials() {
  const plaster = new THREE.MeshStandardMaterial({ color: 0xeee7da, roughness: 0.93 });
  const plasterShade = new THREE.MeshStandardMaterial({ color: 0xdfd5c3, roughness: 0.95 });
  const plinth = new THREE.MeshStandardMaterial({ color: 0xaba193, roughness: 0.9 });
  const slab = new THREE.MeshStandardMaterial({ color: 0xf5f1e9, roughness: 0.85 });
  const coping = new THREE.MeshStandardMaterial({ color: 0xc8bfb0, roughness: 0.7 });
  const frame = new THREE.MeshStandardMaterial({ color: 0x4d5258, roughness: 0.45, metalness: 0.6 });
  const rail = new THREE.MeshStandardMaterial({ color: 0x3a3f44, roughness: 0.4, metalness: 0.75 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x6b4a33, roughness: 0.6 });
  const concrete = new THREE.MeshStandardMaterial({ color: 0xd0cabf, roughness: 0.95 });
  const grey = new THREE.MeshStandardMaterial({ color: 0x94989c, roughness: 0.9 });
  const greyShade = new THREE.MeshStandardMaterial({ color: 0x82868a, roughness: 0.95 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xcfe4ea, roughness: 0.06, metalness: 0.0, transparent: true, opacity: 0.3,
    envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false,
  });
  const glassRail = new THREE.MeshPhysicalMaterial({
    color: 0xbcd8de, roughness: 0.05, transparent: true, opacity: 0.24,
    envMapIntensity: 1.8, side: THREE.DoubleSide, depthWrite: false,
  });
  const darkGlass = new THREE.MeshPhysicalMaterial({
    color: 0x5f7c86, roughness: 0.08, metalness: 0.25, transparent: true, opacity: 0.5,
    envMapIntensity: 1.4, side: THREE.DoubleSide,
  });
  const tank = new THREE.MeshStandardMaterial({ color: 0xeaeaea, roughness: 0.55 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.35, metalness: 0.85 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x4a4d52, roughness: 0.55, metalness: 0.7 });
  const soil = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 1.0 });
  const foliage = new THREE.MeshStandardMaterial({ color: 0x3f6b3a, roughness: 0.9, flatShading: true });
  return { plaster, plasterShade, plinth, slab, coping, frame, rail, wood, concrete, grey, greyShade, glass, glassRail, darkGlass, tank, metal, iron, soil, foliage };
}

function box(parent, w, h, d, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

// Column tags. Drawn to a canvas rather than DOM or font geometry so the
// labels need no extra vendored file and no build step, and so they stay
// legible at any camera distance (sprites always face the viewer).
function labelSprite(text) {
  const pad = 16;
  const size = 128;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `bold ${size}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
  const h = size + pad * 2;
  canvas.width = w;
  canvas.height = h;

  const c = canvas.getContext('2d');
  c.font = `bold ${size}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = 'rgba(16, 22, 28, 0.86)';
  const r = 26;
  c.beginPath();
  c.moveTo(r, 0);
  c.arcTo(w, 0, w, h, r);
  c.arcTo(w, h, 0, h, r);
  c.arcTo(0, h, 0, 0, r);
  c.arcTo(0, 0, w, 0, r);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(217, 163, 83, 0.9)';
  c.lineWidth = 7;
  c.stroke();
  c.fillStyle = '#f6e7cd';
  c.fillText(text, w / 2, h / 2 + 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, depthTest: false, depthWrite: false,
  }));
  // Sized in world feet so the tag reads against the column it names; a
  // fraction of the canvas would make it many times the column's own width.
  const worldHeight = 1.2;
  const scale = worldHeight / h;
  sprite.scale.set(w * scale, h * scale, 1);
  return sprite;
}

// Solid rectangles of a wall face once the openings are cut out of it.
function solidRuns(length, height, openings) {
  const ops = [...openings].sort((p, q) => p.a - q.a);
  const out = [];
  let cursor = 0;
  for (const o of ops) {
    const a = Math.max(0, Math.min(o.a, length));
    const b = Math.max(0, Math.min(o.b, length));
    if (b - a < 0.05) continue;
    if (a > cursor + 0.02) out.push({ u0: cursor, u1: a, y0: 0, y1: height });
    if (o.sill > 0.02) out.push({ u0: a, u1: b, y0: 0, y1: o.sill });
    if (o.head < height - 0.02) out.push({ u0: a, u1: b, y0: o.head, y1: height });
    cursor = Math.max(cursor, b);
  }
  if (cursor < length - 0.02) out.push({ u0: cursor, u1: length, y0: 0, y1: height });
  return out;
}

/**
 * One wall face.
 *  axis 'x' -> wall runs along X at z = origin.z (front / rear facades)
 *  axis 'z' -> wall runs along Z at x = origin.x (side facades)
 * `u` is measured from the origin along the run.
 */
function buildWall(parent, { axis, origin, length, height, openings, y0, mats }) {
  const alongX = axis === 'x';
  const at = (u, y) => (alongX
    ? [origin.x + u, y, origin.z]
    : [origin.x, y, origin.z + u]);

  for (const r of solidRuns(length, height, openings)) {
    const w = r.u1 - r.u0;
    const h = r.y1 - r.y0;
    if (w < 0.02 || h < 0.02) continue;
    const [x, y, z] = at((r.u0 + r.u1) / 2, y0 + (r.y0 + r.y1) / 2);
    box(parent, alongX ? w : T, h, alongX ? T : w, x, y, z, mats.plaster);
  }

  const put = (uu, yy, ww, hh, mat, depth = T * 0.45) => {
    const [x, y, z] = at(uu, yy);
    box(parent, alongX ? ww : depth, hh, alongX ? depth : ww, x, y, z, mat);
  };

  for (const o of openings) {
    const w = o.b - o.a;
    if (w <= 0.05) continue;
    const cu = (o.a + o.b) / 2;
    const glassH = o.head - o.sill;
    const cy = y0 + (o.sill + o.head) / 2;
    const fT = 0.16;
    const isDoor = o.type === 'door';

    put(cu, y0 + o.head - fT / 2, w, fT, mats.frame);
    put(cu, y0 + o.sill + fT / 2, w, fT, mats.frame);
    put(o.a + fT / 2, cy, fT, glassH, mats.frame);
    put(o.b - fT / 2, cy, fT, glassH, mats.frame);

    if (isDoor) {
      put(cu, cy, w - 2 * fT, glassH - 2 * fT, mats.wood, 0.12);
    } else {
      put(cu, cy, w - 2 * fT, glassH - 2 * fT, o.type === 'vent' ? mats.darkGlass : mats.glass, 0.05);
      const panes = w > 6 ? 3 : (w > 3.4 ? 2 : 1);
      for (let i = 1; i < panes; i++) put(o.a + (w * i) / panes, cy, 0.09, glassH - 2 * fT, mats.frame);
    }

    // projecting sill, plus a sunshade band over each window
    put(cu, y0 + o.sill - 0.06, w + 0.7, 0.22, mats.coping, T + 0.9);
    if (!isDoor && o.sill > 0.5) {
      put(cu, y0 + o.head + 0.35, w + 0.9, 0.18, mats.coping, T + 1.1);
    }
  }
}


// The parts of [x0, x1] left over once the given runs are taken out, so a
// cover and a box never build the same ceiling twice.
function clearSpans(x0, x1, taken) {
  let spans = [[x0, x1]];
  for (const [t0, t1] of taken) {
    const next = [];
    for (const [s0, s1] of spans) {
      if (t1 <= s0 || t0 >= s1) next.push([s0, s1]);
      else {
        if (t0 > s0) next.push([s0, t0]);
        if (t1 < s1) next.push([t1, s1]);
      }
    }
    spans = next;
  }
  return spans.filter(([a, b]) => b - a > 0.5);
}

// Balcony covers (concept): the front and rear balconies are roofed the way the
// corner box is roofed - a solid ceiling band on the storey above, its edge
// banded, closed ends above the parapet - and split in two by a wall standing
// on the middle row pillar. Heights come from the floor above, so a cover
// always sits under the slab that caps the storey.
function balconyCover(parent, b, level, mats) {
  if (!BALCONY_COVERS.divides[b.id]) return;
  // Same section as the corner box: a band reaching the underside of the slab
  // above - a hair into it, so the faces are not coincident - with a shaded
  // soffit under it, so a covered bay and the boxed one read as one roof.
  const top = roofDatum(level.id).y - BUILDING.slabT;
  const { ceilingT, wallT, lip, parapetTop } = BALCONY_COVERS;
  const bandT = ceilingT;
  const ceilY = top - bandT / 2;
  const ceilUnder = top - bandT;

  const front = b.id === 'front';
  const wallZ = front ? b.z0 : b.z1;
  const outerZ = front ? b.z1 + lip : b.z0 - lip;
  const z0 = Math.min(wallZ, outerZ);
  const z1 = Math.max(wallZ, outerZ);
  const cz = (z0 + z1) / 2;
  const depth = z1 - z0;

  // The wall dividing the balcony, standing on the middle row pillar. It runs
  // out to whatever roofs the balcony deepest, so a boxed bay meets it.
  const p = columnFootprint(BALCONY_COVERS.divides[b.id]);
  const faceZ = balconyRoofFace(level.id, b.id);
  const divZ0 = Math.min(wallZ, faceZ);
  const divZ1 = Math.max(wallZ, faceZ);
  box(parent, p.x1 - p.x0, ceilUnder - level.base, divZ1 - divZ0,
    (p.x0 + p.x1) / 2, (level.base + ceilUnder) / 2, (divZ0 + divZ1) / 2, mats.plaster);

  // Roof only what the boxes leave: the corner box and any boxed bay build
  // their own ceiling.
  const covered = cornerCoveredRun(level.id, b.id);
  const taken = covered ? [[covered.x0, covered.x1]] : [];
  for (const bay of boxedBays(level.id, b.id)) taken.push([bay.x0, bay.x1]);

  for (const [x0, x1] of clearSpans(b.x0, b.x1, taken)) {
    const cx = (x0 + x1) / 2;
    box(parent, x1 - x0, bandT, depth, cx, ceilY, cz, mats.plaster);
    box(parent, x1 - x0 - 0.3, 0.12, depth - 0.3, cx, ceilUnder - 0.06, cz, mats.plasterShade);

    // Close the ends above the parapet so the cover reads as a box.
    const endY0 = level.base + parapetTop;
    const endH = ceilUnder - endY0;
    for (const ex of [x0 + wallT / 2, x1 - wallT / 2]) {
      box(parent, wallT, endH, depth, ex, endY0 + endH / 2, cz, mats.plaster);
    }
  }
}

/**
 * A balcony bay given the corner box's treatment, in grey rather than the
 * corner's timber: a capping band reaching the slab above, walls on the pillars
 * either side and posts at the open face, out to the balcony's own depth. The
 * divider wall it meets on one side is already there; this closes the other.
 */
function balconyBox(parent, bay, level, mats) {
  const top = roofDatum(level.id).y - BUILDING.slabT;
  const { ceilingT } = BALCONY_COVERS;
  const { wallT } = CORNER_FRAME;
  const cx = (bay.x0 + bay.x1) / 2;
  const cz = (bay.z0 + bay.z1) / 2;
  const w = bay.x1 - bay.x0;
  const depth = bay.z1 - bay.z0;
  const under = top - ceilingT;
  const h = under - level.base;
  const face = bay.front ? bay.z1 : bay.z0;

  box(parent, w, ceilingT, depth, cx, top - ceilingT / 2, cz, mats.grey);
  box(parent, w - 0.3, 0.12, depth - 0.3, cx, under - 0.06, cz, mats.greyShade);

  for (const wx of [bay.x0 + wallT / 2, bay.x1 - wallT / 2]) {
    box(parent, wallT, h, depth, wx, level.base + h / 2, cz, mats.grey);
  }
  for (const px of [bay.x0 + 0.3, bay.x1 - 0.3]) {
    box(parent, 0.6, h, 0.6, px, level.base + h / 2,
      face + (bay.front ? -0.3 : 0.3), mats.grey);
  }

  // The floor edge under the bay, in the same grey, so the box's bottom reads
  // grey too and not as a white ledge under a grey frame.
  const sillH = 0.6;
  box(parent, w, sillH, 0.4, cx, level.base - sillH / 2,
    face + (bay.front ? -0.16 : 0.16), mats.grey);
}

function balcony(parent, b, level, mats) {
  const { base } = level;
  const g = new THREE.Group();
  g.name = `balcony-${level.id}-${b.id}`;
  const w = b.x1 - b.x0;
  const d = b.z1 - b.z0;
  const cx = (b.x0 + b.x1) / 2;
  const cz = (b.z0 + b.z1) / 2;
  const slabT = 0.6;
  const railH = 3.4;

  box(g, w, slabT, d, cx, base - slabT / 2 + 0.05, cz, mats.slab);
  box(g, w + 0.15, 0.3, d + 0.15, cx, base - slabT + 0.15, cz, mats.coping);

  // Solid parapet with evenly spaced piers, as drawn on the plans: the
  // balcony edge is a masonry band, not an open railing. `from` and `to` are
  // the run's ends along its axis, so a bay can be split where the corner box
  // takes the balcony over.
  const parapet = (alongX, from, to, p) => {
    const len = Math.abs(to - from);
    const mid = (from + to) / 2;
    const px = alongX ? mid : p;
    const pz = alongX ? p : mid;
    const piers = Math.max(2, Math.round(len / 4.2));
    const pierW = 0.55;
    const gap = (len - piers * pierW) / (piers - 1 || 1);
    box(g, alongX ? len : 0.5, 0.75, alongX ? 0.5 : len, px, base + 0.35, pz, mats.coping);
    for (let i = 0; i < piers; i++) {
      const u = -len / 2 + pierW / 2 + i * (pierW + gap);
      box(g, alongX ? pierW : 0.55, railH, alongX ? 0.55 : pierW,
        alongX ? px + u : px, base + railH / 2, alongX ? pz : pz + u, mats.plasterShade);
      if (i < piers - 1) {
        const gu = u + pierW / 2 + gap / 2;
        // low infill panel between piers, with an open band above it
        box(g, alongX ? gap : 0.3, 1.5, alongX ? 0.3 : gap,
          alongX ? px + gu : px, base + 0.75, alongX ? pz : pz + gu, mats.plaster);
      }
    }
    // capping rail
    box(g, alongX ? len : 0.42, 0.18, alongX ? 0.42 : len, px, base + railH + 0.09, pz, mats.coping);
  };

  balconyCover(g, b, level, mats);

  // Where the corner box takes the balcony over it also takes its railing: the
  // railing runs out to the box's own face and closes onto the box's side wall
  // at one end and the dividing wall at the other, instead of stopping at the
  // drawn balcony edge and leaving a strip of bare floor inside the box.
  const covered = cornerCoveredRun(level.id, b.id);
  const bays = boxedBays(level.id, b.id);
  const boxFace = covered ? covered.z1 - 0.28 : 0;
  const boxWall = covered ? covered.x0 + CORNER_FRAME.wallT + 0.28 : 0;
  const divideX = covered
    ? columnFootprint(BALCONY_COVERS.divides[b.id]).x0
    : 0;

  for (const bay of bays) balconyBox(g, bay, level, mats);

  for (const s of b.sides) {
    // The parapet goes on the outer edge: 'front' balconies project past
    // FRONT_Z, so their open edge is the high-z one, and 'rear' balconies
    // project past REAR_Z, so theirs is the low-z one.
    if (s === 'front') {
      const taken = covered ? [[covered.x0, covered.x1]] : [];
      for (const bay of bays) taken.push([bay.x0, bay.x1]);
      for (const [r0, r1] of clearSpans(b.x0, b.x1, taken)) {
        parapet(true, r0, r1, b.z1 - 0.28);
      }
      if (covered) parapet(true, boxWall, divideX, boxFace);
      for (const bay of bays) parapet(true, bay.x0, bay.x1, bay.z1 - 0.28);
    } else if (s === 'rear') parapet(true, b.x0, b.x1, b.z0 + 0.28);
    else if (s === 'west') {
      if (covered) parapet(false, b.z0, boxFace + 0.25, boxWall);
      else parapet(false, b.z0, b.z1, b.x0 + 0.28);
    } else if (s === 'east') parapet(false, b.z0, b.z1, b.x1 - 0.28);
  }
  parent.add(g);
}

function roofExtension(parent, ext, mats) {
  const t = BUILDING.slabT;
  const { y: top } = roofDatum(ext.level);
  const { band, arm } = extensionRects(ext);

  const g = new THREE.Group();
  g.name = `roof-extension-${ext.level}-${ext.from}`;
  const cy = top - t / 2;
  const rect = (r, mat) =>
    box(g, r.x1 - r.x0, t, r.z1 - r.z0, (r.x0 + r.x1) / 2, cy, (r.z0 + r.z1) / 2, mat);
  rect(band, mats.slab);
  rect(arm, mats.slab);

  // Fascia under the two outer edges so the eave reads as a slab edge.
  const lipH = EAVE_FASCIA;
  const lipY = top - t - lipH / 2 + 0.05;
  const outerZ = band.z0 < 0 ? band.z0 : band.z1;
  // Narrowed a hair at both ends: the walls under it are on the same planes,
  // and coincident faces would fight for the same pixels.
  box(g, band.x1 - band.x0 - 0.04, lipH, 0.22, (band.x0 + band.x1) / 2, lipY,
    outerZ + (outerZ < 0 ? 0.11 : -0.11), mats.coping);
  const outerX = arm.x0 < 0 ? arm.x0 : arm.x1;
  box(g, 0.22, lipH, arm.z1 - arm.z0, outerX + (outerX < 0 ? 0.11 : -0.11), lipY,
    (arm.z0 + arm.z1) / 2, mats.coping);

  parent.add(g);
  return g;
}

export function buildBuilding(mats) {
  const root = new THREE.Group();
  root.name = 'building';
  // Placed inside the plot with the drawn setbacks; all internal geometry
  // stays in building-local feet.
  root.position.set(BUILDING.offsetX, 0, BUILDING.offsetZ);
  const W = BUILDING.width;
  const D = BUILDING.depth;
  const floorGroups = {};

  const plinthH = BUILDING.floors[0].base;
  box(root, W + 1.6, plinthH, D + 1.6, W / 2, plinthH / 2, D / 2, mats.plinth);

  for (const level of BUILDING.floors) {
    const g = new THREE.Group();
    g.name = `level-${level.id}`;
    g.userData.level = level;
    floorGroups[level.id] = g;
    root.add(g);

    const y0 = level.base;
    const h = level.height;
    const ops = OPENINGS[level.id];
    const slabT = BUILDING.slabT;

    box(g, W + 0.5, slabT, D + 0.5, W / 2, y0 - slabT / 2, D / 2, mats.slab);

    // lift shaft and stair enclosure rise through every floor
    const lw = LIFT.x1 - LIFT.x0;
    const ld = LIFT.z1 - LIFT.z0;
    const lcx = (LIFT.x0 + LIFT.x1) / 2;
    const lcz = (LIFT.z0 + LIFT.z1) / 2;
    box(g, lw, h, ld, lcx, y0 + h / 2, lcz, mats.plasterShade);
    box(g, 0.12, 7.2, 3.4, LIFT.x0 - 0.06, y0 + 3.6, lcz, mats.metal);

    if (level.id === 'GF') {
      // Ground floor is still open structure: no rooms built yet. Only the
      // columns carrying the floors above, plus the staircase and lift
      // enclosures, which are the two things that already exist.
      for (const c of GROUND_COLUMNS) {
        box(g, c.w, h, c.d, c.x, y0 + h / 2, c.z, mats.concrete);
        const tag = labelSprite(c.id);
        tag.userData.columnId = c.id;
        tag.position.set(c.x, y0 + h * 0.55, c.z);
        tag.renderOrder = 10;
        g.add(tag);
      }

      // Staircase enclosure: three walls, open at the front for access.
      const sw = STAIR.x1 - STAIR.x0;
      const sd = STAIR.z1 - STAIR.z0;
      const st = 0.45;
      box(g, sw, h, st, STAIR.x0 + sw / 2, y0 + h / 2, STAIR.z0 + st / 2, mats.plasterShade);
      box(g, sw, h, st, STAIR.x0 + sw / 2, y0 + h / 2, STAIR.z1 - st / 2, mats.plasterShade);
      box(g, st, h, sd, STAIR.x0 + st / 2, y0 + h / 2, STAIR.z0 + sd / 2, mats.plasterShade);
      box(g, st, h, sd, STAIR.x1 - st / 2, y0 + h / 2, STAIR.z0 + sd / 2, mats.plasterShade);

      box(g, W + 1.0, 0.4, D + 1.0, W / 2, y0 + h - 0.2, D / 2, mats.coping);
    } else {
      buildWall(g, { axis: 'x', origin: { x: 0, z: FRONT_Z }, length: W, height: h, openings: ops.front, y0, mats });
      buildWall(g, { axis: 'x', origin: { x: 0, z: 0 }, length: W, height: h, openings: ops.rear, y0, mats });
      buildWall(g, { axis: 'z', origin: { x: 0, z: 0 }, length: D, height: h, openings: ops.west, y0, mats });
      buildWall(g, { axis: 'z', origin: { x: W, z: 0 }, length: D, height: h, openings: ops.east, y0, mats });

      // corner pilasters
      for (const [px, pz] of [[0.1, 0.1], [W - 0.1, 0.1], [0.1, D - 0.1], [W - 0.1, D - 0.1]]) {
        box(g, 1.2, h, 1.2, px, y0 + h / 2, pz, mats.plasterShade);
      }
      // floor band
      box(g, W + 1.1, 0.42, D + 1.1, W / 2, y0 + 0.21, D / 2, mats.coping);
      for (const b of BALCONIES[level.id] || []) balcony(g, b, level, mats);
    }

    for (const ext of ROOF_EXTENSIONS.filter((e) => e.level === level.id)) {
      roofExtension(g, ext, mats);
    }
  }

  // ---------- Roof ----------
  const roof = new THREE.Group();
  roof.name = 'roof';
  const rb = BUILDING.roofBase;
  box(roof, W + 1.2, ROOF_SLAB_T, D + 1.2, W / 2, rb + ROOF_SLAB_T / 2, D / 2, mats.slab);
  box(roof, W + 1.6, ROOF_COPING_T, D + 1.6, W / 2,
    rb + ROOF_SLAB_T + ROOF_COPING_T / 2, D / 2, mats.coping);

  const pw = ROOF_PARAPET.width;
  const ph = BUILDING.parapet;
  const py = rb + ROOF_SLAB_T + ph / 2;
  const cy2 = rb + ROOF_SLAB_T + ph + 0.11;

  // The fourth-floor room stands on the rear-west corner of this roof, so the
  // parapet and its capping run only where the roof is still open terrace.
  const room = fourthFloorRects();
  const open = {
    rear: { from: room.band.x1, to: W + 0.5 },
    west: { from: room.arm.z1, to: D + 0.5 },
  };
  const run = (a, b) => {
    const len = b - a;
    return len <= 0.05 ? null : { len, mid: (a + b) / 2 };
  };

  box(roof, W + 1.0, ph, pw, W / 2, py, D + 0.1, mats.plaster);
  box(roof, pw, ph, D + 0.6, W + 0.1, py, D / 2, mats.plaster);
  box(roof, W + 1.3, 0.22, pw + 0.35, W / 2, cy2, D + 0.1, mats.coping);
  box(roof, pw + 0.35, 0.22, D + 0.6, W + 0.1, cy2, D / 2, mats.coping);

  const rearRun = run(open.rear.from, open.rear.to);
  if (rearRun) {
    box(roof, rearRun.len, ph, pw, rearRun.mid, py, -0.1, mats.plaster);
    box(roof, rearRun.len, 0.22, pw + 0.35, rearRun.mid, cy2, -0.1, mats.coping);
  }
  const westRun = run(open.west.from, open.west.to);
  if (westRun) {
    box(roof, pw, ph, westRun.len, -0.1, py, westRun.mid, mats.plaster);
    box(roof, pw + 0.35, 0.22, westRun.len, -0.1, cy2, westRun.mid, mats.coping);
  }

  // Stair machine room. Its plan, height and roof level all come from
  // stairRoom(), because the water tanks stand on that roof and the two must
  // not disagree about where it is.
  const sr = stairRoom();
  box(roof, sr.plan.w, sr.height, sr.plan.d, sr.plan.cx,
    sr.base + sr.height / 2, sr.plan.cz, mats.plaster);
  box(roof, sr.plan.w + 0.6, sr.roofT, sr.plan.d + 0.6, sr.plan.cx,
    sr.base + sr.height + sr.roofT / 2, sr.plan.cz, mats.coping);
  box(roof, LIFT.x1 - LIFT.x0 + 1, 8, LIFT.z1 - LIFT.z0 + 1,
    (LIFT.x0 + LIFT.x1) / 2, rb + 4.1, (LIFT.z0 + LIFT.z1) / 2, mats.plaster);

  // Water tanks on the stair roof, in a 2 x 2 grid centred on it.
  for (const [tx, tz] of stairTankPositions()) {
    const t = new THREE.Mesh(
      new THREE.CylinderGeometry(STAIR_TANKS.radius, STAIR_TANKS.radius, STAIR_TANKS.height, 24),
      mats.tank,
    );
    t.position.set(tx, sr.roofY + STAIR_TANKS.height / 2, tz);
    t.castShadow = true; t.receiveShadow = true;
    roof.add(t);
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(STAIR_TANKS.radius * 0.55, STAIR_TANKS.radius * 0.82, 0.8, 24),
      mats.tank,
    );
    cap.position.set(tx, sr.roofY + STAIR_TANKS.height + 0.4, tz);
    cap.castShadow = true;
    roof.add(cap);
  }
  root.add(roof);

  root.userData.floorGroups = floorGroups;
  return root;
}
