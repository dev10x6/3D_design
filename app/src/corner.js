import * as THREE from 'three';
import { BUILDING, OPENINGS, CORNER_FRAME, CORNER_STYLES, ROOF_EXTENSIONS } from './spec.js';

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
 * The box is the volume between the two roof extensions at its corner: the
 * floor extension is the slab it stands on, the roof extension is the slab that
 * caps it. Plan and height both come from those extensions, so they cannot
 * drift apart from the box.
 */
function footprint() {
  const floorExt = extensionFor(CORNER_FRAME.floorLevel);
  const roofExt = extensionFor(CORNER_FRAME.roofLevel);

  const W = BUILDING.width;
  const D = BUILDING.depth;
  const { depth, armX, armZ } = roofExt;
  const front = CORNER_FRAME.from === 'frontEast';
  const base = roofDatum(CORNER_FRAME.floorLevel);
  const top = roofDatum(CORNER_FRAME.roofLevel);
  const ov = top.overhang;
  const slabT = BUILDING.slabT;
  const lipH = 0.45;

  // Same two rectangles building.js lays the extension slabs on, so the box
  // plan and the eaves above and below it are the same L, not just similar.
  const frontArm = {
    x0: W - armX, x1: W + ov + depth,
    z0: front ? D + ov : -ov - depth,
    z1: front ? D + ov + depth : -ov,
  };
  const sideArm = {
    x0: W + ov, x1: W + ov + depth,
    z0: front ? D + ov - armZ : -ov,
    z1: front ? D + ov : -ov + armZ,
  };

  return {
    front, depth, ov, baseY: base.y,
    // Fills the storey between the slabs, stopping below the roof fascia lip.
    height: top.y - slabT - lipH - base.y,
    frontArm, sideArm, floorExt, roofExt,
  };
}

// The box: solid walls on the two outer faces of each arm, a timber soffit and
// the band that caps it under the roof extension.
function buildBox(parent, fp, styleKey, mats) {
  const { baseY, height, frontArm: fa, sideArm: sa } = fp;
  const topY = baseY + height;
  const wallT = 0.45;
  const fasciaH = 0.9;
  const yMid = baseY + height / 2;

  // Outer walls: the front face of the front arm and the east face of the side
  // arm are what the box shows to the street and the side.
  const outerZ = fp.front ? fa.z0 : fa.z1;
  box(parent, fa.x1 - fa.x0, height, wallT,
    (fa.x0 + fa.x1) / 2, yMid, outerZ + (fp.front ? wallT / 2 : -wallT / 2), mats.cladding);
  box(parent, wallT, height, sa.z1 - sa.z0,
    sa.x1 - wallT / 2, yMid, (sa.z0 + sa.z1) / 2, mats.cladding);

  // Return walls closing the L at the free end of each arm.
  box(parent, wallT, height, fa.z1 - fa.z0,
    fa.x0 + wallT / 2, yMid, (fa.z0 + fa.z1) / 2, mats.cladding);
  const endZ = fp.front ? sa.z0 : sa.z1;
  box(parent, sa.x1 - sa.x0, height, wallT,
    (sa.x0 + sa.x1) / 2, yMid, endZ + (fp.front ? wallT / 2 : -wallT / 2), mats.cladding);

  // Fascia band under the roof extension, reading as the top of the box.
  box(parent, fa.x1 - fa.x0, fasciaH, fa.z1 - fa.z0,
    (fa.x0 + fa.x1) / 2, topY - fasciaH / 2, (fa.z0 + fa.z1) / 2, mats.claddingDark);
  box(parent, sa.x1 - sa.x0, fasciaH, sa.z1 - sa.z0,
    (sa.x0 + sa.x1) / 2, topY - fasciaH / 2, (sa.z0 + sa.z1) / 2, mats.claddingDark);

  // Timber soffit lining the underside of the roof, downlights below it.
  for (const a of [fa, sa]) {
    box(parent, a.x1 - a.x0 - 0.3, 0.12, a.z1 - a.z0 - 0.3,
      (a.x0 + a.x1) / 2, topY - fasciaH - 0.06, (a.z0 + a.z1) / 2, mats.soffit);
  }
  downlights(parent, fp, topY - fasciaH - 0.14, mats);

  if (styleKey === 'wood') {
    windowFrames(parent, fp, baseY, mats);
  } else {
    fins(parent, fp, topY, mats);
    columnBands(parent, fp, baseY, height, mats);
  }
}

