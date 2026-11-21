/* Vitam's — scène 3D pilotée par le défilement (Three.js r160)
   Inspirée du design MotionSites « Soda Bottles », adaptée à l'eau minérale Vitam's. ROUGATECH. */
import * as THREE from 'three';

const $ = (s) => document.querySelector(s);
const body = document.body;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- helpers ---------- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const eio = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eoc = (t) => 1 - Math.pow(1 - t, 3);
const eob = (t, s = 1.15 * 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
const hex = (h) => new THREE.Color(h);

/* ---------- formats ---------- */
const FORMATS = [
  { id: '1,5 L', name: '1,5 L · LA FAMILLE', R: .37, H: 2.43 },
  { id: '0,5 L', name: '0,5 L · LE NOMADE', R: .28, H: 1.66 },
];
const N = 16;
const TILT = [.10, -.15, .07, -.09, .14, -.06, .12, -.13, .08, -.11, .15, -.07, .09, -.14, .06, -.10];
const BH = 2.43; // reference height (1,5 L)

const STEPS = [
  { tag: '01 — La source', title: 'LA SOURCE', body: "Extraite des profondeurs du plateau de Goguiezé, dans la région de Tillabéry. Une eau qui vient de loin, jusqu'à votre table." },
  { tag: '02 — Composition', title: 'PURE ET LÉGÈRE', body: 'Eau minérale naturelle. pH 6,63, calcium 3,0 mg/L, magnésium 3,8 mg/L : la composition est affichée sur chaque étiquette.' },
  { tag: '03 — Traçable', title: 'TRAÇABLE', body: 'Filtrée et contrôlée avant la mise en bouteille. Date de fabrication (FAB) et date d\'expiration (EXP) imprimées sur chaque bouteille.' },
];
const ROWS = [
  { h: 'LA SOURCE', d: 'Plateau de Goguiezé, région de Tillabéry' },
  { h: 'PURE ET LÉGÈRE', d: 'pH 6,63 · Calcium 3,0 · Magnésium 3,8 mg/L' },
  { h: 'TRAÇABLE', d: 'FAB et EXP imprimées sur chaque bouteille' },
];
// label canvas layout (px)
const LW = 1024, LH = 476, ROW_Y = [126, 232, 338], ROW_H = 102;

/* ---------- renderer ---------- */
const canvas = $('#gl');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) { fallback(); throw e; }
let dpr = Math.min(devicePixelRatio, 1.5);
renderer.setPixelRatio(dpr);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.autoClear = false;

function fallback() {
  body.classList.add('nogl', 'ready', 'intro-ui');
  $('#track').style.height = '100vh';
  $('#hero').style.visibility = 'visible';
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
camera.position.set(0, 0, 10);
camera.lookAt(0, 0, 0);
const VH = 20 * Math.tan(THREE.MathUtils.degToRad(15));
let W = VH, aspect = 1, k = 1;

/* ---------- environment (light planes → long streaks on PET) ---------- */
{
  const env = new THREE.Scene();
  env.background = hex('#0d2147');
  const plane = (w, h, c, i, p) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: hex(c).multiplyScalar(i), side: THREE.DoubleSide }));
    m.position.set(...p); m.lookAt(0, 0, 0); env.add(m);
  };
  plane(1.0, 16, '#ffffff', 7, [-5.5, 0, 4.2]);
  plane(.55, 16, '#ffffff', 5, [4.8, .5, 3.6]);
  plane(.35, 16, '#f2f8ff', 3.5, [1.4, 0, 6.5]);
  plane(12, 2.5, '#eef6ff', 2.4, [0, 7.5, 1.5]);
  plane(10, 9, '#5aa2ff', 1.3, [0, -1, -8]);
  plane(7, 8, '#9fd0ff', 1.1, [-8, -1, -3]);
  plane(7, 8, '#7ab8ff', .9, [8, -1, -2]);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(env, .035).texture;
  pm.dispose();
}
const dl = new THREE.DirectionalLight(0xffffff, 1.1); dl.position.set(-3, 5, 6); scene.add(dl);
scene.add(new THREE.AmbientLight(0xe6f2ff, .35));

/* ---------- textures ---------- */
function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; }
function dropletNormal() {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
  const r = rng(7);
  for (let i = 0; i < 340; i++) {
    const x = r() * S, y = r() * S, rad = 2 + r() * 13;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
  }
  const src = g.getImageData(0, 0, S, S).data, out = g.createImageData(S, S), o = out.data;
  const h = (x, y) => src[(((y + S) % S) * S + ((x + S) % S)) * 4] / 255;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = (h(x - 1, y) - h(x + 1, y)) * 2.2, dy = (h(x, y - 1) - h(x, y + 1)) * 2.2;
    const l = Math.hypot(dx, dy, 1), i = (y * S + x) * 4;
    o[i] = (dx / l * .5 + .5) * 255; o[i + 1] = (dy / l * .5 + .5) * 255; o[i + 2] = (1 / l * .5 + .5) * 255; o[i + 3] = 255;
  }
  g.putImageData(out, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2.4);
  return t;
}
function loadImg(src) {
  return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}
