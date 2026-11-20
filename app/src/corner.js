import * as THREE from 'three';
import { BUILDING, OPENINGS, CORNER_FRAME, CORNER_STYLES } from './spec.js';

// The frame wraps the front-west corner. On the south face the outermost edge
// is the 4'-0" front balcony, not the wall; on the west face it is the wall.
const BALCONY_OUT = 4.0;
// Existing floor slabs project 0.25 past the wall face. Stop just outside so
// no face is coplanar with them.
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

// Plan footprint of the L, in building-local feet.
function footprint() {
  const { armX, armZ, depth } = CORNER_FRAME;
  const fz0 = -BALCONY_OUT - depth;
  const fz1 = -BALCONY_OUT;
  const wx0 = -depth;
  const wx1 = -0.25 - SLAB_GAP;
  return {
    fz0, fz1, wx0, wx1, depth,
    front: { x0: wx0, x1: armX, z0: fz0, z1: fz1 },
    west: { x0: wx0, x1: wx1, z0: fz1, z1: armZ },
  };
}

function slabBand(parent, b, y0, h, mat) {
  box(parent, b.x1 - b.x0, h, b.z1 - b.z0,
    (b.x0 + b.x1) / 2, y0 + h / 2, (b.z0 + b.z1) / 2, mat);
}

// One floor of the frame: the L band at the slab above, then the full-height
// verticals that carry it. `base` is the top of this floor's slab and `top`
// the top of the floor above, so the verticals run the clear storey height.
function frameFloor(parent, fp, base, top, styleKey, mats) {
  const { depth, armX, armZ } = CORNER_FRAME;
  const bandT = BUILDING.slabT;
  const pierW = 0.55;

  const bandY = top - bandT;
  slabBand(parent, fp.front, bandY, bandT, mats.cladding);
  slabBand(parent, fp.west, bandY, bandT, mats.cladding);

  // Fascia under the two outer edges.
  const fasciaH = 0.75;
  box(parent, fp.front.x1 - fp.front.x0, fasciaH, 0.3,
    (fp.front.x0 + fp.front.x1) / 2, bandY - fasciaH / 2, fp.fz0 + 0.15, mats.claddingDark);
  box(parent, 0.3, fasciaH, fp.west.z1 - fp.west.z0,
    fp.wx0 + 0.15, bandY - fasciaH / 2, (fp.west.z0 + fp.west.z1) / 2, mats.claddingDark);

  // Verticals: the outer corner plus the free end of each arm, full height.
  const vh = bandY - fasciaH - base;
  const vy = base + vh / 2;
  const pier = (x, z, w, d) => box(parent, w, vh, d, x, vy, z, mats.claddingDark);
  pier(fp.wx0 + depth / 2, fp.fz0 + depth / 2, depth, depth);
  pier(fp.front.x1 - pierW / 2, fp.fz0 + depth / 2, pierW, depth);
  pier(fp.wx0 + depth / 2, fp.west.z1 - pierW / 2, depth, pierW);

  // Timber soffit under the band, set back from the fascia.
  box(parent, fp.front.x1 - fp.front.x0 - 0.6, 0.14, fp.fz1 - fp.fz0 - 0.3,
    (fp.front.x0 + fp.front.x1) / 2, bandY - fasciaH - 0.07, (fp.fz0 + fp.fz1) / 2, mats.soffit);
  box(parent, fp.wx1 - fp.wx0 - 0.3, 0.14, fp.west.z1 - fp.west.z0 - 0.6,
    (fp.wx0 + fp.wx1) / 2, bandY - fasciaH - 0.07, (fp.west.z0 + fp.west.z1) / 2, mats.soffit);

  if (styleKey === 'wood') {
    // The topmost framed floor is capped by the roof trough, so skip here.
    if (top < BUILDING.roofBase) planters(parent, fp, top, mats);
    windowFrames(parent, armX, base, mats);
  } else {
    fins(parent, fp, top, mats);
    columnBands(parent, armX, armZ, base, vh, mats);
  }

  // Recessed warm downlights in the timber soffit.
  const n = Math.max(2, Math.round(armX / 3));
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xffd9a0, emissive: 0xffb960, emissiveIntensity: 1.5, roughness: 0.4,
  });
  for (let i = 0; i < n; i++) {
    const x = 1.6 + (i * (armX - 2.6)) / Math.max(1, n - 1);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 14), lightMat);
    m.position.set(x, bandY - fasciaH - 0.15, (fp.fz0 + fp.fz1) / 2);
    parent.add(m);
  }
}

// Linear planting troughs along the outer edges, as in the first reference.
function planters(parent, fp, top, mats) {
  const { planterDepth: pd, planterHeight: ph } = CORNER_FRAME;
  const y = top + ph / 2;

  box(parent, fp.front.x1 - fp.front.x0, ph, pd,
    (fp.front.x0 + fp.front.x1) / 2, y, fp.fz0 + pd / 2, mats.planter);
  box(parent, pd, ph, fp.west.z1 - fp.west.z0,
    fp.wx0 + pd / 2, y, (fp.west.z0 + fp.west.z1) / 2, mats.planter);

  const shrub = (x, z) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 7), mats.foliage);
    m.scale.y = 0.75;
    m.position.set(x, top + ph + 0.16, z);
    m.castShadow = true;
    parent.add(m);
  };
  const nx = Math.max(3, Math.round((fp.front.x1 - fp.front.x0) / 2.2));
  for (let i = 0; i < nx; i++) {
    shrub(fp.front.x0 + 0.9 + (i * (fp.front.x1 - fp.front.x0 - 1.8)) / (nx - 1), fp.fz0 + pd / 2);
  }
  const nz = Math.max(3, Math.round((fp.west.z1 - fp.west.z0) / 2.2));
  for (let i = 0; i < nz; i++) {
    shrub(fp.wx0 + pd / 2, fp.west.z0 + 0.9 + (i * (fp.west.z1 - fp.west.z0 - 1.8)) / (nz - 1));
  }
}

