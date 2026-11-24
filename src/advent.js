// 🎄 크리스마스 출석 이벤트 (11/24 ~ 12/25, advent.js — 장식 · 썰매는 xmas.js): 하루에 한 번 들어오면 도장, 모이면 한정판 선물.
// 선물은 부티크에서 팔지 않음(출석으로만). 도장은 지갑(stocks.__xmas)에 이름별로 저장 → 다른 기기에서도 이어짐, 하루 한 번 저장이라 서버 부담 거의 없음.
// 선물 카드 그림은 '내 캐릭터가 그 아이템을 착용한 모습'을 따로 그려서 보여 줌.
import * as THREE from 'three';
import { Avatar } from './avatar.js';

export const ADVENT = { start: '2026-11-24', end: '2026-12-25' };
export const XMAS_REWARDS = [
  { n: 1, id: 'rudolph', name: '루돌프 뿔 머리띠', icon: '🦌', slot: 'head' },
  { n: 3, id: 'xknit', name: '홀리데이 니트 목도리', icon: '🧣', slot: 'neck' },
  { n: 6, id: 'santasack', name: '산타 보따리', icon: '🎁', slot: 'bag' },
  { n: 10, id: 'santaboots', name: '산타 부츠', icon: '👢', slot: 'feet' },
  { n: 15, id: 'santacoat', name: '산타 코트', icon: '🎅', slot: 'body' },
  { n: 21, id: 'snowwings', name: '눈꽃 날개', icon: '❄️', slot: 'back' },
  { xday: true, id: 'xstar', name: '크리스마스 스타', icon: '🌟', slot: 'top' },
];
const pad = (n) => String(n).padStart(2, '0');
const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const XMAS_DAYS = (() => { const out = [], d = new Date(ADVENT.start + 'T12:00:00'); while (key(d) <= ADVENT.end) { out.push(key(d)); d.setDate(d.getDate() + 1); } return out; })();
const md = (k) => `${+k.slice(5, 7)}/${+k.slice(8)}`;
const DOW = ['일', '월', '화', '수', '목', '금', '토'];

