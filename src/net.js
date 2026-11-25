// 실시간 접속: Supabase Realtime (설정 시) 또는 같은 브라우저 탭끼리(BroadcastChannel)
import { CONFIG } from './config.js';

// siteHost가 정해져 있으면 그 주소에서 열 때만 Supabase에 연결 (복사해 간 사이트는 로컬 데모 모드)
const hostOk = !CONFIG.siteHost || location.hostname === CONFIG.siteHost;
export const supa = (hostOk && CONFIG.supabaseUrl && CONFIG.supabaseAnonKey && window.supabase)
  ? window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey)
  : null;

export function makeId() {
  return (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)).slice(0, 12);
}

/**
 * handlers: { onState(p), onChat(m), onLeave(id), onStatus(text, online), onSync(scope) }
 * 11-25 층별 채널: 자주 보내는 위치(state)는 같은 층 채널('…-f층')로만, 모두에게는 가끔(20초) 공용 채널로.
 * 메시지는 '보낸 1 + 받는 사람 수'로 세서 사람이 늘면 제곱으로 늘어남 → 층으로 나눠 크게 줄임.
 * onSync(scope): scope 'all' = 공용(새로 들어온 사람에게 모두 알림), 'floor' = 같은 층에 새로 온 사람에게
 */
export function connect(me, handlers) {
  const lastSeen = new Map();
  const touch = (id) => lastSeen.set(id, performance.now());
  // handlers.onSync(): 누가 "다들 위치 알려줘" 하면 내 상태를 바로 보냄
  let sendRaw = () => {};
  let sendFloor = () => {};
  let close = () => {};
  let reconnect = () => {};

  let floorNow = -1, setFloor = () => {};
  const floorTopic = (f) => `work-tower-88f-f${f}`;
  if (supa) {
    let channel = null, fch = null;
    const openFloor = (f) => {
      if (fch) { try { supa.removeChannel(fch); } catch {} fch = null; }
      floorNow = f;
      if (f < 0) return;
      const c = supa.channel(floorTopic(f), { config: { broadcast: { self: false } } });
      fch = c;
      c.on('broadcast', { event: 'state' }, ({ payload }) => { touch(payload.id); handlers.onState(payload); })
        .on('broadcast', { event: 'sync' }, () => handlers.onSync?.('floor'))
        .subscribe((status) => { if (status === 'SUBSCRIBED' && fch === c) { c.send({ type: 'broadcast', event: 'sync', payload: { id: me.id } }); handlers.onSync?.('floor'); } });
    };
    setFloor = (f) => { if (f !== floorNow) openFloor(f); };
    const open = () => {
      if (channel) { try { supa.removeChannel(channel); } catch {} }
      channel = supa.channel('work-tower-88f', {
        config: { broadcast: { self: false }, presence: { key: me.id } },
      });
      channel
        .on('broadcast', { event: 'state' }, ({ payload }) => { touch(payload.id); handlers.onState(payload); })
        .on('broadcast', { event: 'chat' }, ({ payload }) => handlers.onChat(payload))
        .on('broadcast', { event: 'sync' }, () => handlers.onSync?.('all'))
        .on('broadcast', { event: 'ev' }, ({ payload }) => handlers.onEvent?.(payload))
        // 창을 X로 닫은 사람은 바로 정리
        .on('broadcast', { event: 'leave' }, ({ payload }) => { if (payload?.id) { lastSeen.delete(payload.id); handlers.onLeave(payload.id); } })
        .on('presence', { event: 'join' }, () => handlers.onSync?.('all'))
        // 잠깐 끊겼다 돌아오는 경우가 많아서, 나갔다는 신호만으로 바로 지우지 않음 (아래 정리에서 판단)
        .on('presence', { event: 'leave' }, ({ key }) => { const t = lastSeen.get(key); if (t) lastSeen.set(key, Math.min(t, performance.now() - 90000)); })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ name: me.name, color: me.color });
            handlers.onStatus('온라인 · 실시간 연결됨', true);
            channel.send({ type: 'broadcast', event: 'sync', payload: { id: me.id } });
            handlers.onSync?.('all');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            handlers.onStatus('연결 오류 · 다시 시도 중', false);
          }
        });
    };
    open();
    sendRaw = (event, payload) => channel?.send({ type: 'broadcast', event, payload });
    sendFloor = (payload) => (fch && fch.state === 'joined' ? fch.send({ type: 'broadcast', event: 'state', payload }) : sendRaw('state', payload)); // 층 채널이 아직이면 공용으로
    close = () => {
      // 창을 닫을 때 '나가요'를 바로 알림: 실시간 연결로 한 번 + 창이 닫혀도 끝까지 가는 요청(keepalive)으로 한 번
      try { channel?.send({ type: 'broadcast', event: 'leave', payload: { id: me.id } }); } catch {}
      try {
        fetch(`${CONFIG.supabaseUrl}/realtime/v1/api/broadcast`, {
          method: 'POST', keepalive: true,
          headers: { 'Content-Type': 'application/json', apikey: CONFIG.supabaseAnonKey, Authorization: `Bearer ${CONFIG.supabaseAnonKey}` },
          body: JSON.stringify({ messages: [{ topic: 'work-tower-88f', event: 'leave', payload: { id: me.id } }] }),
        }).catch(() => {});
      } catch {}
      try { supa.removeChannel(channel); } catch {}
      try { if (fch) supa.removeChannel(fch); } catch {}
    };
    // 탭을 다녀오면 연결 상태를 확인하고, 끊겼으면 다시 연결
    reconnect = () => {
      const st = channel?.state;
      if (st !== 'joined') open();
      else { sendRaw('sync', { id: me.id }); handlers.onSync?.('all'); }
      if (fch?.state !== 'joined') openFloor(floorNow);
    };
  } else {
    const bc = 'BroadcastChannel' in window ? new BroadcastChannel('work-tower-88f') : null;
    let fbc = null;
    setFloor = (f) => {
      if (f === floorNow || !('BroadcastChannel' in window)) return;
      fbc?.close(); floorNow = f; fbc = new BroadcastChannel(floorTopic(f));
      fbc.onmessage = (e) => { const { event, payload } = e.data || {}; if (event === 'state') { touch(payload.id); handlers.onState(payload); } else if (event === 'sync') handlers.onSync?.('floor'); };
      fbc.postMessage({ event: 'sync', payload: { id: me.id } }); handlers.onSync?.('floor');
    };
    sendFloor = (payload) => (fbc ? fbc.postMessage({ event: 'state', payload }) : sendRaw('state', payload));
    if (bc) {
      bc.onmessage = (e) => {
        const { event, payload } = e.data || {};
        if (event === 'state') { touch(payload.id); handlers.onState(payload); }
        else if (event === 'chat') handlers.onChat(payload);
        else if (event === 'sync') handlers.onSync?.('all');
        else if (event === 'ev') handlers.onEvent?.(payload);
        else if (event === 'leave') { lastSeen.delete(payload.id); handlers.onLeave(payload.id); }
      };
    }
    sendRaw = (event, payload) => bc?.postMessage({ event, payload });
    close = () => { sendRaw('leave', { id: me.id }); bc?.close(); };
    reconnect = () => { sendRaw('sync', { id: me.id }); handlers.onSync?.('all'); };
    setTimeout(() => { handlers.onStatus('로컬 데모 · 같은 브라우저 탭끼리만 보여요', false); sendRaw('sync', { id: me.id }); }, 0);
  }

  // 오래(2분 반) 소식이 없는 접속자만 정리 — 다른 탭에 다녀와도 사라지지 않게 (숨은 탭은 1분에 한 번쯤만 소식을 보낼 수 있음)
  let hiddenAt = 0;
  const sweep = setInterval(() => {
    if (document.hidden) return; // 내가 안 보는 동안은 정리하지 않음
    const now = performance.now();
    for (const [id, t] of lastSeen) {
      if (now - t > 150000) { lastSeen.delete(id); handlers.onLeave(id); }
    }
  }, 5000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = performance.now(); return; }
    // 돌아오면: 다른 사람들의 마지막 시각을 지금으로 미루고, 다시 연결 · 서로 위치 다시 알림
    const now = performance.now();
    for (const id of lastSeen.keys()) lastSeen.set(id, Math.max(lastSeen.get(id), now - 60000));
    void hiddenAt;
    reconnect();
  });
  addEventListener('online', () => reconnect());

  window.addEventListener('pagehide', () => { try { close(); } catch {} });
  // 뒤로 가기 등으로 페이지가 되살아나면 다시 연결
  window.addEventListener('pageshow', (e) => { if (e.persisted) { try { reconnect(); } catch {} } });

  return {
    sendState(p, all = false) { if (all) sendRaw('state', p); else sendFloor(p); }, // all: 모두에게(공용) / 아니면 같은 층에만
    setFloor(f) { setFloor(f); },
    sendChat(m) { sendRaw('chat', m); },
    sendEvent(e) { sendRaw('ev', e); }, // 결투 같은 놀이용 알림
    close() { clearInterval(sweep); close(); },
  };
}
