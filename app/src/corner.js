import * as THREE from 'three';
import { BUILDING, OPENINGS, BALCONIES, CORNER_FRAME, CORNER_STYLES, ROOF_EXTENSIONS } from './spec.js';
import { extensionRects, EAVE_FASCIA } from './building.js';

const FASCIA_H = EAVE_FASCIA;

function cornerMats(styleKey) {
  const s = CORNER_STYLES[styleKey];
  const std = (color, roughness = 0.7, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  return {
    cladding: std(s.cladding, 0.72),
    claddingDark: std(s.claddingDark, 0.78),
    wall: std(s.wall, 0.9),
    soffit: std(s.soffit, 0.8),
    frame: std(s.frame, 0.55),
  };
}

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

// The roof over a level, mirroring building.js.
function roofDatum(levelId) {
  const i = BUILDING.floors.findIndex((f) => f.id === levelId);
  const next = BUILDING.floors[i + 1];
  if (next) return { y: next.base, overhang: 0.25 };
  return { y: BUILDING.roofBase + 0.7, overhang: 0.6 };
}

function extensionFor(level) {
  const ext = ROOF_EXTENSIONS.find(
    (e) => e.level === level && e.from === CORNER_FRAME.from,
  );
  if (!ext) {
    throw new Error(
      `CORNER_FRAME needs a ROOF_EXTENSIONS entry for ${level}/${CORNER_FRAME.from}`,
    );
  }
  return ext;
}

/**
 * Plan and height of the box, all derived from the spec.
 *
 * The floor and roof come from the two roof extensions at this corner, and the
 * plan is the balcony the box encloses: a deep band across that balcony's
 * corner plus the eave's narrow return up the side wall, so the L reads as the
 * eave above and below it, only carried further out to cover the balcony.
 */
function footprint() {
  const floorExt = extensionFor(CORNER_FRAME.floorLevel);
  const roofExt = extensionFor(CORNER_FRAME.roofLevel);
  const { front, east, band: bandRun, arm } = extensionRects(roofExt);
  const balcony = BALCONIES[CORNER_FRAME.roofLevel].find((b) => b.id === CORNER_FRAME.covers);
  if (!balcony) {
    throw new Error(
      `CORNER_FRAME.covers needs a ${CORNER_FRAME.covers} balcony on ${CORNER_FRAME.roofLevel}`,
    );
  }

  const { lip } = CORNER_FRAME;

  // Width comes from the eave's own run along the facade, so the box covers
  // exactly as much of the balcony as the eaves above and below it. Only the
  // projection is taken from the balcony, so the box reaches its edge.
  const wallZ = front ? balcony.z0 : balcony.z1;
  const outerZ = front ? balcony.z1 + lip : balcony.z0 - lip;
  const band = {
    x0: Math.min(bandRun.x0, bandRun.x1), x1: Math.max(bandRun.x0, bandRun.x1),
    z0: Math.min(wallZ, outerZ), z1: Math.max(wallZ, outerZ),
  };

  // The L's short leg is the eave's return up the side wall.
  const returnDepth = arm.x1 - arm.x0;
  const innerSideX = east ? band.x0 + returnDepth : band.x1 - returnDepth;
  const side = {
    x0: Math.min(band.x0, innerSideX), x1: Math.max(band.x0, innerSideX),
    z0: arm.z0, z1: wallZ,
  };

  const base = roofDatum(CORNER_FRAME.floorLevel);
  const top = roofDatum(CORNER_FRAME.roofLevel);

  return {
    front, east, band, arm: side, balcony,
    baseY: base.y,
    // Fills the storey: floor slab top up to just under the roof slab, clearing
    // the fascia lip that hangs below the eave.
    height: top.y - BUILDING.slabT - FASCIA_H - base.y,
    floorExt, roofExt,
  };
}

// The box: a solid side wall and two returns, an open street face over the
// balcony, a timber soffit and the band that caps it under the roof extension.
function buildBox(parent, fp, styleKey, mats) {
  const { baseY, height, band, arm } = fp;
  const topY = baseY + height;
  const wallT = 0.45;
  const fasciaH = 0.9;
  const yMid = baseY + height / 2;

  // The street face is left open: the box is a cantilevered frame over the
  // balcony, so the balcony parapet is what you see inside it. Only the side
  // face and the two returns are solid.
  const outerX = fp.east ? arm.x1 : arm.x0;
  box(parent, wallT, height, arm.z1 - arm.z0,
    outerX - (fp.east ? wallT / 2 : -wallT / 2), yMid, (arm.z0 + arm.z1) / 2, mats.cladding);

  // Return walls closing the L at the free end of each arm.
  const endX = fp.east ? band.x0 : band.x1;
  box(parent, wallT, height, band.z1 - band.z0,
    endX + (fp.east ? wallT / 2 : -wallT / 2), yMid, (band.z0 + band.z1) / 2, mats.cladding);
  const endZ = fp.front ? arm.z0 : arm.z1;
  box(parent, arm.x1 - arm.x0, height, wallT,
    (arm.x0 + arm.x1) / 2, yMid, endZ + (fp.front ? wallT / 2 : -wallT / 2), mats.cladding);

  // Corner posts at the open face, so the frame reads as built rather than cut.
  const openZ = fp.front ? band.z1 : band.z0;
  const postIn = 0.3;
  for (const px of [band.x0 + postIn, band.x1 - postIn]) {
    box(parent, 0.6, height, 0.6, px, yMid,
      openZ + (fp.front ? -0.3 : 0.3), mats.cladding);
  }

  // Fascia band under the roof extension, reading as the top of the box.
  rect(parent, band, topY - fasciaH / 2, fasciaH, mats.claddingDark);
  rect(parent, arm, topY - fasciaH / 2, fasciaH, mats.claddingDark);

  // Timber soffit lining the underside of the roof, downlights below it.
  for (const r of [band, arm]) {
    rect(parent, { x0: r.x0 + 0.15, x1: r.x1 - 0.15, z0: r.z0 + 0.15, z1: r.z1 - 0.15 },
      topY - fasciaH - 0.06, 0.12, mats.soffit);
  }
  downlights(parent, fp, topY - fasciaH - 0.14, mats);

  if (styleKey === 'wood') {
    windowFrames(parent, fp, mats);
  } else {
    fins(parent, fp, topY, mats);
    columnBands(parent, fp, mats);
  }
}

// Extruded white box frames standing off the street face, per the first
// reference.
function windowFrames(parent, fp, mats) {
  const t = 0.22;
  const proj = 0.44;
  const { band } = fp;
  const ops = OPENINGS[CORNER_FRAME.roofLevel].front.filter(
    (o) => o.type === 'window' && o.a >= band.x0 && o.b <= band.x1,
  );

  for (const o of ops) {
    const w = o.b - o.a;
    const hh = o.head - o.sill;
    const cu = (o.a + o.b) / 2;
    const cy = fp.baseY + (o.sill + o.head) / 2;
    const zc = fp.front ? band.z1 - proj / 2 : band.z0 + proj / 2;

    box(parent, w + 2 * t, t, proj, cu, cy + hh / 2 + t / 2, zc, mats.frame);
    box(parent, w + 2 * t, t, proj, cu, cy - hh / 2 - t / 2, zc, mats.frame);
    box(parent, t, hh, proj, o.a - t / 2, cy, zc, mats.frame);
    box(parent, t, hh, proj, o.b + t / 2, cy, zc, mats.frame);
  }
}

// Three horizontal charcoal fins off the end of the box, per the second
// reference.
function fins(parent, fp, top, mats) {
  const finLen = 3.4;
  const { band } = fp;
  const x = (fp.east ? band.x1 : band.x0) + (fp.east ? finLen / 2 - 0.3 : -finLen / 2 + 0.3);
  for (let i = 0; i < 3; i++) {
    box(parent, finLen, 0.34, band.z1 - band.z0, x, top - 1.0 - i * 1.25,
      (band.z0 + band.z1) / 2, mats.claddingDark);
  }
}

// White grooved column bands running the box height below the roof.
function columnBands(parent, fp, mats) {
  const { baseY, height, band, arm } = fp;
  const y = baseY + height / 2;
  const zIn = fp.front ? band.z1 - 0.9 : band.z0 + 0.9;
  const xIn = fp.east ? arm.x1 - 0.9 : arm.x0 + 0.9;
  const from = fp.east ? band.x0 : band.x1;

  for (const d of [0.2, 1.9, 3.6]) {
    box(parent, 0.62, height, 0.5, from + (fp.east ? d : -d), y, zIn, mats.wall);
  }
  for (const d of [2.2, 4.4]) {
    box(parent, 0.5, height, 0.62, xIn, y, arm.z1 - d, mats.wall);
  }
}

// Recessed warm downlights in the timber soffit.
function downlights(parent, fp, y, mats) {
  const { band } = fp;
  const n = Math.max(2, Math.round((band.x1 - band.x0) / 3));
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffd9a0, emissive: 0xffb960, emissiveIntensity: 1.5, roughness: 0.4,
  });
  for (let i = 0; i < n; i++) {
    const x = band.x0 + 1.6 + (i * (band.x1 - band.x0 - 2.6)) / Math.max(1, n - 1);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 14), mat);
    m.position.set(x, y, (band.z0 + band.z1) / 2);
    parent.add(m);
  }
}

