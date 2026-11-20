import * as THREE from 'three';
import { PLOT } from './spec.js';

// Trapezoid plot: 33'-0" front, 35'-0" rear, 100'-0" deep.
// Expressed in the building's own coordinates so the front edge runs 0..33.
function plotShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(PLOT.frontWidth, 0);
  s.lineTo(PLOT.frontWidth + (PLOT.rearWidth - PLOT.frontWidth) / 2, PLOT.depth);
  s.lineTo(-(PLOT.rearWidth - PLOT.frontWidth) / 2, PLOT.depth);
  s.closePath();
  return s;
}

export function buildSite(mats) {
  const site = new THREE.Group();
  site.name = 'site';

  const halfFront = PLOT.frontWidth / 2;
  const halfRear = PLOT.rearWidth / 2;

  // ---------- Ground / lawn ----------
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(700, 700),
    new THREE.MeshStandardMaterial({ color: 0x7d8a5f, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(PLOT.frontWidth / 2, -0.02, PLOT.depth / 2);
  ground.receiveShadow = true;
  site.add(ground);

  // ---------- Plot paving ----------
  const plotGeo = new THREE.ExtrudeGeometry(plotShape(), { depth: 0.2, bevelEnabled: false });
  plotGeo.rotateX(Math.PI / 2);
  const plotMesh = new THREE.Mesh(plotGeo, new THREE.MeshStandardMaterial({ color: 0xbfb6a5, roughness: 0.95 }));
  plotMesh.position.set(0, 0.2, 0);
  plotMesh.receiveShadow = true;
  site.add(plotMesh);

  // ---------- Driveway: 10'-0" wide strip from the street to the gate ----------
  // The street is at +Z, so the driveway runs up the west side to the front.
  const dw = PLOT.drivewayWidth;
  const drive = new THREE.Mesh(
    new THREE.PlaneGeometry(dw, PLOT.depth - 4),
    new THREE.MeshStandardMaterial({ color: 0x9d978c, roughness: 1 }),
  );
  drive.rotation.x = -Math.PI / 2;
  drive.position.set(dw / 2, 0.22, PLOT.depth / 2);
  drive.receiveShadow = true;
  site.add(drive);

  // ---------- Boundary wall ----------
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xd8d0c1, roughness: 0.9 });
  const capMat = new THREE.MeshStandardMaterial({ color: 0xb0a798, roughness: 0.8 });
  const wh = PLOT.wallHeight;
  const wt = 0.7;
  const addWall = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const ang = Math.atan2(z1 - z0, x1 - x0);
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, wh, wt), wallMat);
    m.position.set((x0 + x1) / 2, wh / 2, (z0 + z1) / 2);
    m.rotation.y = -ang;
    m.castShadow = true; m.receiveShadow = true;
    site.add(m);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(len, 0.18, wt + 0.3), capMat);
    cap.position.set((x0 + x1) / 2, wh + 0.09, (z0 + z1) / 2);
    cap.rotation.y = -ang;
    cap.castShadow = true;
    site.add(cap);
  };
  const F = PLOT.depth;
  addWall(0, F, dw + 1.5, F); // front, west of gate
  addWall(PLOT.frontWidth - 4.5, F, PLOT.frontWidth, F); // front, east of gate
  addWall(0, F, -(halfRear - halfFront), 0); // west
  addWall(PLOT.frontWidth, F, PLOT.frontWidth + (halfRear - halfFront), 0); // east
  addWall(-(halfRear - halfFront), 0, PLOT.frontWidth + (halfRear - halfFront), 0); // rear

  // gate piers
  for (const gx of [dw + 1.5, PLOT.frontWidth - 4.5]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.4, wh + 1.4, 1.4), wallMat);
    p.position.set(gx, (wh + 1.4) / 2, 0);
    p.castShadow = true; p.receiveShadow = true;
    site.add(p);
  }
  // gate leaves
  const gateMat = new THREE.MeshStandardMaterial({ color: 0x50565c, roughness: 0.4, metalness: 0.7 });
  for (const side of [-1, 1]) {
    const gw = 2.0;
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(gw, wh - 0.4, 0.12), gateMat);
    leaf.position.set(dw + 1.5 + 0.9 + gw / 2 + (side > 0 ? gw : 0), (wh - 0.4) / 2, 0);
    site.add(leaf);
  }

  // ---------- Rear garden ----------
  const garden = new THREE.Mesh(
    new THREE.PlaneGeometry(halfRear * 1.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x6d7d4c, roughness: 1 }),
  );
  garden.rotation.x = -Math.PI / 2;
  garden.position.set(PLOT.frontWidth / 2, 0.24, PLOT.depth - 5);
  garden.receiveShadow = true;
  site.add(garden);

  // ---------- Road in front ----------
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(320, 24),
    new THREE.MeshStandardMaterial({ color: 0x565a5e, roughness: 1 }),
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(PLOT.frontWidth / 2, 0.02, -13);
  road.receiveShadow = true;
  site.add(road);
  const kerb = new THREE.Mesh(
    new THREE.BoxGeometry(320, 0.45, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xbdb6a9, roughness: 0.9 }),
  );
  kerb.position.set(PLOT.frontWidth / 2, 0.22, -1.4);
  kerb.receiveShadow = true;
  site.add(kerb);

  site.userData.centerX = PLOT.frontWidth / 2;
  return site;
}
