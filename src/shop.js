// 👜 WORK BOUTIQUE: 회사 동쪽 잔디의 작은 명품관. 월급으로 캐릭터 아이템을 사서 착용 (게임 속 가상 돈)
import * as THREE from 'three';
import { Kit, MATERIALS as M, canvasTex, panel, ICO, BALL } from './building.js';
import { Avatar, makeAcc, ACC_SLOTS } from './avatar.js';
import { XMAS_REWARDS } from './advent.js';

// 가격: 시급 10,320원 기준 — 작은 소품은 3~6시간, 날개·고리는 하루~이틀, 왕관은 일주일쯤, 티아라는 한 달 꼬박 모아야 살 수 있게
export const ITEMS = [
  { id: 'glasses', name: '동그란 금테 안경', icon: '👓', slot: 'face', price: 30000 },
  { id: 'sunglasses', name: '시크한 선글라스', icon: '🕶️', slot: 'face', price: 50000 },
  { id: 'ribbon', name: '핑크 리본 머리띠', icon: '🎀', slot: 'head', price: 40000 },
  { id: 'santa', name: '산타 모자', icon: '🎅', slot: 'head', price: 50000 },
  { id: 'catears', name: '고양이 귀 머리띠', icon: '🐱', slot: 'head', price: 60000 },
  { id: 'flower', name: '봄꽃 화관', icon: '🌸', slot: 'head', price: 80000 },
  { id: 'halo', name: '천사 고리', icon: '😇', slot: 'top', price: 150000 },
  { id: 'butterfly', name: '나비 날개', icon: '🦋', slot: 'back', price: 150000 },
  { id: 'bat', name: '꼬마 박쥐 날개', icon: '🦇', slot: 'back', price: 180000 },
  { id: 'wings', name: '천사 날개', icon: '🕊️', slot: 'back', price: 250000 },
  { id: 'crown', name: '황금 왕관', icon: '👑', slot: 'head', price: 300000 },
  { id: 'diacrown', name: '다이아몬드 티아라', icon: '💎', slot: 'head', price: 1000000 },
  // 👜 가방
  { id: 'tote', name: '미니 토트백', icon: '👜', slot: 'bag', price: 120000, cat: 'bag' },
  { id: 'backpack', name: '가죽 백팩', icon: '🎒', slot: 'bag', price: 180000, cat: 'bag' },
  { id: 'clutch', name: '샴페인 골드 클러치', icon: '👛', slot: 'bag', price: 220000, cat: 'bag' },
  { id: 'chainbag', name: '퀼팅 체인백', icon: '🖤', slot: 'bag', price: 350000, cat: 'bag' },
  { id: 'pradybag', name: '프라디 나일론 호보백', icon: '🖤', slot: 'bag', price: 420000, cat: 'bag' },
  // 🛴 탈것 (발밑에, 🛴 버튼 · R 키로 타고 내림)
  { id: 'kickblack', name: '어반 블랙 킥보드', icon: '🛴', slot: 'ride', price: 150000, cat: 'ride' },
  { id: 'kickmint', name: '민트 크림 킥보드', icon: '🛴', slot: 'ride', price: 220000, cat: 'ride' },
  { id: 'kickgold', name: '크롬 골드 킥보드', icon: '✨', slot: 'ride', price: 400000, cat: 'ride' },
  // 👗 옷
  { id: 'muffler', name: '캐시미어 머플러', icon: '🧣', slot: 'neck', price: 70000, cat: 'wear' },
  { id: 'tweed', name: '핑크 트위드 재킷', icon: '🧥', slot: 'body', price: 280000, cat: 'wear' },
  { id: 'cape', name: '레드 벨벳 망토', icon: '🦸', slot: 'body', price: 300000, cat: 'wear' },
  { id: 'dress', name: '샴페인 파티 드레스', icon: '👗', slot: 'body', price: 380000, cat: 'wear' },
  { id: 'furcoat', name: '화이트 퍼 코트', icon: '🤍', slot: 'body', price: 450000, cat: 'wear' },
  { id: 'gucicardi', name: '구치 니트 가디건', icon: '🧶', slot: 'body', price: 390000, cat: 'wear' },
  { id: 'blackdress', name: '블랙 미니 드레스 & 진주', icon: '🖤', slot: 'body', price: 360000, cat: 'wear' },
  { id: 'reddress', name: '레드 실크 롱 드레스', icon: '💃', slot: 'body', price: 520000, cat: 'wear' },
  { id: 'navysuit', name: '네이비 더블 수트', icon: '🤵', slot: 'body', price: 480000, cat: 'wear' },
  { id: 'tuxedo', name: '블랙 턱시도', icon: '🎩', slot: 'body', price: 550000, cat: 'wear' },
];
// 🎄 크리스마스 출석 한정판: 팔지 않고 진열만(출석해야 받음) — advent.js
for (const r of XMAS_REWARDS) ITEMS.push({ id: r.id, name: r.name, icon: r.icon, slot: r.slot, price: 0, cat: 'xmas', limited: r.xday ? '12/25 당일 출석' : `출석 ${r.n}일` });
for (const it of ITEMS) it.cat ||= 'acc';
const CATS = { all: '전체', xmas: '🎄 출석 한정', acc: '✨ 액세서리', bag: '👜 가방', wear: '👗 옷', ride: '🛴 탈것' };
export const SHOP = { x0: 17.5, x1: 25.5, z0: -8, z1: 0, door: [-5.1, -2.9], counter: { x: 23.1, z: -4 }, clerk: { x: 24.75, z: -4 } };
const won = (n) => `${Math.round(n).toLocaleString('ko-KR')}원`;

