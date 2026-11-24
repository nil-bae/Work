const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const S = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-proxy-server'] });
  const cfg = fs.readFileSync('/home/user/work/src/config.js', 'utf8').replace(/supabaseUrl: '[^']*'/, "supabaseUrl: ''");
  const ctx = await b.newContext({ viewport: { width: 900, height: 600 } });
  await ctx.route('**/src/config.js', (r) => r.fulfill({ body: cfg, contentType: 'text/javascript' }));
  const errs = [];
  async function open(name, cash) {
    const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); p.on('dialog', (d) => d.accept());
    await p.addInitScript(([n, cash]) => { localStorage.setItem('work-day', '1'); localStorage.setItem('work-news-seen', '9999'); localStorage.setItem('work-dev', 'dev-' + n); localStorage.removeItem('work-duel2'); localStorage.setItem('work-tower-me', JSON.stringify({ name: n, color: '#ff6b6b', gender: 'f' }));
      const w = JSON.parse(localStorage.getItem('work-wallet') || '{}'); w[n] = { cash, unpaid: 0, day: '2030-01-01', day_secs: 0, paid_month: '', savings: 0, sav_day: '2030-01-01', stocks: {} }; localStorage.setItem('work-wallet', JSON.stringify(w)); }, [name, cash]);
    await p.goto('http://127.0.0.1:8123/', { waitUntil: 'commit' });
    await p.waitForFunction(() => window.__work && __work.mode === 'office', null, { timeout: 1500000 });
    await p.evaluate(() => document.querySelector('#chatToggle')?.click());
    return p;
  }
  const A = await open('엘리', 100000);
  const B = await open('민수', 30000);
  await A.waitForFunction(() => __work.peers.size > 0, null, { timeout: 60000 });
  const cash = async (p) => Math.round(await p.evaluate(() => __work.money.cash()));
  const c0 = [await cash(A), await cash(B)];
  await A.evaluate(() => __work.duel.openPicker()); await A.waitForTimeout(400);
  await A.click('#dPickList button:not(.bot)'); await A.waitForTimeout(400);
  await A.fill('#dBetAmt', '50000'); await A.screenshot({ path: S + '/bet_set.png' });
  await A.click('#dBetGo');
  await B.waitForFunction(() => !document.getElementById('duelAsk').hidden, null, { timeout: 30000 });
  console.log('B accept disabled (모자람)', await B.evaluate(() => document.getElementById('dAccept').disabled));
  await B.waitForTimeout(500); await B.screenshot({ path: S + '/bet_ask.png' });
  await B.waitForTimeout(+process.argv[3] * 1000); // 금액을 천천히 고민하는 사람
  console.log('B ask still open after wait?', await B.evaluate(() => !document.getElementById('duelAsk').hidden));
  await B.fill('#dCounterAmt', '20000').catch(() => {}); await B.click('#dCounterBtn').catch(() => console.log('B 역제안 버튼 누를 수 없음'));
  const got = await A.waitForFunction(() => !document.getElementById('duelCounter').hidden, null, { timeout: 15000 }).then(() => true).catch(() => false);
  console.log('A got counter?', got, '| A chat:', await A.evaluate(() => document.getElementById('chatLog').innerText.split('\n').slice(-2).join(' / ')), '| B chat:', await B.evaluate(() => document.getElementById('chatLog').innerText.split('\n').slice(-2).join(' / ')));
  if (!got) { await b.close(); return; }
  await A.waitForFunction(() => !document.getElementById('duelCounter').hidden, null, { timeout: 30000 });
  await A.screenshot({ path: S + '/bet_counter.png' });
  await A.click('#dCAccept');
  await B.waitForFunction(() => __work.duel.active, null, { timeout: 30000 });
  await A.waitForTimeout(800);
  console.log('after start cash A,B', await cash(A), await cash(B), '(was', c0, ')');
  await A.evaluate(() => { __work.duel.st.t = 0.01; }); await B.evaluate(() => { __work.duel.st.t = 0.01; });
  await A.waitForFunction(() => __work.duel.st.phase === 'fight', null, { timeout: 120000 });
  await B.waitForFunction(() => __work.duel.st.phase === 'fight', null, { timeout: 120000 });
  await B.evaluate(() => { __work.duel.st.myHp = 1; });
  for (let i = 0; i < 6; i++) { await A.evaluate(() => __work.duel.attack()); await A.waitForTimeout(300); }
  await A.waitForFunction(() => __work.duel.st.phase === 'done', null, { timeout: 60000 });
  await B.waitForFunction(() => __work.duel.st.phase === 'done', null, { timeout: 60000 });
  await A.waitForTimeout(800);
  console.log('after end cash A,B', await cash(A), await cash(B));
  await A.screenshot({ path: S + '/bet_win.png' });
  console.log('errors', errs.join('|') || 'none'); await b.close();
})();
