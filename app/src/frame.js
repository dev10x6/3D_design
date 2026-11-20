import * as THREE from 'three';
import { ROOF_FRAME, roofFrameLayout } from './spec.js';

// The roof frame is a concept addition, like the fourth-floor room: nothing in
// the drawing set describes it. Four front-bay pillars - C1 and C4 on the west
// wall line, C3 and C6 on the east - carry on up through the roof for 10 ft,
// each pair is joined by a concrete roof beam, and the two beams are joined by
// iron beams spanning between them.
//
// It is built as its own group on the roof rather than as a floor: it has no
// floor area and no storey height.

function box(parent, w, h, d, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

/**
 * Build the roof frame: four columns, two roof beams, and the iron beams
 * between them.
 *
 * Each column keeps the section of the pillar it continues and stands on the
 * roof deck, so it reads as the same post coming through the roof rather than a
 * new member landing on it.
 */
export function buildRoofFrame(mats) {
  const g = new THREE.Group();
  g.name = 'roof-frame';

  const { beams, ties, deck, columnHeight, beamDepth } = roofFrameLayout();
  const { tieW, tieD } = ROOF_FRAME;
  const top = deck + columnHeight;

  for (const b of beams) {
    for (const c of b.cols) {
      box(g, c.w, columnHeight, c.d, c.x, deck + columnHeight / 2, c.z, mats.concrete);
    }
    // Roof beam capping both columns of the pair, running along the bay.
    box(g, b.width, beamDepth, b.z1 - b.z0, b.x, top + beamDepth / 2,
      (b.z0 + b.z1) / 2, mats.slab);
  }

  // Iron beams across, resting on the two roof beams so each one is carried at
  // both ends. They span the outer faces, not the centres, so no part of one
  // overhangs the beam it bears on.
  const x0 = Math.min(...beams.map((b) => b.x - b.width / 2));
  const x1 = Math.max(...beams.map((b) => b.x + b.width / 2));
  const y = top + beamDepth + tieD / 2;

  for (const z of ties) {
    box(g, x1 - x0, tieD, tieW, (x0 + x1) / 2, y, z, mats.iron);
  }

  g.userData.level = {
    id: 'roof-frame',
    name: 'Roof frame',
    base: deck,
    height: columnHeight + beamDepth + tieD,
    rooms: `Concept: pillars ${ROOF_FRAME.pairs.map((p) => p.pillars.join(' + ')).join(' and ')} carried up 10 ft above the roof, joined by roof beams and iron beams`,
    area: 0,
    concept: true,
  };

  return { group: g, bounds: new THREE.Box3().setFromObject(g) };
}
