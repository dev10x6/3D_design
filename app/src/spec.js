// Building specification reconstructed from
// "Rajib_Bisoi_2D_Builing_Design.pdf" - PROPOSED GROUND / FIRST / TYPICAL
// SECOND & THIRD FLOOR PLAN, CONCEPT-B (REVISED-1), 29-04-2024, 1:100.
//
// All values in FEET, measured off the vector drawing. Origin is the outer
// rear-west corner of the main envelope, so z grows towards the street:
//   +X -> east (right when facing the front elevation from the street)
//   +Z -> south, towards the front / road
//   +Y -> up
// FRONT_Z and REAR_Z name the two long facades; use them rather than a bare 0
// or depth so the sign is never ambiguous.
//
// Measured envelope: 27'-1" wide (27.1) x 90'-1" deep (90.1).
// The plans show rooms across the ground floor, but only the stilt columns and
// the staircase and lift enclosures are actually built; the ground floor is
// modelled as open structure to match.

// Plot 33'-0" front / 35'-0" rear x 100'-0" deep. The drawings dimension the
// setbacks as 3'-0" at each side and 5'-0" front and rear, which leaves a
// 27'-1" x 90'-1" envelope - exactly the building.
export const PLOT = {
  frontWidth: 33,
  rearWidth: 35,
  depth: 100,
  sideSetback: 3,
  frontSetback: 5,
  rearSetback: 5,
  wallHeight: 5.5,
  drivewayWidth: 10,
};

export const BUILDING = {
  offsetX: PLOT.sideSetback,
  offsetZ: PLOT.frontSetback,
  width: 27.1,
  depth: 90.1,
  wallT: 0.75,
  floors: [
    { id: 'GF', name: 'Ground Floor', base: 1.5, height: 11, area: 2004,
      rooms: 'Single room 1 & 2 (12\'-6" x 12\'-0"), A. toilet, C. toilet, staircase 13\'-10" x 9\'-8", lift 4\'-0" x 4\'-10", stilt parking' },
    { id: 'F1', name: 'First Floor', base: 12.5, height: 10.5, area: 2735,
      rooms: 'Bedroom 1 & 2, dining hall, kitchen, drawing hall, single room, 2 toilets, 3 balconies' },
    { id: 'F2', name: 'Second Floor', base: 23.0, height: 10.5, area: 2765,
      rooms: 'Bedroom 1 & 2, dining hall, kitchen, drawing hall, single room, 2 toilets, 3 balconies' },
    { id: 'F3', name: 'Third Floor', base: 33.5, height: 10.5, area: 2765,
      rooms: 'Bedroom 1 & 2, dining hall, kitchen, drawing hall, single room, 2 toilets, 3 balconies' },
  ],
  roofBase: 44.0,
  parapet: 3.5,
  slabT: 0.65,
};

const win = (a, b, sill = 3.0, head = 7.9) => ({ a, b, sill, head, type: 'window' });
const vent = (a, b) => ({ a, b, sill: 4.8, head: 7.6, type: 'vent' });
const door = (a, b, head = 7.7) => ({ a, b, sill: 0, head, type: 'door' });

// a / b are measured along the wall from the building corner.
// Bedrooms open onto the full-width balconies, so the outer bays of the
// front and rear walls are glazed doors rather than windows.
const FRONT_UPPER = [door(2.3, 7.3), win(8.8, 11.3), win(13.8, 16.3), door(18.8, 23.8)];
const REAR_UPPER = [door(2.0, 7.0), win(8.8, 11.3), win(13.8, 16.3), door(18.8, 23.8)];
const WEST_UPPER = [
  win(4.4, 9.4), vent(14.5, 16.5), vent(19.5, 21.5), win(24.4, 29.4),
  vent(30.6, 33.1), vent(34.5, 36.5), win(38.0, 42.0), win(48.1, 52.1),
  vent(53.5, 55.5), vent(57.0, 59.5), win(60.7, 65.7), vent(68.6, 70.6),
  vent(73.6, 75.6), win(80.7, 85.7),
];
const EAST_UPPER = [
  win(4.4, 9.4), win(15.5, 20.5), win(25.6, 30.6),
  win(59.5, 64.5), win(69.6, 74.6), win(80.7, 85.7),
];

