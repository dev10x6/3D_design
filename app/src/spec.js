// Building specification reconstructed from
// "Rajib_Bisoi_2D_Builing_Design.pdf" - PROPOSED GROUND / FIRST / TYPICAL
// SECOND & THIRD FLOOR PLAN, CONCEPT-B (REVISED-1), 29-04-2024, 1:100.
//
// All values in FEET, measured off the vector drawing. Origin is the outer
// front-west corner of the main envelope:
//   +X -> east (right when facing the front elevation)
//   +Z -> north (towards the rear of the building)
//   +Y -> up
//
// Measured envelope: 27'-1" wide (27.1) x 90'-1" deep (90.1).
// Ground floor is enclosed to 56'-6" (56.5); behind that is open stilt
// parking carried on columns, with the upper floors spanning over it.

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
  groundDepth: 56.5,
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
  GF: {
    front: [win(2.3, 7.3), win(18.8, 23.8)],
    rear: [door(2.0, 5.6), door(18.8, 22.4)],
    west: [vent(7.4, 9.4), vent(14.4, 16.4)],
    east: [win(4.4, 9.4)],
  },
  F1: { front: FRONT_UPPER, rear: REAR_UPPER, west: WEST_UPPER, east: EAST_UPPER },
  F2: { front: FRONT_UPPER, rear: REAR_UPPER, west: WEST_UPPER, east: EAST_UPPER },
  F3: { front: FRONT_UPPER, rear: REAR_UPPER, west: WEST_UPPER, east: EAST_UPPER },
};

// Balconies, sized from the labels on the plans:
//   BALCONY 27'-1" x 4'-0"   front
//   10'-10" x 3'-0"          west
//   6'-7" x 8'-2"            east, beside the lift
export const BALCONIES = {
  F1: [
    { id: 'front', x0: 0, x1: 27.1, z0: -4.0, z1: 0, sides: ['front', 'west', 'east'] },
    { id: 'west', x0: -3.0, x1: 0, z0: 27.0, z1: 37.8, sides: ['west', 'front', 'rear'] },
    { id: 'east', x0: 27.1, x1: 33.7, z0: 41.7, z1: 48.2, sides: ['east', 'front', 'rear'] },
    { id: 'rear', x0: 0, x1: 27.1, z0: 90.1, z1: 94.1, sides: ['rear', 'west', 'east'] },
  ],
  F2: [
    { id: 'front', x0: 0, x1: 27.1, z0: -4.0, z1: 0, sides: ['front', 'west', 'east'] },
    { id: 'west', x0: -3.0, x1: 0, z0: 27.0, z1: 37.8, sides: ['west', 'front', 'rear'] },
    { id: 'east', x0: 27.1, x1: 33.7, z0: 41.7, z1: 48.2, sides: ['east', 'front', 'rear'] },
    { id: 'rear', x0: 0, x1: 27.1, z0: 90.1, z1: 94.1, sides: ['rear', 'west', 'east'] },
  ],
  F3: [
    { id: 'front', x0: 0, x1: 27.1, z0: -4.0, z1: 0, sides: ['front', 'west', 'east'] },
    { id: 'west', x0: -3.0, x1: 0, z0: 27.0, z1: 37.8, sides: ['west', 'front', 'rear'] },
    { id: 'rear', x0: 0, x1: 27.1, z0: 90.1, z1: 94.1, sides: ['rear', 'west', 'east'] },
  ],
};

// Roof extensions (revised design). Each entry adds a 2 ft deep L-shaped
// eaves slab at the roof of the named level, turning the east corner:
//   from  - corner the extension starts at: 'frontEast' or 'rearEast'
//   armX  - length along the facade, measured westwards from the east wall
//   armZ  - length along the east wall, measured away from the facade
// `depth` is measured outwards from the roof slab edge, not the wall face,
// so the eave adds to the roof that is already there.
export const ROOF_EXTENSIONS = [
  { level: 'F2', from: 'frontEast', depth: 2.0, armX: 13.5, armZ: 17.0 },
  { level: 'F3', from: 'frontEast', depth: 2.0, armX: 27.1, armZ: 17.0 },
  { level: 'F3', from: 'rearEast', depth: 2.0, armX: 27.1, armZ: 17.0 },
];

export const LIFT = { x0: 24.6, x1: 29.9, z0: 41.7, z1: 48.2 };
export const STAIR = { x0: 10.0, x1: 20.6, z0: 38.9, z1: 50.6 };

// Columns carrying the upper floors over the open stilt-parking bay.
export const STILT_COLUMNS = { xs: [2.0, 13.6, 25.1], zs: [61.0, 72.0, 83.0, 89.6] };