function splash(g, x0, w, h, seed) {
  const r = rng(seed);
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    g.strokeStyle = `rgba(${40 + r() * 40},${110 + r() * 60},${220 + r() * 35},${.25 + r() * .35})`;
    g.lineWidth = 3 + r() * 10;
    g.beginPath(); const y = h * (.15 + r() * .7);
    g.moveTo(x0, y); g.bezierCurveTo(x0 + w * .3, y - 60 + r() * 120, x0 + w * .6, y - 80 + r() * 160, x0 + w, y - 40 + r() * 80); g.stroke();
  }
  for (let i = 0; i < 26; i++) {
    g.fillStyle = `rgba(255,255,255,${.5 + r() * .5})`;
    g.beginPath(); g.arc(x0 + r() * w, r() * h, 2 + r() * 7, 0, 7); g.fill();
  }
  g.restore();
}
function labelBase(g, back) {
  const gr = g.createLinearGradient(0, 0, 0, LH);
  if (back) { gr.addColorStop(0, '#E6F1FC'); gr.addColorStop(1, '#C9E0F7'); }
  else { gr.addColorStop(0, '#F6FBFF'); gr.addColorStop(.55, '#DCEDFC'); gr.addColorStop(1, '#BFDDF8'); }
  g.fillStyle = gr; g.fillRect(0, 0, LW, LH);
}
function frontLabel(logo, fmt) {
  const c = document.createElement('canvas'); c.width = LW; c.height = LH; const g = c.getContext('2d');
  labelBase(g, false);
  splash(g, 560, 464, LH, 3);
  const lw = 560, lh = logo ? lw * logo.height / logo.width : 0;
  if (logo) g.drawImage(logo, (LW - lw) / 2 - 40, 34, lw, lh);
  else { g.fillStyle = '#1D3FC4'; g.font = '900 italic 200px "Barlow Condensed"'; g.textAlign = 'center'; g.fillText("ViTAM'S", LW / 2, 250); }
  g.textAlign = 'center';
  g.fillStyle = '#E3262E'; g.font = 'italic 800 50px "Barlow Condensed", serif'; g.fillText('VITAMS, le plein de vie !', LW / 2 - 30, 380);
  g.fillStyle = '#1D3FC4'; g.font = '700 24px Manrope, sans-serif'; g.fillText('EAU MINÉRALE NATURELLE', LW / 2 - 30, 424);
  g.save(); g.translate(LW - 70, LH / 2); g.rotate(-Math.PI / 2); g.fillStyle = '#1D3FC4'; g.font = '900 italic 64px "Barlow Condensed"'; g.fillText(fmt, 0, 0); g.restore();
  // mini composition table on the left edge, like the real label
  g.fillStyle = 'rgba(11,42,111,.55)'; g.font = '600 15px Manrope, sans-serif'; g.textAlign = 'left';
  ['Ca 3,0', 'Mg 3,8', 'K 0,4', 'Fe 0,1', 'NO₃ 0,8', 'pH 6,63'].forEach((t, i) => g.fillText(t, 22, 150 + i * 26));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const ICONS = [
  (g, x, y, s) => { g.beginPath(); g.moveTo(x, y - s * .42); g.bezierCurveTo(x + s * .32, y - s * .05, x + s * .3, y + s * .32, x, y + s * .32); g.bezierCurveTo(x - s * .3, y + s * .32, x - s * .32, y - s * .05, x, y - s * .42); g.stroke(); },
  (g, x, y, s) => { [[-.14, .1, .17], [.16, -.08, .12], [.12, .2, .08], [-.08, -.2, .07]].forEach(([a, b, r]) => { g.beginPath(); g.arc(x + a * s, y + b * s, r * s, 0, 7); g.stroke(); }); },
  (g, x, y, s) => { g.strokeRect(x - s * .24, y - s * .3, s * .48, s * .6); [-.12, 0, .12].forEach((d) => { g.beginPath(); g.moveTo(x - s * .14, y + d * s); g.lineTo(x + s * .14, y + d * s); g.stroke(); }); },
];
function backLabel(logo, fmt) {
  const c = document.createElement('canvas'); c.width = LW; c.height = LH; const g = c.getContext('2d');
  labelBase(g, true);
  if (logo) { const w = 210; g.drawImage(logo, 150, 14, w, w * logo.height / logo.width); }
  g.fillStyle = '#0B2A6F'; g.textAlign = 'left';
  g.font = '800 italic 40px "Barlow Condensed"'; g.fillText('EAU MINÉRALE NATURELLE', 390, 66);
  g.font = '600 20px Manrope, sans-serif'; g.fillStyle = 'rgba(11,42,111,.7)'; g.fillText('Goguiezé · Tillabéry · Niger · ' + fmt, 392, 96);
  ROWS.forEach((r, i) => {
    const y = ROW_Y[i], x = 150;
    g.strokeStyle = 'rgba(11,42,111,.16)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(874, y); g.stroke();
    g.strokeStyle = '#1D3FC4'; g.lineWidth = 3.5;
    g.beginPath(); g.arc(x + 46, y + ROW_H / 2, 34, 0, 7); g.stroke();
    ICONS[i](g, x + 46, y + ROW_H / 2, 46);
    g.fillStyle = '#0B2A6F'; g.font = '900 italic 50px "Barlow Condensed"'; g.fillText(r.h, x + 104, y + 52);
    g.fillStyle = 'rgba(11,42,111,.78)'; g.font = '500 21px Manrope, sans-serif'; g.fillText(r.d, x + 106, y + 84);
  });
  g.fillStyle = 'rgba(11,42,111,.6)'; g.font = '600 17px Manrope, sans-serif'; g.textAlign = 'center';
  g.fillText("Vitam's, le plein de vie ! · Niamey, Niger · À conserver au frais", LW / 2, 464);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

/* ---------- geometry ---------- */
function profile(R, H) {
  const p = [[0, 0], [R * .68, 0], [R * .88, .02], [R * .98, .07], [R, .14]];
  const ribTop = .42 * H, n = 9;
  for (let i = 0; i < n; i++) {
    const y0 = .2 + (ribTop - .2) * i / n, y1 = .2 + (ribTop - .2) * (i + .5) / n;
    p.push([R, y0], [R * .955, y1 - .012], [R * .955, y1 + .012]);
  }
  const bt = .66 * H, neckY = H - .25;
  p.push([R, ribTop + .03], [R, bt]);
  for (let i = 1; i <= 7; i++) {
    const t = i / 7, e = t * t * (3 - 2 * t);
    p.push([lerp(R, .12, Math.pow(e, .8)), lerp(bt, neckY, t)]);
  }
  p.push([.118, neckY + .03], [.145, neckY + .04], [.145, neckY + .06], [.12, neckY + .07], [.118, neckY + .09]);
  return p;
}
const geoCache = {};
function geos(f) {
  if (geoCache[f.id]) return geoCache[f.id];
  const pts = profile(f.R, f.H);
  const curve = new THREE.SplineCurve(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const shellPts = curve.getPoints(150);
  shellPts[0].set(0, 0);
  const shell = new THREE.LatheGeometry(shellPts, 84);
  const level = f.H - .36;
  const lp = [new THREE.Vector2(0, .045)];
  shellPts.forEach((v) => { if (v.y > .04 && v.y < level) lp.push(new THREE.Vector2(Math.max(0, v.x - .024), v.y)); });
  lp.push(new THREE.Vector2(0, level));
  const liquid = new THREE.LatheGeometry(lp, 64);
  // screw cap with vertical knurls
  const capY = f.H - .17;
  const cp = [[0, f.H], [.11, f.H], [.126, f.H - .008], [.132, f.H - .025], [.132, capY + .015], [.128, capY]].map(([x, y]) => new THREE.Vector2(x, y));
  const cap = new THREE.LatheGeometry(cp, 96);
  const pos = cap.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (v.y < f.H - .04 && v.y > capY + .01) { const a = Math.atan2(v.z, v.x), m = 1 + .025 * Math.pow(Math.max(0, Math.cos(40 * a)), .6); v.x *= m; v.z *= m; pos.setXYZ(i, v.x, v.y, v.z); }
  }
  cap.computeVertexNormals();
  const lh = .215 * f.H, ly = .55 * f.H, lr = f.R + .006;
  const front = new THREE.CylinderGeometry(lr, lr, lh, 64, 1, true, -Math.PI / 2, Math.PI);
  const back = new THREE.CylinderGeometry(lr, lr, lh, 64, 1, true, Math.PI / 2, Math.PI);
  const glow = new THREE.CylinderGeometry(lr + .014, lr + .014, lh * ROW_H / LH * 1.25, 48, 1, true, Math.PI - 1.05, 2.1);
  return (geoCache[f.id] = { shell, liquid, cap, front, back, glow, lh, ly });
}

/* ---------- materials ---------- */
const DROPS = dropletNormal();
function patchAlpha(mat, fresW, specW) {
  mat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `
      float fres = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.2);
      float spec = smoothstep(.22, 1.1, max(max(outgoingLight.r, outgoingLight.g), outgoingLight.b));
      diffuseColor.a = clamp(diffuseColor.a + fres * ${fresW.toFixed(2)} + spec * ${specW.toFixed(2)}, 0.0, 1.0);
      #include <opaque_fragment>`);
  };
}
function shellMat() {
  const m = new THREE.MeshPhysicalMaterial({
    color: 0x000000, roughness: .05, transparent: true, opacity: .06, depthWrite: false,
    clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 2.1, ior: 1.5,
    normalMap: DROPS, normalScale: new THREE.Vector2(.42, .42),
  });
  patchAlpha(m, .3, .9); return m;
}
function liquidMat() {
  const m = new THREE.MeshPhysicalMaterial({
    color: hex('#a8d8ff'), roughness: .1, transparent: true, opacity: .07, depthWrite: false,
    emissive: hex('#2f78e0'), emissiveIntensity: .06, clearcoat: .7, envMapIntensity: 1.3,
  });
  patchAlpha(m, .24, .3); return m;
}
const BACK_V = ROW_Y.map((y) => [1 - (y + ROW_H) / LH, 1 - y / LH]);
function backMat(tex) {
  const m = new THREE.MeshPhysicalMaterial({ map: tex, roughness: .5, clearcoat: .3, clearcoatRoughness: .3 });
  const u = { uP: { value: new THREE.Vector3() }, uD: { value: new THREE.Vector3() }, uStreak: { value: new THREE.Vector2(-1, 0) }, uRow: { value: -1 } };
  m.userData.u = u;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.fragmentShader = 'uniform vec3 uP; uniform vec3 uD; uniform vec2 uStreak; uniform float uRow;\n' + sh.fragmentShader.replace('#include <map_fragment>', `
      #include <map_fragment>
      {
        vec2 q = vMapUv;
        float ux = (q.x * ${LW.toFixed(1)} - 150.0) / 724.0;
        float lum = dot(diffuseColor.rgb, vec3(.299, .587, .114));
        float paper = smoothstep(.62, .80, lum);
        ${BACK_V.map(([a, b], i) => `
        {
          float band = smoothstep(${a.toFixed(4)}, ${(a + .006).toFixed(4)}, q.y) * (1.0 - smoothstep(${(b - .006).toFixed(4)}, ${b.toFixed(4)}, q.y)) * step(0.0, ux) * step(ux, 1.0);
          float p = uP[${i}];
          float mask = band * (1.0 - smoothstep(mix(.12, .9, p) - .03, mix(.12, .9, p), ux)) * smoothstep(.12, .30, ux) * smoothstep(.90, .72, ux) * step(.001, p);
          mask = band * max(mask, 0.0) * step(.001, p) + 0.0;
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0), paper * mask * .85);
          diffuseColor.rgb *= 1.0 - (1.0 - paper) * mask * .25;
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.92, .955, .99), band * uD[${i}] * .66);
          if (abs(uRow - ${i}.0) < .5) {
            float st = exp(-pow((ux - q.y * .35 - uStreak.x) * 9.0, 2.0)) * uStreak.y;
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0), band * paper * st);
          }
        }`).join('')}
      }`);
  };
  return m;
}
function glowTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
  const gx = g.createLinearGradient(0, 0, 256, 0); gx.addColorStop(0, 'rgba(255,255,255,0)'); gx.addColorStop(.3, '#fff'); gx.addColorStop(.7, '#fff'); gx.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gx; g.fillRect(0, 0, 256, 64);
  g.globalCompositeOperation = 'destination-in';
  const gy = g.createLinearGradient(0, 0, 0, 64); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(.5, '#000'); gy.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gy; g.fillRect(0, 0, 256, 64);
  return new THREE.CanvasTexture(c);
}