export const OPENINGS = {
  F1: { front: FRONT_UPPER, rear: REAR_UPPER, west: WEST_UPPER, east: EAST_UPPER },
  F2: { front: FRONT_UPPER, rear: REAR_UPPER, west: WEST_UPPER, east: EAST_UPPER },
  F3: { front: FRONT_UPPER, rear: REAR_UPPER, west: WEST_UPPER, east: EAST_UPPER },
};

// Balconies, sized from the labels on the plans:
//   BALCONY 27'-1" x 4'-0"   front
//   10'-10" x 3'-0"          west
// The 6'-7" x 8'-2" balcony the plans show east of the building beside the
// lift is not built: the east face runs straight up past the lift pillars
// C16 and C19 with no balcony on it.
export const BALCONIES = {
  F1: [
    { id: 'front', x0: 0, x1: 27.1, z0: 90.1, z1: 94.1, sides: ['front', 'west', 'east'] },
    { id: 'west', x0: -3.0, x1: 0, z0: 52.3, z1: 63.1, sides: ['west', 'front', 'rear'] },
    { id: 'rear', x0: 0, x1: 27.1, z0: -4.0, z1: 0, sides: ['rear', 'west', 'east'] },
  ],
  F2: [
    { id: 'front', x0: 0, x1: 27.1, z0: 90.1, z1: 94.1, sides: ['front', 'west', 'east'] },
    { id: 'west', x0: -3.0, x1: 0, z0: 52.3, z1: 63.1, sides: ['west', 'front', 'rear'] },
    { id: 'rear', x0: 0, x1: 27.1, z0: -4.0, z1: 0, sides: ['rear', 'west', 'east'] },
  ],
  F3: [
    { id: 'front', x0: 0, x1: 27.1, z0: 90.1, z1: 94.1, sides: ['front', 'west', 'east'] },
    { id: 'west', x0: -3.0, x1: 0, z0: 52.3, z1: 63.1, sides: ['west', 'front', 'rear'] },
    { id: 'rear', x0: 0, x1: 27.1, z0: -4.0, z1: 0, sides: ['rear', 'west', 'east'] },
  ],
};

// Roof extensions (revised design). Each entry adds a 2 ft deep L-shaped
// eaves slab at the roof of the named level, turning one corner:
//   from  - corner the extension turns: 'frontEast', 'frontWest', 'rearEast'
//           or 'rearWest'
//   armX  - length along the facade, measured from that side wall
//   armZ  - length along that side wall, measured away from the facade
// `depth` is measured outwards from the roof slab edge, not the wall face,
// so the eave adds to the roof that is already there.
// The front eaves cover only half the facade - the half over the balcony they
// serve - so armX is half the width, not the whole 27'-1".
export const ROOF_EXTENSIONS = [
  { level: 'F2', from: 'frontWest', depth: 2.0, armX: 13.55, armZ: 17.0 },
  { level: 'F3', from: 'frontWest', depth: 2.0, armX: 13.55, armZ: 17.0 },
  // The rear eave turns the west corner so it sits over C28, C31 and C32, and
  // runs far enough forward down the west wall to carry the fourth-floor arm.
  { level: 'F3', from: 'rearWest', depth: 2.0, armX: 14.0, armZ: 26.0 },
];

// Floor slabs project W + 0.5 and the main roof slab W + 1.2 past the wall
// face. Roof extensions continue outwards from that edge.
const SLAB_OVERHANG = 0.25;
const ROOF_SLAB_OVERHANG = 0.6;

// Depth of the fascia band hanging under an eave's outer edge. Anything built
// beneath an extension has to clear it.
export const EAVE_FASCIA = 0.45;

// The main roof is a slab with a coping course laid on it. building.js builds
// both from these, and the roof frame stands on the deck they make, so the deck
// height has one owner instead of being repeated as magic numbers.
export const ROOF_SLAB_T = 0.7;
export const ROOF_COPING_T = 0.35;

// Top face of the roof deck - what a structure standing on the roof rests on.
export function roofTopFace() {
  return BUILDING.roofBase + ROOF_SLAB_T + ROOF_COPING_T;
}