// Extruded white box frames standing off the facade, per the first reference.
function windowFrames(parent, fp, baseY, mats) {
  const t = 0.22;
  const proj = 0.44;
  const fa = fp.frontArm;
  const ops = OPENINGS[CORNER_FRAME.roofLevel].front.filter(
    (o) => o.type === 'window' && o.a >= fa.x0 && o.b <= fa.x1,
  );

  for (const o of ops) {
    const w = o.b - o.a;
    const hh = o.head - o.sill;
    const cu = (o.a + o.b) / 2;
    const cy = baseY + (o.sill + o.head) / 2;
    const zc = fp.front ? fa.z0 + proj / 2 : fa.z1 - proj / 2;

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
  const fa = fp.frontArm;
  const x = fa.x0 - finLen / 2 + 0.3;
  for (let i = 0; i < 3; i++) {
    box(parent, finLen, 0.34, fa.z1 - fa.z0, x, top - 1.0 - i * 1.25,
      (fa.z0 + fa.z1) / 2, mats.claddingDark);
  }
}

// White grooved column bands running the box height below the roof.
function columnBands(parent, fp, baseY, height, mats) {
  const y = baseY + height / 2;
  const fa = fp.frontArm;
  const sa = fp.sideArm;
  const zIn = fp.front ? fa.z0 + 0.9 : fa.z1 - 0.9;
  for (const dx of [0.2, 1.9, 3.6]) {
    box(parent, 0.62, height, 0.5, fa.x0 + dx, y, zIn, mats.wall);
  }
  for (const dz of [2.2, 4.4]) {
    box(parent, 0.5, height, 0.62, sa.x1 + 0.35, y, sa.z1 - dz, mats.wall);
  }
}

// Recessed warm downlights in the timber soffit.
function downlights(parent, fp, y, mats) {
  const fa = fp.frontArm;
  const n = Math.max(2, Math.round((fa.x1 - fa.x0) / 3));
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffd9a0, emissive: 0xffb960, emissiveIntensity: 1.5, roughness: 0.4,
  });
  for (let i = 0; i < n; i++) {
    const x = fa.x0 + 1.6 + (i * (fa.x1 - fa.x0 - 2.6)) / Math.max(1, n - 1);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 14), mat);
    m.position.set(x, y, (fa.z0 + fa.z1) / 2);
    parent.add(m);
  }
}

/**
 * Build the corner box. It fills the storey between the floor and roof
 * extensions, so it returns one group per storey it passes through, split at
 * each storey's floor level. main.js parents each into the matching level
 * group, which keeps level isolation working across the two floors.
 */
export function buildCorner(styleKey = CORNER_FRAME.style) {
  const mats = cornerMats(styleKey);
  const fp = footprint();

  const whole = new THREE.Group();
  buildBox(whole, fp, styleKey, mats);
  whole.updateMatrixWorld(true);

  // The box fills exactly one storey: the one under the roof extension.
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
    // Owned by the topmost storey whose floor is at or below the mesh centre.
    const cy = (b.min.y + b.max.y) / 2;
    let owner = spanned[0];
    for (const lv of spanned) if (cy >= lv.base - 0.001) owner = lv;
    whole.remove(mesh);
    levels[owner.id].add(mesh);
  }

  return { levels, footprint: fp, mats, style: styleKey };
}