const SM = {
  marble: null,
  cream: new THREE.MeshStandardMaterial({ color: 0xf1e9dc, roughness: 0.6 }),
  navy: new THREE.MeshStandardMaterial({ color: 0x1b2233, roughness: 0.55 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xd9ad48, roughness: 0.25, metalness: 0.85, emissive: 0x2a1c00 }),
  black: new THREE.MeshStandardMaterial({ color: 0x0e0e12, roughness: 0.3, metalness: 0.2 }),
  velvet: new THREE.MeshStandardMaterial({ color: 0x8e1b2c, roughness: 0.9 }),
  glass: new THREE.MeshStandardMaterial({ color: 0xcfe8ff, roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false }),
  white: new THREE.MeshStandardMaterial({ color: 0xfbfaf6, roughness: 0.35 }),
  spot: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.55, 1.1) }),
  bust: new THREE.MeshStandardMaterial({ color: 0xece6dc, roughness: 0.5 }),
  carpet: new THREE.MeshStandardMaterial({ color: 0xa3192a, roughness: 0.95 }),
};
SM.marble = new THREE.MeshStandardMaterial({ roughness: 0.25, metalness: 0.05, map: canvasTex(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#f4f1ea'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) { ctx.strokeStyle = `rgba(150,140,125,${0.08 + Math.random() * 0.12})`; ctx.lineWidth = 1 + Math.random() * 2; ctx.beginPath(); let x = Math.random() * w, y = Math.random() * h; ctx.moveTo(x, y); for (let j = 0; j < 6; j++) { x += (Math.random() - 0.4) * 120; y += (Math.random() - 0.5) * 90; ctx.lineTo(x, y); } ctx.stroke(); }
  ctx.strokeStyle = 'rgba(200,170,100,0.35)'; ctx.lineWidth = 3; ctx.strokeRect(0, 0, w, h); // 타일 금줄
}) });
SM.marble.map.wrapS = SM.marble.map.wrapT = THREE.RepeatWrapping; SM.marble.map.repeat.set(4, 4);