// The roof over a level: the slab of the floor above, or the main roof slab
// for the top floor. Extensions are placed flush with its top face and start
// at its outer edge, so nothing is coplanar.
export function roofDatum(levelId) {
  const i = BUILDING.floors.findIndex((f) => f.id === levelId);
  const next = BUILDING.floors[i + 1];
  if (next) return { y: next.base, overhang: SLAB_OVERHANG };
  return { y: BUILDING.roofBase + 0.7, overhang: ROOF_SLAB_OVERHANG };
}

/**
 * An L-shaped eaves slab `depth` wide added to the roof of a level, turning one
 * corner. `from` names it: 'frontEast', 'frontWest', 'rearEast' or 'rearWest'.
 * `armX` runs along the facade from the side wall, `armZ` runs along that side
 * wall away from the facade.
 *
 * The two rectangles are returned so the corner box and the fourth floor can be
 * built on exactly the same plan instead of recomputing it.
 */
export function extensionRects(ext) {
  const W = BUILDING.width;
  const D = BUILDING.depth;
  const { depth, armX, armZ } = ext;
  const front = ext.from.startsWith('front');
  const east = ext.from.endsWith('East');
  const { overhang: ov } = roofDatum(ext.level);
  const span = (a, b) => (a < b ? [a, b] : [b, a]);

  // Band along the facade, sitting outside it.
  const [bz0, bz1] = front ? span(D + ov, D + ov + depth) : span(-ov - depth, -ov);
  const [bx0, bx1] = east ? span(W - armX, W + ov + depth) : span(-ov - depth, armX);

  // Arm down the side wall, starting where the band ends.
  const [az0, az1] = front ? span(D + ov - armZ, D + ov) : span(-ov, -ov + armZ);
  const [ax0, ax1] = east ? span(W + ov, W + ov + depth) : span(-ov - depth, -ov);

  return {
    front, east, overhang: ov, depth,
    band: { x0: bx0, x1: bx1, z0: bz0, z1: bz1 },
    arm: { x0: ax0, x1: ax1, z0: az0, z1: az1 },
  };
}

// Fourth-floor concept. This room is not on the drawings - it is a proposed
// future addition, so there is nothing to measure on the plan.
//
// It is built on the third-floor rear eave: the eave is the slab under the
// room's outer edge, and the roof slab behind it is the rest of the floor. So
// the room's outer faces line up with the eave's outer edge and the plan runs
// inwards from there over the roof - an eave on its own is 2 ft deep and could
// not hold a room, but an eave plus the roof behind it can.
//
// `from` and `floorLevel` name the eave, exactly as in ROOF_EXTENSIONS, so the
// room and the eave cannot drift apart. `armWidth` is how far the forward arm
// reaches in from the west edge; `height` and `wallT` are the only other
// invented numbers.
export const FOURTH_FLOOR = {
  id: 'F4',
  name: 'Fourth Floor (concept)',
  from: 'rearWest',
  floorLevel: 'F3',
  height: 10.5,
  wallT: 0.6,
  // Kept under 6.6 ft so the forward arm clears the water tank standing at
  // x=6.5 on the roof; the tank's 2.2 ft radius reaches x=4.3.
  armWidth: 6.5,
  pillars: ['C28', 'C31', 'C32'],
};

// Plan of the fourth-floor room, as the two rectangles that make the L.
//
// The outer corner is the eave's outer corner, so the walls stand on the eave.
// The far ends are the pillars, so the room cannot grow past what carries it.
// The arm runs forward to the end of the eave's own arm.
export function fourthFloorRects() {
  const ext = ROOF_EXTENSIONS.find(
    (e) => e.level === FOURTH_FLOOR.floorLevel && e.from === FOURTH_FLOOR.from,
  );
  if (!ext) {
    throw new Error(
      `FOURTH_FLOOR needs a ROOF_EXTENSIONS entry for ${FOURTH_FLOOR.floorLevel}/${FOURTH_FLOOR.from}`,
    );
  }
  const { band: eaveBand, arm: eaveArm } = extensionRects(ext);

  const cols = FOURTH_FLOOR.pillars.map((id) => GROUND_COLUMNS.find((c) => c.id === id));
  const missing = FOURTH_FLOOR.pillars.filter((id, i) => !cols[i]);
  if (missing.length) {
    throw new Error(`FOURTH_FLOOR.pillars: no such column: ${missing.join(', ')}`);
  }

  // Outer corner and forward reach come from the eave; the far edges from the
  // pillars it stands over.
  const x0 = Math.min(eaveBand.x0, eaveBand.x1);
  const z0 = Math.min(eaveBand.z0, eaveBand.z1);
  const x1 = Math.max(...cols.map((c) => c.x + c.w / 2));
  const z1 = Math.max(...cols.map((c) => c.z + c.d / 2));

  return {
    band: { x0, x1, z0, z1 },
    arm: {
      x0, x1: x0 + FOURTH_FLOOR.armWidth,
      z0: z1, z1: Math.max(eaveArm.z0, eaveArm.z1),
    },
    ext,
  };
}


