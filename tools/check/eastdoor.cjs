const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-proxy-server'] });
  const cfg = fs.readFileSync('/home/user/work/src/config.js', 'utf8').replace(/supabaseUrl: '[^']*'/, "supabaseUrl: ''");
  const ctx = await b.newContext({ viewport: { width: 1000, height: 620 } });
  await ctx.route('**/src/config.js', (r) => r.fulfill({ body: cfg, contentType: 'text/javascript' }));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('work-day', '1'); localStorage.setItem('work-news-seen', '9999'); localStorage.setItem('work-tower-me', JSON.stringify({ name: '엘리', color: '#ffb547', gender: 'f' })); });
  await p.goto('http://127.0.0.1:8123/', { waitUntil: 'commit' });
  await p.waitForFunction(() => window.__work && __work.mode === 'office', null, { timeout: 1500000 });
  const path = await p.evaluate(() => { const r = __work.findPath(0, 5, -1.5, 22.5, -4); return r ? r.map(([x, z]) => `${x.toFixed(1)},${z.toFixed(1)}`) : null; });
  console.log('lobby→boutique path', path ? path.length + ' pts: ' + path.join(' ') : 'NO PATH');
  // 실제로 걸어서 문을 통과하는지 (D키로 동쪽으로)
  await p.evaluate(() => { const w = __work; w.player.x = 8.6; w.player.z = -2.1; w.cam.yaw = -Math.PI / 2; w.cam.pitch = 0.2; w.cam.dist = 4.5; });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: process.argv[2] + '/door_in.png' });
  const x0 = await p.evaluate(() => __work.player.x);
  await p.keyboard.down('KeyW'); await p.waitForTimeout(6000); await p.keyboard.up('KeyW');
  console.log('walked x', x0.toFixed(1), '→', (await p.evaluate(() => __work.player.x)).toFixed(1));
  await p.evaluate(() => { const w = __work; w.player.x = 13.5; w.player.z = -2.4; w.cam.yaw = Math.PI / 2 + 0.3; w.cam.pitch = 0.2; w.cam.dist = 6; });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: process.argv[2] + '/door_out.png' });
  console.log('errors', errs.join('|') || 'none'); await b.close();
})();
