import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BUILDING, PLOT, CORNER_FRAME } from './spec.js';
import { buildBuilding, makeMaterials } from './building.js';
import { buildCorner } from './corner.js';
import { buildSite } from './site.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// ---------- Camera rig: perspective for walking, orthographic for elevations ----------
const persp = new THREE.PerspectiveCamera(42, 1, 0.5, 4000);
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, -2000, 4000);
let camera = persp;

const target = new THREE.Vector3(PLOT.frontWidth / 2, 25, BUILDING.depth / 2);

// ---------- Sky ----------
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(1500, 32, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color(0x7ea9cf) },
      mid: { value: new THREE.Color(0xbcd3e4) },
      bottom: { value: new THREE.Color(0xe6ecf0) },
    },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP;
      void main(){
        float h = clamp(normalize(vP).y, -1.0, 1.0);
        vec3 c = h > 0.06 ? mix(mid, top, pow(clamp(h,0.0,1.0), 0.75))
                          : mix(bottom, mid, smoothstep(-0.12, 0.06, h));
        gl_FragColor = vec4(c, 1.0);
      }`,
  }),
);
sky.renderOrder = -1;
sky.frustumCulled = false;
scene.add(sky);

// ---------- Lights ----------
const hemi = new THREE.HemisphereLight(0xdcecff, 0x8b8368, 1.6);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2df, 2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -120, right: 120, top: 120, bottom: -120, near: 1, far: 520 });
sun.shadow.bias = -0.0007;
sun.shadow.normalBias = 0.4;
scene.add(sun, sun.target);
const fill = new THREE.DirectionalLight(0xc9dcef, 0.5);
fill.position.set(-70, 55, -90);
scene.add(fill);

// ---------- Model ----------
const mats = makeMaterials();
const site = buildSite(mats);
const building = buildBuilding(mats);
scene.add(site, building);

// ---------- Corner box ----------
// The box occupies one storey, so it goes in that level's group and level
// isolation hides it with the floor.
let corner = null;

function applyCornerStyle(style) {
  corner?.group.parent?.remove(corner.group);
  corner = buildCorner(style);
  const host = building.userData.floorGroups[CORNER_FRAME.level];
  corner.group.visible = host.visible;
  host.add(corner.group);
}

// ---------- Controls ----------
const controls = new OrbitControls(persp, renderer.domElement);
controls.target.copy(target);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.maxPolarAngle = Math.PI / 2 - 0.015;
controls.minDistance = 16;
controls.maxDistance = 520;
controls.autoRotateSpeed = 0.7;

const W = BUILDING.width;
const D = BUILDING.depth;
const PX = PLOT.frontWidth / 2;

// dir = direction from the building towards the camera (normalised on use).
const VIEWS = {
  front: { dir: [0, 0, -1], ortho: true, label: 'Front elevation' },
  rear: { dir: [0, 0, 1], ortho: true, label: 'Rear elevation' },
  left: { dir: [-1, 0, 0], ortho: true, label: 'West elevation' },
  right: { dir: [1, 0, 0], ortho: true, label: 'East elevation' },
  frontLeft: { dir: [-0.62, 0.4, -0.68], label: 'Front left' },
  frontRight: { dir: [0.62, 0.4, -0.68], label: 'Front right' },
  rearLeft: { dir: [-0.62, 0.4, 0.68], label: 'Rear left' },
  rearRight: { dir: [0.62, 0.4, 0.68], label: 'Rear right' },
  aerial: { dir: [-0.55, 0.78, -0.6], label: 'Aerial' },
  top: { dir: [0.001, 1, 0.001], label: 'Roof plan' },
};

building.updateMatrixWorld(true);
const bbox = new THREE.Box3().setFromObject(building);
const bcenter = bbox.getCenter(new THREE.Vector3());
const bsize = bbox.getSize(new THREE.Vector3());

// Frame fitting.
// The silhouette of a box under an orthographic or perspective projection is
// solved exactly: project the eight corners onto the camera's right/up axes
// and take the extremes. Perspective distance is then found by bisection,
// which is monotonic in distance and therefore cannot oscillate.
const _corners = (() => {
  const out = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) out.push([sx, sy, sz]);
  return out;
})();

function basis(dir) {
  const forward = dir.clone().negate();
  const up = new THREE.Vector3(0, 1, 0);
  if (Math.abs(forward.y) > 0.98) up.set(0, 0, -1);
  const right = new THREE.Vector3().crossVectors(forward, up).normalize();
  up.crossVectors(right, forward).normalize();
  return { forward, right, up };
}

function fitFor(dirRaw) {
  const dir = new THREE.Vector3(...dirRaw).normalize();
  const { right, up } = basis(dir);
  const aspect = window.innerWidth / window.innerHeight;
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(persp.fov / 2));
  const margin = 1.1;

  const v = new THREE.Vector3();
  const pts = _corners.map(([sx, sy, sz]) => {
    v.set(
      bcenter.x + (sx * bsize.x) / 2,
      bcenter.y + (sy * bsize.y) / 2,
      bcenter.z + (sz * bsize.z) / 2,
    ).sub(bcenter);
    return { a: v.dot(right), b: v.dot(up), c: v.dot(dir) };
  });

  const halfW = Math.max(...pts.map((p) => Math.abs(p.a))) * margin;
  const halfH = Math.max(...pts.map((p) => Math.abs(p.b))) * margin;

  // For a camera at `lookAt + dir*d`, corner i projects to
  //   x = (a_i - ox) / ((d - c_i) * tanHalf * aspect)
  //   y = (b_i - oy) / ((d - c_i) * tanHalf)
  // so the feasible offsets for a given d are intervals; fitting is possible
  // exactly when those intervals are non-empty. Bisect on d for that.
  const bounds = (d) => {
    let axLo = -Infinity; let axHi = Infinity;
    let ayLo = -Infinity; let ayHi = Infinity;
    for (const p of pts) {
      const z = d - p.c;
      if (z < 0.5) return null;
      const wx = z * tanHalf * aspect / margin;
      const wy = z * tanHalf / margin;
      axLo = Math.max(axLo, p.a - wx);
      axHi = Math.min(axHi, p.a + wx);
      ayLo = Math.max(ayLo, p.b - wy);
      ayHi = Math.min(ayHi, p.b + wy);
    }
    if (axLo > axHi || ayLo > ayHi) return null;
    return { ox: (axLo + axHi) / 2, oy: (ayLo + ayHi) / 2 };
  };

  let lo = 1;
  let hi = bsize.length() * 20;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (bounds(mid)) hi = mid; else lo = mid;
  }
  const distance = hi;
  const off = bounds(distance) || { ox: 0, oy: 0 };
  const lookAt = bcenter.clone().addScaledVector(right, off.ox).addScaledVector(up, off.oy);
  return { dir, distance, halfW, halfH, lookAt };
}

let anim = null;
let activeView = 'frontLeft';

function frameOrtho(view) {
  const f = fitFor(VIEWS[view].dir);
  const aspect = window.innerWidth / window.innerHeight;
  const hh = Math.max(f.halfH, f.halfW / aspect);
  const hw = hh * aspect;
  ortho.left = -hw;
  ortho.right = hw;
  ortho.top = hh;
  ortho.bottom = -hh;
  ortho.updateProjectionMatrix();
  return f.lookAt;
}

function flyTo(name, duration = 950) {
  const v = VIEWS[name];
  if (!v) return;
  activeView = name;
  const f = fitFor(v.dir);

  if (v.ortho) {
    const t = frameOrtho(name);
    const to = f.lookAt.clone().addScaledVector(f.dir, Math.max(f.distance, 340));
    anim = { t0: performance.now(), dur: duration, ortho: true,
      from: (camera === ortho ? ortho.position : persp.position).clone(), to,
      tFrom: controls.target.clone(), tTo: t };
    if (camera !== ortho) {
      camera = ortho;
      controls.object = ortho;
    }
  } else {
    const to = f.lookAt.clone().addScaledVector(f.dir, f.distance);
    anim = { t0: performance.now(), dur: duration, ortho: false,
      from: (camera === ortho ? ortho.position : persp.position).clone(), to,
      tFrom: controls.target.clone(), tTo: f.lookAt.clone() };
    if (camera !== persp) {
      camera = persp;
      controls.object = persp;
    }
  }
  document.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
  const lbl = document.getElementById('viewLabel');
  if (lbl) lbl.textContent = v.label;
}

// initial camera
{
  const f0 = fitFor(VIEWS.frontLeft.dir);
  persp.position.copy(f0.lookAt).addScaledVector(f0.dir, f0.distance);
  controls.target.copy(f0.lookAt);
}
controls.update();
activeView = 'frontLeft';

// ---------- Sun ----------
const sunState = { azimuth: 138, elevation: 48 };
function applySun() {
  const az = THREE.MathUtils.degToRad(sunState.azimuth);
  const el = THREE.MathUtils.degToRad(sunState.elevation);
  const r = 260;
  sun.position.set(PX + r * Math.cos(el) * Math.sin(az), r * Math.sin(el), D / 2 + r * Math.cos(el) * Math.cos(az));
  sun.target.position.set(PX, 20, D / 2);
  sun.target.updateMatrixWorld();
  sun.color.copy(new THREE.Color(0xfff2dd)).lerp(new THREE.Color(0xffd2a0), THREE.MathUtils.clamp(1 - sunState.elevation / 60, 0, 1) * 0.8);
  sun.intensity = 1.5 + 1.4 * Math.sin(el);
  hemi.intensity = 1.0 + 0.8 * Math.sin(el);
}
applySun();

// ---------- Level isolation ----------
const levelButtons = document.querySelectorAll('[data-level]');
function setLevel(id) {
  const groups = building.userData.floorGroups;
  for (const [key, g] of Object.entries(groups)) g.visible = id === 'all' || key === id;
  const roofGroup = building.getObjectByName('roof');
  roofGroup.visible = id === 'all' || id === 'F3';
  levelButtons.forEach((b) => b.classList.toggle('active', b.dataset.level === id));
  const lv = BUILDING.floors.find((f) => f.id === id);
  document.getElementById('levelInfo').innerHTML = lv
    ? `<strong>${lv.name}</strong><span>${lv.rooms}</span><span>${lv.area.toLocaleString()} sq ft · floor level ${lv.base.toFixed(1)} ft</span>`
    : `<strong>Full building</strong><span>Ground + 3 floors · ${BUILDING.floors.reduce((s, f) => s + f.area, 0).toLocaleString()} sq ft built-up</span><span>Ridge height ≈ ${(BUILDING.roofBase + BUILDING.parapet + 0.9).toFixed(0)} ft above plinth</span>`;
}
setLevel('all');

// ---------- UI ----------
document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => flyTo(b.dataset.view)));
levelButtons.forEach((b) => b.addEventListener('click', () => setLevel(b.dataset.level)));

const cornerButtons = document.querySelectorAll('[data-corner]');
cornerButtons.forEach((b) => b.addEventListener('click', () => {
  const style = b.dataset.corner;
  cornerButtons.forEach((o) => o.classList.toggle('active', o === b));
  if (style === 'none') {
    if (corner) corner.group.visible = false;
  } else {
    applyCornerStyle(style);
    setLevel(document.querySelector('[data-level].active').dataset.level);
  }
}));
applyCornerStyle(CORNER_FRAME.style);
setLevel('all');

const azEl = document.getElementById('sunAz');
const elEl = document.getElementById('sunEl');
const syncSun = () => {
  document.getElementById('sunAzVal').textContent = `${sunState.azimuth}°`;
  document.getElementById('sunElVal').textContent = `${sunState.elevation}°`;
};
azEl.addEventListener('input', () => { sunState.azimuth = +azEl.value; applySun(); syncSun(); });
elEl.addEventListener('input', () => { sunState.elevation = +elEl.value; applySun(); syncSun(); });
azEl.value = sunState.azimuth; elEl.value = sunState.elevation; syncSun();

document.getElementById('btnShadows').addEventListener('click', (e) => {
  renderer.shadowMap.enabled = !renderer.shadowMap.enabled;
  scene.traverse((o) => { if (o.isMesh && o.material) o.material.needsUpdate = true; });
  e.currentTarget.classList.toggle('active', renderer.shadowMap.enabled);
});

document.getElementById('btnAutoRotate').addEventListener('click', (e) => {
  controls.autoRotate = !controls.autoRotate;
  e.currentTarget.classList.toggle('active', controls.autoRotate);
});

document.getElementById('btnReset').addEventListener('click', () => flyTo('frontLeft'));
document.getElementById('btnPanels').addEventListener('click', (e) => {
  document.body.classList.toggle('hide-ui');
  e.currentTarget.classList.toggle('active', document.body.classList.contains('hide-ui'));
});

document.getElementById('btnScreenshot').addEventListener('click', () => {
  renderer.render(scene, camera);
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = `rajib-bisoi-${activeView}.png`;
  a.click();
});

document.getElementById('btnGlb').addEventListener('click', () => {
  const exporter = new GLTFExporter();
  const root = new THREE.Group();
  root.add(building.clone(true));
  exporter.parse(root, (buf) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([buf], { type: 'model/gltf-binary' }));
    a.download = 'rajib-bisoi-building.glb';
    a.click();
  }, (err) => console.error(err), { binary: true });
});

// Walk-around: orbit the camera continuously so every facade can be reviewed.
const turntable = { on: false, angle: 0, radius: 0, height: 0 };
function startTurntable() {
  const f = fitFor([0, 0.18, -1]);
  turntable.on = true;
  turntable.radius = f.distance;
  turntable.height = bcenter.y + bsize.y * 0.18;
  turntable.angle = Math.atan2(camera.position.x - bcenter.x, camera.position.z - bcenter.z);
  if (camera !== persp) {
    persp.position.copy(camera.position);
    camera = persp;
    controls.object = persp;
  }
  controls.enabled = false;
  controls.target.copy(bcenter);
}
function stopTurntable() {
  turntable.on = false;
  controls.enabled = true;
  controls.target.copy(bcenter);
}

document.getElementById('btnTurntable').addEventListener('click', (e) => {
  const btn = e.currentTarget;
  if (turntable.on) {
    stopTurntable();
    btn.classList.remove('active');
  } else {
    startTurntable();
    btn.classList.add('active');
  }
});

window.addEventListener('keydown', (e) => {
  const map = { 1: 'front', 2: 'rear', 3: 'left', 4: 'right', 5: 'aerial', 6: 'top', 7: 'frontLeft', 8: 'rearLeft' };
  if (map[e.key]) flyTo(map[e.key]);
  if (e.key.toLowerCase() === 'a') document.getElementById('btnAutoRotate').click();
  if (e.key.toLowerCase() === 'r') flyTo('frontLeft');
  if (e.key.toLowerCase() === 'h') document.getElementById('btnPanels').click();
});

// ---------- Resize / loop ----------
function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  persp.aspect = w / h;
  persp.updateProjectionMatrix();
  if (activeView && VIEWS[activeView] && VIEWS[activeView].ortho) frameOrtho(activeView);
  renderer.setSize(w, h, false);
}
window.addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();
function tick() {
  const dt = Math.min(clock.getDelta(), 0.1);
  if (anim) {
    const k = Math.min(1, (performance.now() - anim.t0) / anim.dur);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const cam = anim.ortho ? ortho : persp;
    cam.position.lerpVectors(anim.from, anim.to, e);
    controls.target.lerpVectors(anim.tFrom, anim.tTo, e);
    if (k >= 1) anim = null;
  }
  if (turntable.on) {
    turntable.angle += dt * 0.42;
    persp.position.set(
      bcenter.x + Math.sin(turntable.angle) * turntable.radius,
      turntable.height,
      bcenter.z + Math.cos(turntable.angle) * turntable.radius,
    );
    persp.lookAt(bcenter);
  } else {
    controls.update();
  }
  sky.position.copy(camera.position);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

window.__viewer = { scene, persp, ortho, renderer, controls, building, site, flyTo, setLevel, applyCornerStyle, get corner() { return corner; }, get camera() { return camera; } };
