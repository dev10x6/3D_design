import * as THREE from 'three';
import { BUILDING, FOURTH_FLOOR, fourthFloorRects, OPENINGS, EAVE_FASCIA, roofDatum } from './spec.js';

// The fourth floor is a concept, not part of the drawing set. It is built as a
// separate group rather than a BUILDING.floors entry so the three floors that
// do exist keep their numbering, areas and roof datum unchanged.
//
// The room is a box standing on the third-floor rear eave: that eave is its
// floor slab, and the plan of the room is the plan of the eave, so the two
// cannot disagree about where the room lands.

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

// A glazed wall. The L's inner faces look onto the roof terrace, so they are
// glass rather than solid, which is what makes the room read as opening onto
// the roof it stands on.
function glazedRun(g, { alongX, a, b, at }, base, h, mats) {
  const len = b - a;
  if (len <= 0.1) return;
  const sill = 1.0;
  const head = h - 1.2;
  const cy = base + (sill + head) / 2;
  const cx = alongX ? (a + b) / 2 : at;
  const cz = alongX ? at : (a + b) / 2;

  box(g, alongX ? len : T * 0.5, head - sill, alongX ? T * 0.5 : len, cx, cy, cz, mats.glass);
  box(g, alongX ? len : T, 0.5, alongX ? T : len, cx, base + head + 0.25, cz, mats.frame);
  box(g, alongX ? len : T, sill, alongX ? T : len, cx, base + sill / 2, cz, mats.plaster);

  const n = Math.max(2, Math.round(len / 3.5));
  for (let i = 1; i < n; i++) {
    const u = a + (len * i) / n;
    box(g, alongX ? 0.14 : T * 0.6, head - sill, alongX ? T * 0.6 : 0.14,
      alongX ? u : at, cy, alongX ? at : u, mats.frame);
  }
}

// Walls of the room. The outer faces (rear and west) are solid with the
// openings the floors below already use; the two inner faces of the L look onto
// the terrace and are glazed.
function buildWalls(g, band, arm, base, h, mats) {
  const yMid = base + h / 2;
  const rear = OPENINGS.F3.rear;
  const west = OPENINGS.F3.west;

  for (const run of wallRuns(band.x1 - band.x0, rear)) {
    box(g, run.len, h, T, band.x0 + run.u0 + run.len / 2, yMid, band.z0 + T / 2, mats.plaster);
  }
  const westLen = arm.z1 - band.z0;
  for (const run of wallRuns(westLen, west)) {
    box(g, T, h, run.len, band.x0 + T / 2, yMid, band.z0 + run.u0 + run.len / 2, mats.plaster);
  }
  for (const run of wallRuns(arm.x1 - arm.x0, OPENINGS.F3.front)) {
    box(g, run.len, h, T, arm.x0 + run.u0 + run.len / 2, yMid, arm.z1 - T / 2, mats.plaster);
  }

  glazedRun(g, { alongX: true, a: arm.x1, b: band.x1, at: band.z1 - T / 2 }, base, h, mats);
  glazedRun(g, { alongX: false, a: band.z1, b: arm.z1 - T, at: arm.x1 - T / 2 }, base, h, mats);
}

/**
 * Build the fourth-floor room on the third-floor rear eave.
 *
 * The eave slab already exists and is drawn by building.js, so this adds only
 * what sits on top of it: walls, a roof slab and a fascia. Nothing here
 * duplicates the eave itself.
 */
export function buildFourthFloor(mats) {
  const g = new THREE.Group();
  g.name = 'level-F4';

  const { band, arm } = fourthFloorRects();
  const { y: eaveTop } = roofDatum(FOURTH_FLOOR.floorLevel);

  // The eave slab is laid flush with the roof datum, so its top face is the
  // floor of the room and its underside is what the room has to clear.
  const base = eaveTop;
  const { height: h } = FOURTH_FLOOR;
  const top = base + h;
  const t = BUILDING.slabT;

  g.userData.level = {
    id: FOURTH_FLOOR.id,
    name: FOURTH_FLOOR.name,
    base,
    height: h,
    rooms: `Concept: L-shaped room standing on the third-floor rear eave, over pillars ${FOURTH_FLOOR.pillars.join(', ')}`,
    area: 0,
    concept: true,
  };

  // Plinth band at the foot, tying the room to the slab it stands on.
  rect(g, band, base + 0.25, 0.5, mats.coping);
  rect(g, arm, base + 0.25, 0.5, mats.coping);

  buildWalls(g, band, arm, base, h, mats);

  // Roof slab over both legs, then a fascia hanging under its outer edge so the
  // top of the box reads the same way as the eaves below it.
  rect(g, band, top + t / 2, t, mats.slab);
  rect(g, arm, top + t / 2, t, mats.slab);

  const lipH = EAVE_FASCIA;
  const lipY = top - lipH / 2;
  box(g, band.x1 - band.x0, lipH, 0.22, (band.x0 + band.x1) / 2, lipY, band.z0 + 0.11, mats.coping);
  box(g, 0.22, lipH, arm.z1 - band.z0, band.x0 + 0.11, lipY, (band.z0 + arm.z1) / 2, mats.coping);
  box(g, arm.x1 - arm.x0, lipH, 0.22, (arm.x0 + arm.x1) / 2, lipY, arm.z1 - 0.11, mats.coping);

  // Parapet along the inner edges, where the room meets the open terrace.
  const ph = 1.6;
  const topY = top + t;
  box(g, band.x1 - arm.x1, ph, 0.4, (arm.x1 + band.x1) / 2, topY + ph / 2, band.z1 - 0.2, mats.coping);
  box(g, 0.4, ph, arm.z1 - band.z1, arm.x1 - 0.2, topY + ph / 2, (band.z1 + arm.z1) / 2, mats.coping);

  const bounds = new THREE.Box3().setFromObject(g);
  return { group: g, bounds };
}
