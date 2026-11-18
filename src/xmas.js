// 🎄 크리스마스: 광장 대형 트리 · 내리는 눈 · 루돌프 썰매 (모양과 비행 경로)
// 끄려면 config.js에 xmas: false
import * as THREE from 'three';
import { Kit, MATERIALS as M, XM, XMAS, xmasTree, xmasGifts, xmasBulb, HX, HZ, ICO, BALL } from './building.js';

export { XMAS };

// ---------- 광장 트리 (분수 자리) ----------
export function createPlazaTree(garden) {
  const g = new THREE.Group();
  const { x, z } = garden.fountain;
  garden.fountain.water.forEach((m) => (m.visible = false)); // 분수 물은 잠시 쉬고
  garden.fountain.light.color.set(0xfff0d0);
  const k = new Kit();
  k.cyl(3.5, 0.06, x, 0.52, z, XM.snow, 40);                         // 수반에 쌓인 눈
  xmasTree(k, x, 0.55, z, 13, 0.25, 7);
  xmasGifts(k, x, z, 14, 3.15, 11, 0.58);
  // 광장 둘레 작은 전구 기둥
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.26, r = 8.7, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
    if (Math.abs(px - x) < 2.3 || Math.abs(pz - z) < 1.9) continue; // 길은 비움
    k.cyl(0.05, 1.1, px, 0, pz, M.black, 6);
    k.add(ICO, xmasBulb(i), px, 1.16, pz, 0, 0.09, 0.09, 0.09);
  }
  k.flush(g);
  return g;
}

// ---------- 내리는 눈 (건물 안에는 내리지 않음) ----------
export function createSnow(n = 1600) {
  const W = 70, H = 36;
  const pos = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * W; pos[i * 3 + 1] = Math.random() * H; pos[i * 3 + 2] = (Math.random() - 0.5) * W; seed[i] = Math.random() * 10; }
  const geo = new THREE.BufferGeometry();
  const show = new Float32Array(n * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(show, 3));
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const ctx = c.getContext('2d'), gr = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, 32, 32);
  const mat = new THREE.PointsMaterial({ size: 0.16, map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, opacity: 0.9 });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  let t = 0;
  return {
    points: pts,
    update(dt, cam) {
      t += dt;
      const cx = cam.position.x, cy = cam.position.y, cz = cam.position.z;
      for (let i = 0; i < n; i++) {
        const j = i * 3;
        pos[j + 1] -= dt * (0.9 + (seed[i] % 1) * 0.6);
        if (pos[j + 1] < 0) pos[j + 1] += H;
        // 카메라를 따라다니는 상자 안에서 반복
        const x = cx + ((((pos[j] + Math.sin(t * 0.7 + seed[i]) * 0.6 - cx) % W) + W * 1.5) % W) - W / 2;
        const z = cz + ((((pos[j + 2] - cz) % W) + W * 1.5) % W) - W / 2;
        const y = Math.max(0, cy - 14) + pos[j + 1];
        const inside = Math.abs(x) < HX + 0.3 && Math.abs(z) < HZ + 0.3 && y < 16.3;
        show[j] = x; show[j + 1] = inside ? -999 : y; show[j + 2] = z;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

// ---------- 🛷 루돌프 썰매 ----------
export const SLEIGH = { x: 23.5, z: 17, max: 4, wait: 12, dur: 46 }; // 동쪽 문 앞 길 (앞 = +x 쪽, 도로 방향)
const brown = new THREE.MeshStandardMaterial({ color: 0x7a4b2a, roughness: 0.8 });
const brownD = new THREE.MeshStandardMaterial({ color: 0x5a3519, roughness: 0.8 });
const tan = new THREE.MeshStandardMaterial({ color: 0xd8c09a, roughness: 0.7 });
const red = new THREE.MeshStandardMaterial({ color: 0xc41e2a, roughness: 0.45, metalness: 0.1 });
const redD = new THREE.MeshStandardMaterial({ color: 0x8e1520, roughness: 0.7 });
const gold = new THREE.MeshStandardMaterial({ color: 0xe2b23f, roughness: 0.3, metalness: 0.7 });
const noseMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 0.25, 0.2) });
const eyeMat = new THREE.MeshBasicMaterial({ color: 0x141414 });

