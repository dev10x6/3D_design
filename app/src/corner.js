import * as THREE from 'three';
import {
  BUILDING, OPENINGS, BALCONIES, CORNER_FRAME, CORNER_STYLES, ROOF_EXTENSIONS,
  roofDatum, extensionRects, cornerWallPillar,
} from './spec.js';

// Height of the band that caps the box. The walls stop at its underside, so
// the band reads as the box's top and nothing is coplanar with anything else.
const CAP_H = 0.9;
const wallH = (fp) => fp.height - CAP_H;

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
    glass: new THREE.MeshPhysicalMaterial({
      color: s.glass, roughness: 0.06, metalness: 0.2, transparent: true, opacity: 0.55,
      envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false,
    }),
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

  // The plan is the eave's own run, in both directions: its depth out from the
  // facade and its width along that facade. The box, its floor and its roof
  // therefore close on the same outer faces.
  const wallZ = front ? balcony.z0 : balcony.z1;
  const outerZ = front
    ? Math.max(bandRun.z0, bandRun.z1)
    : Math.min(bandRun.z0, bandRun.z1);
  const band = {
    x0: Math.min(bandRun.x0, bandRun.x1), x1: Math.max(bandRun.x0, bandRun.x1),
    z0: Math.min(wallZ, outerZ), z1: Math.max(wallZ, outerZ),
  };

  // The L's short leg is the eave's own return, so the box's side takes its
  // width from the return rather than from the band it turns off.
  const side = { x0: arm.x0, x1: arm.x1, z0: arm.z0, z1: wallZ };

  const base = roofDatum(CORNER_FRAME.floorLevel);
  const top = roofDatum(CORNER_FRAME.roofLevel);

  return {
    front, east, band, arm: side, balcony,
    baseY: base.y,
    // Fills the storey: floor slab top right up to the underside of the roof
    // slab, so the box's walls close on the roof instead of stopping short of
    // the fascia lip that hangs below it.
    height: top.y - BUILDING.slabT - base.y,
    // Footprint of the pillar the side wall runs out to.
    pillar: cornerWallPillar(),
    floorExt, roofExt,
  };
}

// The box: a solid side wall and two returns, an open street face over the
// balcony, a timber soffit and the band that caps it under the roof extension.
function buildBox(parent, fp, styleKey, mats) {
  const { baseY, height, band, arm } = fp;
  const topY = baseY + height;
  const { wallT } = CORNER_FRAME;
  const yMid = baseY + wallH(fp) / 2;

  // The street face is left open: the box is a cantilevered frame over the
  // balcony, so the balcony parapet is what you see inside it. Only the side
  // face and the two returns are solid.
  sideWall(parent, fp, mats);

  // Return walls closing the L at the free end of each arm.
  const endX = fp.east ? band.x0 : band.x1;
  box(parent, wallT, wallH(fp), band.z1 - band.z0,
    endX + (fp.east ? wallT / 2 : -wallT / 2), yMid, (band.z0 + band.z1) / 2, mats.cladding);
  const endZ = fp.front ? arm.z0 : arm.z1;
  box(parent, arm.x1 - arm.x0, wallH(fp), wallT,
    (arm.x0 + arm.x1) / 2, yMid, endZ + (fp.front ? wallT / 2 : -wallT / 2), mats.cladding);

  // Corner posts at the open face, so the frame reads as built rather than cut.
  const openZ = fp.front ? band.z1 : band.z0;
  const postIn = 0.3;
  for (const px of [band.x0 + postIn, band.x1 - postIn]) {
    box(parent, 0.6, wallH(fp), 0.6, px, yMid,
      openZ + (fp.front ? -0.3 : 0.3), mats.cladding);
  }

  // Capping band under the roof extension: it is the top of the box, and it
  // runs up to the slab above, so the walls stop at its underside instead of
  // passing through it and fighting with it for the same faces.
  rect(parent, band, topY - CAP_H / 2, CAP_H, mats.claddingDark);
  rect(parent, arm, topY - CAP_H / 2, CAP_H, mats.claddingDark);

  // Timber soffit lining the underside of the roof, downlights below it.
  for (const r of [band, arm]) {
    rect(parent, { x0: r.x0 + 0.15, x1: r.x1 - 0.15, z0: r.z0 + 0.15, z1: r.z1 - 0.15 },
      topY - CAP_H - 0.06, 0.12, mats.soffit);
  }
  downlights(parent, fp, topY - CAP_H - 0.14, mats);

  if (styleKey !== 'wood') {
    fins(parent, fp, topY - CAP_H, mats);
    columnBands(parent, fp, mats);
  }
}