/* ---------- bottles ---------- */
const bottles = [];
const pickables = [];
let rowGlow;
async function buildBottles() {
  const logo = await loadImg('assets/img/logo-bleu.png');
  await document.fonts.ready;
  const tex = {};
  FORMATS.forEach((f) => { tex[f.id] = { front: frontLabel(logo, f.id), back: backLabel(logo, f.id) }; });
  const capCol = hex('#1f3fd0');
  for (let i = 0; i < N; i++) {
    const f = FORMATS[i % 2], G = geos(f);
    const group = new THREE.Group(), inner = new THREE.Group();
    inner.position.y = -f.H / 2; group.add(inner);
    const liquid = new THREE.Mesh(G.liquid, liquidMat()); liquid.renderOrder = 1;
    const shell = new THREE.Mesh(G.shell, shellMat()); shell.renderOrder = 2;
    const cap = new THREE.Mesh(G.cap, new THREE.MeshStandardMaterial({ color: capCol, metalness: .15, roughness: .35, envMapIntensity: 1.2 }));
    const fm = new THREE.MeshPhysicalMaterial({ map: tex[f.id].front, roughness: .5, clearcoat: .3, clearcoatRoughness: .3 });
    const front = new THREE.Mesh(G.front, fm); front.position.y = G.ly;
    const bm = backMat(tex[f.id].back);
    const back = new THREE.Mesh(G.back, bm); back.position.y = G.ly;
    inner.add(liquid, front, back, cap, shell);
    shell.userData.i = i; pickables.push(shell);
    scene.add(group);
    bottles.push({ i, f, G, group, inner, liquid, shell, cap, front, back, fm, bm, hover: 0, L: 1,
      baseLiquid: liquid.material.color.clone(), baseCap: cap.material.color.clone() });
  }
  rowGlow = new THREE.Mesh(geos(FORMATS[0]).glow, new THREE.MeshBasicMaterial({ map: glowTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, opacity: 0 }));
  rowGlow.renderOrder = 3;
}

