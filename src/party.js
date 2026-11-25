// 🪩 옥상 파티 무대 (옥상 동쪽 소파 옆, 높이 50cm 단 — 점프로 올라감, 11-25 사용자 요청으로 엘리베이터 앞에서 옮김): LED 댄스 플로어 · DJ 부스 · 스피커 · 조명 트러스 · 미러볼 · 네온 간판.
// 무대 위에 서면 💃 춤추기 버튼(컴퓨터는 G 키)이 생김 → 누를 때마다 다른 춤, 움직이면 멈춤. 춤추는 동안 얼굴은 활짝 웃음(avatar.js).
// 진짜 조명은 쓰지 않고 빛나는 재질 · 반투명 빛기둥만 써서 가벼움.
import * as THREE from 'three';
import { Kit, canvasTex } from './building.js';

export const PARTY = { x0: 6.65, x1: 9.8, z0: 0.85, z1: 5.05, h: 0.5 }; // 옥상(4층) 동쪽 소파 옆, 높이 50cm 무대 (점프로 올라감)
export const inParty = (f, x, z) => f === 4 && x > PARTY.x0 - 0.2 && x < PARTY.x1 && z > PARTY.z0 - 0.2 && z < PARTY.z1 + 0.2; // 가장자리에 걸쳐 서 있어도 (바닥에선 단에 막혀 여기까지 못 옴)
export const DANCES = ['', '🙌 신나는 점프', '🌊 웨이브', '🤖 로봇 댄스', '🌀 빙글빙글', '💃 셔플'];

