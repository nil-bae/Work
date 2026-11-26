// ⛄ 눈싸움장: 사옥 뒤쪽(북쪽) 정원, 울타리로 둘러싸고 사옥 쪽 문으로만 드나듦. 안에 들어가면 F 키(휴대폰은 ❄ 버튼)로 캐릭터가 보는 쪽으로 눈덩이를 던짐.
// 던질 때만 알림 하나({t:'snow', k:'throw'})를 보내고, 눈덩이는 모든 화면이 똑같이 계산해서 날림 (서버 부담 적음).
// 눈덩이는 울타리 밖으로 못 나가고, 안에 있는 사람만 맞음. 맞았는지는 '맞은 사람' 화면이 판단해서 {k:'hit'}를 보냄 → 던진 사람이 맞힘 +1 · 용돈.
// 움직이는 꼬마 눈사람 과녁 3개(혼자서도 연습), 눈 벽 4개(숨기).
import * as THREE from 'three';
import { Kit, canvasTex, SNOW, BOX } from './building.js';

const SPEED = 14, UP = 2.0, G = 9.8, COOL = 0.55;   // 던지는 힘 · 위로 · 중력 · 다시 던지기까지(초)
const REMOTE_DELAY = 0.3;                              // 다른 사람 캐릭터는 조금 늦게 그려지므로 그 사람 눈덩이도 그만큼 늦게
const PAY_HIT = 1000, PAY_TARGET = 100, PAY_DAY = 50000; // 사람 맞히기 · 과녁 맞히기 · 하루 최대 용돈
const WALLS = [[-4.6, -12.9], [4.6, -12.9], [-4.6, -18.3], [4.6, -18.3]]; // 눈 벽 (가로 2.4m)
const WALL = { w: 2.4, d: 0.6, h: 0.8 };
const TARGETS = [{ z: -20.7, a: 6.5, sp: 0.42, ph: 0 }, { z: -20.7, a: 6.5, sp: 0.42, ph: Math.PI }, { z: -15.6, a: 2.2, sp: 0.7, ph: 1.3 }];

const SM = {
  snow: new THREE.MeshStandardMaterial({ color: 0xf3f7fc, roughness: 0.92 }),
  shade: new THREE.MeshStandardMaterial({ color: 0xdfe8f3, roughness: 0.95 }),
  coal: new THREE.MeshStandardMaterial({ color: 0x1b1b20, roughness: 0.6 }),
  carrot: new THREE.MeshStandardMaterial({ color: 0xf07a1f, roughness: 0.6 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x7a5236, roughness: 0.8 }),
  path: new THREE.MeshStandardMaterial({ color: 0xc9c2b4, roughness: 0.8 }),
  fence: new THREE.MeshStandardMaterial({ color: 0xa87c57, roughness: 0.8 }),
  scarf: new THREE.MeshStandardMaterial({ color: 0xd63a3a, roughness: 0.8 }),
  scarf2: new THREE.MeshStandardMaterial({ color: 0x2f7bd6, roughness: 0.8 }),
  ball: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, emissive: 0x30353c }),
};
const BALL_GEO = new THREE.SphereGeometry(0.09, 12, 9);
const PUFF_GEO = new THREE.IcosahedronGeometry(0.06, 0);

export const inSnow = (f, x, z) => f === 0 && x > SNOW.x0 && x < SNOW.x1 && z > SNOW.z0 && z < SNOW.z1;