export function createXmas(api) {
  const { $, money } = api;
  const on = () => { const t = money.today(); return t >= ADVENT.start && t <= ADVENT.end; };
  const visible = () => money.today() <= '2026-12-31';
  const days = () => money.xmasDays().filter((d) => d >= ADVENT.start && d <= ADVENT.end);
  const earned = (r, ds = days()) => (r.xday ? ds.includes(ADVENT.end) : ds.length >= r.n);
  let fresh = null; // 방금 받은 선물 (창 위쪽에 크게)

  // ---- 선물 카드 그림: 내 캐릭터가 착용한 모습 ----
  const pics = new Map();
  let picKey = '';
  function drawPics() {
    const k = `${api.me.color}|${api.me.gender}|${api.me.look}`;
    if (k === picKey && pics.size) return;
    picKey = k; pics.clear();
    let r;
    try { r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch { return; }
    const S = 220; r.setSize(S, S); r.setPixelRatio(1); r.toneMapping = THREE.ACESFilmicToneMapping;
    const sc = new THREE.Scene();
    sc.add(new THREE.HemisphereLight(0xf3f6ff, 0x4a3a30, 2.4)); const l = new THREE.DirectionalLight(0xffffff, 2.2); l.position.set(1.5, 2.5, 3); sc.add(l);
    const cam = new THREE.PerspectiveCamera(24, 1, 0.1, 20);
    for (const it of XMAS_REWARDS) {
      const a = new Avatar('', api.me.color, api.me.gender, api.me.look); a.label.visible = false; a.setAcc([it.id]);
      const back = it.slot === 'back' || it.slot === 'bag';
      a.root.rotation.y = it.slot === 'back' ? Math.PI * 0.82 : back ? Math.PI * 0.75 : -0.42; a.animate?.(0.25, 0, 1);
      const feet = it.slot === 'feet';
      cam.position.set(0, feet ? 0.75 : 0.95, feet ? 2.9 : 3.6); cam.lookAt(0, feet ? 0.42 : (it.slot === 'top' ? 0.95 : 0.7), 0);
      sc.add(a.root); r.render(sc, cam); pics.set(it.id, r.domElement.toDataURL('image/png'));
      sc.remove(a.root); a.dispose?.();
    }
    r.dispose(); r.forceContextLoss?.();
  }

  function render() {
    const ds = days(), t = money.today(), n = ds.length, owned = money.items(), wear = money.wear();
    const next = XMAS_REWARDS.find((r) => !r.xday && !earned(r, ds));
    const left = XMAS_DAYS.filter((d) => d >= t).length - (ds.includes(t) ? 1 : 0);
    drawPics();
    $('xmasStat').innerHTML = `<div><b>${n}</b><span>일 출석</span></div>`
      + `<p>${!on() ? (t < ADVENT.start ? '곧 시작해요!' : '이벤트가 끝났어요. 받은 선물은 계속 착용할 수 있어요 🎄') : next ? `다음 선물 <b>${next.icon} ${next.name}</b>까지 <b>${next.n - n}일</b>` : '날개까지 다 모았어요! 12월 25일에 들어오면 🌟 마지막 선물'}${on() ? `<br><small>남은 날 ${left}일 · 하루 한 번 들어오기만 하면 도장 쾅!</small>` : ''}</p>`;
    const pct = Math.min(1, n / 21);
    $('xmasBar').innerHTML = `<i style="width:${pct * 100}%"></i>` + XMAS_REWARDS.filter((r) => !r.xday).map((r) => `<em class="${earned(r, ds) ? 'got' : ''}" style="left:${(r.n / 21) * 100}%">${r.icon}<small>${r.n}</small></em>`).join('');
    $('xmasFresh').hidden = !fresh;
    if (fresh) $('xmasFresh').innerHTML = `<img src="${pics.get(fresh.id) || ''}" alt=""><div><small>🎁 새 선물이 도착했어요!</small><b>${fresh.icon} ${fresh.name}</b><span>출석으로만 받을 수 있는 한정판이에요</span><button type="button" data-wear="${fresh.id}" class="${wear[fresh.slot] === fresh.id ? 'on' : ''}">${wear[fresh.slot] === fresh.id ? '✔ 착용 중' : '지금 착용하기'}</button></div>`;
    $('xmasGifts').innerHTML = XMAS_REWARDS.map((r) => {
      const got = earned(r, ds) && owned.includes(r.id), worn = wear[r.slot] === r.id;
      const need = r.xday ? '12/25 당일 출석' : `출석 ${r.n}일`;
      const btn = got ? `<button type="button" data-wear="${r.id}" class="${worn ? 'on' : ''}">${worn ? '✔ 착용 중' : '착용하기'}</button>` : `<span class="lock">🔒 ${r.xday ? '12/25' : `${r.n - n}일 남음`}</span>`;
      return `<li class="${got ? 'got' : ''} ${r.xday ? 'star' : ''}"><img src="${pics.get(r.id) || ''}" alt=""><small>${need}</small><b>${r.icon} ${r.name}</b>${btn}</li>`;
    }).join('');
    $('xmasCal').innerHTML = DOW.map((d) => `<i>${d}</i>`).join('') + '<i></i>'.repeat(new Date(ADVENT.start + 'T12:00:00').getDay())
      + XMAS_DAYS.map((d) => { const st = ds.includes(d), cls = [st ? 'st' : '', d === t ? 'today' : '', d > t ? 'future' : '', d < t && !st ? 'miss' : '', d === ADVENT.end ? 'xday' : ''].join(' ');
        return `<span class="${cls}"${d === t && st && api.justStamped ? ' data-new' : ''}>${md(d)}${st ? '<em>❄</em>' : d === ADVENT.end ? '<em class="x">🎄</em>' : ''}</span>`; }).join('');
    document.querySelectorAll('#xmasModal [data-wear]').forEach((b) => (b.onclick = () => {
      const r = XMAS_REWARDS.find((x) => x.id === b.dataset.wear);
      money.setWear(r.slot, money.wear()[r.slot] === r.id ? null : r.id); api.changed(); render();
    }));
    api.justStamped = false;
    const chip = $('xmasCount'); if (chip) chip.textContent = n;
  }

  // 들어올 때 한 번: 오늘 도장 + 새 선물 지급
  function checkIn() {
    $('btnXmas').hidden = !visible();
    if (!on() || !money.ready) { render(); return false; }
    const t = money.today();
    const stamped = money.stampDay(t);
    const ds = days();
    fresh = null;
    for (const r of XMAS_REWARDS) if (earned(r, ds) && money.grant(r.id)) fresh = r; // 늦게 받아도(예: 다른 기기) 빠짐없이
    render();
    if (!stamped) return false;
    api.justStamped = true; render();
    api.beep();
    api.sys(`🎄 크리스마스 출석 도장 쾅! 지금까지 ${ds.length}일 출석${fresh ? ` · 🎁 ${fresh.name}을(를) 받았어요!` : ''}`);
    return true;
  }
  function open() { render(); api.openModal('xmasModal'); }
  $('btnXmas').onclick = () => { fresh = null; open(); };
  return { checkIn, open, render, get on() { return on(); }, earned: (id) => { const r = XMAS_REWARDS.find((x) => x.id === id); return r ? earned(r) : false; } };
}
