/**
 * Hero stage: the Basra grove photograph sits as a lit plane in space,
 * and a procedural date cluster (stylized from the product stills) floats in front.
 * One photo cannot reveal every wrinkle or the far side — the fruit is approximate.
 */
const stage = document.getElementById("heroStage");
const canvas = document.getElementById("heroCanvas");
const fallback = document.getElementById("heroFallback");
const hint = document.getElementById("heroHint");

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function showFallback() {
  if (canvas) canvas.hidden = true;
  if (fallback) fallback.hidden = false;
  if (hint) hint.hidden = true;
}

async function loadThree() {
  try {
    return await import("./vendor/three.module.js");
  } catch (localError) {
    const urls = [
      "https://unpkg.com/three@0.170.0/build/three.module.js",
      "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
    ];
    let last = localError;
    for (const url of urls) {
      try {
        return await import(url);
      } catch (error) {
        last = error;
      }
    }
    throw last;
  }
}

function makeDateGeometry(THREE) {
  const geo = new THREE.SphereGeometry(0.34, 48, 36);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 1) {
    v.fromBufferAttribute(pos, i);
    v.y *= 1.62;
    v.x *= 0.9;
    v.z *= 0.74;
    const n = v.clone().normalize();
    const wrinkle =
      Math.sin(n.y * 28.0 + n.x * 11.0) * Math.cos(n.z * 18.0 + n.y * 7.0) * 0.022;
    const crease = Math.abs(n.x) ** 4 * -0.045;
    const tip = Math.max(0, n.y - 0.72) * 0.04;
    v.addScaledVector(n, wrinkle + crease - tip);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

function boot(THREE) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(0x1a120c, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
  camera.position.set(0.12, 0.22, 5.05);

  const grove = new THREE.Group();
  scene.add(grove);

  const loader = new THREE.TextureLoader();
  const photoUrl = new URL("../images/hero.jpg", import.meta.url).href;
  loader.load(
    photoUrl,
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(8.2, 11, 1, 1),
        new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 1,
          metalness: 0,
        })
      );
      plane.position.set(0, 0.15, -2.4);
      grove.add(plane);
    },
    undefined,
    () => {}
  );

  scene.add(new THREE.AmbientLight(0xfff2e2, 0.55));
  const key = new THREE.DirectionalLight(0xfff0d2, 2.4);
  key.position.set(-2.4, 3.2, 4.2);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xf0b56a, 1.15);
  rim.position.set(3.2, 1.4, 2.2);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0x8fb56a, 0.35);
  fill.position.set(0, -1.2, 3);
  scene.add(fill);

  const fruit = new THREE.Group();
  fruit.position.set(0.02, 0.02, 0.35);
  fruit.scale.setScalar(1.12);
  scene.add(fruit);

  const geo = makeDateGeometry(THREE);
  const tones = [0x6b2c16, 0x7a3418, 0x5c2412, 0x8a3d1c, 0x4e1e10, 0x703018, 0x62301a];
  const spots = [
    [0.0, 0.02, 0.12, 0.15, 0.4],
    [0.38, -0.1, 0.02, -0.4, 1.1],
    [-0.36, -0.04, 0.06, 0.7, -0.5],
    [0.1, 0.32, -0.04, 0.25, 2.0],
    [-0.14, 0.26, 0.1, -0.35, 0.8],
    [0.24, 0.14, -0.14, 1.0, -1.3],
    [-0.06, -0.2, 0.2, 0.5, 0.3],
  ];

  spots.forEach((spot, index) => {
    const material = new THREE.MeshPhysicalMaterial({
      color: tones[index % tones.length],
      roughness: 0.48 + (index % 3) * 0.06,
      metalness: 0.02,
      clearcoat: 0.28,
      clearcoatRoughness: 0.4,
      sheen: 0.45,
      sheenRoughness: 0.42,
      sheenColor: new THREE.Color(0xd4894a),
    });
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(spot[0], spot[1], spot[2]);
    mesh.rotation.set(spot[3], spot[4], spot[3] * 0.4);
    mesh.scale.setScalar(0.92 + (index % 4) * 0.06);
    fruit.add(mesh);
  });

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.04, 0.7, 10),
    new THREE.MeshStandardMaterial({ color: 0x6d8a3a, roughness: 0.7 })
  );
  stem.position.set(-0.02, 0.62, -0.05);
  stem.rotation.z = 0.35;
  fruit.add(stem);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.95, 40),
    new THREE.MeshBasicMaterial({ color: 0x140c08, transparent: true, opacity: 0.38 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0.02, -0.52, 1.2);
  scene.add(shadow);

  let width = 0;
  let height = 0;
  const resize = () => {
    const nextW = stage.clientWidth;
    const nextH = stage.clientHeight;
    if (!nextW || !nextH || (nextW === width && nextH === height)) return;
    width = nextW;
    height = nextH;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  resize();

  let pointerX = 0;
  let dragging = false;
  let lastX = 0;
  let spin = 0.35;
  let userSpin = 0;

  const fine = window.matchMedia("(pointer: fine)").matches;
  if (hint) {
    hint.textContent = fine ? "حرّك المؤشر لتدوير التمور" : "اسحب التمور لتدويرها";
  }

  canvas.addEventListener("pointerdown", (event) => {
    dragging = true;
    lastX = event.clientX;
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener("pointerup", () => {
    dragging = false;
  });
  canvas.addEventListener("pointercancel", () => {
    dragging = false;
  });
  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    if (!dragging) return;
    const dx = event.clientX - lastX;
    lastX = event.clientX;
    userSpin += dx * 0.008;
  });

  let running = true;
  const visibility = new IntersectionObserver(
    (entries) => {
      running = entries.some((entry) => entry.isIntersecting);
    },
    { threshold: 0.05 }
  );
  visibility.observe(stage);

  const clock = new THREE.Clock();
  const frame = () => {
    requestAnimationFrame(frame);
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!reduced && !dragging) spin += dt * 0.18;
    const yaw = spin + userSpin;
    fruit.rotation.y = yaw;
    fruit.rotation.x = reduced ? 0.08 : 0.08 + Math.sin(yaw * 0.5) * 0.03;
    const look = reduced || dragging ? 0 : pointerX * 0.28;
    camera.position.x += (look - camera.position.x) * 0.06;
    camera.lookAt(0, 0.02, 0.4);
    renderer.render(scene, camera);
  };

  stage.classList.add("is-live");
  if (fallback) fallback.hidden = true;
  frame();
}

if (!stage || !canvas) {
  showFallback();
} else if (!window.WebGLRenderingContext) {
  showFallback();
} else {
  loadThree().then(boot).catch(showFallback);
}