function reindeer(rudolph) {
  const g = new THREE.Group(), k = new Kit();
  k.add(BALL, brown, 0, 0.78, 0, 0, 0.48, 0.3, 0.27);                      // 몸통 (+x가 앞)
  k.add(BALL, tan, 0.05, 0.68, 0, 0, 0.36, 0.17, 0.2);                       // 배
  k.add(new THREE.CylinderGeometry(0.1, 0.13, 0.42, 10).rotateZ(-0.7), brown, 0.42, 1.0, 0); // 목
  k.add(BALL, brown, 0.62, 1.2, 0, 0, 0.2, 0.17, 0.16);                      // 머리
  k.add(BALL, tan, 0.78, 1.14, 0, 0, 0.11, 0.09, 0.1);                       // 주둥이
  k.add(BALL, rudolph ? noseMat : brownD, 0.89, 1.16, 0, 0, 0.055, 0.055, 0.055);
  for (const e of [-1, 1]) {
    k.add(ICO, eyeMat, 0.74, 1.27, e * 0.1, 0, 0.025, 0.03, 0.025);
    k.add(BALL, brownD, 0.56, 1.33, e * 0.15, 0, 0.07, 0.035, 0.03);         // 귀
    // 뿔 (가지 셋)
    k.add(new THREE.CylinderGeometry(0.018, 0.024, 0.32, 6).rotateX(e * 0.45), tan, 0.58, 1.48, e * 0.11);
    k.add(new THREE.CylinderGeometry(0.014, 0.018, 0.16, 6).rotateZ(-0.9), tan, 0.65, 1.5, e * 0.14);
    k.add(new THREE.CylinderGeometry(0.014, 0.018, 0.14, 6).rotateZ(0.8), tan, 0.52, 1.56, e * 0.17);
  }
  k.add(BALL, M.white || tan, -0.47, 0.88, 0, 0, 0.07, 0.07, 0.07);        // 꼬리
  k.add(new THREE.TorusGeometry(0.2, 0.035, 6, 16).rotateY(Math.PI / 2), red, 0.38, 0.92, 0); // 목줄
  k.add(ICO, gold, 0.5, 0.8, 0, 0, 0.05, 0.05, 0.05);                       // 방울
  k.box(0.5, 0.05, 0.56, -0.02, 1.04, 0, red);                              // 안장 끈
  k.flush(g);
  const legs = [];
  for (const [lx, lz] of [[0.3, 0.13], [0.3, -0.13], [-0.3, 0.13], [-0.3, -0.13]]) {
    const leg = new THREE.Group(); leg.position.set(lx, 0.62, lz);
    const lk = new Kit(); lk.add(new THREE.CylinderGeometry(0.045, 0.04, 0.56, 8), brown, 0, -0.28, 0); lk.add(BALL, brownD, 0, -0.57, 0, 0, 0.055, 0.04, 0.06); lk.flush(leg);
    g.add(leg); legs.push(leg);
  }
  g.userData.legs = legs;
  return g;
}