// The two long facades. The front carries the street, the driveway and the
// 27'-1" x 4'-0" balcony, so it sits at +Z.
export const FRONT_Z = BUILDING.depth;
export const REAR_Z = 0;

export const LIFT = { x0: 24.6, x1: 29.9, z0: 41.9, z1: 48.4 };

export const STAIR = { x0: 10.0, x1: 20.6, z0: 39.5, z1: 51.2 };

// The stair enclosure rises out of the main roof as a machine room, and its own
// roof is the highest flat surface on the building. The water tanks stand on it
// rather than on the main roof, so the terrace stays clear.
export const STAIR_ROOM = {
  // Overhang of the machine room past the stair walls, on every side.
  margin: 1.0,
  // Clear height of the machine room above the main roof deck.
  height: 9.0,
  roofT: 0.4,
};

/**
 * The stair machine room: its plan, the level its roof deck is at, and the
 * tanks standing on it.
 *
 * The plan is the stair walls plus the overhang, which is what building.js has
 * always drawn, so the room and the tanks cannot disagree about where the roof
 * is. `roofY` is the top face of the room's roof slab - the surface the tanks
 * stand on.
 */
export function stairRoom() {
  const { margin, height, roofT } = STAIR_ROOM;
  const plan = {
    x0: STAIR.x0 - margin,
    x1: STAIR.x1 + margin,
    z0: STAIR.z0 - margin,
    z1: STAIR.z1 + margin,
  };
  plan.w = plan.x1 - plan.x0;
  plan.d = plan.z1 - plan.z0;
  plan.cx = (plan.x0 + plan.x1) / 2;
  plan.cz = (plan.z0 + plan.z1) / 2;

  const base = roofTopFace();
  const roofY = base + height + roofT;

  return { plan, base, height, roofT, roofY };
}

// Four tanks on the stair roof, in a 2 x 2 grid. `radius` and `height` are the
// barrel; the cap is derived in building.js from the same numbers.
export const STAIR_TANKS = {
  count: 4,
  radius: 2.2,
  height: 4.2,
  // Clear gap between neighbouring barrels, so the grid is not a tight pack.
  gap: 0.9,
};

/**
 * Centres of the tanks on the stair roof, as [x, z] pairs in a 2 x 2 grid
 * centred on that roof. `gap` is the clear space between barrels, so the pitch
 * is two radii plus the gap and the tanks cannot overlap however the size is
 * changed.
 */
export function stairTankPositions() {
  const { count, radius, gap } = STAIR_TANKS;
  if (count % 2 !== 0) throw new Error('STAIR_TANKS.count must be even to form a grid');
  const { plan } = stairRoom();
  const pitch = 2 * radius + gap;
  const cols = count / 2;
  const out = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < 2; j++) {
      out.push([
        plan.cx + (i - (cols - 1) / 2) * pitch,
        plan.cz + (j - 0.5) * pitch,
      ]);
    }
  }
  return out;
}

// The roof parapet. `inset` is how far its centre line stands inside the wall
// line, so the inner face - the usable edge of the deck - is `width / 2` inside
// that. Anything that has to stop at the parapet reads `parapetInner()` rather
// than repeating the arithmetic.
export const ROOF_PARAPET = { width: 0.6, inset: 0.1 };

/** Inner faces of the main roof parapet: the clear rectangle of the deck. */
export function parapetInner() {
  const { width, inset } = ROOF_PARAPET;
  const W = BUILDING.width;
  const D = BUILDING.depth;
  const edge = inset - width / 2;
  return { x0: edge, x1: W - edge, z0: edge, z1: D - edge };
}

