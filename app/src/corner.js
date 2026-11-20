import * as THREE from 'three';
import { BUILDING, OPENINGS, CORNER_FRAME, CORNER_STYLES, ROOF_EXTENSIONS } from './spec.js';

// Existing floor slabs project 0.25 past the wall face and the roof slab 0.6;
// the box stops just outside whichever edge it abuts so no faces are coplanar.
const SLAB_GAP = 0.01;

function cornerMats(styleKey) {
  const s = CORNER_STYLES[styleKey];
  const std = (color, roughness = 0.7, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  return {
    cladding: std(s.cladding, 0.72),
    claddingDark: std(s.claddingDark, 0.78),
    wall: std(s.wall, 0.9),
    stone: std(s.stone, 0.92),
    soffit: std(s.soffit, 0.8),
    planter: std(s.planter, 0.88),
    foliage: std(s.foliage, 0.95),
    frame: std(s.frame, 0.55),
    rail: new THREE.MeshStandardMaterial({ color: s.rail, roughness: 0.38, metalness: 0.7 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: s.glass, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.42,
      envMapIntensity: 1.4, side: THREE.DoubleSide,
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

// The roof over a level, mirroring building.js: the slab of the floor above,
// or the main roof slab for the top floor.
function roofDatum(levelId) {
  const i = BUILDING.floors.findIndex((f) => f.id === levelId);
  const next = BUILDING.floors[i + 1];
  if (next) return { y: next.base, overhang: 0.25 };
  return { y: BUILDING.roofBase + 0.7, overhang: 0.6 };
}

/**
 * Footprint of the box, derived from the roof extension it sits on so the two
 * always agree. The extension's slab is the floor the box stands on and also
 * its roof, so the box repeats the extension's 2 ft footprint exactly and
 * rises from the slab's top face.
 */
function footprint() {
  const ext = ROOF_EXTENSIONS.find(
    (e) => e.level === CORNER_FRAME.level && e.from === CORNER_FRAME.from,
  );
  if (!ext) {
    throw new Error(
      `CORNER_FRAME needs a ROOF_EXTENSIONS entry for ${CORNER_FRAME.level}/${CORNER_FRAME.from}`,
    );
  }

  const W = BUILDING.width;
  const D = BUILDING.depth;
  const { depth, armX, armZ } = ext;
  const front = ext.from === 'frontEast';
  const { y: slabTop, overhang: ov } = roofDatum(ext.level);

  // Same outer and inner edges the extension's slab spans.
  const x1 = W + ov + depth;
  const x0 = W + ov + SLAB_GAP;
  const z0 = front ? -(ov + depth) : D + ov;
  const z1 = front ? -ov : D + ov + depth;

  const fx0 = x1 - armX;
  const wz1 = front ? armZ : D + ov + armZ;

  return {
    front, depth, baseY: slabTop, height: CORNER_FRAME.height,
    fz0: z0, fz1: z1, fx0, fx1: x1, wz0: z1, wz1, wx0: x0, wx1: x1,
    frontArm: { x0: fx0, x1, z0, z1 },
    sideArm: { x0, x1, z0: z1, z1: wz1 },
  };
}

function slabBand(parent, b, y0, h, mat) {
  box(parent, b.x1 - b.x0, h, b.z1 - b.z0,
    (b.x0 + b.x1) / 2, y0 + h / 2, (b.z0 + b.z1) / 2, mat);
}

// The box itself: solid walls on the two outer faces, a timber soffit, and the
// band and roof coping that cap it. Standing on the extension slab, the box
// occupies the L in plan rather than a full rectangle.
function buildBox(parent, fp, styleKey, mats) {
  const { depth, baseY, height, fz0, fz1, fx0, fx1, wz0, wz1, wx0, wx1 } = fp;
  const topY = baseY + height;
  const wallT = 0.45;
  const fasciaH = 0.9;

  // Outer walls of the two arms, full height.
  box(parent, fx1 - fx0, height, wallT,
    (fx0 + fx1) / 2, baseY + height / 2, fz0 + wallT / 2, mats.cladding);
  box(parent, wallT, height, wz1 - wz0,
    wx1 - wallT / 2, baseY + height / 2, (wz0 + wz1) / 2, mats.cladding);

  // Return walls at the free end of each arm, closing the L.
  box(parent, wallT, height, depth,
    fx0 + wallT / 2, baseY + height / 2, (fz0 + fz1) / 2, mats.cladding);
  box(parent, depth, height, wallT,
    (wx0 + wx1) / 2, baseY + height / 2, wz1 - wallT / 2, mats.cladding);

  // Fascia band under the roof coping, reading as the top of the box.
  box(parent, fx1 - fx0, fasciaH, depth,
    (fx0 + fx1) / 2, topY - fasciaH / 2, (fz0 + fz1) / 2, mats.claddingDark);
  box(parent, depth, fasciaH, wz1 - wz0,
    (wx0 + wx1) / 2, topY - fasciaH / 2, (wz0 + wz1) / 2, mats.claddingDark);

  // Timber soffit lining the underside of the roof coping.
  box(parent, fx1 - fx0 - 0.3, 0.12, fz1 - fz0 - 0.3,
    (fx0 + fx1) / 2, topY - fasciaH - 0.06, (fz0 + fz1) / 2, mats.soffit);
  box(parent, wx1 - wx0 - 0.3, 0.12, wz1 - wz0 - 0.3,
    (wx0 + wx1) / 2, topY - fasciaH - 0.06, (wz0 + wz1) / 2, mats.soffit);

  // Roof coping: the box's own roof, set just above the extension slab so the
  // two read as one eave without sharing a face.
  const copH = 0.3;
  box(parent, fx1 - fx0 + 0.2, copH, depth + 0.2,
    (fx0 + fx1) / 2, topY + copH / 2, (fz0 + fz1) / 2, mats.stone);
  box(parent, depth + 0.2, copH, wz1 - wz0,
    (wx0 + wx1) / 2, topY + copH / 2, (wz0 + wz1) / 2, mats.stone);

  if (styleKey === 'wood') {
    planters(parent, fp, topY + copH, mats);
    windowFrames(parent, fp, baseY, mats);
  } else {
    fins(parent, fp, topY, mats);
    columnBands(parent, fp, baseY, height, mats);
  }

  downlights(parent, fp, topY - fasciaH - 0.14, mats);
}

// Linear planting troughs on the box roof, as in the first reference.
function planters(parent, fp, top, mats) {
  const { planterDepth: pd, planterHeight: ph } = CORNER_FRAME;
  const y = top + ph / 2;

  box(parent, fp.fx1 - fp.fx0, ph, pd,
    (fp.fx0 + fp.fx1) / 2, y, fp.fz0 + pd / 2, mats.planter);
  box(parent, pd, ph, fp.wz1 - fp.wz0,
    fp.wx1 - pd / 2, y, (fp.wz0 + fp.wz1) / 2, mats.planter);

  const nx = Math.max(3, Math.round((fp.fx1 - fp.fx0) / 2.2));
  for (let i = 0; i < nx; i++) {
    shrub(parent, fp.fx0 + 0.9 + (i * (fp.fx1 - fp.fx0 - 1.8)) / (nx - 1),
      fp.fz0 + pd / 2, top + ph + 0.16, mats);
  }
  const nz = Math.max(3, Math.round((fp.wz1 - fp.wz0) / 2.2));
  for (let i = 0; i < nz; i++) {
    shrub(parent, fp.wx1 - pd / 2,
      fp.wz0 + 0.9 + (i * (fp.wz1 - fp.wz0 - 1.8)) / (nz - 1), top + ph + 0.16, mats);
  }
}

function shrub(parent, x, z, y, mats) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 7), mats.foliage);
  m.scale.y = 0.75;
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
}

// Extruded white box frames standing off the facade, per the first reference.
function windowFrames(parent, fp, baseY, mats) {
  const ops = OPENINGS[CORNER_FRAME.level].front.filter(
    (o) => o.type === 'window' && o.a >= fp.fx0 && o.b <= fp.fx1,
  );
  const t = 0.22;
  const proj = 0.44;
  const zc = -proj / 2;

  for (const o of ops) {
    const w = o.b - o.a;
    const hh = o.head - o.sill;
    const cu = (o.a + o.b) / 2;
    const cy = baseY + (o.sill + o.head) / 2;

    box(parent, w + 2 * t, t, proj, cu, cy + hh / 2 + t / 2, zc, mats.frame);
    box(parent, w + 2 * t, t, proj, cu, cy - hh / 2 - t / 2, zc, mats.frame);
    box(parent, t, hh, proj, o.a - t / 2, cy, zc, mats.frame);
    box(parent, t, hh, proj, o.b + t / 2, cy, zc, mats.frame);
  }
}

// Three horizontal charcoal fins off the west end of the box, per the second
// reference.
function fins(parent, fp, top, mats) {
  const finLen = 3.4;
  const x = fp.fx0 - finLen / 2 + 0.3;
  for (let i = 0; i < 3; i++) {
    box(parent, finLen, 0.34, fp.depth, x, top - 1.0 - i * 1.25,
      (fp.fz0 + fp.fz1) / 2, mats.claddingDark);
  }
}

// White grooved column bands running the box height below the coping.
function columnBands(parent, fp, baseY, height, mats) {
  const y = baseY + height / 2;
  for (const dx of [0.2, 1.9, 3.6]) {
    box(parent, 0.62, height, 0.5, fp.fx0 + dx, y, fp.fz0 + 0.9, mats.wall);
  }
  for (const dz of [2.2, 4.4]) {
    box(parent, 0.5, height, 0.62, fp.wx1 + 0.35, y, fp.wz1 - dz, mats.wall);
  }
}

// Recessed warm downlights in the timber soffit.
function downlights(parent, fp, y, mats) {
  const n = Math.max(2, Math.round((fp.fx1 - fp.fx0) / 3));
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffd9a0, emissive: 0xffb960, emissiveIntensity: 1.5, roughness: 0.4,
  });
  for (let i = 0; i < n; i++) {
    const x = fp.fx0 + 1.6 + (i * (fp.fx1 - fp.fx0 - 2.6)) / Math.max(1, n - 1);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 14), mat);
    m.position.set(x, y, (fp.fz0 + fp.fz1) / 2);
    parent.add(m);
  }
}

/**
 * Build the corner box. It occupies one storey, so it returns one group that
 * main.js parents into that level's group and level isolation hides with the
 * floor. The roof extension slab underneath is both its floor and its eave.
 */
export function buildCorner(styleKey = CORNER_FRAME.style) {
  const mats = cornerMats(styleKey);
  const fp = footprint();
  const g = new THREE.Group();
  g.name = `corner-${CORNER_FRAME.level}`;
  g.userData.cornerStyle = styleKey;
  g.userData.cornerFrom = CORNER_FRAME.from;
  buildBox(g, fp, styleKey, mats);
  return { group: g, footprint: fp, mats, style: styleKey };
}