export function createSnowField(colliders) {
  const group = new THREE.Group(), k = new Kit();
  const { x0, x1, z0, z1 } = SNOW, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  // 눈 바닥 + 가장자리 눈 더미
  k.box(x1 - x0, 0.06, z1 - z0, cx, -0.02, cz, SM.snow);
  for (let i = 0; i < 26; i++) {
    const t = i / 26, side = i % 4;
    const x = side < 2 ? x0 + (x1 - x0) * ((i * 0.37) % 1) : (side === 2 ? x0 : x1);
    const z = side < 2 ? (side === 0 ? z0 : z1) : z0 + (z1 - z0) * ((i * 0.53) % 1);
    if (side === 1 && Math.abs(x - cx) < 2.4) continue; // 남쪽 가운데는 들어오는 길
    k.ball(0.45 + 0.35 * ((t * 7.3) % 1), x, 0, z, i % 3 ? SM.snow : SM.shade, 0.38);
  }
  // 눈 벽 (숨을 곳) + 옆에 눈덩이 무더기
  for (const [x, z] of WALLS) {
    k.box(WALL.w, WALL.h, WALL.d, x, 0, z, SM.snow);
    for (let j = 0; j < 5; j++) k.ball(0.11, x + (j % 3 - 1) * 0.2 + 0.9, 0.08 + (j > 2 ? 0.16 : 0), z + (z > cz ? 0.55 : -0.55) + (j > 2 ? 0 : 0.05), SM.snow);
    colliders.push({ x1: x - WALL.w / 2, z1: z - WALL.d / 2, x2: x + WALL.w / 2, z2: z + WALL.d / 2, tall: false, top: WALL.h, fixedTop: true });
  }
  // 사옥 뒷문에서 눈싸움장 문까지 돌길
  for (let z = -7.0; z > z1 - 0.2; z -= 0.75) for (const e of [-1, 1]) k.box(1.0, 0.05, 0.6, cx + e * 0.58, -0.01, z, SM.path);
  // 울타리: 둘레를 막고, 사옥 쪽(남쪽) 가운데만 문으로 열어 둠 → 문으로만 드나듦
  const F = SM.fence, FH = 1.05, GATE = 1.4;
  const rail = (ax, az, bx, bz) => {
    const len = Math.hypot(bx - ax, bz - az), mx = (ax + bx) / 2, mz = (az + bz) / 2, ry = Math.atan2(bx - ax, bz - az) + Math.PI / 2;
    for (const y of [0.35, 0.8]) k.add(BOX, F, mx, y, mz, ry, len, 0.08, 0.05);
    for (let t = 0; t <= len + 0.01; t += 1.15) { const u = len ? t / len : 0; k.box(0.11, FH, 0.11, ax + (bx - ax) * u, 0, az + (bz - az) * u, F); k.ball(0.075, ax + (bx - ax) * u, FH + 0.02, az + (bz - az) * u, SM.snow, 0.7); }
    const T = 0.25; // 부딪힘
    colliders.push({ x1: Math.min(ax, bx) - T, z1: Math.min(az, bz) - T, x2: Math.max(ax, bx) + T, z2: Math.max(az, bz) + T, tall: true });
  };
  rail(x0, z0, x1, z0); rail(x0, z0, x0, z1); rail(x1, z0, x1, z1);
  rail(x0, z1, cx - GATE, z1); rail(cx + GATE, z1, x1, z1);
  // 문 아치 + 간판
  for (const e of [-1, 1]) { k.box(0.18, 2.5, 0.18, cx + e * (GATE + 0.05), 0, z1, SM.wood); k.ball(0.14, cx + e * (GATE + 0.05), 2.55, z1, SM.snow, 0.6); }
  k.box(GATE * 2 + 0.5, 0.16, 0.22, cx, 2.38, z1, SM.wood);
  k.flush(group);
  const signMat = new THREE.MeshStandardMaterial({ roughness: 0.7, map: canvasTex(512, 160, (ctx, w, h) => {
    ctx.fillStyle = '#7a5236'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#f6efe2'; ctx.fillRect(9, 9, w - 18, h - 18);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#23324a';
    ctx.font = '800 62px "Pretendard","Apple SD Gothic Neo","Noto Sans KR",sans-serif'; ctx.fillText('⛄ 눈싸움장', w / 2, 62);
    ctx.font = '600 27px "Pretendard","Apple SD Gothic Neo","Noto Sans KR",sans-serif'; ctx.fillStyle = '#5b6578'; ctx.fillText('안에서만 던질 수 있어요 · F 키 / ❄ 버튼', w / 2, 122);
  }) });
  for (const e of [1, -1]) { // 바깥(남쪽)과 안쪽 양면
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.72), signMat);
    sign.position.set(cx, 1.98, z1 + e * 0.13); if (e < 0) sign.rotation.y = Math.PI; group.add(sign);
  }

  // 꼬마 눈사람 과녁 (모두 같은 시계로 움직여서 누구 화면에서나 같은 자리)
  const targets = TARGETS.map((t, i) => {
    const g = new THREE.Group(), kk = new Kit();
    kk.ball(0.32, 0, 0.3, 0, SM.snow); kk.ball(0.23, 0, 0.75, 0, SM.snow);
    kk.ball(0.03, -0.08, 0.8, 0.2, SM.coal); kk.ball(0.03, 0.08, 0.8, 0.2, SM.coal);
    for (let j = 0; j < 3; j++) kk.ball(0.025, 0, 0.5 - j * 0.11 + 0.05, 0.31 - j * 0.01, SM.coal);
    kk.add(new THREE.ConeGeometry(0.035, 0.18, 8).rotateX(Math.PI / 2), SM.carrot, 0, 0.76, 0.3); // 당근 코 (앞을 향함)
    kk.cyl(0.24, 0.06, 0, 0.55, 0, i % 2 ? SM.scarf2 : SM.scarf, 16);
    kk.cyl(0.16, 0.18, 0, 0.94, 0, SM.coal, 14); kk.cyl(0.24, 0.025, 0, 0.94, 0, SM.coal, 16);
    kk.flush(g);
    group.add(g);
    return { ...t, g, wob: 0 };
  });
  function placeTargets(dt) {
    const s = Date.now() / 1000;
    for (const t of targets) {
      const x = Math.sin(s * t.sp + t.ph) * t.a;
      t.g.position.set(x, 0, t.z);
      t.wob = Math.max(0, t.wob - dt * 2.5);
      t.g.rotation.z = Math.sin(t.wob * 18) * t.wob * 0.35;
    }
  }
  return { group, targets, placeTargets };
}