export function createShop(colliders) {
  const group = new THREE.Group(), roof = new THREE.Group();
  const { x0, x1, z0, z1 } = SHOP, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, W = x1 - x0, D = z1 - z0, Hh = 3.6;
  const col = (a, b, c, d, tall = false, top = 0.9) => colliders.push({ x1: a, z1: b, x2: c, z2: d, tall, top });
  const k = new Kit(false), kr = new Kit(false);
  // 바닥 (대리석) + 입구 레드카펫 + 회사에서 오는 돌길
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), SM.marble); floor.rotation.x = -Math.PI / 2; floor.position.set(cx, 0.03, cz); group.add(floor);
  k.box(4.2, 0.02, 1.4, x0 - 1.0, 0.02, -4, SM.carpet);
  k.box(5.6, 0.04, 2.2, 14.3, -0.01, -4, M.stoneLight || SM.cream);
  k.box(2.2, 0.04, 2.0, 11.4, -0.01, -2.6, M.stoneLight || SM.cream); // 회사 동쪽 옆문에서 이어지는 길
  // 벽: 바깥은 크림색 + 금테, 안은 짙은 남색 + 금줄
  const wall = (ax, az, bx, bz) => {
    const len = Math.hypot(bx - ax, bz - az), mx = (ax + bx) / 2, mz = (az + bz) / 2, ry = Math.atan2(bx - ax, bz - az) + Math.PI / 2;
    k.add(new THREE.BoxGeometry(len, Hh, 0.22), SM.cream, mx, Hh / 2, mz, ry);
    const nx = (cx - mx), nz = (cz - mz), nl = Math.hypot(nx, nz) || 1; // 안쪽으로 살짝
    k.add(new THREE.BoxGeometry(len - 0.05, Hh - 0.05, 0.02), SM.navy, mx + (nx / nl) * 0.12, Hh / 2, mz + (nz / nl) * 0.12, ry);
    for (let t = 0.5; t < len; t += 1.0) { const f = t / len; k.add(new THREE.BoxGeometry(0.03, Hh - 0.5, 0.01), SM.gold, ax + (bx - ax) * f + (nx / nl) * 0.135, Hh / 2, az + (bz - az) * f + (nz / nl) * 0.135, ry); }
  };
  wall(x0, z0, x1, z0); wall(x0, z1, x1, z1); wall(x1, z0, x1, z1);
  col(x0 - 0.15, z0 - 0.15, x1 + 0.15, z0 + 0.15, true); col(x0 - 0.15, z1 - 0.15, x1 + 0.15, z1 + 0.15, true); col(x1 - 0.15, z0, x1 + 0.15, z1, true);
  // 앞(서쪽): 문 양옆 쇼윈도 유리 + 검은 틀 + 금빛 문틀
  const [d0, d1] = SHOP.door;
  for (const [a, b] of [[z0, d0], [d1, z1]]) {
    k.add(new THREE.BoxGeometry(0.04, Hh - 0.6, b - a), SM.glass, x0, (Hh - 0.6) / 2 + 0.3, (a + b) / 2);
    k.box(0.16, 0.3, b - a, x0, 0, (a + b) / 2, SM.black); k.box(0.16, 0.3, b - a, x0, Hh - 0.3, (a + b) / 2, SM.black);
    for (const z of [a + 0.05, b - 0.05]) k.box(0.16, Hh, 0.1, x0, 0, z, SM.black);
    col(x0 - 0.15, a, x0 + 0.15, b, true);
  }
  k.box(0.22, 0.25, d1 - d0 + 0.3, x0, Hh - 0.25, (d0 + d1) / 2, SM.gold);
  for (const z of [d0 - 0.08, d1 + 0.08]) k.box(0.22, Hh, 0.16, x0, 0, z, SM.gold);
  // 간판 · 차양
  const sign = canvasTex(1024, 200, (ctx, w, h) => {
    ctx.fillStyle = '#0e0e12'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d9ad48'; ctx.lineWidth = 6; ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.fillStyle = '#e8c56a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '600 92px "Times New Roman", Georgia, serif'; ctx.fillText('W O R K   B O U T I Q U E', w / 2, h / 2 + 4);
  });
  panel(group, sign, 5.2, 1.0, x0 - 0.14, Hh + 0.55, cz, -Math.PI / 2, true);
  k.box(0.2, 1.2, 5.6, x0, Hh, cz, SM.black);
  for (let i = 0; i < 7; i++) k.add(new THREE.BoxGeometry(1.1, 0.04, 0.38), i % 2 ? SM.cream : SM.black, x0 - 0.5, Hh - 0.28, d0 - 0.2 + i * 0.4, 0, 1, 1, 1);
  // 문 앞 토피어리 화분
  for (const z of [d0 - 0.9, d1 + 0.9]) { k.add(new THREE.CylinderGeometry(0.28, 0.22, 0.5, 14), SM.black, x0 - 0.7, 0.25, z); k.add(BALL, M.leaf, x0 - 0.7, 0.9, z, 0, 0.32, 0.32, 0.32); k.add(BALL, M.leaf, x0 - 0.7, 1.35, z, 0, 0.22, 0.22, 0.22); col(x0 - 1.0, z - 0.3, x0 - 0.4, z + 0.3); }
  // 지붕 (안에 들어가면 숨김) + 금 처마
  kr.box(W + 0.4, 0.2, D + 0.4, cx, Hh, cz, SM.cream);
  kr.box(W + 0.5, 0.08, D + 0.5, cx, Hh + 0.2, cz, SM.gold);
  kr.box(W - 0.3, 0.02, D - 0.3, cx, Hh - 0.03, cz, SM.white);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) kr.add(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 16), SM.spot, 19.3 + i * 2.2, Hh - 0.05, -6 + j * 4);
  // 계산대 (금테 + 유리) + 뒤 진열장
  const { x: ccx, z: ccz } = SHOP.counter;
  k.box(0.7, 0.58, 2.4, ccx + 0.6, 0, ccz, SM.white); k.box(0.74, 0.05, 2.44, ccx + 0.6, 0.58, ccz, SM.gold); // 캐릭터 키에 맞춘 낮은 계산대
  k.box(0.02, 0.36, 2.2, ccx + 0.24, 0.12, ccz, SM.gold);
  col(ccx + 0.25, ccz - 1.22, ccx + 0.95, ccz + 1.22, false, 0.63);
  k.box(0.35, 2.4, 3.4, x1 - 0.3, 0, ccz, SM.black);
  for (const y of [0.9, 1.5, 2.1]) k.box(0.36, 0.03, 3.3, x1 - 0.3, y, ccz, SM.gold);
  for (let i = 0; i < 6; i++) k.add(new THREE.BoxGeometry(0.22, 0.28, 0.32), [SM.velvet, SM.cream, SM.gold][i % 3], x1 - 0.32, 0.93 + Math.floor(i / 3) * 0.6 + 0.14, ccz - 0.9 + (i % 3) * 0.9); // 쇼핑백 · 상자
  col(x1 - 0.5, ccz - 1.7, x1 - 0.1, ccz + 1.7, true);
  // 가운데 벨벳 원형 소파 + 샹들리에
  k.add(new THREE.CylinderGeometry(0.75, 0.8, 0.42, 28), SM.velvet, 20.4, 0.21, cz);
  k.add(new THREE.CylinderGeometry(0.25, 0.3, 0.55, 20), SM.velvet, 20.4, 0.62, cz);
  k.add(new THREE.TorusGeometry(0.79, 0.03, 8, 32).rotateX(Math.PI / 2), SM.gold, 20.4, 0.42, cz);
  colliders.push({ circle: true, cx: 20.4, cz, r: 0.82, x1: 19.58, z1: cz - 0.82, x2: 21.22, z2: cz + 0.82, tall: false, top: 0.42 });
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; kr.add(ICO, SM.spot, 20.4 + Math.cos(a) * 0.55, Hh - 0.75, cz + Math.sin(a) * 0.55, 0, 0.05, 0.07, 0.05); }
  kr.add(new THREE.TorusGeometry(0.55, 0.025, 8, 32).rotateX(Math.PI / 2), SM.gold, 20.4, Hh - 0.8, cz);
  kr.add(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 6), SM.gold, 20.4, Hh - 0.4, cz);
  // 진열대 6개 (북쪽 · 남쪽 벽): 금테 받침 + 유리 상자 + 하얀 흉상에 아이템
  const shows = ['crown', 'diacrown', 'wings', 'halo', 'butterfly', 'catears'];
  const display = [];
  shows.forEach((id, i) => {
    const x = 19.0 + (i % 3) * 2.0, z = i < 3 ? z0 + 0.75 : z1 - 0.75;
    k.box(0.62, 0.95, 0.62, x, 0, z, SM.white); k.box(0.66, 0.04, 0.66, x, 0.95, z, SM.gold); k.box(0.66, 0.06, 0.66, x, 0, z, SM.gold);
    k.add(new THREE.BoxGeometry(0.58, 0.85, 0.58), SM.glass, x, 0.99 + 0.425, z);
    col(x - 0.33, z - 0.33, x + 0.33, z + 0.33, true);
    const holder = new THREE.Group(); holder.position.set(x, 0.99, z); holder.scale.setScalar(0.62);
    const bust = new THREE.Mesh(new THREE.SphereGeometry(0.25, 20, 16), SM.bust); bust.position.y = 0.78; holder.add(bust);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.5, 14), SM.bust); neck.position.y = 0.42; holder.add(neck);
    holder.add(makeAcc(id));
    group.add(holder); display.push(holder);
    kr.add(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 14), SM.spot, x, Hh - 0.05, z);
  });
  k.flush(group); kr.flush(roof); group.add(roof);
  // 쇼윈도 마네킹 (문 양옆, 바깥을 바라봄): 퍼 코트 + 체인백 / 파티 드레스 + 클러치
  const mannequins = [[-6.9, ['furcoat', 'chainbag', 'diacrown']], [-1.1, ['dress', 'clutch', 'flower']]].map(([z, acc]) => {
    const m = new Avatar('', '#efe9df', 'f', '15000'); m.label.visible = false; m.setAcc(acc);
    m.root.position.set(x0 + 0.65, 0.08, z); m.root.rotation.y = -Math.PI / 2;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.08, 20), SM.gold); base.position.set(x0 + 0.65, 0.04, z); group.add(base);
    group.add(m.root); col(x0 + 0.35, z - 0.3, x0 + 0.95, z + 0.3);
    return m;
  });
  // 직원 (NPC)
  const clerk = new Avatar('👜 부티크 매니저', '#1b1b22', 'f', '33100');
  clerk.root.position.set(SHOP.clerk.x, 0, SHOP.clerk.z); clerk.root.rotation.y = -Math.PI / 2;
  clerk.setAcc(['glasses']);
  group.add(clerk.root);
  colliders.push({ x1: SHOP.clerk.x - 0.3, z1: SHOP.clerk.z - 0.3, x2: SHOP.clerk.x + 0.3, z2: SHOP.clerk.z + 0.3, tall: false, top: 1.3 });
  let t = 0;
  return {
    group, clerk,
    inside: (x, z) => x > x0 && x < x1 && z > z0 && z < z1,
    update(dt, now, px, pz, onGround) {
      t += dt;
      display.forEach((h, i) => (h.rotation.y = t * 0.6 + i));
      roof.visible = !(onGround && px > x0 - 0.3 && px < x1 + 0.3 && pz > z0 - 0.3 && pz < z1 + 0.3);
      clerk.animate(dt, 0, now);
      mannequins.forEach((m) => m.animate(dt, 0, now));
    },
  };
}