// Extruded white box frames standing off the facade, per the first reference.
function windowFrames(parent, armX, base, mats) {
  const ops = OPENINGS.F2.front.filter((o) => o.b <= armX && o.type === 'window');
  const t = 0.22;
  const proj = 0.44;
  const zc = -proj / 2;

  for (const o of ops) {
    const w = o.b - o.a;
    const hh = o.head - o.sill;
    const cu = (o.a + o.b) / 2;
    const cy = base + (o.sill + o.head) / 2;

    box(parent, w + 2 * t, t, proj, cu, cy + hh / 2 + t / 2, zc, mats.frame);
    box(parent, w + 2 * t, t, proj, cu, cy - hh / 2 - t / 2, zc, mats.frame);
    box(parent, t, hh, proj, o.a - t / 2, cy, zc, mats.frame);
    box(parent, t, hh, proj, o.b + t / 2, cy, zc, mats.frame);
  }
}

// Three horizontal charcoal fins off the east end of the box, per the second
// reference.
function fins(parent, fp, top, mats) {
  const { depth } = CORNER_FRAME;
  const finLen = 3.4;
  const x = fp.front.x1 + finLen / 2 - 0.3;
  for (let i = 0; i < 3; i++) {
    box(parent, finLen, 0.34, depth, x, top - 1.0 - i * 1.25, (fp.fz0 + fp.fz1) / 2, mats.claddingDark);
  }
}

// White grooved column bands running the storey height below the box.
function columnBands(parent, armX, armZ, base, vh, mats) {
  const y = base + vh / 2;
  for (const x of [armX - 3.6, armX - 1.9, armX - 0.2]) {
    box(parent, 0.62, vh, 0.5, x, y, -0.9, mats.wall);
  }
  for (const z of [armZ - 4.4, armZ - 2.2]) {
    box(parent, 0.5, vh, 0.62, 0.35, y, z, mats.wall);
  }
}

// Cap the frame at the parapet and finish it with a trough and a rail.
function roofCap(fp, mats) {
  const g = new THREE.Group();
  g.name = 'corner-roof';
  const rb = BUILDING.roofBase + 0.7;
  const ph = BUILDING.parapet;

  slabBand(g, fp.front, rb, ph, mats.cladding);
  slabBand(g, fp.west, rb, ph, mats.cladding);

  const { planterDepth: pd, planterHeight } = CORNER_FRAME;
  const y = rb + ph + planterHeight / 2;
  box(g, fp.front.x1 - fp.front.x0, planterHeight, pd,
    (fp.front.x0 + fp.front.x1) / 2, y, fp.fz0 + pd / 2, mats.planter);
  box(g, pd, planterHeight, fp.west.z1 - fp.west.z0,
    fp.wx0 + pd / 2, y, (fp.west.z0 + fp.west.z1) / 2, mats.planter);

  const nx = Math.max(3, Math.round((fp.front.x1 - fp.front.x0) / 1.8));
  for (let i = 0; i < nx; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 7), mats.foliage);
    m.scale.y = 0.9;
    m.position.set(fp.front.x0 + 0.8 + (i * (fp.front.x1 - fp.front.x0 - 1.6)) / (nx - 1),
      rb + ph + planterHeight + 0.18, fp.fz0 + pd / 2);
    g.add(m);
  }
  box(g, fp.front.x1 - fp.front.x0, 0.14, 0.1,
    (fp.front.x0 + fp.front.x1) / 2, rb + ph + planterHeight + 0.85, fp.fz0 + pd + 0.06, mats.rail);
  box(g, 0.1, 0.14, fp.west.z1 - fp.west.z0,
    fp.wx0 + pd + 0.06, rb + ph + planterHeight + 0.85, (fp.west.z0 + fp.west.z1) / 2, mats.rail);

  return g;
}

/**
 * Build the corner frame. Returns one group per level so level isolation can
 * hide each storey with its floor, plus a roof cap group.
 */
export function buildCorner(styleKey = CORNER_FRAME.style) {
  const mats = cornerMats(styleKey);
  const fp = footprint();
  const levels = {};
  const from = BUILDING.floors.findIndex((f) => f.id === CORNER_FRAME.fromLevel);
  const to = BUILDING.floors.findIndex((f) => f.id === CORNER_FRAME.toLevel);

  for (let i = from; i <= to; i++) {
    const level = BUILDING.floors[i];
    const g = new THREE.Group();
    g.name = `corner-${level.id}`;
    g.userData.cornerStyle = styleKey;
    frameFloor(g, fp, level.base, level.base + level.height, styleKey, mats);
    levels[level.id] = g;
  }

  return { levels, roof: roofCap(fp, mats), mats, style: styleKey };
}
