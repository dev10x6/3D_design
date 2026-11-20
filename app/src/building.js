import * as THREE from 'three';
import { BUILDING, OPENINGS, BALCONIES, LIFT, STAIR, STILT_COLUMNS, ROOF_EXTENSIONS, FRONT_Z } from './spec.js';

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
  return { plaster, plasterShade, plinth, slab, coping, frame, rail, wood, concrete, glass, glassRail, darkGlass, tank, metal };
}

function box(parent, w, h, d, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
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
  // balcony edge is a masonry band, not an open railing.
  const parapet = (alongX, len, px, pz) => {
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

  for (const s of b.sides) {
    // The parapet goes on the outer edge: 'front' balconies project past
    // FRONT_Z, so their open edge is the high-z one, and 'rear' balconies
    // project past REAR_Z, so theirs is the low-z one.
    if (s === 'front') parapet(true, w, cx, b.z1 - 0.28);
    else if (s === 'rear') parapet(true, w, cx, b.z0 + 0.28);
    else if (s === 'west') parapet(false, d, b.x0 + 0.28, cz);
    else if (s === 'east') parapet(false, d, b.x1 - 0.28, cz);
  }
  parent.add(g);
}

// Floor slabs project W + 0.5 and the main roof slab W + 1.2 past the wall
// face. Roof extensions continue outwards from that edge.
const SLAB_OVERHANG = 0.25;
const ROOF_SLAB_OVERHANG = 0.6;

// Depth of the fascia band hanging under an eave's outer edge. Anything built
// beneath an extension has to clear it.
export const EAVE_FASCIA = 0.45;

// The roof over a level: the slab of the floor above, or the main roof slab
// for the top floor. Extensions are placed flush with its top face and start
// at its outer edge, so nothing is coplanar.
function roofDatum(levelId) {
  const i = BUILDING.floors.findIndex((f) => f.id === levelId);
  const next = BUILDING.floors[i + 1];
  if (next) return { y: next.base, overhang: SLAB_OVERHANG };
  return { y: BUILDING.roofBase + 0.7, overhang: ROOF_SLAB_OVERHANG };
}

/**
 * An L-shaped eaves slab `depth` wide added to the roof of a level, turning one
 * corner. `from` names it: 'frontEast', 'frontWest', 'rearEast' or 'rearWest'.
 * `armX` runs along the facade from the side wall, `armZ` runs along that side
 * wall away from the facade.
 *
 * The two rectangles are returned so the corner box can be built on exactly the
 * same plan instead of recomputing it.
 */
export function extensionRects(ext) {
  const W = BUILDING.width;
  const D = BUILDING.depth;
  const { depth, armX, armZ } = ext;
  const front = ext.from.startsWith('front');
  const east = ext.from.endsWith('East');
  const { overhang: ov } = roofDatum(ext.level);
  const span = (a, b) => (a < b ? [a, b] : [b, a]);

  // Band along the facade, sitting outside it.
  const [bz0, bz1] = front ? span(D + ov, D + ov + depth) : span(-ov - depth, -ov);
  const [bx0, bx1] = east ? span(W - armX, W + ov + depth) : span(-ov - depth, armX);

  // Arm down the side wall, starting where the band ends.
  const [az0, az1] = front ? span(D + ov - armZ, D + ov) : span(-ov, -ov + armZ);
  const [ax0, ax1] = east ? span(W + ov, W + ov + depth) : span(-ov - depth, -ov);

  return {
    front, east, overhang: ov, depth,
    band: { x0: bx0, x1: bx1, z0: bz0, z1: bz1 },
    arm: { x0: ax0, x1: ax1, z0: az0, z1: az1 },
  };
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
  box(g, band.x1 - band.x0, lipH, 0.22, (band.x0 + band.x1) / 2, lipY,
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
      for (const z of STILT_COLUMNS.zs) {
        for (const x of STILT_COLUMNS.xs) {
          box(g, 1.1, h, 1.1, x, y0 + h / 2, z, mats.concrete);
        }
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
  box(roof, W + 1.2, 0.7, D + 1.2, W / 2, rb + 0.35, D / 2, mats.slab);
  box(roof, W + 1.6, 0.35, D + 1.6, W / 2, rb + 0.85, D / 2, mats.coping);

  const pw = 0.6;
  const ph = BUILDING.parapet;
  const py = rb + 0.7 + ph / 2;
  box(roof, W + 1.0, ph, pw, W / 2, py, D + 0.1, mats.plaster);
  box(roof, W + 1.0, ph, pw, W / 2, py, -0.1, mats.plaster);
  box(roof, pw, ph, D + 0.6, -0.1, py, D / 2, mats.plaster);
  box(roof, pw, ph, D + 0.6, W + 0.1, py, D / 2, mats.plaster);
  const cy2 = rb + 0.7 + ph + 0.11;
  box(roof, W + 1.3, 0.22, pw + 0.35, W / 2, cy2, D + 0.1, mats.coping);
  box(roof, W + 1.3, 0.22, pw + 0.35, W / 2, cy2, -0.1, mats.coping);
  box(roof, pw + 0.35, 0.22, D + 0.6, -0.1, cy2, D / 2, mats.coping);
  box(roof, pw + 0.35, 0.22, D + 0.6, W + 0.1, cy2, D / 2, mats.coping);

  const sw = STAIR.x1 - STAIR.x0 + 2;
  const sd = STAIR.z1 - STAIR.z0 + 2;
  const sx = STAIR.x0 - 1 + sw / 2;
  const sz = STAIR.z0 - 1 + sd / 2;
  box(roof, sw, 9, sd, sx, rb + 4.6, sz, mats.plaster);
  box(roof, sw + 0.6, 0.4, sd + 0.6, sx, rb + 9.2, sz, mats.coping);
  box(roof, LIFT.x1 - LIFT.x0 + 1, 8, LIFT.z1 - LIFT.z0 + 1,
    (LIFT.x0 + LIFT.x1) / 2, rb + 4.1, (LIFT.z0 + LIFT.z1) / 2, mats.plaster);

  for (const [tx, tz] of [[6.5, D - 12], [20.5, D - 74]]) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 4.2, 24), mats.tank);
    t.position.set(tx, rb + 2.1, tz);
    t.castShadow = true; t.receiveShadow = true;
    roof.add(t);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 0.8, 24), mats.tank);
    cap.position.set(tx, rb + 4.6, tz);
    cap.castShadow = true;
    roof.add(cap);
  }
  root.add(roof);

  root.userData.floorGroups = floorGroups;
  return root;
}
