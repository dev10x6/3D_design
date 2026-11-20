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
// eaves slab at the roof of the named level, turning the east corner:
//   from  - corner the extension turns: 'frontEast', 'frontWest', 'rearEast'
//           or 'rearWest'
//   armX  - length along the facade, measured westwards from the east wall
//   armZ  - length along the east wall, measured away from the facade
// `depth` is measured outwards from the roof slab edge, not the wall face,
// so the eave adds to the roof that is already there.
// The front eaves cover only half the facade - the half over the balcony they
// serve - so armX is half the width, not the whole 27'-1".
export const ROOF_EXTENSIONS = [
  { level: 'F2', from: 'frontWest', depth: 2.0, armX: 13.55, armZ: 17.0 },
  { level: 'F3', from: 'frontWest', depth: 2.0, armX: 13.55, armZ: 17.0 },
  { level: 'F3', from: 'rearEast', depth: 2.0, armX: 27.1, armZ: 17.0 },
];

// Fourth-floor concept. This room is not on the drawings - it is a proposed
// future addition, so nothing here is measured; it is derived from the ground
// pillar grid instead, which is the only thing that fixes where it can land.
//
// The room sits on the roof over the third floor, in the rear-west corner, and
// is L-shaped: a deep band over the four pillars, plus an arm cantilevered
// forward from it down the west side. The band is the pillars' own bounding
// rectangle, so the whole loaded part of the room sits over C28, C29, C31 and
// C32 and nothing is carried by slab bending. The arm reaches past them and is
// the cantilever - that is what turns the band into an L.
//
// `armLength` and `armWidth` are free choices, not measurements. `eave` is the
// same 2 ft cantilevered eave the front-west corner uses, turned outward along
// the free edges of the L.
export const FOURTH_FLOOR = {
  id: 'F4',
  name: 'Fourth Floor (concept)',
  base: BUILDING.roofBase + 0.7,
  height: 10.5,
  wallT: 0.6,
  eave: 2.0,
  armLength: 12.0,
  armWidth: 7.0,
  pillars: ['C28', 'C31', 'C32', 'C29'],
};

// Plan of the fourth-floor room, as the two rectangles that make the L, taken
// from the pillar sections rather than from round numbers so that moving a
// pillar moves the room with it.
export function fourthFloorRects() {
  const cols = FOURTH_FLOOR.pillars.map((id) => GROUND_COLUMNS.find((c) => c.id === id));
  const missing = FOURTH_FLOOR.pillars.filter((id, i) => !cols[i]);
  if (missing.length) {
    throw new Error(`FOURTH_FLOOR.pillars: no such column: ${missing.join(', ')}`);
  }

  const x0 = Math.min(...cols.map((c) => c.x - c.w / 2));
  const x1 = Math.max(...cols.map((c) => c.x + c.w / 2));
  const z0 = Math.min(...cols.map((c) => c.z - c.d / 2));
  const z1 = Math.max(...cols.map((c) => c.z + c.d / 2));
  const band = { x0, x1, z0, z1 };

  // The arm starts where the band ends and runs forward, towards the street.
  return {
    band,
    arm: { x0, x1: x0 + FOURTH_FLOOR.armWidth, z0: z1, z1: z1 + FOURTH_FLOOR.armLength },
  };
}


// The two long facades. The front carries the street, the driveway and the
// 27'-1" x 4'-0" balcony, so it sits at +Z.
export const FRONT_Z = BUILDING.depth;
export const REAR_Z = 0;

export const LIFT = { x0: 24.6, x1: 29.9, z0: 41.9, z1: 48.4 };

export const STAIR = { x0: 10.0, x1: 20.6, z0: 39.5, z1: 51.2 };

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
};

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
