import * as THREE from 'three';
import { ROOF_GARDEN, roofGardenLayout } from './spec.js';

// The rooftop garden and greenhouse are a concept addition, like the fourth
// floor and the roof frame: nothing in the drawing set describes them. Iron
// posts stand on C26, C27, C33, C32 and C29 and hold a glazed roof, so the
// planting is under cover.
//
// Built as its own group on the roof rather than as a floor: it has no floor
// area and no storey height.

function box(parent, w, h, d, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

/**
 * A planting bed: a soil box with a low kerb rimmed round its edge.
 *
 * `alongZ` runs the bed front to back centred on x=`at`; otherwise it runs side
 * to side centred on z=`at`.
 */
function bed(g, alongZ, a, b, at, y, mats) {
  const { bedW, bedH } = ROOF_GARDEN;
  const len = b - a;
  if (len <= 0.1) return;

  const r = alongZ
    ? { x0: at - bedW / 2, x1: at + bedW / 2, z0: a, z1: b }
    : { x0: a, x1: b, z0: at - bedW / 2, z1: at + bedW / 2 };
  const w = r.x1 - r.x0;
  const d = r.z1 - r.z0;
  const cx = (r.x0 + r.x1) / 2;
  const cz = (r.z0 + r.z1) / 2;
  const t = 0.18;

  // Soil is inset by the kerb thickness and stops just under its top, so no
  // face of it is coplanar with a kerb face.
  box(g, w - 2 * t, bedH, d - 2 * t, cx, y + bedH / 2, cz, mats.soil);

  const ky = y + (bedH + 0.12) / 2;
  box(g, w, bedH + 0.12, t, cx, ky, r.z0 + t / 2, mats.coping);
  box(g, w, bedH + 0.12, t, cx, ky, r.z1 - t / 2, mats.coping);
  box(g, t, bedH + 0.12, d - 2 * t, r.x0 + t / 2, ky, cz, mats.coping);
  box(g, t, bedH + 0.12, d - 2 * t, r.x1 - t / 2, ky, cz, mats.coping);

  // Shrubs: one per few feet, sized off the bed so they never reach the glass.
  const n = Math.max(2, Math.floor(len / 4));
  const rad = Math.min(bedW * 0.32, 0.85);
  for (let i = 0; i < n; i++) {
    const u = a + (len * (i + 0.5)) / n;
    const s = new THREE.Mesh(new THREE.SphereGeometry(rad, 12, 8), mats.foliage);
    s.position.set(alongZ ? at : u, y + bedH + rad * 0.7, alongZ ? u : at);
    s.scale.y = 0.85;
    s.castShadow = true;
    s.receiveShadow = true;
    g.add(s);
  }
}

/**
 * Build the rooftop garden: five iron posts, a glazed roof over them, and
 * planting beds along the outer edges.
 */
export function buildRoofGarden(mats) {
  const g = new THREE.Group();
  g.name = 'roof-garden';

  const L = roofGardenLayout();
  const { posts, plan, roof, deck, columnHeight, columnW, top, wall } = L;
  const { beamDepth, glassT, bedW, bedInset } = ROOF_GARDEN;

  g.userData.level = {
    id: 'roof-garden',
    name: 'Roof garden',
    base: deck,
    height: columnHeight,
    rooms: `Concept: glazed roof garden over pillars ${ROOF_GARDEN.pillars.join(', ')}`,
    area: 0,
    concept: true,
  };

  // Posts, each standing on the pillar it is named for.
  for (const p of posts) {
    box(g, columnW, columnHeight, columnW, p.x, deck + columnHeight / 2, p.z, mats.iron);
    // Base plate, so the post reads as bolted down rather than pushed in. It is
    // clipped at the room's wall, because a plate wide enough to read would
    // otherwise poke through the wall on the west line.
    const pw2 = columnW + 0.35;
    const px0 = Math.max(p.x - pw2 / 2, wall);
    const px1 = p.x + pw2 / 2;
    box(g, px1 - px0, 0.16, pw2, (px0 + px1) / 2, deck + 0.08, p.z, mats.iron);
  }

  // Edge beam under the glass, on all four sides, so the roof has a visible
  // edge rather than the glass floating on the posts.
  const rw = roof.x1 - roof.x0;
  const rd = roof.z1 - roof.z0;
  const rcx = (roof.x0 + roof.x1) / 2;
  const rcz = (roof.z0 + roof.z1) / 2;
  const by = top - beamDepth / 2;
  box(g, rw, beamDepth, 0.3, rcx, by, roof.z0 + 0.15, mats.iron);
  box(g, rw, beamDepth, 0.3, rcx, by, roof.z1 - 0.15, mats.iron);
  box(g, 0.3, beamDepth, rd, roof.x0 + 0.15, by, rcz, mats.iron);
  box(g, 0.3, beamDepth, rd, roof.x1 - 0.15, by, rcz, mats.iron);

  // Glazing: a single sheet with mullions over it, which reads as a greenhouse
  // roof without needing a pane-by-pane grid at this scale.
  box(g, rw - 0.3, glassT, rd - 0.3, rcx, top + glassT / 2, rcz, mats.glass);
  const bays = 4;
  for (let i = 1; i < bays; i++) {
    const x = roof.x0 + (rw * i) / bays;
    box(g, 0.14, 0.22, rd - 0.3, x, top + 0.11, rcz, mats.iron);
  }
  const rungs = 4;
  for (let i = 1; i < rungs; i++) {
    const z = roof.z0 + (rd * i) / rungs;
    box(g, rw - 0.3, 0.22, 0.14, rcx, top + 0.11, z, mats.iron);
  }

  // Beds: along the rear and east edges, which are the two open sides. The west
  // edge is the fourth-floor room's wall and the front edge is the way in, so
  // neither carries a bed. The rear bed stops where the east bed starts, so the
  // two do not overlap at the corner and their soil tops stay clear of each
  // other instead of z-fighting.
  const inset = bedW / 2 + bedInset;
  bed(g, true, plan.z0 + inset, plan.z1 - inset, plan.x1 - inset, deck, mats);
  bed(g, false, plan.x0 + inset, plan.x1 - inset - bedW, plan.z0 + inset, deck, mats);

  return { group: g, layout: L };
}