// Corner treatment. An L-shaped cantilevered box wraps the front-west corner,
// turning the two perpendicular faces there. The two roof extensions at that
// corner are the box's floor and roof: the F2 one is the slab it stands on, the
// F3 one is the slab it is capped by, and its sides are built between them.
//
// The box reaches out past the eaves to the balcony edge so it encloses that
// balcony rather than stopping at the wall line. `covers` names the balcony it
// takes in, and the box's outer face is set from that balcony's own edge, so
// the two cannot disagree. `lip` is how far the box runs past that edge.
//
//   floorLevel - ROOF_EXTENSIONS level forming the box floor
//   roofLevel  - ROOF_EXTENSIONS level forming the box roof
//   from       - which corner it turns; must match both extensions
//   covers     - id of the balcony the box encloses; sets how far the box
//                projects to the balcony edge
//   lip        - projection past that balcony's outer edge
//
// The box's width is not set here: it is the eave's own run along the facade,
// so the box covers exactly as much of the balcony as the eaves above and
// below it do.
//   style      - which finish to apply: 'wood' or 'darkBox'
export const CORNER_FRAME = {
  floorLevel: 'F2',
  roofLevel: 'F3',
  from: 'frontWest',
  covers: 'front',
  lip: 0.4,
  style: 'wood',
  // One large glazed opening in the box's side wall. The insets are measured
  // from the wall's own ends and from its floor and head, so the opening
  // follows the wall when the eave or the balcony changes. `panes` counts the
  // lights between the mullions, `frame` is the width of the frame bars.
  // `endInset` also keeps the glazing clear of the pier that lands on the
  // pillar, which is as deep as the pillar's section.
  sideWindow: { endInset: 1.6, sill: 0.9, headInset: 1.1, panes: 4, frame: 0.22 },
  // The side wall runs out to this pillar: its street end is carried across to
  // the pillar's footprint, so the wall lands on the pillar instead of stopping
  // short of it.
  sideWallPillar: 'C1',
};

/**
 * Footprint of the pillar the corner box's side wall lands on, read from
 * GROUND_COLUMNS so the wall cannot drift off the pillar it is carried by.
 */
export function cornerWallPillar() {
  const pillar = GROUND_COLUMNS.find((c) => c.id === CORNER_FRAME.sideWallPillar);
  if (!pillar) {
    throw new Error(
      `CORNER_FRAME.sideWallPillar is not a pillar: ${CORNER_FRAME.sideWallPillar}`,
    );
  }
  return {
    pillar,
    x0: pillar.x - pillar.w / 2,
    x1: pillar.x + pillar.w / 2,
    z0: pillar.z - pillar.d / 2,
    z1: pillar.z + pillar.d / 2,
  };
}

// Balcony covers (concept, not on the drawings). Every front and rear balcony
// is roofed the way the corner box is roofed - a solid ceiling band on the
// storey above, closed ends above the parapet - and split in two by a wall
// standing on the middle row pillar. `divides` names that pillar per balcony;
// everything else is read from the balcony and the pillar.
export const BALCONY_COVERS = {
  divides: { front: 'C2', rear: 'C32' },
  lip: 0.4,
  ceilingT: 0.9,
  wallT: 0.45,
  // Height of the parapet the end walls start above, so they close the open
  // band over the parapet instead of clashing with the drawn piers.
  parapetTop: 3.7,
};

/**
 * Footprint of a named ground-floor column, so anything that stands on a pillar
 * reads its section from the survey instead of repeating it.
 */
export function columnFootprint(id) {
  const column = GROUND_COLUMNS.find((c) => c.id === id);
  if (!column) throw new Error(`no such column: ${id}`);
  return {
    column,
    x0: column.x - column.w / 2,
    x1: column.x + column.w / 2,
    z0: column.z - column.d / 2,
    z1: column.z + column.d / 2,
  };
}

/**
 * The x-run the corner box already roofs over a balcony, or null. The balcony
 * covers stop where the box begins so the two never build a ceiling in the same
 * place.
 */
export function cornerCoveredRun(levelId, balconyId) {
  if (levelId !== CORNER_FRAME.roofLevel || balconyId !== CORNER_FRAME.covers) return null;
  const ext = ROOF_EXTENSIONS.find(
    (e) => e.level === CORNER_FRAME.roofLevel && e.from === CORNER_FRAME.from,
  );
  if (!ext) return null;
  const { band } = extensionRects(ext);
  return { x0: Math.min(band.x0, band.x1), x1: Math.max(band.x0, band.x1) };
}

