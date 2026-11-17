const H = require('./harness'); const {BASE,API,PRODUCTS,TOP,price,fmt,sql,resetStock,api,newUser,staffToken,makeCtx,cartItem,addToCartUI,money} = H;
const T = [];
const add = (id,cat,title,expected,run) => T.push({id,cat,title,expected,run});
const CAT_A='A. Menu và chi tiết sản phẩm', CAT_B='B. Giỏ hàng', CAT_C='C. Tài khoản và phân quyền giao diện';

add('A01',CAT_A,'Menu hiển thị đủ 8 sản phẩm kèm tên, giá, ảnh','8 thẻ sản phẩm, đúng tên và giá, ảnh tải được',async(t,b)=>{
  const {ctx,page}=await makeCtx(b); await page.goto(BASE); await page.getByTestId('menu-grid').waitFor();
  const n=await page.locator('[data-testid=menu-grid] li').count(); t.check('Số sản phẩm = 8', n===8, n);
  for (const [id,[name,p]] of Object.entries(PRODUCTS)) {
    const li=page.locator('[data-testid=menu-grid] li',{hasText:name}).first();
    const txt=await li.innerText(); t.check(`"${name}" hiển thị giá ${fmt(p)}`, txt.includes(fmt(p)), txt.replace(/\n/g,' | '));
  }
  const broken=await page.$$eval('[data-testid=menu-grid] img',imgs=>imgs.filter(i=>!i.complete||i.naturalWidth===0).length);
  t.check('Mọi ảnh sản phẩm tải được', broken===0, `${broken} ảnh lỗi`);
  await t.shot(page,'menu'); await ctx.close(); });

add('A02',CAT_A,'Lỗi mạng khi tải menu: hiện thông báo và nút Thử lại hoạt động','Hiện hộp lỗi + Thử lại; sau khi mạng ổn bấm Thử lại thì menu hiện',async(t,b)=>{
  const {ctx,page}=await makeCtx(b); await page.route('**/products',r=>r.abort()); await page.goto(BASE);
  await page.locator('div[role="alert"].border-red-200').waitFor(); const txt=await page.locator('div[role="alert"].border-red-200').innerText();
  t.check('Hiện thông báo lỗi kết nối', /Không kết nối được máy chủ/.test(txt), txt); await t.shot(page,'error');
  await page.unroute('**/products'); await page.getByRole('button',{name:'Thử lại'}).click();
  await page.getByTestId('menu-grid').waitFor(); t.check('Thử lại thành công, menu hiện', (await page.locator('[data-testid=menu-grid] li').count())===8);
  await ctx.close(); });