/* ---------- hero disc ---------- */
const disc = new THREE.Group();
{
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .05, 96), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .22, roughness: .05, clearcoat: 1, depthWrite: false }));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, .007, 8, 160), new THREE.MeshBasicMaterial({ color: 0xffffff, blending: THREE.AdditiveBlending, transparent: true }));
  ring.rotation.x = Math.PI / 2; ring.position.y = .026;
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const rg = g.createRadialGradient(128, 128, 0, 128, 128, 128); rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 256, 256);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .55 }));
  glow.rotation.x = -1.2; glow.position.y = .02;
  disc.add(plate, glow, ring); disc.userData = { ring, glow, plate };
  scene.add(disc);
}

/* ---------- background shader ---------- */
function typeTex(blur) {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 1024; const g = c.getContext('2d');
  g.filter = `blur(${blur}px)`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  ['LE PLEIN', 'DE VIE !'].forEach((t, i) => {
    let s = 400; g.font = `900 italic ${s}px "Barlow Condensed"`;
    s *= 1880 / g.measureText(t).width; s = Math.min(s, 470); g.font = `900 italic ${s}px "Barlow Condensed"`;
    g.fillText(t, 1024, 270 + i * 470);
  });
  const t = new THREE.CanvasTexture(c); return t;
}
const PAL = {
  hero:  { top: '#6FB2EE', bot: '#CFE8FF', glow: '#FFFFFF', gp: [.5, .2], ga: .42, gr: 2.4, cl: 0, fl: 0 },
  story: { top: '#D7ECFF', bot: '#9CCBF2', glow: '#FFFFFF', gp: [.36, .5], ga: .5, gr: 1.6, cl: 0, fl: 0 },
  mani:  { top: '#4C9BE6', bot: '#2167C2', glow: '#BFE2FF', gp: [.5, .42], ga: .45, gr: 1.8, cl: 1, fl: 0 },
  line:  { top: '#0A1E4A', bot: '#040F2B', glow: '#1E5BD6', gp: [.3, .05], ga: 0, gr: 2, cl: 0, fl: 1 },
};
const bgU = {
  uTop: { value: hex(PAL.hero.top) }, uBot: { value: hex(PAL.hero.bot) }, uGlow: { value: hex(PAL.hero.glow) },
  uGP: { value: new THREE.Vector2(.5, .2) }, uGA: { value: .42 }, uGR: { value: 2.4 }, uCl: { value: 0 }, uFl: { value: 0 },
  uT: { value: 0 }, uAsp: { value: 1 }, uTxt: { value: 0 }, uSharp: { value: 0 }, uTxtY: { value: .5 }, uTxtW: { value: .92 }, uDrift: { value: 0 },
  uSharpTex: { value: null }, uSoftTex: { value: null },
};
const bgScene = new THREE.Scene(), bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  uniforms: bgU, depthTest: false, depthWrite: false,
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
  fragmentShader: `
    varying vec2 vUv;
    uniform vec3 uTop, uBot, uGlow; uniform vec2 uGP; uniform float uGA, uGR, uCl, uFl, uT, uAsp, uTxt, uSharp, uTxtY, uTxtW, uDrift;
    uniform sampler2D uSharpTex, uSoftTex;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
      return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
    float fbm(vec2 p){ float a = .5, s = 0.; for(int i=0;i<5;i++){ s += a*n(p); p *= 2.02; a *= .5; } return s; }
    vec3 toLin(vec3 c){ return pow(c, vec3(2.2)); }
    void main(){
      vec2 uv = vUv;
      vec3 col = mix(uBot, uTop, uv.y);
      vec2 d = (uv - uGP) * vec2(uAsp, 1.);
      float gl = uGA * exp(-dot(d, d) * uGR);
      col += uGlow * gl;
      col += uGlow * uFl * smoothstep(.5, 0., uv.y) * .55 * (.4 + gl);
      if (uCl > .001) {
        vec2 p = uv * vec2(uAsp, 1.) * 1.35 + vec2(.022, .011) * uT;
        float c = fbm(p) + .32 * fbm(p * 1.8 - uT * .015);
        c = smoothstep(.42, .86, c);
        col = mix(col, vec3(.88, .95, 1.), c * .5 * uCl);
      }
      if (uTxt > .001) {
        vec2 tp = vec2((uv.x - .5 + uDrift) / uTxtW + .5, (uv.y - uTxtY) / (.5 * uTxtW * uAsp) + .5);
        if (tp.x > 0. && tp.x < 1. && tp.y > 0. && tp.y < 1.) {
          float a = mix(texture2D(uSoftTex, tp).r, texture2D(uSharpTex, tp).r, uSharp);
          a *= .82 + .36 * h(floor(uv * 900.) + floor(uT * 24.));
          col = mix(col, vec3(.95, .98, 1.), a * uTxt * .78);
        }
      }
      col += (h(uv * 1000. + fract(uT) * 37.) - .5) * .045;
      gl_FragColor = vec4(col, 1.);
    }`,
})));