// Finish palettes for the two corner treatments, transcribed from the two
// reference renders.
export const CORNER_STYLES = {
  wood: {
    name: 'Warm wood & planters',
    cladding: 0x9a6a3f,
    claddingDark: 0x7a512f,
    wall: 0x3d3128,
    stone: 0xbdae96,
    soffit: 0x8a5c34,
    planter: 0x4a4136,
    foliage: 0x4f7a3a,
    frame: 0xf2efe8,
    rail: 0x2b2f33,
    glass: 0x1e2a2e,
  },
  darkBox: {
    name: 'Dark monolithic box',
    cladding: 0x3f3228,
    claddingDark: 0x2e241c,
    wall: 0xf4f2ed,
    stone: 0xe8e2d6,
    soffit: 0x372c23,
    planter: 0x4a4136,
    foliage: 0x466b36,
    frame: 0xe9e5dc,
    rail: 0x1e2124,
    glass: 0x203034,
  },
};

// Ground-floor columns, transcribed from the CENTRE LINE PLAN (sheet 05) where
// they are numbered C1-C33: 12 across the front bay, 12 across the rear bay,
// 4 around the staircase, 4 around the lift and 1 standing alone on the west
// edge beside the stair. Numbering starts at the street end of the front bay
// and runs back through the stair and lift cluster to the rear bay, left to
// right within each row - so C1-C3 are the front row nearest the street and
// C31-C33 the rear row. `code` is the directional alias used in discussion -
// FR/BR + row (1-8, counted from the street) + L/C/R; ST = staircase,
// LF = lift, SG = single. Sizes are the column sections measured on the plan.
// The array is kept in C1..C33 order, which is also build order.
export const GROUND_COLUMNS = [
  { id: 'C1', code: 'FR1L', x:   0.42, z:  89.34, w: 0.84, d: 1.50 },
  { id: 'C2', code: 'FR1C', x:  13.01, z:  89.68, w: 1.51, d: 0.84 },
  { id: 'C3', code: 'FR1R', x:  26.69, z:  89.34, w: 0.82, d: 1.50 },
  { id: 'C4', code: 'FR2L', x:   0.42, z:  77.58, w: 0.84, d: 1.50 },
  { id: 'C5', code: 'FR2C', x:  13.01, z:  77.24, w: 1.51, d: 0.82 },
  { id: 'C6', code: 'FR2R', x:  26.69, z:  77.58, w: 0.82, d: 1.50 },
  { id: 'C7', code: 'FR3L', x:   0.42, z:  66.65, w: 0.84, d: 1.50 },
  { id: 'C8', code: 'FR3C', x:  13.01, z:  66.99, w: 1.51, d: 0.84 },
  { id: 'C9', code: 'FR3R', x:  26.34, z:  66.99, w: 1.52, d: 0.84 },
  { id: 'C10', code: 'FR4L', x:   0.42, z:  56.22, w: 0.84, d: 1.50 },
  { id: 'C11', code: 'FR4C', x:  13.01, z:  56.55, w: 1.51, d: 0.84 },
  { id: 'C12', code: 'FR4R', x:  26.70, z:  56.22, w: 0.82, d: 1.50 },
  { id: 'C13', code: 'ST3', x:  10.74, z:  50.29, w: 1.50, d: 0.84 },
  { id: 'C14', code: 'ST4', x:  19.76, z:  50.29, w: 1.50, d: 0.84 },
  { id: 'C15', code: 'LF3', x:  25.09, z:  47.96, w: 1.17, d: 0.84 },
  { id: 'C16', code: 'LF4', x:  29.26, z:  47.96, w: 1.17, d: 0.84 },
  { id: 'C17', code: 'SG1', x:   0.42, z:  45.05, w: 0.84, d: 1.50 },
  { id: 'C18', code: 'LF1', x:  25.09, z:  42.29, w: 1.17, d: 0.84 },
  { id: 'C19', code: 'LF2', x:  29.26, z:  42.29, w: 1.17, d: 0.84 },
  { id: 'C20', code: 'ST1', x:  10.74, z:  39.78, w: 1.50, d: 0.84 },
  { id: 'C21', code: 'ST2', x:  19.76, z:  39.78, w: 1.50, d: 0.84 },
  { id: 'C22', code: 'BR5L', x:   0.42, z:  32.78, w: 0.84, d: 1.50 },
  { id: 'C23', code: 'BR5C', x:  13.01, z:  33.11, w: 1.51, d: 0.84 },
  { id: 'C24', code: 'BR5R', x:  26.69, z:  32.78, w: 0.82, d: 1.50 },
  { id: 'C25', code: 'BR6L', x:   0.42, z:  23.44, w: 0.84, d: 1.50 },
  { id: 'C26', code: 'BR6C', x:  13.01, z:  23.11, w: 1.51, d: 0.84 },
  { id: 'C27', code: 'BR6R', x:  26.35, z:  23.11, w: 1.50, d: 0.84 },
  { id: 'C28', code: 'BR7L', x:   0.42, z:  12.51, w: 0.84, d: 1.50 },
  { id: 'C29', code: 'BR7C', x:  13.01, z:  12.85, w: 1.51, d: 0.84 },
  { id: 'C30', code: 'BR7R', x:  26.69, z:  12.51, w: 0.82, d: 1.50 },
  { id: 'C31', code: 'BR8L', x:   0.42, z:   0.75, w: 0.84, d: 1.50 },
  { id: 'C32', code: 'BR8C', x:  13.01, z:   0.41, w: 1.51, d: 0.84 },
  { id: 'C33', code: 'BR8R', x:  26.35, z:   0.41, w: 1.50, d: 0.84 },
];

