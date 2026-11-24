const { chromium, devices } = require('playwright'); const fs = require('fs');
(async () => {
  const S = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-proxy-server'] });
  const cfg = fs.readFileSync('/home/user/work/src/config.js', 'utf8').replace(/supabaseUrl: '[^']*'/, "supabaseUrl: ''");
  const errs = [];
  async function page(ctxOpts, init, clock) {
    const ctx = await b.newContext(ctxOpts);
    await ctx.route('**/src/config.js', (r) => r.fulfill({ body: cfg, contentType: 'text/javascript' }));
    const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message));
    if (clock) await p.clock.install({ time: clock });
    await p.addInitScript(init);
    await p.goto('http://127.0.0.1:8123/', { waitUntil: 'commit' });
    await p.waitForFunction(() => window.__work && __work.mode === 'office', null, { timeout: 300000 });
    return p;
  }
  // 1) 처음 출근: 축하금 + 오늘의 일급 알림
  const p = await page({ viewport: { width: 1100, height: 680 } }, () => { localStorage.setItem('work-day', '1'); localStorage.setItem('work-tower-me', JSON.stringify({ name: '엘리', color: '#ffb547', gender: 'f', look: '10011' })); });
  await p.waitForTimeout(1500);
  console.log('toast1', await p.evaluate(() => document.getElementById('toast').textContent));
  await p.screenshot({ path: S + '/money_enter.png' });
  await p.waitForTimeout(5000);
  console.log('toast2', await p.evaluate(() => document.getElementById('toast').textContent));
  console.log('chip', await p.evaluate(() => document.getElementById('workChip').textContent));
  await p.click('#workChip'); await p.waitForTimeout(500);
  await p.screenshot({ path: S + '/money_wallet.png' });
  await p.click('#walletModal [data-close]');
  // 3층 투자 상담실
  await p.evaluate(() => { __work.goFloor(2); }); await p.waitForTimeout(2500);
  await p.evaluate(() => { const w = __work; w.player.x = -6.55; w.player.z = 3.0; w.player.ry = -Math.PI / 2; w.cam.yaw = Math.PI / 2 + 0.6; w.cam.dist = 3.2; w.cam.pitch = 0.3; });
  await p.waitForTimeout(2000);
  console.log('prompt', await p.evaluate(() => { const e = document.getElementById('prompt'); return e.hidden ? '(none)' : e.textContent; }));
  await p.screenshot({ path: S + '/money_room.png' });
  await p.keyboard.press('KeyE'); await p.waitForTimeout(600);
  await p.fill('[data-q="WRK"]', '1'); await p.click('[data-buy="WRK"]'); await p.waitForTimeout(300);
  await p.fill('[data-q="BYF"]', '3'); await p.click('[data-buy="BYF"]'); await p.waitForTimeout(300);
  await p.screenshot({ path: S + '/money_invest.png' });
  await p.click('#invTabs [data-t="save"]'); await p.fill('#savAmt', '20000'); await p.click('#savIn'); await p.waitForTimeout(300);
  await p.screenshot({ path: S + '/money_save.png' });
  console.log('saved', await p.evaluate(() => localStorage.getItem('work-wallet')));
  await p.context().close();
  // 2) 25일 월급날 (시계를 11/25로)
  const q = await page({ viewport: { width: 900, height: 600 } }, () => {
    localStorage.setItem('work-day', '1'); localStorage.setItem('work-tower-me', JSON.stringify({ name: '민수', color: '#4f8cff', gender: 'm' }));
    localStorage.setItem('work-wallet', JSON.stringify({ 민수: { cash: 100000, unpaid: 412800, day: '2026-11-24', day_secs: 14400, paid_month: '', savings: 100000, sav_day: '2026-11-20', stocks: {} } }));
  }, new Date('2026-11-25T10:00:00'));
  await q.waitForTimeout(1500);
  const msgs = []; for (let i = 0; i < 4; i++) { msgs.push(await q.evaluate(() => document.getElementById('toast').textContent)); await q.evaluate(() => document.getElementById('toast').click()); await q.waitForTimeout(400); }
  console.log('payday toasts', msgs);
  console.log('wallet after', await q.evaluate(() => localStorage.getItem('work-wallet')));
  console.log('errors', errs.join('|') || 'none'); await b.close();
})();
