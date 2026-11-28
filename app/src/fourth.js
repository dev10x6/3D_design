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

// A solid stretch of wall, `len` long, centred at `mid` along the wall axis.
function solidRun(g, alongX, mid, len, at, base, h, mats) {
  if (len <= 0.05) return;
  box(g, alongX ? len : T, h, alongX ? T : len,
    alongX ? mid : at, base + h / 2, alongX ? at : mid, mats.plaster);
}

// A glazed opening. The room's walls are the floors' walls, so the openings are
// the same ones the storeys below use - they are glazed here rather than left
// as holes, because there is nothing behind them to look into.
function glazedRun(g, alongX, a, b, at, base, h, mats) {
  const len = b - a;
  if (len <= 0.05) return;
  const sill = 1.0;
  const head = h - 1.2;
  const cy = base + (sill + head) / 2;
  const cx = alongX ? (a + b) / 2 : at;
  const cz = alongX ? at : (a + b) / 2;

  box(g, alongX ? len : T * 0.5, head - sill, alongX ? T * 0.5 : len, cx, cy, cz, mats.glass);
  box(g, alongX ? len : T, 0.45, alongX ? T : len, cx, base + head + 0.22, cz, mats.frame);
  box(g, alongX ? len : T, sill, alongX ? T : len, cx, base + sill / 2, cz, mats.plaster);

  const n = Math.max(2, Math.round(len / 3.5));
  for (let i = 1; i < n; i++) {
    const u = a + (len * i) / n;
    box(g, alongX ? 0.14 : T * 0.6, head - sill, alongX ? T * 0.6 : 0.14,
      alongX ? u : at, cy, alongX ? at : u, mats.frame);
  }
}

// One wall of the room, running from `a` to `b` in absolute building
// coordinates, solid except where the storeys below already have an opening.
// Those openings are glazed here rather than left as holes: there is nothing
// behind them to look into.
function buildWall(g, alongX, a, b, at, openings, base, h, mats) {
  let cursor = a;
  for (const o of [...openings].sort((p, q) => p.a - q.a)) {
    const oa = Math.max(a, Math.min(o.a, b));
    const ob = Math.max(a, Math.min(o.b, b));
    if (ob - oa < 0.05) continue;
    solidRun(g, alongX, (cursor + oa) / 2, oa - cursor, at, base, h, mats);
    glazedRun(g, alongX, oa, ob, at, base, h, mats);
    cursor = Math.max(cursor, ob);
  }
  solidRun(g, alongX, (cursor + b) / 2, b - cursor, at, base, h, mats);
}

// Walls of the room.
//
// The rear and west faces line up with the building's own walls - they are
// carried 2.6 ft out on the eave - so they reuse the openings the storeys below
// already have. Every other face is a new wall standing over the roof terrace,
// so those are glazed along their whole length.
function buildWalls(g, band, arm, base, h, mats) {
  buildWall(g, true, band.x0, band.x1, band.z0 + T / 2, OPENINGS.F3.rear, base, h, mats);
  buildWall(g, false, band.z0, arm.z1, band.x0 + T / 2, OPENINGS.F3.west, base, h, mats);

  // Band: east face, then the stretch of front face the arm does not cover.
  glazedRun(g, false, band.z0, band.z1, band.x1 - T / 2, base, h, mats);
  glazedRun(g, true, arm.x1, band.x1, band.z1 - T / 2, base, h, mats);

  // Arm: east face, then its front face.
  glazedRun(g, false, band.z1, arm.z1, arm.x1 - T / 2, base, h, mats);
  glazedRun(g, true, band.x0, arm.x1, arm.z1 - T / 2, base, h, mats);
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

  // Parapet round the whole roof boundary. The inner runs face the open
  // terrace; the outer runs sit over the eave edges - rear, west and the arm's
  // front - so the boundary covers the roof extension to the west instead of
  // stopping at the fascia.
  const ph = 1.6;
  const topY = top + t;
  const pw = 0.4;

  // Inner: east face of the band, and the arm's east face.
  box(g, band.x1 - arm.x1, ph, pw, (arm.x1 + band.x1) / 2, topY + ph / 2, band.z1 - pw / 2, mats.coping);
  box(g, pw, ph, arm.z1 - band.z1, arm.x1 - pw / 2, topY + ph / 2, (band.z1 + arm.z1) / 2, mats.coping);

  // Outer: rear edge of the band, its west edge, and the front edge of the arm.
  // These stand on the eave's outer edge, which is where the roof extension
  // ends, so nothing overhangs the slab it sits on.
  box(g, band.x1 - band.x0, ph, pw, (band.x0 + band.x1) / 2, topY + ph / 2, band.z0 + pw / 2, mats.coping);
  box(g, pw, ph, arm.z1 - band.z0, band.x0 + pw / 2, topY + ph / 2, (band.z0 + arm.z1) / 2, mats.coping);
  box(g, arm.x1 - band.x0, ph, pw, (band.x0 + arm.x1) / 2, topY + ph / 2, arm.z1 - pw / 2, mats.coping);

  // East face of the band, closing the boundary where the room faces the roof
  // garden.
  box(g, pw, ph, band.z1 - band.z0, band.x1 - pw / 2, topY + ph / 2, (band.z0 + band.z1) / 2, mats.coping);

  const bounds = new THREE.Box3().setFromObject(g);
  return { group: g, bounds };
}