// ---------- 상점 창 ----------
export function createShopUI(api) {
  const { $, money } = api;
  let tab = 'buy', cat = 'all';
  function render() {
    const owned = money.items(), wear = money.wear();
    document.querySelectorAll('#shopTabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === tab));
    $('shopCats').innerHTML = Object.entries(CATS).map(([k, v]) => `<button type="button" data-c="${k}" class="${k === cat ? 'on' : ''}">${v}</button>`).join('');
    $('shopCats').querySelectorAll('button').forEach((b) => (b.onclick = () => { cat = b.dataset.c; render(); }));
    $('shopCash').innerHTML = `지갑 현금 <b>${won(money.cash())}</b>`;
    const list = (tab === 'buy' ? ITEMS : ITEMS.filter((it) => owned.includes(it.id))).filter((it) => cat === 'all' || it.cat === cat);
    $('shopGrid').innerHTML = list.length ? list.map((it) => {
      const has = owned.includes(it.id), on = wear[it.slot] === it.id;
      const btn = !has && it.limited ? `<button data-xmas class="limited">🔒 ${it.limited}</button>` : !has ? `<button data-buy="${it.id}" ${money.cash() < it.price ? 'class="poor"' : ''}>${won(it.price)}</button>` : `<button data-wear="${it.id}" class="${on ? 'on' : ''}">${it.slot === 'ride' ? (on ? '✔ 타는 중 (내리기)' : '🛴 타기') : on ? '✔ 착용 중 (벗기)' : '착용하기'}</button>`;
      return `<li class="${on ? 'worn' : ''}"><i>${it.icon}</i><b>${it.name}</b><small>${ACC_SLOTS[it.slot]}${it.limited ? ' · 판매 안 함' : ''}${has ? ' · 보유' : ''}</small>${btn}</li>`;
    }).join('') : '<p class="sub">아직 산 아이템이 없어요. 부티크에서 골라 보세요!</p>';
    $('shopGrid').querySelectorAll('[data-buy]').forEach((b) => (b.onclick = () => buy(b.dataset.buy)));
    $('shopGrid').querySelectorAll('[data-xmas]').forEach((b) => (b.onclick = () => api.openXmas()));
    $('shopGrid').querySelectorAll('[data-wear]').forEach((b) => (b.onclick = () => toggle(b.dataset.wear)));
    $('shopNote').textContent = api.atShop() ? '같은 부위(얼굴 · 머리 · 머리 위 · 등 · 옷 · 목 · 가방 · 신발 · 탈것)는 하나씩 착용할 수 있어요. 킥보드는 🛴 버튼(컴퓨터는 R 키)으로 타고 내려요.' : '사는 건 부티크 안에서만 할 수 있어요. 산 아이템은 어디서든 착용할 수 있어요.';
  }
  function buy(id) {
    const it = ITEMS.find((x) => x.id === id); if (!it) return;
    if (it.limited) { api.openXmas(); return; }
    if (!api.atShop()) { alert('부티크 안에서 살 수 있어요 (1층 정원 동쪽 WORK BOUTIQUE).'); return; }
    if (money.cash() < it.price) { alert(`현금이 ${won(it.price - money.cash())} 모자라요. 조금 더 일하면 살 수 있어요! 일급은 일하는 대로 바로 들어와요 💸`); return; }
    if (!confirm(`${it.icon} ${it.name}을(를) ${won(it.price)}에 살까요?`)) return;
    if (!money.buy(it.id, it.price)) return;
    money.setWear(it.slot, it.id); api.changed();
    api.sys(it.slot === 'ride' ? `🛴 ${it.name}을(를) 샀어요! 바로 올라탔어요. 🛴 버튼(컴퓨터는 R 키)으로 타고 내려요. 건물 안에서도 탈 수 있어요!` : `🛍️ ${it.name}을(를) 샀어요! 바로 착용했어요 ✨`); api.beep();
    render();
  }
  function toggle(id) {
    const it = ITEMS.find((x) => x.id === id); if (!it) return;
    money.setWear(it.slot, money.wear()[it.slot] === id ? null : id); api.changed(); render();
  }
  document.querySelectorAll('#shopTabs button').forEach((b) => (b.onclick = () => { tab = b.dataset.t; render(); }));
  return { open(t = api.atShop() ? 'buy' : 'mine') { tab = t; render(); api.openModal('shopModal'); }, render };
}