export function createSnowFight(api) {
  const { scene, field, me, peers, $ } = api;
  const fx = new THREE.Group(); scene.add(fx);
  const balls = [], puffs = [];
  let inField = false, last = null, nextThrow = 0, seq = 0, hits = 0, gotHit = 0, splatT = 0;
  const today = () => new Date().toLocaleDateString('ko-KR');
  let pay = { day: '', won: 0 };
  try { pay = { ...pay, ...JSON.parse(localStorage.getItem('work-snow2') || '{}') }; } catch {}
  const won = (n) => `${Math.round(n).toLocaleString('ko-KR')}원`;
  function reward(n) {
    if (pay.day !== today()) pay = { day: today(), won: 0 };
    const give = Math.max(0, Math.min(n, PAY_DAY - pay.won));
    if (give) { pay.won += give; api.earn(give); try { localStorage.setItem('work-snow2', JSON.stringify(pay)); } catch {} }
    hud();
    return give;
  }
  let flashMsg = '', flashT = 0;
  function flash(t) { flashMsg = t; clearTimeout(flashT); hud(); flashT = setTimeout(() => { flashMsg = ''; hud(); }, 1400); }
  function hud() {
    const el = $('snowHud'); if (!el) return;
    el.classList.toggle('flash', !!flashMsg);
    if (flashMsg && inField) { el.hidden = false; el.innerHTML = `<b>${flashMsg}</b>`; return; }
    el.hidden = !inField;
    if (!inField) return;
    if (pay.day !== today()) pay = { day: today(), won: 0 };
    el.innerHTML = `⛄ 눈싸움장 · 🎯 맞힘 <b>${hits}</b> · ❄ 맞음 <b>${gotHit}</b> · 오늘 상금 <b>${won(pay.won)}</b>${pay.won >= PAY_DAY ? ' (오늘 최대)' : ''}`;
  }

  function spawn(b, wait = 0) {
    if (balls.length > 24) kill(balls[0]);
    const m = new THREE.Mesh(BALL_GEO, SM.ball); m.visible = false; fx.add(m);
    balls.push({ ...b, m, t: 0, wait });
  }
  function kill(b, puffAt = true) {
    const i = balls.indexOf(b); if (i < 0) return;
    balls.splice(i, 1); fx.remove(b.m);
    if (puffAt && b.t > 0) puff(b.x, Math.max(0.05, b.y), b.z, 0.8);
  }
  function puff(x, y, z, s = 1) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, transparent: true, opacity: 0.95, emissive: 0x3a3f46 });
    const g = new THREE.Group(); g.position.set(x, y, z);
    for (let i = 0; i < 7; i++) {
      const m = new THREE.Mesh(PUFF_GEO, mat), a = (i / 7) * Math.PI * 2;
      m.userData.v = new THREE.Vector3(Math.cos(a) * 1.4, 0.8 + (i % 3) * 0.6, Math.sin(a) * 1.4).multiplyScalar(s);
      m.scale.setScalar(s * (0.8 + (i % 3) * 0.3)); g.add(m);
    }
    fx.add(g); puffs.push({ g, mat, t: 0 });
  }

  // 던지기: 캐릭터가 바라보는 쪽으로 (휴대폰은 카메라가 안 돌아서, 화면 방향으로 하면 늘 한쪽으로만 날아갔음)
  function throwBall() {
    if (!inField || api.busy() || api.now() < nextThrow) return;
    nextThrow = api.now() + COOL;
    const p = api.player(), av = api.avatar();
    let yaw = p.ry + Math.PI; // 캐릭터 정면 (ry=0이면 남쪽 +z)
    // 살짝 도와주기: 보는 방향에서 17° 안쪽 · 9m 안에 사람(또는 눈사람)이 있으면 그쪽으로 (휴대폰에서도 맞힐 수 있게)
    let best = 0.3, aim = null;
    const cand = [...[...peers.values()].filter((q) => q.floor === 0 && inSnow(0, q.x, q.z)).map((q) => [q.x, q.z]), ...field.targets.map((t) => [t.g.position.x, t.g.position.z])];
    for (const [tx, tz] of cand) {
      const d = Math.hypot(tx - p.x, tz - p.z); if (d < 0.6 || d > 9) continue;
      const diff = Math.abs(Math.atan2(Math.sin(Math.atan2(-(tx - p.x), -(tz - p.z)) - yaw), Math.cos(Math.atan2(-(tx - p.x), -(tz - p.z)) - yaw)));
      if (diff < best) { best = diff; aim = [tx, tz]; }
    }
    if (aim) yaw = Math.atan2(-(aim[0] - p.x), -(aim[1] - p.z));
    const dx = -Math.sin(yaw), dz = -Math.cos(yaw);
    p.ry = Math.atan2(dx, dz); // (도움으로 방향이 바뀌면 그쪽을 보게)
    av?.punch(api.now());
    const y0 = (av?.root.position.y || 0) + 0.78;
    const b = { k: 'throw', t: 'snow', id: `${me.id}-${++seq}`, by: me.id, x: +(p.x + dx * 0.35).toFixed(2), y: +y0.toFixed(2), z: +(p.z + dz * 0.35).toFixed(2), vx: +(dx * SPEED).toFixed(2), vy: UP, vz: +(dz * SPEED).toFixed(2) };
    api.send(b); last = b;
    spawn(b, 0);
    api.whoosh();
    api.sendNow();
  }

  function onEvent(e) {
    if (!e || e.t !== 'snow') return;
    if (e.k === 'throw' && e.by !== me.id) {
      spawn(e, REMOTE_DELAY);
      const p = peers.get(e.by); if (p) { p.av.punch(api.now()); p.ry = Math.atan2(e.vx, e.vz); }
    } else if (e.k === 'hit') {
      /* 11-26: 맞았는지는 던진 사람 화면이 정함(맞은 사람이 자리를 비웠거나 화면이 늦어도 상금이 들어오게) */
      const b = balls.find((q) => q.id === e.bid); if (b) kill(b, false);
      if (e.id === me.id) { gotIt(e.by); return; }
      const v = peers.get(e.id);
      if (v) { v.av.hurt(api.now()); puff(v.x, (v.av.root.position.y || 0) + 0.8, v.z, 1.1); }
    }
  }
  function gotIt(by) {
    const av = api.avatar(), p = api.player(); gotHit++;
    if (av) { av.hurt(api.now()); puff(p.x, _feet(av) + 0.8, p.z, 1.1); }
    api.thump();
    splatT = 1; const sp = $('snowSplat'); if (sp) { sp.hidden = false; sp.style.opacity = '1'; }
    const who = peers.get(by); api.toast(`❄ ${who ? `${who.name}님의` : ''} 눈덩이에 맞았어요!`);
    hud();
  }

  const _feet = (av) => av?.root.position.y || 0;
  function update(dt) {
    const p = api.player();
    const was = inField;
    inField = api.active() && inSnow(p.floor, p.x, p.z);
    if (inField !== was) { hud(); $('btnSnow').hidden = !(inField && api.isTouch); if (inField && !was) api.sys('⛄ 눈싸움장에 들어왔어요! 캐릭터가 보는 쪽으로 눈을 던져요 (F 키 · ❄ 버튼). 사람을 맞히면 +1,000원, 눈사람 과녁은 +100원 (하루 최대 5만 원).'); }
    field.placeTargets(dt);
    for (const b of [...balls]) {
      if (b.wait > 0) { b.wait -= dt; continue; }
      b.m.visible = true;
      // 빠른 눈덩이가 얇은 몸을 지나치지 않게 잘게 나눠서 움직임
      const n = 3, h = dt / n;
      let gone = false;
      for (let s = 0; s < n && !gone; s++) {
        b.t += h; b.vy -= G * h;
        b.x += b.vx * h; b.y += b.vy * h; b.z += b.vz * h;
        if (b.y <= 0.04 || b.t > 2.5 || !inSnow(0, b.x, b.z)) { kill(b); gone = true; break; } // 울타리에 막힘
        // 눈 벽
        for (const [wx, wz] of WALLS) if (Math.abs(b.x - wx) < WALL.w / 2 + 0.05 && Math.abs(b.z - wz) < WALL.d / 2 + 0.05 && b.y < WALL.h + 0.05) { kill(b); gone = true; break; }
        if (gone) break;
        // 눈사람 과녁
        for (const t of field.targets) {
          const tp = t.g.position;
          if (Math.hypot(b.x - tp.x, b.z - tp.z) < 0.36 && b.y < 1.05) {
            t.wob = 1; kill(b); gone = true;
            if (b.by === me.id) { hits++; const g = reward(PAY_TARGET); flash(`⛄ 눈사람 명중!${g ? ` +${won(g)}` : ''}`); api.ding(); } // 채팅에는 안 남김(사용자 요청), 점수판에만 잠깐
            break;
          }
        }
        if (gone) break;
        // 다른 사람: 내 눈덩이가 내 화면에서 맞으면 명중(상금) + 맞은 사람에게 알림. 남의 눈덩이는 터지는 모습만
        for (const [id, q] of peers) {
          if (id === b.by || !inSnow(q.floor, q.x, q.z)) continue;
          if (Math.hypot(b.x - q.x, b.z - q.z) < 0.4 && b.y > _feet(q.av) && b.y < _feet(q.av) + 1.15) {
            kill(b, b.by !== me.id); gone = true;
            if (b.by === me.id) {
              api.send({ t: 'snow', k: 'hit', bid: b.id, by: me.id, id, name: q.name });
              q.av.hurt(api.now()); puff(q.x, _feet(q.av) + 0.8, q.z, 1.1);
              hits++; const g = reward(PAY_HIT);
              api.toast(`🎯 ${q.name}님을 맞혔어요!${g ? ` +${won(g)}` : ''}`); api.ding(); hud();
            }
            break;
          }
        }
      }
      if (!gone) b.m.position.set(b.x, b.y, b.z);
    }
    for (const f of [...puffs]) {
      f.t += dt;
      for (const m of f.g.children) { m.userData.v.y -= 6 * dt; m.position.addScaledVector(m.userData.v, dt); }
      f.mat.opacity = Math.max(0, 0.95 - f.t * 1.6);
      if (f.t > 0.6) { fx.remove(f.g); f.mat.dispose(); puffs.splice(puffs.indexOf(f), 1); }
    }
    if (splatT > 0) { splatT -= dt; const sp = $('snowSplat'); if (sp) { sp.style.opacity = String(Math.max(0, splatT)); if (splatT <= 0) sp.hidden = true; } }
  }
  return { update, onEvent, throw: throwBall, get inField() { return inField; }, get stats() { return { hits, gotHit, won: pay.won, balls: balls.length }; }, get last() { return last; } };
}
