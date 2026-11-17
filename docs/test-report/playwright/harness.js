const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const BASE = 'http://localhost:3000', API = 'http://localhost:3001';
const SHOTS = path.join(__dirname, 'shots');
const PRODUCTS = {1:['Cà phê sữa',35000],2:['Americano',40000],3:['Cappuccino',45000],4:['Trà đào',39000],5:['Latte',45000],6:['Bạc xỉu',38000],7:['Trà vải',39000],8:['Matcha đá xay',55000]};
const SIZE_D = {S:-5000,M:0,L:7000};
const TOP = {PEARL:['Trân châu',5000],CREAM:['Kem',7000],JELLY:['Thạch dừa',5000],SHOT:['Espresso shot',10000]};
const price = (pid,size='M',tops=[]) => PRODUCTS[pid][1]+SIZE_D[size]+[...new Set(tops)].reduce((s,c)=>s+TOP[c][1],0);
const fmt = n => `${n.toLocaleString('vi-VN')}đ`;
const sql = q => execSync(`PGPASSWORD=postgres psql -h localhost -U postgres -d brewlite -tA -c "${q.replace(/"/g,'\\"')}"`).toString().trim();
const resetStock = () => sql("update products set stock=100, version=1, price=case id when 1 then 35000 when 2 then 40000 when 3 then 45000 when 4 then 39000 when 5 then 45000 when 6 then 38000 when 7 then 39000 else 55000 end");
async function api(p, {method, body, token, headers={}, origin} = {}) {
  const h = {...headers}; if (body !== undefined) h['Content-Type']='application/json';
  if (token) h.Authorization = `Bearer ${token}`; if (origin) h.Origin = origin;
  const r = await fetch(API+p, {method: method ?? (body!==undefined?'POST':'GET'), headers:h, body: body!==undefined?(typeof body==='string'?body:JSON.stringify(body)):undefined});
  const text = await r.text(); let j=null; try{j=JSON.parse(text)}catch{}
  return {status:r.status, body:j, text, headers:r.headers};
}
let uc = 0; const RUN = Date.now().toString().slice(-6);
async function newUser(name='Tester') {
  const email = `u${RUN}_${++uc}@test.vn`;
  const r = await api('/auth/register',{body:{email,password:'secret123',name}});
  return {email, password:'secret123', token:r.body.accessToken, user:r.body.user};
}
async function staffToken() { return (await api('/auth/login',{body:{email:'staff@brewlite.local',password:'staff123'}})).body.accessToken; }
const authInit = (u) => ({ token:u.token, user:u.user });
async function makeCtx(browser, {user, cart, viewport}={}) {
  const ctx = await browser.newContext({viewport: viewport ?? {width:1280,height:800}, locale:'vi-VN'});
  await ctx.addInitScript(([a,c]) => {
    if (a && !localStorage.getItem('brewlite-auth')) localStorage.setItem('brewlite-auth', JSON.stringify({state:a,version:0}));
    if (c && !localStorage.getItem('brewlite-cart')) localStorage.setItem('brewlite-cart', JSON.stringify({state:{items:c},version:0}));
  }, [user?authInit(user):null, cart??null]);
  const page = await ctx.newPage(); page.setDefaultTimeout(9000);
  page.errors = []; page.on('console', m => { if (m.type()==='error') page.errors.push(m.text()); }); page.on('pageerror', e => page.errors.push('pageerror: '+e.message));
  page.on('dialog', d => d.accept());
  return {ctx, page};
}
const cartItem = (pid,size='M',tops=[],qty=1) => ({key:`${pid}|${size}|${[...tops].sort().join(',')}`, productId:pid, name:PRODUCTS[pid][0], imageUrl:`/images/x.svg`, size, toppings:tops, qty, unitPrice:price(pid,size,tops)});
async function addToCartUI(page, pid, {size='M', tops=[], qty=1}={}) {
  await page.goto(`${BASE}/products/${pid}`); await page.getByTestId('price').waitFor();
  if (size!=='M') await page.locator(`button[aria-pressed]`).filter({hasText:new RegExp('^'+size)}).click();
  for (const c of tops) await page.locator('label',{hasText:TOP[c][0]}).locator('input').check();
  for (let i=1;i<qty;i++) await page.getByLabel('Tăng').click();
  await page.getByRole('button',{name:'Thêm vào giỏ'}).click();
  await page.getByRole('status').filter({hasText:'Đã thêm vào giỏ hàng'}).waitFor();
}
const money = s => parseInt((s||'').replace(/[^\d]/g,''),10);
let results = [];
async function run(browser, tests, only) {
  for (const T of tests) {
    if (only && !only.includes(T.id)) continue;
    const t = {id:T.id, cat:T.cat, title:T.title, steps:[], checks:[], shots:[], expected:T.expected, status:'PASS', notes:[], t0:Date.now()};
    t.step = s => t.steps.push(s);
    t.check = (desc, ok, actual) => { t.checks.push({desc, ok:!!ok, actual: actual===undefined?'':String(actual)}); if(!ok) t.status='FAIL'; return ok; };
    t.note = s => t.notes.push(s);
    t.shot = async (page, name) => { const f=`${T.id}_${name}.png`; await page.screenshot({path:path.join(SHOTS,f)}); t.shots.push(f); };
    try { await T.run(t, browser); }
    catch (e) { t.status='ERROR'; t.checks.push({desc:'Test chạy không lỗi', ok:false, actual:String(e.message).split('\n')[0]}); }
    t.ms = Date.now()-t.t0; results.push(t);
    console.log(`${t.status.padEnd(5)} ${t.id} ${t.title}${t.status!=='PASS'?'  <- '+t.checks.filter(c=>!c.ok).map(c=>c.desc+' ['+c.actual+']').join(' | '):''}`);
  }
  return results;
}
module.exports = {chromium, BASE, API, PRODUCTS, TOP, price, fmt, sql, resetStock, api, newUser, staffToken, makeCtx, cartItem, addToCartUI, money, run, SHOTS};