// Roof frame (concept). Also not in the drawing set. The front-bay pillars
// C1/C4 on the west wall line and C3/C6 on the east wall line carry on up
// through the roof for 10 ft, each pair is joined by a concrete beam across
// their tops, and the two beams are joined by iron beams spanning between them.
//
// The pairs are named by pillar id and every dimension is read back from
// GROUND_COLUMNS, so the frame stands exactly over the pillars it continues and
// follows any correction to the pillar survey.
export const ROOF_FRAME = {
  pairs: [
    { id: 'west', pillars: ['C1', 'C4'] },
    { id: 'east', pillars: ['C3', 'C6'] },
  ],
  // Clear height of the columns above the roof deck. The beams sit on top of
  // this, so it is the headroom under them, not the overall height.
  columnHeight: 10.0,
  beamDepth: 1.5,
  // Iron beams cross between the two roof beams, evenly spaced along the span.
  tieCount: 5,
  tieW: 0.45,
  tieD: 0.5,
  // Iron rods hang from each end of every iron beam down to the third-floor
  // roof, so the frame is tied back to the building on both sides rather than
  // standing as a free portal. They land on the roof deck below.
  rodR: 0.13,
  rodInset: 0.3,
};

/**
 * Where the frame lands: the two beams (each with the pillars it joins) and the
 * roof deck it stands on. Building coordinates, feet.
 *
 * A beam runs along z between its pair, so it is centred on their mean x, is as
 * wide as the wider of the two sections, and caps both columns from the rear
 * column's outer face to the front column's.
 */
export function roofFrameLayout() {
  const find = (id) => {
    const c = GROUND_COLUMNS.find((col) => col.id === id);
    if (!c) throw new Error(`ROOF_FRAME names a pillar that is not in GROUND_COLUMNS: ${id}`);
    return c;
  };

  const beams = ROOF_FRAME.pairs.map((p) => {
    const cols = p.pillars.map(find);
    return {
      id: p.id,
      cols,
      x: cols.reduce((s, c) => s + c.x, 0) / cols.length,
      width: Math.max(...cols.map((c) => c.w)),
      z0: Math.min(...cols.map((c) => c.z - c.d / 2)),
      z1: Math.max(...cols.map((c) => c.z + c.d / 2)),
    };
  });

  if (beams.length !== 2) {
    throw new Error('ROOF_FRAME.pairs must describe exactly two beams to join');
  }

  // The iron beams are spaced evenly between the two roof beams and inset from
  // both ends, so none of them lands on a column or overhangs a beam end.
  const { tieCount } = ROOF_FRAME;
  if (tieCount < 1) throw new Error('ROOF_FRAME.tieCount must be at least 1');
  const z0 = Math.min(...beams.map((b) => b.z0));
  const z1 = Math.max(...beams.map((b) => b.z1));
  const ties = Array.from({ length: tieCount },
    (_, i) => z0 + ((z1 - z0) * (i + 1)) / (tieCount + 1));

  return {
    beams,
    ties,
    deck: roofTopFace(),
    columnHeight: ROOF_FRAME.columnHeight,
    beamDepth: ROOF_FRAME.beamDepth,
  };
}