/* ---------- state ---------- */
let car = 0, carT = 0, carV = 0, drag = null, wheelSnap = 0;
let Ys = 0, Yv = 0, intro = reduce ? 1 : 0, ready = false, introStart = 0, uiShown = false;
let curIdx = -1, stepIdx = -1, lockCentre = 0;
const rowP = [0, 0, 0], rowD = [0, 0, 0];
let streakT = 9, lastRow = -1, glowY = 0;
const flavour = { c: hex('#3d7bff') };

const titleEl = $('#hero .title .roll'), heroWa = $('#heroWa');
function setTitle(idx, dir) {
  const name = FORMATS[idx % 2].name;
  const cur = titleEl.querySelector('.cur');
  if (cur.textContent === name) return;
  const nx = document.createElement('span'); nx.className = 'nxt'; nx.textContent = name;
  nx.style.transform = `translateY(${dir >= 0 ? 100 : -100}%)`;
  titleEl.appendChild(nx);
  requestAnimationFrame(() => {
    nx.style.transform = 'translateY(0)'; cur.style.transform = `translateY(${dir >= 0 ? -100 : 100}%)`;
  });
  setTimeout(() => { cur.remove(); nx.className = 'cur'; }, reduce ? 20 : 640);
  if (heroWa && window.VitamsWA) heroWa.href = window.VitamsWA("Bonjour Vitam's, je souhaite commander de l'eau Vitam's.\nFormat : " + FORMATS[idx % 2].id + '\nQuantité : \nMon quartier : ');
}
if (heroWa) { heroWa.target = '_blank'; heroWa.rel = 'noopener'; }

/* story copy decode */
const sTag = $('#sTag'), sTitle = $('#sTitle'), sBody = $('#sBody'), tagWrap = $('#story .tag');
let decodeTimer = 0;
function setStep(i) {
  if (i === stepIdx) return; stepIdx = i;
  document.querySelectorAll('#story .icons button').forEach((b, j) => b.classList.toggle('on', j === i));
  const st = STEPS[Math.min(i, 2)];
  tagWrap.classList.add('blur'); sBody.classList.add('blur'); sTitle.classList.add('bars');
  clearTimeout(decodeTimer); cancelAnimationFrame(setStep.raf);
  decodeTimer = setTimeout(() => {
    sTag.textContent = st.tag; tagWrap.classList.remove('blur');
    sTitle.classList.remove('bars');
    const target = st.title, t0 = performance.now(), G = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const tick = (now) => {
      const p = clamp((now - t0) / (reduce ? 1 : 520)); const n = Math.floor(p * target.length);
      sTitle.textContent = target.slice(0, n) + target.slice(n).replace(/[^ ]/g, () => G[(Math.random() * G.length) | 0]);
      if (p < 1) setStep.raf = requestAnimationFrame(tick);
    };
    setStep.raf = requestAnimationFrame(tick);
    setTimeout(() => { sBody.textContent = st.body; sBody.classList.remove('blur'); }, 160);
  }, reduce ? 0 : 230);
}
document.querySelectorAll('#story .icons button').forEach((b) => b.addEventListener('click', () => {
  const s = +b.dataset.step;
  const y = s === 3 ? 6.4 : .75 + (s + .5) / 3 * 2.55;
  scrollTo({ top: y * innerHeight, behavior: 'smooth' });
}));