add('A03',CAT_A,'Menu trống hiển thị trạng thái rỗng','Hiện "Menu đang trống"',async(t,b)=>{
  const {ctx,page}=await makeCtx(b); await page.route('**/products',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'})); await page.goto(BASE);
  await page.getByText('Menu đang trống').waitFor(); t.check('Hiện trạng thái rỗng', true); await t.shot(page,'empty'); await ctx.close(); });

add('A04',CAT_A,'Trang chi tiết: giá mặc định (size M), đổi size S/M/L','Giá = giá gốc + chênh lệch size (S −5k, M 0, L +7k)',async(t,b)=>{
  const {ctx,page}=await makeCtx(b); await page.goto(`${BASE}/products/3`); await page.getByTestId('price').waitFor();
  t.check('Mặc định size M = 45.000đ', money(await page.getByTestId('price').innerText())===45000);
  for (const s of ['S','L','M']) { await page.locator('button[aria-pressed]').filter({hasText:new RegExp('^'+s)}).click();
    const v=money(await page.getByTestId('price').innerText()); t.check(`Size ${s} = ${fmt(price(3,s))}`, v===price(3,s), v); }
  await page.locator('button[aria-pressed]').filter({hasText:/^L/}).click(); await t.shot(page,'detail'); await ctx.close(); });

add('A05',CAT_A,'Giá theo mọi tổ hợp size × topping (48 tổ hợp) cho Cappuccino','Giá hiển thị khớp công thức server cho từng tổ hợp',async(t,b)=>{
  const {ctx,page}=await makeCtx(b); await page.goto(`${BASE}/products/3`); await page.getByTestId('price').waitFor();
  const codes=Object.keys(TOP); let bad=[]; let n=0;
  for (const s of ['S','M','L']) { await page.locator('button[aria-pressed]').filter({hasText:new RegExp('^'+s)}).click();
    for (let mask=0;mask<16;mask++) { const tops=codes.filter((_,i)=>mask&(1<<i));
      for (const c of codes) { const cb=page.locator('label',{hasText:TOP[c][0]}).locator('input'); const want=tops.includes(c); if ((await cb.isChecked())!==want) await (want?cb.check():cb.uncheck()); }
      const v=money(await page.getByTestId('price').innerText()); n++; if (v!==price(3,s,tops)) bad.push(`${s}+${tops}: ${v}≠${price(3,s,tops)}`); } }
  t.check(`Cả ${n} tổ hợp đều đúng giá`, bad.length===0, bad.slice(0,3).join('; ')); await ctx.close(); });

add('A06',CAT_A,'Số lượng ở trang chi tiết: tối thiểu 1, tối đa 20, giá nhân theo số lượng','Không giảm dưới 1, không tăng quá 20, tạm tính = đơn giá × số lượng',async(t,b)=>{
  const {ctx,page}=await makeCtx(b); await page.goto(`${BASE}/products/1`); await page.getByTestId('price').waitFor();
  await page.getByLabel('Giảm').click(); t.check('Giảm ở 1 vẫn là 1', (await page.getByTestId('qty').innerText())==='1');
  for (let i=0;i<25;i++) await page.getByLabel('Tăng').click();
  t.check('Tăng 25 lần dừng ở 20', (await page.getByTestId('qty').innerText())==='20');
  t.check('Tạm tính = 20 × 35.000đ', money(await page.getByTestId('price').innerText())===700000); await t.shot(page,'qty20'); await ctx.close(); });

add('A07',CAT_A,'Sản phẩm không tồn tại / id sai','Thông báo "Không tìm thấy sản phẩm", không trang trắng',async(t,b)=>{
  const {ctx,page}=await makeCtx(b);
  await page.goto(`${BASE}/products/9999`); await page.locator('div[role="alert"].border-red-200').waitFor(); const a=await page.locator('div[role="alert"].border-red-200').innerText();
  t.check('/products/9999 báo không tìm thấy', /Không tìm thấy/.test(a), a); await t.shot(page,'notfound');
  await page.goto(`${BASE}/products/abc`); await page.locator('div[role="alert"].border-red-200').waitFor(); const a2=await page.locator('div[role="alert"].border-red-200').innerText();
  t.check('/products/abc hiện lỗi dễ hiểu (không crash)', a2.length>0, a2); await ctx.close(); });

add('A08',CAT_A,'Sản phẩm hết hàng: menu báo "Hết hàng", nút thêm giỏ bị vô hiệu','Menu có nhãn Hết hàng; nút "Hết hàng" disabled',async(t,b)=>{
  sql('update products set stock=0 where id=8'); try {
    const {ctx,page}=await makeCtx(b); await page.goto(BASE); await page.getByTestId('menu-grid').waitFor();
    const li=await page.locator('[data-testid=menu-grid] li',{hasText:'Matcha'}).innerText(); t.check('Menu có nhãn Hết hàng', /Hết hàng/.test(li)); await t.shot(page,'menu');
    await page.goto(`${BASE}/products/8`); const btn=page.getByRole('button',{name:'Hết hàng'}); await btn.waitFor();
    t.check('Nút bị vô hiệu', await btn.isDisabled()); await ctx.close(); } finally { resetStock(); } });

add('B01',CAT_B,'Thêm vào giỏ: badge đếm đúng, cùng cấu hình gộp dòng, khác size tách dòng','Cùng món/size/topping cộng dồn; khác size là dòng riêng; badge = tổng số lượng',async(t,b)=>{
  const {ctx,page}=await makeCtx(b); await addToCartUI(page,3,{size:'L',tops:['PEARL']});
  t.check('Badge = 1', (await page.getByTestId('cart-badge').innerText())==='1');
  await addToCartUI(page,3,{size:'L',tops:['PEARL']}); t.check('Thêm lại cùng cấu hình → badge 2', (await page.getByTestId('cart-badge').innerText())==='2');
  await addToCartUI(page,3,{size:'M'}); await page.goto(`${BASE}/cart`); await page.getByTestId('cart-item').first().waitFor();
  t.check('Có 2 dòng (L+Trân châu ×2 và M ×1)', (await page.getByTestId('cart-item').count())===2, await page.getByTestId('cart-item').count());
  const want=2*price(3,'L',['PEARL'])+price(3,'M'); t.check(`Tổng = ${fmt(want)}`, money(await page.getByTestId('cart-total').innerText())===want);
  await t.shot(page,'cart'); await ctx.close(); });

add('B02',CAT_B,'Giỏ hàng: tăng, giảm, giảm về 0 thì xóa dòng, nút Xóa, Xóa tất cả','Tổng cập nhật đúng sau mỗi thao tác; giỏ rỗng hiện trạng thái trống',async(t,b)=>{
  const {ctx,page}=await makeCtx(b,{cart:[cartItem(1,'M',[],2),cartItem(4,'L',['JELLY'],1)]}); await page.goto(`${BASE}/cart`); await page.getByTestId('cart-item').first().waitFor();
  const tot=async()=>money(await page.getByTestId('cart-total').innerText());
  t.check('Tổng ban đầu đúng', await tot()===2*35000+price(4,'L',['JELLY']), await tot());
  await page.getByTestId('cart-item').first().getByLabel('Tăng').click(); t.check('Tăng món 1 → 3 ly', await tot()===3*35000+price(4,'L',['JELLY']));
  await page.getByTestId('cart-item').first().getByLabel('Giảm').click(); await page.getByTestId('cart-item').first().getByLabel('Giảm').click();
  t.check('Giảm còn 1 ly', await tot()===35000+price(4,'L',['JELLY']));
  await page.getByTestId('cart-item').first().getByLabel('Giảm').click(); t.check('Giảm về 0 thì dòng bị xóa', (await page.getByTestId('cart-item').count())===1);
  await page.getByRole('button',{name:'Xóa',exact:true}).click(); await page.getByText('Giỏ hàng trống').waitFor(); t.check('Xóa dòng cuối → giỏ trống', true); await t.shot(page,'empty');
  await ctx.close();
  const c2=await makeCtx(b,{cart:[cartItem(1),cartItem(2)]}); await c2.page.goto(`${BASE}/cart`); await c2.page.getByRole('button',{name:'Xóa tất cả'}).click();
  await c2.page.getByText('Giỏ hàng trống').waitFor(); t.check('"Xóa tất cả" làm trống giỏ', true); await c2.ctx.close(); });

add('B03',CAT_B,'Giỏ hàng được lưu qua lần tải lại trang (localStorage/Zustand persist)','Reload vẫn còn sản phẩm và badge',async(t,b)=>{
  const {ctx,page}=await makeCtx(b); await addToCartUI(page,5,{size:'S',qty:2}); await page.goto(`${BASE}/cart`); await page.reload();
  await page.getByTestId('cart-item').first().waitFor(); t.check('Còn 1 dòng sau reload', (await page.getByTestId('cart-item').count())===1);
  t.check('Badge vẫn là 2', (await page.getByTestId('cart-badge').innerText())==='2'); await ctx.close(); });

add('B04',CAT_B,'Giới hạn 20 ly mỗi dòng khi cộng dồn trong giỏ','Không vượt 20',async(t,b)=>{
  const {ctx,page}=await makeCtx(b,{cart:[cartItem(1,'M',[],20)]}); await page.goto(`${BASE}/cart`); await page.getByTestId('cart-item').first().waitFor();
  await page.getByTestId('cart-item').first().getByLabel('Tăng').click();
  const q=await page.getByTestId('cart-item').first().locator('span.w-5').innerText(); t.check('Tăng ở 20 vẫn là 20', q==='20', q);
  await addToCartUI(page,1,{qty:5}); await page.goto(`${BASE}/cart`); const q2=await page.getByTestId('cart-item').first().locator('span.w-5').innerText(); t.check('Thêm 5 ly vào dòng đã có 20 → vẫn 20', q2==='20', q2); await ctx.close(); });

add('B05',CAT_B,'Thanh toán khi giỏ trống / vào /checkout trực tiếp','Không tạo đơn rỗng; hiện giỏ trống',async(t,b)=>{
  const u=await newUser(); const {ctx,page}=await makeCtx(b,{user:u}); await page.goto(`${BASE}/checkout`);
  await page.getByText('Giỏ hàng trống').waitFor(); t.check('Hiện "Giỏ hàng trống"', true); await t.shot(page,'checkout-empty');
  const r=await api('/orders',{body:{items:[]},token:u.token,headers:{'Idempotency-Key':'x'+Date.now()}}); t.check('API từ chối giỏ rỗng (400)', r.status===400, r.status); await ctx.close(); });

add('C01',CAT_C,'Đăng ký tài khoản mới trên giao diện','Đăng ký xong tự đăng nhập, header hiện "Đơn của tôi", điểm 0',async(t,b)=>{
  const {ctx,page}=await makeCtx(b); const email=`ui${Date.now()}@test.vn`; await page.goto(`${BASE}/register`);
  await page.getByLabel('Tên hiển thị').fill('Nguyễn Văn A'); await page.getByLabel('Email').fill(email); await page.getByLabel(/Mật khẩu/).fill('secret123'); await t.shot(page,'form');
  await page.getByRole('button',{name:'Đăng ký'}).click(); await page.getByText('Đơn của tôi').waitFor();
  t.check('Header hiện điểm tích lũy 0', /★ 0 điểm/.test(await page.locator('header').innerText())); t.check('Về trang chủ sau đăng ký', page.url()===BASE+'/', page.url()); await t.shot(page,'after'); await ctx.close(); });

add('C02',CAT_C,'Đăng ký trùng email','Báo lỗi email đã tồn tại, không đăng nhập',async(t,b)=>{
  const u=await newUser(); const {ctx,page}=await makeCtx(b); await page.goto(`${BASE}/register`);
  await page.getByLabel('Email').fill(u.email); await page.getByLabel(/Mật khẩu/).fill('secret123'); await page.getByRole('button',{name:'Đăng ký'}).click();
  await page.locator('div[role="alert"].border-red-200').waitFor(); const a=await page.locator('div[role="alert"].border-red-200').innerText(); t.check('Hiện lỗi trùng email', /đã|tồn tại|trùng/i.test(a), a); await t.shot(page,'dup'); await ctx.close(); });

add('C03',CAT_C,'Kiểm tra dữ liệu đăng ký: mật khẩu ngắn, email sai (UI và API)','Giao diện chặn; API trả 400',async(t,b)=>{
  const {ctx,page}=await makeCtx(b); await page.goto(`${BASE}/register`);
  await page.getByLabel('Email').fill('abc@test.vn'); await page.getByLabel(/Mật khẩu/).fill('123'); await page.getByRole('button',{name:'Đăng ký'}).click();
  t.check('Mật khẩu 3 ký tự bị chặn ở form (vẫn ở /register)', page.url().includes('/register')); await t.shot(page,'short');
  const r1=await api('/auth/register',{body:{email:'a@b.vn',password:'12345'}}); t.check('API: mật khẩu 5 ký tự → 400', r1.status===400, r1.status);
  const r2=await api('/auth/register',{body:{email:'khong-phai-email',password:'secret123'}}); t.check('API: email sai định dạng → 400', r2.status===400, r2.status);
  const r3=await api('/auth/register',{body:{email:'a@b.vn',password:'secret123',role:'STAFF'}}); t.check('API: gửi thêm trường role=STAFF bị từ chối (chống leo quyền)', r3.status===400, r3.status);
  await ctx.close(); });

add('C04',CAT_C,'Đăng nhập sai mật khẩu / email không tồn tại','Báo lỗi, không đăng nhập; thông báo không lộ email có tồn tại hay không',async(t,b)=>{
  const u=await newUser(); const {ctx,page}=await makeCtx(b); const res=[];
  for (const [em,pw] of [[u.email,'saimatkhau'],['khongco@test.vn','secret123']]) {
    await page.goto(`${BASE}/login`); await page.getByLabel('Email').fill(em); await page.getByLabel(/Mật khẩu/).fill(pw); await page.getByRole('button',{name:'Đăng nhập'}).click();
    await page.locator('div[role="alert"].border-red-200').waitFor(); res.push(await page.locator('div[role="alert"].border-red-200').innerText()); }
  t.check('Cả hai trường hợp đều báo lỗi', res.every(x=>x.length>0), res.join(' | ')); t.check('Hai thông báo giống nhau (không lộ email tồn tại)', res[0]===res[1], res.join(' | ')); await t.shot(page,'wrong'); await ctx.close(); });

add('C05',CAT_C,'Đăng nhập, tải lại vẫn giữ phiên, đăng xuất xóa phiên','Phiên lưu qua reload; đăng xuất ẩn "Đơn của tôi"',async(t,b)=>{
  const u=await newUser(); const {ctx,page}=await makeCtx(b); await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill(u.email); await page.getByLabel(/Mật khẩu/).fill(u.password); await page.getByRole('button',{name:'Đăng nhập'}).click(); await page.getByText('Đơn của tôi').waitFor();
  await page.reload(); await page.getByText('Đơn của tôi').waitFor(); t.check('Reload vẫn đăng nhập', true);
  await page.getByRole('button',{name:'Đăng xuất'}).click(); await page.getByRole('link',{name:'Đăng nhập'}).waitFor(); t.check('Đăng xuất thành công', true);
  await page.goto(`${BASE}/orders`); await page.waitForURL(/\/login\?next=%2Forders/); t.check('Sau đăng xuất, /orders chuyển về /login?next=/orders', true); await ctx.close(); });

add('C06',CAT_C,'Trang cần đăng nhập chuyển hướng rồi quay lại đúng trang sau khi đăng nhập','/orders và /checkout redirect; đăng nhập xong về đúng next',async(t,b)=>{
  const u=await newUser(); const {ctx,page}=await makeCtx(b,{cart:[cartItem(1)]}); await page.goto(`${BASE}/cart`); await page.getByRole('button',{name:/^Thanh toán/}).click();
  await page.waitForURL(/\/login\?next=\/checkout/); t.check('Thanh toán khi chưa đăng nhập → /login?next=/checkout', true);
  await page.getByLabel('Email').fill(u.email); await page.getByLabel(/Mật khẩu/).fill(u.password); await page.getByRole('button',{name:'Đăng nhập'}).click();
  await page.waitForURL(/\/checkout/); await page.getByTestId('checkout-total').waitFor(); t.check('Đăng nhập xong quay về /checkout, giỏ còn nguyên', money(await page.getByTestId('checkout-total').innerText())===35000); await t.shot(page,'back'); await ctx.close(); });

add('C07',CAT_C,'Token hỏng / hết hạn khi đang dùng','Không treo giao diện; người dùng được đưa về đăng nhập hoặc thấy lỗi rõ ràng',async(t,b)=>{
  const u=await newUser(); const bad={...u,token:'khong.phai.jwt'}; const {ctx,page}=await makeCtx(b,{user:bad,cart:[cartItem(1)]});
  await page.goto(`${BASE}/orders`); await page.waitForURL(/login/,{timeout:4000}).catch(()=>{}); const txt=await page.locator('main, body').first().innerText();
  const url1=page.url(); t.note(`/orders với token hỏng: url=${url1}, nội dung="${txt.replace(/\n/g,' ').slice(0,120)}"`);
  const handled=/\/login/.test(url1); t.check('/orders với token hỏng/hết hạn tự đăng xuất và chuyển về /login?next=/orders', handled, txt.replace(/\n/g,' ').slice(0,100)); await t.shot(page,'orders-badtoken');
  await ctx.close(); const c2=await makeCtx(b,{user:bad,cart:[cartItem(1)]}); const page2=c2.page; await page2.goto(`${BASE}/checkout`); await page2.getByRole('button',{name:/Xác nhận thanh toán/}).click(); await page2.waitForURL(/\/login/,{timeout:6000}).catch(()=>{}); t.check('Checkout với token hỏng → logout + về /login', /login/.test(page2.url()), page2.url()); await c2.ctx.close(); });

add('C08',CAT_C,'Email viết hoa/thường và khoảng trắng khi đăng nhập','Đăng nhập không phân biệt hoa thường email',async(t,b)=>{
  const u=await newUser(); const r1=await api('/auth/login',{body:{email:u.email.toUpperCase(),password:u.password}});
  t.check('Đăng nhập với email VIẾT HOA thành công (email thường không phân biệt hoa thường)', r1.status===200, r1.status);
  const r2=await api('/auth/register',{body:{email:u.email.toUpperCase(),password:'secret123'}}); t.check('Đăng ký lại cùng email khác hoa thường bị từ chối (409)', r2.status===409, r2.status); });

add('C09',CAT_C,'Chuỗi nguy hiểm trong tên và email (XSS, SQL injection)','Không chạy script, không lỗi 500, không lộ dữ liệu',async(t,b)=>{
  const r=await api('/auth/login',{body:{email:"' OR '1'='1",password:"' OR '1'='1"}}); t.check("SQLi ở login → 400/401 (không 500, không đăng nhập)", [400,401].includes(r.status), r.status);
  const xss='<img src=x onerror="window.__xss=1">'; const email=`xss${Date.now()}@test.vn`; const rr=await api('/auth/register',{body:{email,password:'secret123',name:xss}});
  t.check('Đăng ký tên chứa HTML được chấp nhận hoặc từ chối an toàn', [201,400].includes(rr.status), rr.status);
  if (rr.status===201) { const {ctx,page}=await makeCtx(b,{user:{token:rr.body.accessToken,user:rr.body.user}}); await page.goto(`${BASE}/orders`); await page.waitForTimeout(800);
    t.check('Tên chứa HTML không thực thi script', (await page.evaluate(()=>window.__xss))!==1); await ctx.close(); } });
module.exports = T;