// The box's side wall: solid piers and spandrels round one large glazed
// opening, and a return at its street end so the wall runs out onto the pillar
// the spec names instead of stopping short of it.
function sideWall(parent, fp, mats) {
  const { baseY, arm, pillar: p } = fp;
  const { wallT } = CORNER_FRAME;
  const height = wallH(fp);
  const topY = baseY + height;
  // Outer face of the wall, and its centre line just inside that.
  const outerX = fp.east ? arm.x1 : arm.x0;
  const x = outerX + (fp.east ? -wallT / 2 : wallT / 2);
  const out = fp.east ? 1 : -1;
  const { sill, headInset, panes, frame: fT } = CORNER_FRAME.sideWindow;
  // The glazing stops clear of the pier that lands on the pillar.
  const endInset = Math.max(CORNER_FRAME.sideWindow.endInset, p.z1 - p.z0 + 0.1);

  const z0 = arm.z0 + endInset;
  const z1 = arm.z1 - endInset;
  const ySill = baseY + sill;
  const yHead = topY - headInset;
  const zc = (z0 + z1) / 2;

  // Piers either end of the opening, full height.
  box(parent, wallT, height, z0 - arm.z0, x, baseY + height / 2, (arm.z0 + z0) / 2, mats.cladding);
  box(parent, wallT, height, arm.z1 - z1, x, baseY + height / 2, (z1 + arm.z1) / 2, mats.cladding);
  // Spandrel below the sill and the head band above it.
  box(parent, wallT, ySill - baseY, z1 - z0, x, (baseY + ySill) / 2, zc, mats.cladding);
  box(parent, wallT, topY - yHead, z1 - z0, x, (yHead + topY) / 2, zc, mats.cladding);

  // Glazing, set back in the wall so the frame stands proud of it.
  const gx = outerX - out * 0.12;
  box(parent, 0.08, yHead - ySill, z1 - z0, gx, (ySill + yHead) / 2, zc, mats.glass);

  // Frame: a surround plus mullions splitting the opening into `panes` lights.
  const fx = outerX + out * 0.02;
  const fy = (ySill + yHead) / 2;
  box(parent, 0.14, fT, z1 - z0, fx, ySill + fT / 2, zc, mats.frame);
  box(parent, 0.14, fT, z1 - z0, fx, yHead - fT / 2, zc, mats.frame);
  box(parent, 0.14, yHead - ySill, fT, fx, fy, z0 + fT / 2, mats.frame);
  box(parent, 0.14, yHead - ySill, fT, fx, fy, z1 - fT / 2, mats.frame);
  for (let i = 1; i < panes; i++) {
    box(parent, 0.14, yHead - ySill, fT * 0.7, fx, fy, z0 + ((z1 - z0) * i) / panes, mats.frame);
  }

  // The band projects past the side wall's end, so the wall is carried on to
  // the box's own front face; without this the box is open along that side.
  const postFaceZ = fp.front ? fp.band.z1 - 0.6 : fp.band.z0 + 0.6;
  const armEndZ = fp.front ? arm.z1 : arm.z0;
  const endRun = Math.abs(postFaceZ - armEndZ);
  const faceZ = postFaceZ;
  if (endRun > 0.05) {
    box(parent, wallT, height, endRun, x, baseY + height / 2,
      (armEndZ + faceZ) / 2, mats.cladding);
  }

  // The wall's street end runs out onto the pillar: a return across from the
  // wall to the pillar's footprint, so the wall is carried by the pillar rather
  // than stopping short of it.
  const fromX = fp.east ? arm.x1 - wallT : arm.x0 + wallT;
  const toX = fp.east ? p.x0 : p.x1;
  const run = Math.abs(toX - fromX);
  if (run > 0.05) {
    box(parent, run, height, p.z1 - p.z0, (fromX + toX) / 2, baseY + height / 2,
      (p.z0 + p.z1) / 2, mats.cladding);
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
  const { baseY, band, arm } = fp;
  const height = wallH(fp);
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