// Rooftop garden and greenhouse (concept). The rear-east bay carries it: iron
// pillars on C26, C27, C33, C32 and C29 rise from the roof deck and hold a
// glazed roof, so the planting sits under cover rather than on open terrace.
//
// The five pillars are given by id and read back from GROUND_COLUMNS, so the
// iron posts stand exactly on the concrete pillars and follow any correction to
// the survey. They are all rear-row pillars, so the bay is a plain rectangle
// between the two rear corner pillars and the middle one.
export const ROOF_GARDEN = {
  pillars: ['C26', 'C27', 'C33', 'C32', 'C29'],
  // Clear height of the iron posts above the roof deck. Set to the roof frame's
  // own column height so the two roof structures read as one composition.
  columnHeight: 10.0,
  columnW: 0.5,
  // Depth of the glazed roof's edge beam, hung under the glass.
  beamDepth: 0.7,
  // How far the glazed roof runs past the pillars, so the beds are under cover
  // to the edge rather than open to the rain at the perimeter.
  eaves: 0.8,
  glassT: 0.12,
  // Planting bed along the outer walls, inside the posts.
  bedW: 2.4,
  bedH: 1.3,
  // The fourth-floor room's east wall - the garden starts there, not on the
  // roof edge, because the room occupies the rear-west side of the deck.
  innerX: 13.765,
  // Clearance between a post face and that wall, so the two are not coplanar
  // and cannot z-fight where they meet.
  wallClear: 0.05,
  // How far the beds stop short of the glazed roof edge, so they are reachable.
  bedInset: 0.35,
};

/**
 * Plan of the roof garden: the post positions, the rectangle they enclose, and
 * the glazed roof over it. Building coordinates, feet.
 *
 * The five named pillars are all rear-row, so the bay they enclose is a plain
 * rectangle: C26/C29/C32 down the west side, C27/C33 down the east. The west
 * side is the fourth-floor room's own east wall - the room's plan is set by
 * C32's outer face - so the garden's west line is that wall, and the posts on
 * it stand against the room rather than inside it. They are moved to the wall's
 * outer face as a group, so the west line stays straight.
 */
export function roofGardenLayout() {
  const cols = ROOF_GARDEN.pillars.map((id) => {
    const c = GROUND_COLUMNS.find((col) => col.id === id);
    if (!c) throw new Error(`ROOF_GARDEN names a pillar that is not in GROUND_COLUMNS: ${id}`);
    return c;
  });

  const deck = roofTopFace();
  const { columnHeight, eaves, innerX, columnW, wallClear } = ROOF_GARDEN;
  const wall = innerX + wallClear;

  // Posts sit on the pillar centres, so each is carried by the pillar below it.
  // The west line then moves out to the room's east face, because the room
  // occupies that line; C32's own outer face is what sets it.
  const posts = cols.map((c) => ({ id: c.id, x: c.x, z: c.z }));
  const westX = Math.min(...posts.map((p) => p.x));
  for (const p of posts) {
    if (p.x === westX) p.x = wall + columnW / 2;
  }

  const plan = {
    x0: Math.min(...posts.map((p) => p.x)) - columnW / 2,
    x1: Math.max(...posts.map((p) => p.x)) + columnW / 2,
    z0: Math.min(...posts.map((p) => p.z)) - columnW / 2,
    z1: Math.max(...posts.map((p) => p.z)) + columnW / 2,
  };

  // The glazed roof overhangs the posts, but it cannot run into the parapet or
  // through the room, so it is clipped to the room's face and the clear deck.
  const clear = parapetInner();
  const roof = {
    x0: Math.max(plan.x0 - eaves, wall),
    x1: Math.min(plan.x1 + eaves, clear.x1),
    z0: Math.max(plan.z0 - eaves, clear.z0),
    z1: Math.min(plan.z1 + eaves, clear.z1),
  };

  return {
    posts,
    plan,
    roof,
    deck,
    columnHeight,
    columnW,
    wall,
    top: deck + columnHeight,
    glassT: ROOF_GARDEN.glassT,
  };
}