export function createPartyStage(floor) {
  const g = new THREE.Group(), k = new Kit();
  const col = (x1, z1, x2, z2) => floor.colliders.push({ x1, z1, x2, z2, tall: true });
  const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...o });
  const black = mat(0x15161b, { roughness: 0.35, metalness: 0.4 }), metal = mat(0x8d939c, { metalness: 0.8, roughness: 0.3 });
  const neonP = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 0.4, 1.6) }), neonC = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 1.8, 2.2) });
  const { x0, x1, z0, z1, h: Y } = PARTY, zc = (z0 + z1) / 2;

  // --- 무대 단 (높이 50cm, 점프해서 올라감) + 앞 · 옆 네온 테두리 ---
  k.box(x1 - x0, Y, z1 - z0, (x0 + x1) / 2, 0.05, zc, black);
  k.box(0.03, 0.04, z1 - z0, x0 - 0.005, Y - 0.06, zc, neonP);
  k.box(0.03, 0.04, z1 - z0, x0 - 0.005, 0.12, zc, neonC);
  for (const z of [z0, z1]) k.box(x1 - x0, 0.04, 0.03, (x0 + x1) / 2, Y - 0.06, z, neonP);
  floor.colliders.push({ x1: x0, z1: z0, x2: x1, z2: z1, tall: false, top: Y + 0.05, fixedTop: true });

  // --- LED 댄스 플로어 (무대 위, 4 × 7칸) ---
  const FX0 = x0 + 0.1, FX1 = 8.85, FZ0 = z0 + 0.12, FZ1 = z1 - 0.12, NX = 4, NZ = 7, tw = (FX1 - FX0) / NX, td = (FZ1 - FZ0) / NZ, FY = Y + 0.05;
  const tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(tw - 0.04, 0.025, td - 0.04), new THREE.MeshBasicMaterial({ color: 0xffffff }), NX * NZ);
  const m4 = new THREE.Matrix4(), cells = [];
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) { cells.push([i, j]); tiles.setMatrixAt(cells.length - 1, m4.makeTranslation(FX0 + tw * (i + 0.5), FY + 0.012, FZ0 + td * (j + 0.5))); }
  tiles.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NX * NZ * 3), 3);
  g.add(tiles);

  // --- DJ 부스 (동쪽 난간 앞, 서쪽 = 소파 쪽을 봄) ---
  const bx = 9.3, bz = zc;
  k.box(0.7, 1.0, 1.7, bx, FY, bz, black);
  k.box(0.02, 0.05, 1.6, bx - 0.36, FY + 0.7, bz, neonC);
  k.box(0.02, 0.05, 1.6, bx - 0.36, FY + 0.35, bz, neonP);
  for (const dz of [-0.45, 0.45]) { k.cyl(0.19, 0.03, bx, FY + 1.0, bz + dz, mat(0x222228, { metalness: 0.5 }), 24); k.cyl(0.08, 0.035, bx, FY + 1.01, bz + dz, mat(0xe8352f), 16); } // 턴테이블
  k.box(0.28, 0.04, 0.32, bx, FY + 1.0, bz, mat(0x30323a));                          // 믹서
  for (let i = 0; i < 4; i++) k.box(0.03, 0.02, 0.03, bx - 0.05, FY + 1.04, bz - 0.12 + i * 0.08, i % 2 ? neonP : neonC);
  col(bx - 0.38, bz - 0.88, bx + 0.38, bz + 0.88);
  // 스피커 (부스 양옆)
  const SPK = [z0 + 0.4, z1 - 0.4];
  for (const sz of SPK) { k.box(0.6, 1.5, 0.6, 9.4, FY, sz, black); col(9.1, sz - 0.3, 9.7, sz + 0.3); }
  // 조명 트러스 (무대 위 문 모양 틀)
  const TX = 7.75, TH = FY + 2.9;
  for (const z of [z0 + 0.12, z1 - 0.12]) { k.box(0.16, 2.9, 0.16, TX, FY, z, metal); col(TX - 0.12, z - 0.12, TX + 0.12, z + 0.12); }
  k.box(0.18, 0.18, z1 - z0, TX, TH, zc, metal);
  k.flush(g);
  // 스피커 우퍼 (앞면 원판 + 테, 서쪽을 봄)
  for (const sz of SPK) for (const [y, r] of [[FY + 0.6, 0.2], [FY + 1.2, 0.11]]) { const d = new THREE.Mesh(new THREE.CircleGeometry(r, 24), mat(0x0b0b0e, { roughness: 0.9 })); d.position.set(9.09, y, sz); d.rotation.y = -Math.PI / 2; g.add(d); const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.015, 6, 24), metal); ring.position.copy(d.position); ring.rotation.y = -Math.PI / 2; g.add(ring); }

  // 네온 간판 (트러스 위, 양면)
  const sign = canvasTex(1024, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '900 150px "Pretendard","Apple SD Gothic Neo","Noto Sans KR",sans-serif';
    ctx.shadowColor = '#ff4fd8'; ctx.shadowBlur = 36; ctx.fillStyle = '#ffd1f4'; ctx.fillText('PARTY 🪩', w / 2, h / 2 + 6);
    ctx.shadowBlur = 12; ctx.fillText('PARTY 🪩', w / 2, h / 2 + 6);
  });
  for (const ry of [-Math.PI / 2, Math.PI / 2]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.75), new THREE.MeshBasicMaterial({ map: sign, transparent: true, depthWrite: false })); s.position.set(TX + (ry < 0 ? -0.11 : 0.11), TH + 0.55, zc); s.rotation.y = ry; g.add(s); }

  // 미러볼 (트러스 가운데에 매달려 돎)
  const ballG = new THREE.Group(); ballG.position.set(TX, TH - 0.55, zc); g.add(ballG);
  const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.4, 4), metal); wire.position.y = 0.4; ballG.add(wire);
  const mirror = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 2), new THREE.MeshStandardMaterial({ color: 0xe8eef6, metalness: 0.55, roughness: 0.18, flatShading: true, emissive: 0x8a93a6, emissiveIntensity: 0.9 }));
  ballG.add(mirror);
  // 반짝이 점 (무대 위에 떠다니는 빛 조각)
  const spk = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.09, 0.09), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }), 40);
  const spkPos = Array.from({ length: 40 }, (_, i) => [Math.random() * Math.PI * 2, FY + 0.4 + Math.random() * 1.9, 0.5 + Math.random() * 1.3, i]);
  g.add(spk);

  // 무대 조명 빛기둥 (트러스에서 무대로, 흔들림)
  const beamMat = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const beams = [[z0 + 0.7, 0xff4fd8], [zc - 0.6, 0x4fd8ff], [zc + 0.6, 0xffd84f], [z1 - 0.7, 0x7dff6a]].map(([z, c], i) => {
    const pivot = new THREE.Group(); pivot.position.set(TX, TH - 0.1, z); g.add(pivot);
    const geo = new THREE.ConeGeometry(0.7, 2.7, 20, 1, true); geo.translate(0, -1.35, 0);
    pivot.add(new THREE.Mesh(geo, beamMat(c)));
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.2, 12), black); pivot.add(head);
    return { pivot, ph: i * 1.7 };
  });
  floor.group.add(g);

  const col3 = new THREE.Color(), pal = [0xff4fd8, 0x4fd8ff, 0xffd84f, 0x7dff6a, 0xa66bff, 0xff7a4f].map((c) => new THREE.Color(c));
  const q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  function update(t) {
    if (!floor.group.visible) return;
    const beat = Math.floor(t * 2.1);
    cells.forEach(([i, j], n) => {
      const wave = Math.sin(t * 3 + i * 0.9 + j * 0.6) * 0.5 + 0.5;
      col3.copy(pal[(i + j + beat) % pal.length]).multiplyScalar(0.25 + wave * 1.1);
      tiles.setColorAt(n, col3);
    });
    tiles.instanceColor.needsUpdate = true;
    mirror.rotation.y = t * 0.8;
    spkPos.forEach(([a, y, r, i]) => {
      const ang = a + t * 0.8;
      v.set(TX + Math.cos(ang) * r, y + Math.sin(t * 2 + i) * 0.05, zc + Math.sin(ang) * r * 1.4);
      q.setFromEuler(e.set(0, -ang, 0));
      m4.compose(v, q, one.setScalar(0.6 + 0.4 * Math.abs(Math.sin(t * 6 + i))));
      spk.setMatrixAt(i, m4);
    });
    spk.instanceMatrix.needsUpdate = true;
    for (const b of beams) { b.pivot.rotation.x = Math.sin(t * 1.3 + b.ph) * 0.4; b.pivot.rotation.z = Math.cos(t * 0.9 + b.ph) * 0.45; }
  }
  return { update };
}