/* ---------- input ---------- */
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
let hoverI = -1;
function pick(e) {
  const r = canvas.getBoundingClientRect();
  mouse.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const hit = ray.intersectObjects(pickables.filter((m) => m.parent.parent.visible), false)[0];
  return hit ? hit.object.userData.i : -1;
}
const heroActive = () => Ys < .05 && intro >= 1 && body.classList.contains('ready');
const wrapD = (i, c) => { let d = i - c; d = ((d % N) + N + N / 2) % N - N / 2; return d; };
const s1 = () => lerp(.36, .15, k);
canvas.addEventListener('pointerdown', (e) => {
  if (!heroActive()) return;
  drag = { x: e.clientX, y: e.clientY, c: carT, last: e.clientX, t: performance.now(), v: 0, moved: 0, id: e.pointerId, horiz: null };
});
addEventListener('pointermove', (e) => {
  if (drag) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (drag.horiz === null && Math.hypot(dx, dy) > 6) drag.horiz = Math.abs(dx) > Math.abs(dy);
    if (drag.horiz) {
      const step = s1() * innerWidth;
      carT = drag.c - dx / step;
      const now = performance.now(), dt = Math.max(1, now - drag.t);
      const v = -(e.clientX - drag.last) / step / (dt / 1000);
      drag.v = clamp(lerp(drag.v, v, .35), -14, 14); drag.last = e.clientX; drag.t = now;
    }
    drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
    canvas.style.cursor = 'grabbing';
  } else if (heroActive() && e.target === canvas) {
    hoverI = pick(e);
    canvas.style.cursor = hoverI >= 0 ? (Math.abs(wrapD(hoverI, car)) < .5 ? 'grab' : 'pointer') : 'default';
  } else hoverI = -1;
});
addEventListener('pointerup', (e) => {
  if (!drag) return;
  if (drag.moved < 6) {
    const i = pick(e);
    if (i >= 0) carT = Math.round(car + wrapD(i, car));
  } else if (drag.horiz) {
    if (performance.now() - drag.t > 90) drag.v = 0;
    carT = Math.round(carT + drag.v * .22);
  }
  drag = null; canvas.style.cursor = '';
});
$('#prev').addEventListener('click', () => { carT = Math.round(carT) - 1; });
$('#next').addEventListener('click', () => { carT = Math.round(carT) + 1; });
addEventListener('keydown', (e) => {
  if (!heroActive()) return;
  if (e.key === 'ArrowLeft') carT = Math.round(carT) - 1;
  if (e.key === 'ArrowRight') carT = Math.round(carT) + 1;
});
addEventListener('wheel', (e) => {
  if (!heroActive() || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
  carT += e.deltaX / 220; clearTimeout(wheelSnap);
  wheelSnap = setTimeout(() => { carT = Math.round(carT); }, 130);
}, { passive: true });

/* ---------- layout ---------- */
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  aspect = w / h; camera.aspect = aspect; camera.updateProjectionMatrix();
  W = VH * aspect; k = ss(.72, 1.25, aspect);
  bgU.uAsp.value = aspect; bgU.uTxtY.value = lerp(.47, .5, k); bgU.uTxtW.value = lerp(1.02, .92, k);
}
addEventListener('resize', resize);

const P = () => ({ x: 0, y: 0, z: 0, s: 1, rx: 0, ry: 0, rz: 0 });
const mix = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t), s: lerp(a.s, b.s, t), rx: lerp(a.rx, b.rx, t), ry: lerp(a.ry, b.ry, t), rz: lerp(a.rz, b.rz, t) });
function heroScale() { return Math.min(lerp(.38, .5, k) * VH, lerp(.36, .2, k) * W * BH / (FORMATS[0].R * 2.08)) / BH; }
function heroPose(b, t) {
  const p = P(), d = wrapD(b.i, car), ad = Math.abs(d), hc = heroScale();
  p.x = Math.sign(d) * (Math.min(ad, 1) * s1() + Math.max(0, ad - 1) * lerp(.25, .104, k)) * W;
  p.s = hc * (1 - .3 * Math.min(ad, 1) - .035 * Math.max(0, ad - 1));
  const bottom = lerp(-.3, -.35, k) * VH + .05 * VH * Math.min(ad, 1);
  p.y = bottom + b.f.H / 2 * p.s;
  p.z = -Math.min(ad, 6) * .32;
  p.rz = TILT[b.i] * ss(0, 1, ad); p.ry = -d * .2;
  if (!reduce) { p.y += Math.sin(1.1 * t + 1.7 * b.i) * .035; p.rz += Math.sin(.8 * t + 2.3 * b.i) * .025; p.ry += Math.sin(.5 * t + b.i) * .06; }
  p.y += b.hover * .09;
  // intro
  if (intro < 1) {
    const q = clamp((intro - .06 * ad) / .62);
    if (ad < .5) p.y -= (1 - eoc(q)) * .75 * VH * 1.6;
    else { const e = eob(q); p.x = lerp(Math.sign(d) * .85 * W * 1.4, p.x, e); p.rz += Math.sign(d) * .5 * (1 - q); }
  }
  return { p, d, ad };
}
function rowLocalY(b, f) {
  const G = b.G, i0 = Math.floor(f), i1 = Math.min(2, i0 + 1), t = f - i0;
  const yv = (i) => { const v = 1 - (ROW_Y[i] + ROW_H / 2) / LH; return G.ly - b.f.H / 2 + (v - .5) * G.lh; };
  return lerp(yv(i0), yv(i1), t);
}
function storyPose(b, s, t) {
  const sc0 = lerp(.9, 1.08, k) * VH / b.f.H;
  const sc1 = Math.min(sc0 * lerp(1.25, 1.22, k), lerp(.62, .36, k) * W / (b.f.R * 2.08));
  const turn = eio(clamp(s / .12));
  const sc = lerp(sc0, sc1, turn);
  const f = Math.min(2, Math.floor(3 * s) + ss(.6, 1, (3 * s) % 1));
  const p = P();
  p.s = sc;
  p.x = lerp(lerp(0, -.17, k) * W, lerp(0, -.165, k) * W, turn);
  const y0 = lerp(.15, .44, k) * VH - b.f.H / 2 * sc0;
  const y1 = lerp(-.33, 0, k) * VH - rowLocalY(b, f) * sc;
  p.y = lerp(y0, y1, turn);
  p.rz = lerp(lerp(.12, .3, k), .025, turn);
  p.ry = Math.PI * turn + (f - 1) * .14 * turn + (reduce ? 0 : Math.sin(.7 * t) * .025);
  return { p, f };
}
function maniPose(b, m) {
  const h = Math.min(lerp(.5, .7, k) * VH, .36 * W * b.f.H / (b.f.R * 2.1));
  const p = P(); p.s = h / b.f.H; p.y = lerp(-.16, -.1, k) * VH;
  p.ry = 2 * Math.PI + (reduce ? 0 : 2 * Math.PI * eio(m));
  return p;
}
function linePose(b, slot, l) {
  const sc = lerp(.42, .6, k) * VH / BH, u = slot - eio(l) * 2;
  const p = P(); p.s = sc;
  p.z = 1.4 - 1.55 * u;
  p.x = lerp(-.3 * .86 * W, .48 * 3.19 * W, u / 15) + Math.min(0, u) * .35 * W;
  p.y = -.43 * VH * .86 + b.f.H / 2 * sc;
  p.ry = -.38 + Math.sin(.8 * u + 2.5 * l) * .12;
  return p;
}
function apply(b, p) {
  b.group.position.set(p.x, p.y, p.z);
  b.group.rotation.set(p.rx, p.ry, p.rz);
  b.group.scale.setScalar(p.s);
}
function setLight(b, L) {
  b.L = L;
  const a = .42 + .58 * L;
  b.liquid.material.color.copy(b.baseLiquid).multiplyScalar(a);
  b.liquid.material.emissiveIntensity = .03 + .1 * L;
  b.cap.material.color.copy(b.baseCap).multiplyScalar(.55 + .45 * L);
  const lc = .48 + .52 * L; b.fm.color.setScalar(lc); b.bm.color.setScalar(lc);
}

