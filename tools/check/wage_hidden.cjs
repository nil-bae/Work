const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-proxy-server'] });
  const cfg = fs.readFileSync('/home/user/work/src/config.js', 'utf8').replace(/supabaseUrl: '[^']*'/, "supabaseUrl: ''");
  const ctx = await b.newContext({ viewport: { width: 900, height: 600 } });
  await ctx.route('**/src/config.js', (r) => r.fulfill({ body: cfg, contentType: 'text/javascript' }));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('work-day', '1'); localStorage.setItem('work-news-seen', '9999'); localStorage.setItem('work-tower-me', JSON.stringify({ name: '엘리', color: '#ffb547', gender: 'f' }));
    window.__hide = (h) => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => h }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') }); document.dispatchEvent(new Event('visibilitychange')); }; });
  await p.goto('http://127.0.0.1:8123/', { waitUntil: 'commit' });
  await p.waitForFunction(() => window.__work && __work.mode === 'office', null, { timeout: 300000, polling: 500 }).catch(() => {});
  const secs = () => p.evaluate(() => JSON.parse(localStorage.getItem('work-wallet'))?.['엘리']?.day_secs ?? -1);
  const chip = () => p.evaluate(() => document.getElementById('workChip').textContent);
  await p.waitForTimeout(3000); console.log('start chip', await chip());
  await p.evaluate(() => __hide(true));
  await p.waitForTimeout(15000);   // 다른 탭에 15초
  await p.evaluate(() => __hide(false)); await p.waitForTimeout(1500);
  console.log('after 15s hidden chip', await chip());
  await p.evaluate(() => { const real = Date.now.bind(Date); Date.now = () => real() + 600000; }); await p.waitForTimeout(3000); // 10분 잠자기(시계가 한 번에 건너뜀)
  console.log('after 10min sleep jump chip', await chip());
  console.log('errors', errs.join('|') || 'none'); await b.close();
})();
