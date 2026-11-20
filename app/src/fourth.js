import * as THREE from 'three';
import { BUILDING, FOURTH_FLOOR, fourthFloorRects, OPENINGS } from './spec.js';

// The fourth floor is a concept, not part of the drawing set. It is built as a
// separate group rather than a BUILDING.floors entry so that the three floors
// that do exist keep their own numbering, areas and roof datum unchanged.
//
// Everything here is derived from the pillar footprint in spec.js: the room
// stands over C28, C29, C31 and C32, and the eave is the same 2 ft cantilever
// the front-west corner uses.

const T = FOURTH_FLOOR.wallT;

function box(parent, w, h, d, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

const rect = (parent, r, y, h, mat) =>
  box(parent, r.x1 - r.x0, h, r.z1 - r.z0, (r.x0 + r.x1) / 2, y, (r.z0 + r.z1) / 2, mat);

// Walls of the room. The L's two inner faces (the band's street side outside
// the arm, and the arm's east side) face the roof terrace and are glazed; the
// outer faces are solid with the openings the upper floors already use.
function buildWalls(g, band, arm, base, h, mats) {
  const yMid = base + h / 2;
  const rear = OPENINGS.F3.rear;
  const west = OPENINGS.F3.west;

  // Rear wall, along the band.
  for (const run of wallRuns(band.x1 - band.x0, rear)) {
    box(g, run.len, h, T, band.x0 + run.u0 + run.len / 2, yMid, band.z0 + T / 2, mats.plaster);
  }
  // West wall, along band plus arm.
  const westLen = arm.z1 - band.z0;
  for (const run of wallRuns(westLen, west)) {
    box(g, T, h, run.len, band.x0 + T / 2, yMid, band.z0 + run.u0 + run.len / 2, mats.plaster);
  }
  // Arm's front end, facing the street.
  for (const run of wallRuns(arm.x1 - arm.x0, OPENINGS.F3.front)) {
    box(g, run.len, h, T, arm.x0 + run.u0 + run.len / 2, yMid, arm.z1 - T / 2, mats.plaster);
  }

  // Inner faces onto the terrace: glazed, so the room reads as opening onto
  // the roof it stands on.
  glazedRun(g, { axis: 'x', a: arm.x1, b: band.x1, z: band.z1 - T / 2 }, base, h, mats);
  glazedRun(g, { axis: 'z', a: band.z1, b: arm.z1 - T, x: arm.x1 - T / 2 }, base, h, mats);
}

// Split a wall length into solid runs, leaving the openings the plan defines.
function wallRuns(length, openings) {
  const ops = [...openings].sort((p, q) => p.a - q.a);
  const runs = [];
  let cursor = 0;
  for (const o of ops) {
    const a = Math.max(0, Math.min(o.a, length));
    if (a > cursor) runs.push({ u0: cursor, len: a - cursor });
    cursor = Math.max(cursor, Math.min(o.b, length));
  }
  if (cursor < length) runs.push({ u0: cursor, len: length - cursor });
  return runs;
}

function glazedRun(g, { axis, a, b, x, z }, base, h, mats) {
  const alongX = axis === 'x';
  const len = b - a;
  if (len <= 0.1) return;
  const sill = 1.0;
  const head = h - 1.2;
  const cy = base + (sill + head) / 2;
  const cx = alongX ? (a + b) / 2 : x;
  const cz = alongX ? z : (a + b) / 2;

  box(g, alongX ? len : T * 0.5, head - sill, alongX ? T * 0.5 : len, cx, cy, cz, mats.glass);
  box(g, alongX ? len : T, 0.5, alongX ? T : len, cx, base + head + 0.25, cz, mats.frame);
  box(g, alongX ? len : T, sill, alongX ? T : len, cx, base + sill / 2, cz, mats.plaster);
  const n = Math.max(2, Math.round(len / 3.5));
  for (let i = 1; i < n; i++) {
    const u = a + (len * i) / n;
    box(g, alongX ? 0.14 : T * 0.6, head - sill, alongX ? T * 0.6 : 0.14,
      alongX ? u : x, cy, alongX ? z : u, mats.frame);
  }
}

// The 2 ft eave, turned outward along the L's free edges, mirroring the
// front-west extension: a slab flush with the top of the wall plus a fascia
// band hanging under its outer edge.
function buildEave(g, band, arm, top, mats) {
  const d = FOURTH_FLOOR.eave;
  const t = BUILDING.slabT;
  const y = top + t / 2;

  // Slabs: one along the rear, one down the west, one across the arm's end.
  box(g, band.x1 - band.x0 + d, t, d, (band.x0 + band.x1 + d) / 2, y, band.z0 - d / 2, mats.slab);
  box(g, d, t, arm.z1 - band.z0 + d, band.x0 - d / 2, y, (band.z0 + arm.z1 - d) / 2, mats.slab);
  box(g, arm.x1 - arm.x0, t, d, (arm.x0 + arm.x1) / 2, y, arm.z1 + d / 2, mats.slab);

  const lipH = 0.45;
  const lipY = top - lipH / 2;
  box(g, band.x1 - band.x0 + d, lipH, 0.22, (band.x0 + band.x1 + d) / 2, lipY,
    band.z0 - d + 0.11, mats.coping);
  box(g, 0.22, lipH, arm.z1 - band.z0 + d, band.x0 - d + 0.11, lipY,
    (band.z0 + arm.z1 - d) / 2, mats.coping);
  box(g, arm.x1 - arm.x0, lipH, 0.22, (arm.x0 + arm.x1) / 2, lipY,
    arm.z1 + d - 0.11, mats.coping);
}

/**
 * Build the fourth-floor room. Returns a group plus the box it occupies, so
 * main.js can parent it and the camera can frame it.
 */
export function buildFourthFloor(mats) {
  const g = new THREE.Group();
  g.name = 'level-F4';
  g.userData.level = {
    id: FOURTH_FLOOR.id,
    name: FOURTH_FLOOR.name,
    base: FOURTH_FLOOR.base,
    height: FOURTH_FLOOR.height,
    rooms: 'Concept: one L-shaped room on the roof terrace, over pillars C28, C29, C31 and C32',
    area: 0,
    concept: true,
  };

  const { band, arm } = fourthFloorRects();
  const { base, height: h } = FOURTH_FLOOR;
  const top = base + h;

  // Floor slab, standing on the roof and covering both legs of the L.
  const t = BUILDING.slabT;
  rect(g, band, base - t / 2, t, mats.slab);
  rect(g, arm, base - t / 2, t, mats.slab);

  // Plinth band at the foot, tying the room to the roof below.
  rect(g, band, base + 0.25, 0.5, mats.coping);
  rect(g, arm, base + 0.25, 0.5, mats.coping);

  buildWalls(g, band, arm, base, h, mats);

  // Roof slab over both legs, then the cantilevered eave around the free edges.
  rect(g, band, top + t / 2, t, mats.slab);
  rect(g, arm, top + t / 2, t, mats.slab);
  buildEave(g, band, arm, top + t, mats);

  // Parapet along the inner edges, where the room meets the open terrace.
  const ph = 1.6;
  box(g, band.x1 - arm.x1, ph, 0.4, (arm.x1 + band.x1) / 2, top + t + ph / 2, band.z1 - 0.2, mats.coping);
  box(g, 0.4, ph, arm.z1 - band.z1, arm.x1 - 0.2, top + t + ph / 2, (band.z1 + arm.z1) / 2, mats.coping);

  const bounds = new THREE.Box3().setFromObject(g);
  return { group: g, bounds };
}