/* ---------- palette blend ---------- */
const cA = new THREE.Color(), cB = new THREE.Color();
function palBlend(a, b, t, out) {
  out.top.copy(cA.set(a.top)).lerp(cB.set(b.top), t);
  out.bot.copy(cA.set(a.bot)).lerp(cB.set(b.bot), t);
  out.glow.copy(cA.set(a.glow)).lerp(cB.set(b.glow), t);
  out.gp.set(lerp(a.gp[0], b.gp[0], t), lerp(a.gp[1], b.gp[1], t));
  out.ga = lerp(a.ga, b.ga, t); out.gr = lerp(a.gr, b.gr, t); out.cl = lerp(a.cl, b.cl, t); out.fl = lerp(a.fl, b.fl, t);
}
const PB = { top: bgU.uTop.value, bot: bgU.uBot.value, glow: bgU.uGlow.value, gp: bgU.uGP.value };

/* ---------- loop ---------- */
const ovHero = $('#hero'), ovStory = $('#story'), ovFinal = $('#final');
function vis(el, o) { el.style.opacity = o; el.style.visibility = o < .01 ? 'hidden' : 'visible'; }
let last = 0, ft = 16, dprHold = 0, dprUp = 0, T = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - (last || now)) / 1000); last = now; T += dt;
  // adaptive resolution
  ft = lerp(ft, dt * 1000, .05);
  if (ft > 19.5 && dpr > .7 && now > dprHold) { dpr = Math.max(.7, dpr - .15); renderer.setPixelRatio(dpr); resize(); dprHold = now + 8000; }
  else if (ft < 17.3 && dpr < Math.min(devicePixelRatio, 1.5) && now > dprHold && now > dprUp) { dpr = Math.min(Math.min(devicePixelRatio, 1.5), dpr + .05); renderer.setPixelRatio(dpr); resize(); dprUp = now + 1200; }

  // smoothed scroll (critically damped spring)
  const target = scrollY / innerHeight, w = reduce ? 40 : 5.6;
  const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
  for (let i = 0; i < n; i++) { const acc = w * w * (target - Ys) - 2 * w * Yv; Yv += acc * h; Ys += Yv * h; }
  const Y = Ys;
  if (scrollY > innerHeight * 8.3 && Y > 8.2) return; // canvas hidden by content

  // intro
  if (ready && intro < 1) { intro = clamp((now - introStart) / 1900); }
  if (ready && !uiShown && intro > .7) { uiShown = true; body.classList.add('intro-ui'); }

  // carousel spring
  const ck = 46; const cacc = ck * (carT - car) - 2 * Math.sqrt(ck) * carV;
  carV += cacc * dt; car += carV * dt;
  if (Ys < .05) lockCentre = ((Math.round(car) % N) + N) % N;
  const ci = lockCentre;
  if (ci !== curIdx) { setTitle(ci, curIdx < 0 ? 1 : Math.sign(wrapD(ci, curIdx)) || 1); curIdx = ci; }

  const a = eio(clamp(Y / .75)), s = clamp((Y - .75) / 2.55), bb = eio(clamp((Y - 3.3) / .65)),
    m = clamp((Y - 3.95) / 1.05), c = eio(clamp((Y - 5) / .7)), l = clamp((Y - 5.7) / 1.35);

  // background
  if (Y < .75) palBlend(PAL.hero, PAL.story, a, PB);
  else if (Y < 3.95) palBlend(PAL.story, PAL.mani, bb, PB);
  else palBlend(PAL.mani, PAL.line, c, PB);
  bgU.uGA.value = PB.ga; bgU.uGR.value = PB.gr; bgU.uCl.value = PB.cl; bgU.uFl.value = PB.fl;
  bgU.uT.value = T; bgU.uTxt.value = bb * (1 - c);
  bgU.uSharp.value = .62 * eoc(m); bgU.uDrift.value = (m - .5) * .03;

  // overlays
  vis(ovHero, intro > .75 ? 1 - ss(.02, .35, Y) : 0);
  vis(ovStory, ss(.5, .8, Y) * (1 - ss(3.3, 3.55, Y)));
  vis(ovFinal, ss(6.1, 6.7, Y) * (1 - ss(7.3, 7.9, Y)));
  if (Y > .5 && Y < 3.4) setStep(Math.min(2, Math.floor(3 * s)));

  // flavour colour (blue tint for disc/strip)
  const centre = bottles[ci];
  const tint = centre && centre.f.id === '0,5 L' ? '#36b7ff' : '#3d7bff';
  flavour.c.lerp(cA.set(tint), 1 - Math.exp(-4 * dt));
  document.documentElement.style.setProperty('--sc', '#' + flavour.c.getHexString());
  document.documentElement.style.setProperty('--sg', '#' + flavour.c.clone().lerp(cB.set('#ffffff'), .35).getHexString());

  // bottles
  let centrePose = null;
  bottles.forEach((b) => {
    const isC = b.i === ci;
    b.hover = lerp(b.hover, (hoverI === b.i && !isC && heroActive()) ? 1 : 0, 1 - Math.exp(-10 * dt));
    let pose, L = 1;
    if (Y < 3.3) {
      const { p, ad } = heroPose(b, T);
      L = 1 - Math.min(ad, 1) * (1 - b.hover * .4);
      if (isC) {
        pose = a > 0 ? mix(p, storyPose(b, s, T).p, a) : p;
        L = lerp(L, 1, a);
      } else {
        p.x += Math.sign(wrapD(b.i, car)) * .9 * W * a; p.s *= 1 - .25 * a; pose = p;
      }
      b.group.visible = isC || a < .999;
    } else if (Y < 5) {
      if (isC) {
        const sp = storyPose(b, 1, T).p, mp = maniPose(b, m);
        pose = mix(sp, mp, bb);
      }
      b.group.visible = isC;
    } else {
      const slot = ((b.i - ci) % N + N) % N;
      const lp = linePose(b, slot, l);
      if (isC) pose = mix(maniPose(b, 1), lp, c);
      else {
        const side = slot % 2 ? 1 : -1;
        const from = { ...lp, x: side * 1.25 * W, y: lp.y + .05 * VH, ry: lp.ry + side * 1.2 };
        const q = eio(clamp((c - (slot % 5) / 5 * .15) / .85));
        pose = mix(from, lp, q);
      }
      b.group.visible = isC || c > .001;
    }
    if (pose) apply(b, pose);
    setLight(b, L);
    if (isC) centrePose = pose;
  });

  // disc
  if (centre && centrePose) {
    const hc = heroScale(), sink = a;
    disc.visible = Y < 1;
    disc.scale.set(hc * 1.25, hc * 1.2, hc * 1.25);
    const introP = intro < 1 ? eoc(clamp(intro / .62)) : 1;
    disc.position.set(0, lerp(-.3, -.35, k) * VH - (1 - introP) * .4 * VH - sink * .5 * VH, 0);
    disc.userData.ring.material.color.copy(flavour.c).lerp(cB.set('#ffffff'), .25).multiplyScalar(1.5);
    disc.userData.glow.material.color.copy(flavour.c).lerp(cB.set('#ffffff'), .5);
    disc.userData.glow.material.opacity = .55 * (1 - a);
    disc.userData.plate.material.opacity = .22 * (1 - a);
  }

  // story row highlight on the centre bottle
  if (centre) {
    const active = Y > .75 && Y < 3.4 && s >= .11 ? Math.min(2, Math.floor(3 * s)) : -1;
    const u = centre.bm.userData.u;
    for (let i = 0; i < 3; i++) {
      if (i === active) rowP[i] = Math.min(1, rowP[i] + dt / .6); else rowP[i] = Math.max(0, rowP[i] - dt / .6 * 1.4);
      rowD[i] = lerp(rowD[i], active >= 0 && i !== active ? 1 : 0, 1 - Math.exp(-7 * dt));
    }
    u.uP.value.set(eio(rowP[0]), eio(rowP[1]), eio(rowP[2]));
    u.uD.value.set(rowD[0], rowD[1], rowD[2]);
    if (active !== lastRow) { lastRow = active; streakT = 0; }
    streakT += dt; const st = clamp(streakT / .95);
    u.uRow.value = active; u.uStreak.value.set(lerp(-.15, 1.15, eoc(st)), Math.sin(Math.PI * st) * .6);
    bottles.forEach((b) => { if (b !== centre) { b.bm.userData.u.uP.value.set(0, 0, 0); b.bm.userData.u.uD.value.set(0, 0, 0); } });
    // row glow
    if (rowGlow) {
      if (rowGlow.parent !== centre.inner) { centre.inner.add(rowGlow); rowGlow.geometry = centre.G.glow; }
      const ty = active >= 0 ? rowLocalY(centre, active) + centre.f.H / 2 : centre.G.ly;
      glowY = lerp(glowY || ty, ty, 1 - Math.exp(-8 * dt)); rowGlow.position.y = glowY;
      rowGlow.material.opacity = active >= 0 ? .2 + .05 * Math.sin(2.2 * T) : Math.max(0, rowGlow.material.opacity - dt);
    }
  }

  renderer.clear();
  renderer.render(bgScene, bgCam);
  renderer.clearDepth();
  renderer.render(scene, camera);
}

/* ---------- boot ---------- */
(async function boot() {
  resize();
  try {
    await document.fonts.load('900 italic 100px "Barlow Condensed"');
    await document.fonts.load('800 italic 100px "Barlow Condensed"');
  } catch (e) { /* fonts optional */ }
  bgU.uSharpTex.value = typeTex(5); bgU.uSoftTex.value = typeTex(26);
  await buildBottles();
  renderer.compile(scene, camera);
  renderer.compile(bgScene, bgCam);
  requestAnimationFrame(frame);
  setTimeout(() => {
    body.classList.add('ready'); ready = true; introStart = performance.now();
    if (reduce) { intro = 1; body.classList.add('intro-ui'); uiShown = true; }
  }, 120);
})().catch((e) => { console.error(e); fallback(); });
