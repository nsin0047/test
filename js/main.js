import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ---------------------------------------------------------------------
   ASSET DELIVERY
   The model is stored at assets/holder.dat as a decimated GLB that has
   been byte-XORed with a repeating key. It is not a valid glTF file on
   disk or on the wire — it only becomes one after being decoded here,
   in memory, and handed straight to GLTFLoader.parse(). There is no
   endpoint on this site that serves a plain .glb/.stl/.obj.
   This is a deterrent against casual copying, not a cryptographic lock —
   see js/protect.js for the full caveat.
------------------------------------------------------------------------ */
const XOR_KEY = [0x4B, 0x9E, 0x2A, 0x77, 0x1D, 0x63, 0xF0, 0x8C];

function xorDecode(buffer) {
  const bytes = new Uint8Array(buffer);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i] ^ XOR_KEY[i % XOR_KEY.length];
  }
  return out.buffer;
}

/* ---------------------------------------------------------------------
   SCENE SETUP
------------------------------------------------------------------------ */
const canvas = document.getElementById('viewport');
const heroSection = document.getElementById('hero');

const scene = new THREE.Scene();
scene.background = null;
scene.fog = new THREE.Fog(0x0a0b0d, 6, 16);

const camera = new THREE.PerspectiveCamera(
  38,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(2.6, 1.7, 3.2);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

/* Lighting: key + rim + soft fill, tuned for a dark hero */
const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(4, 6, 3);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.camera.near = 1;
key.shadow.camera.far = 15;
scene.add(key);

const rim = new THREE.DirectionalLight(0xcbff4d, 1.1);
rim.position.set(-4, 2, -3);
scene.add(rim);

const fill = new THREE.HemisphereLight(0x2a2f36, 0x0a0b0d, 0.9);
scene.add(fill);

/* Ground: soft shadow catcher */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.ShadowMaterial({ opacity: 0.35 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.receiveShadow = true;
scene.add(ground);

/* Orbit controls — gentle, capped, auto-rotates until user interacts */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.enableZoom = false;
controls.minPolarAngle = Math.PI * 0.28;
controls.maxPolarAngle = Math.PI * 0.52;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.1;
controls.target.set(0, 0.15, 0);

let userInteracted = false;
controls.addEventListener('start', () => {
  userInteracted = true;
  controls.autoRotate = false;
});

/* ---------------------------------------------------------------------
   LOAD MODEL
------------------------------------------------------------------------ */
const loader = new GLTFLoader();
let productGroup = null;

async function loadModel() {
  const res = await fetch('assets/holder.dat', { cache: 'no-store' });
  const encrypted = await res.arrayBuffer();
  const decoded = xorDecode(encrypted);

  loader.parse(decoded, '', (gltf) => {
    const model = gltf.scene;

    // Normalize scale/position: fit into a ~2.2 unit wide stage
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const scale = 2.2 / Math.max(size.x, size.z);
    model.scale.setScalar(scale);

    box.setFromObject(model);
    box.getCenter(center);
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= box.min.y;

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!child.geometry.attributes.normal) {
          child.geometry.computeVertexNormals();
        }
        child.material = new THREE.MeshStandardMaterial({
          color: 0xc9803f,
          roughness: 0.55,
          metalness: 0.08,
        });
      }
    });

    productGroup = new THREE.Group();
    productGroup.add(model);
    productGroup.rotation.y = Math.PI * 0.15;
    scene.add(productGroup);

    animateHUD();
    revealHero();
  }, (err) => {
    console.error('Model failed to load/decode', err);
  });
}
loadModel();

/* ---------------------------------------------------------------------
   HUD telemetry counters — purely cosmetic, plays into the "AI product"
   satire and doubles as a visible reminder the file itself isn't exposed.
------------------------------------------------------------------------ */
function animateHUD() {
  const slotsEl = document.getElementById('hud-slots');
  const chaosEl = document.getElementById('hud-chaos');
  const deskEl = document.getElementById('hud-desk');
  const duration = 1400;
  const start = performance.now();

  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const ease = 1 - Math.pow(1 - t, 3);
    slotsEl.textContent = `${Math.round(ease * 6)} / 6`;
    chaosEl.textContent = `${Math.round(ease * 94)}%`;
    deskEl.textContent = `${Math.round(ease * 412)} cm²`;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function revealHero() {
  document.querySelectorAll('.hero__copy, .hud, .hero__scroll').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(14px)';
    el.style.transition = 'opacity .8s ease, transform .8s ease';
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 120 + i * 90);
  });
}

/* ---------------------------------------------------------------------
   RENDER LOOP
------------------------------------------------------------------------ */
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', onResize);

function tick() {
  controls.update();
  if (productGroup && !userInteracted) {
    productGroup.rotation.y += 0.0009;
  }
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

/* ---------------------------------------------------------------------
   SCROLL REVEALS for non-hero sections
   Content is visible by default in CSS (.reveal) — JS only ever ADDS
   the "is-visible" class on intersection. If JS fails to run, is slow,
   or a screenshot/crawler tool never fires scroll/intersection events,
   the page still shows everything rather than staying hidden.
------------------------------------------------------------------------ */
const revealTargets = document.querySelectorAll(
  '.feature, .stat, .tier-card, .review, .modelcard__block, .intro'
);
revealTargets.forEach((el) => el.classList.add('reveal'));

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  revealTargets.forEach((el) => io.observe(el));

  // Safety net: reveal anything still hidden shortly after load, in case
  // an element never intersects (e.g. it's already in view at load, or
  // a screenshot tool captures without dispatching real scroll events).
  window.addEventListener('load', () => {
    setTimeout(() => {
      revealTargets.forEach((el) => el.classList.add('is-visible'));
    }, 900);
  });
} else {
  revealTargets.forEach((el) => el.classList.add('is-visible'));
}