export function createSleigh() {
  const root = new THREE.Group();      // 위치 · 방향 (경로를 따라감)
  const body = new THREE.Group();      // 썰매 + 루돌프
  root.add(body);
  const k = new Kit();
  // 썰매 몸통 (길이 x 2.2, 폭 1.15): 바닥 · 옆판 · 높은 등받이 · 둥근 앞코
  k.box(2.2, 0.12, 1.12, -0.25, 0.3, 0, red);
  for (const e of [-1, 1]) k.box(2.2, 0.42, 0.08, -0.25, 0.38, e * 0.56, red);
  k.box(0.14, 0.95, 1.2, -1.35, 0.3, 0, red);                                   // 등받이
  k.add(new THREE.CylinderGeometry(0.6, 0.6, 1.2, 16, 1, false, 0, Math.PI).rotateX(Math.PI / 2), red, -1.3, 1.22, 0, 0, 0.5, 0.5, 1); // 둥근 등받이 윗부분
  k.box(0.12, 0.55, 1.12, 0.82, 0.38, 0, red);
  k.add(new THREE.TorusGeometry(0.3, 0.06, 8, 16, Math.PI).rotateY(Math.PI / 2), red, 0.98, 0.65, 0, 0, 1, 1, 1.75); // 앞코 말림
  for (const e of [-1, 1]) { k.box(2.24, 0.05, 0.1, -0.25, 0.82, e * 0.56, gold); }      // 금테
  // 의자 2줄
  k.box(0.52, 0.2, 1.0, 0.2, 0.42, 0, redD); k.box(0.52, 0.2, 1.0, -0.8, 0.42, 0, redD);
  k.box(0.08, 0.42, 1.0, -0.08, 0.5, 0, redD);
  // 썰매 날 (금색) + 말린 앞끝
  for (const e of [-1, 1]) {
    k.box(2.6, 0.05, 0.07, -0.15, 0.02, e * 0.48, gold);
    k.add(new THREE.TorusGeometry(0.22, 0.035, 6, 14, Math.PI * 1.2), gold, 1.15, 0.24, e * 0.48, 0, 1, 1, 1);
    for (const sx of [-1.0, -0.1, 0.8]) k.box(0.05, 0.3, 0.05, sx, 0.02, e * 0.48, gold);
  }
  // 뒤 선물 자루
  k.add(BALL, brownD, -1.55, 0.95, 0.25, 0, 0.28, 0.32, 0.26);
  xmasGifts(k, -1.55, -0.25, 3, 0.18, 4, 0.36);
  // 고삐 (썰매 → 루돌프)
  for (const e of [-1, 1]) k.add(new THREE.CylinderGeometry(0.012, 0.012, 2.6, 4).rotateZ(Math.PI / 2 - 0.08), redD, 2.15, 0.95, e * 0.2);
  // 방울 줄
  for (let i = 0; i < 6; i++) for (const e of [-1, 1]) k.add(ICO, gold, -1.1 + i * 0.36, 0.78, e * 0.61, 0, 0.04, 0.04, 0.04);
  k.flush(body);
  const deer = [reindeer(false), reindeer(true)];
  deer[0].position.set(2.05, 0, 0); deer[1].position.set(3.35, 0, 0);
  deer.forEach((d) => body.add(d));
  // 탈 자리 (썰매 안, 앞줄 2 · 뒷줄 2): x 앞뒤, z 좌우
  const seats = [[0.2, -0.26], [0.2, 0.26], [-0.8, -0.26], [-0.8, 0.26]].map(([x, z]) => new THREE.Vector3(x, 0, z));
  let run = 0;
  return {
    root, seats, seatH: 0.52,
    // 날 때 다리를 휘저음
    animate(dt, speed) {
      run += dt * (speed > 0.3 ? 9 : 0);
      deer.forEach((d, j) => d.userData.legs.forEach((l, i) => (l.rotation.z = speed > 0.3 ? Math.sin(run + i * 1.6 + j) * 0.6 : 0)));
      deer.forEach((d, j) => (d.position.y = speed > 0.3 ? Math.abs(Math.sin(run * 0.5 + j)) * 0.12 : 0));
    },
  };
}

// 비행 경로: 동쪽으로 날아올라 → 건물을 한 바퀴 → 서쪽에서 내려와 제자리 (앞 = +x)
const S = SLEIGH;
export const SLEIGH_PATH = new THREE.CatmullRomCurve3([
  [S.x, 0, S.z], [S.x + 3.5, 0.9, S.z], [S.x + 8, 3.6, S.z - 1.5], [33, 8, 7], [30, 13, -10], [17, 17, -24], [-3, 20, -29],
  [-22, 21, -20], [-30, 20, -2], [-24, 18, 16], [-10, 14, 27], [2, 9, 25], [9, 4.5, 19.5], [15, 1.4, S.z], [S.x - 3, 0.25, S.z], [S.x, 0, S.z],
].map(([x, y, z]) => new THREE.Vector3(x, y, z)), false, 'centripetal');
const smooth = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
const _t = new THREE.Vector3();
// 출발 후 sec초일 때의 위치 · 방향 (모두 같은 시각으로 계산하므로 다 같이 같은 하늘을 남)
export function sleighPose(sec, out) {
  const u = smooth(Math.min(1, Math.max(0, sec / S.dur)));
  SLEIGH_PATH.getPointAt(u, out.pos);
  SLEIGH_PATH.getTangentAt(Math.min(0.999, Math.max(0.001, u)), _t);
  out.yaw = Math.atan2(-_t.z, _t.x);
  out.pitch = Math.asin(THREE.MathUtils.clamp(_t.y, -1, 1)) * 0.8;
  return out;
}