/**
 * Build the corner box. It fills the storey between the floor and roof
 * extensions, so it returns one group per storey it passes through, split at
 * each storey's floor level. main.js parents each into the matching level
 * group, which keeps level isolation working.
 */
export function buildCorner(styleKey = CORNER_FRAME.style) {
  const mats = cornerMats(styleKey);
  const fp = footprint();

  const whole = new THREE.Group();
  buildBox(whole, fp, styleKey, mats);
  whole.updateMatrixWorld(true);

  const spanned = BUILDING.floors.filter((f) => f.id === CORNER_FRAME.roofLevel);

  const levels = {};
  for (const lv of spanned) {
    const g = new THREE.Group();
    g.name = `corner-${lv.id}`;
    g.userData.cornerStyle = styleKey;
    g.userData.cornerFrom = CORNER_FRAME.from;
    levels[lv.id] = g;
  }

  for (const mesh of [...whole.children]) {
    const b = new THREE.Box3().setFromObject(mesh);
    const cy = (b.min.y + b.max.y) / 2;
    let owner = spanned[0];
    for (const lv of spanned) if (cy >= lv.base - 0.001) owner = lv;
    whole.remove(mesh);
    levels[owner.id].add(mesh);
  }

  return { levels, footprint: fp, mats, style: styleKey };
}
