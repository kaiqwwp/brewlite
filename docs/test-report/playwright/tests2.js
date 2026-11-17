const H = require('./harness'); const {BASE,API,PRODUCTS,TOP,price,fmt,sql,resetStock,api,newUser,staffToken,makeCtx,cartItem,addToCartUI,money} = H;
const T = []; const add = (id,cat,title,expected,run) => T.push({id,cat,title,expected,run});
const CAT_D='D. Thanh toán và mã giảm giá', CAT_E='E. Đơn hàng: lịch sử, chi tiết, hủy, trạng thái', CAT_F='F. Tồn kho và dữ liệu thay đổi', CAT_G='G. Bảo mật và kiểm tra dữ liệu đầu vào (API)', CAT_H='H. Giao diện di động và độ ổn định';
const confirmBtn = p => p.getByRole('button',{name:/Xác nhận thanh toán/});
const cartLS = p => p.evaluate(()=>{ try{return JSON.parse(localStorage.getItem('brewlite-cart')).state.items}catch{return null} });
const pts = async u => (await api('/auth/me',{token:u.token})).body.loyaltyPoints;
const myOrders = async u => (await api('/orders/me',{token:u.token})).body;
const stock = id => parseInt(sql(`select stock from products where id=${id}`));
const mk = (pid,size='M',tops=[],qty=1)=>({productId:pid,size,toppings:tops,qty});
let k=0; const key = ()=>`k${Date.now()}_${++k}`;
async function apiOrder(u,items,coupon){ return api('/orders',{body:{items,couponCode:coupon},token:u.token,headers:{'Idempotency-Key':key()}}); }
async function apiPay(u,orderId,extra={}){ return api('/payments',{body:{orderId,method:'WALLET',...extra},token:u.token,headers:{'Idempotency-Key':key()}}); }

add('D01',CAT_D,'Luồng chính: thanh toán ví điện tử thành công','Đơn PAID, mã đơn hiển thị, giỏ rỗng, header cộng điểm (96.000đ → 9 điểm)',async(t,b)=>{
  resetStock(); const u=await newUser(); const items=[cartItem(3,'L',['PEARL'],1),cartItem(4,'M',[],1)]; const sum=price(3,'L',['PEARL'])+price(4,'M');
  const {ctx,page}=await makeCtx(b,{user:u,cart:items}); await page.goto(`${BASE}/cart`); await page.getByTestId('cart-item').first().waitFor();
  t.check(`Giỏ ${fmt(sum)}`, money(await page.getByTestId('cart-total').innerText())===sum); await page.getByRole('button',{name:/^Thanh toán/}).click();
  await page.getByTestId('checkout-total').waitFor(); await t.shot(page,'checkout'); t.check('Mặc định chọn Ví điện tử', await page.getByRole('radio').first().isChecked());
  await confirmBtn(page).click(); await page.waitForURL(/\/orders\/\d+\?paid=1/); await page.getByTestId('order-status').waitFor();
  t.check('Trạng thái PAID', (await page.getByTestId('order-status').innerText())==='PAID'); t.check('Có mã đơn', /Mã đơn: #?\w+/.test(await page.getByTestId('order-code').innerText()), await page.getByTestId('order-code').innerText());
  t.check('Tiêu đề "Đặt hàng thành công"', /Đặt hàng thành công/.test(await page.locator('h1').innerText())); await t.shot(page,'confirm');
  t.check('Giỏ hàng được xóa', (await cartLS(page)).length===0); await page.waitForTimeout(500);
  const want=Math.floor(sum/10000); t.check(`Điểm trên header = ${want}`, new RegExp(`★ ${want} điểm`).test(await page.locator('header').innerText()), await page.locator('header').innerText()); t.check('Điểm trên server khớp', await pts(u)===want); await ctx.close(); });

add('D02',CAT_D,'Thanh toán bằng thẻ ngân hàng','Chọn Thẻ ngân hàng → PAID',async(t,b)=>{
  resetStock(); const u=await newUser(); const {ctx,page}=await makeCtx(b,{user:u,cart:[cartItem(1)]}); await page.goto(`${BASE}/checkout`); await page.getByTestId('checkout-total').waitFor();
  await page.getByLabel('Thẻ ngân hàng').check(); await confirmBtn(page).click(); await page.waitForURL(/paid=1/); t.check('PAID', (await page.getByTestId('order-status').innerText())==='PAID');
  const o=(await myOrders(u))[0]; const pay=sql(`select method from payments where "orderId"=${o.id}`); t.check('Phương thức lưu là CARD', pay==='CARD', pay); await ctx.close(); });

add('D03',CAT_D,'Mã BREW10 trên giao diện: giảm 10%, hiển thị ở checkout và xác nhận','96.000đ → giảm 9.600đ → 86.400đ, 8 điểm',async(t,b)=>{
  resetStock(); const u=await newUser(); const {ctx,page}=await makeCtx(b,{user:u,cart:[cartItem(3,'L',['PEARL']),cartItem(4,'M')]}); await page.goto(`${BASE}/checkout`); await page.getByTestId('checkout-total').waitFor();
  await page.getByPlaceholder('VD: BREW10').fill('BREW10'); await t.shot(page,'coupon'); await confirmBtn(page).click(); await page.waitForURL(/paid=1/);
  await page.getByTestId('order-status').waitFor(); const body=await page.locator('main').innerText(); t.check('Hiện dòng giảm giá BREW10 −9.600đ', /Giảm giá \(BREW10\)/.test(body)&&/9\.600đ/.test(body), body.replace(/\n/g,' ').slice(0,160)); t.check('Tổng 86.400đ', /86\.400đ/.test(body)); await t.shot(page,'confirm');
  t.check('Cộng 8 điểm', await pts(u)===8, await pts(u)); await ctx.close(); });

add('D04',CAT_D,'Ma trận mã giảm giá (BREW10, WELCOME20) theo giá trị đơn','Đúng tỷ lệ, trần giảm, điều kiện đơn tối thiểu',async(t,b)=>{
  resetStock(); const u=await newUser(); const q=async(items,c)=>{const r=await apiOrder(u,items,c); return r;};
  let r=await q([mk(8,'M',[],2)],'BREW10'); t.check('BREW10, đơn 110.000đ → giảm 11.000đ', r.status===201&&r.body.discount===11000&&r.body.total===99000, JSON.stringify([r.status,r.body.discount,r.body.total]));
  r=await q([mk(8,'M',[],6)],'BREW10'); t.check('BREW10, đơn 330.000đ → giảm tối đa 20.000đ', r.status===201&&r.body.discount===20000, JSON.stringify([r.status,r.body.discount]));
  r=await q([mk(3,'M',[],2)],'WELCOME20'); t.check('WELCOME20, đơn 90.000đ (<100k) → bị từ chối 400', r.status===400, `${r.status} ${r.body?.message}`);
  r=await q([mk(8,'M',[],2)],'WELCOME20'); t.check('WELCOME20, đơn 110.000đ → giảm 22.000đ', r.status===201&&r.body.discount===22000, JSON.stringify([r.status,r.body.discount]));
  r=await q([mk(8,'M',[],6)],'WELCOME20'); t.check('WELCOME20, đơn 330.000đ → giảm tối đa 50.000đ', r.status===201&&r.body.discount===50000, JSON.stringify([r.status,r.body.discount]));
  r=await q([mk(1)],'KHONGCO'); t.check('Mã không tồn tại → 400', r.status===400, r.status);
  r=await q([mk(1)],'brew10'); t.check('Mã viết thường "brew10" vẫn nhận', r.status===201&&r.body.discount>0, JSON.stringify([r.status,r.body?.discount]));
  r=await q([mk(1)],'  BREW10  '); t.check('Mã có khoảng trắng hai đầu vẫn nhận', r.status===201&&r.body.discount>0, JSON.stringify([r.status,r.body?.discount]));
  r=await q([mk(1)],'   '); t.check('Mã chỉ toàn khoảng trắng không gây lỗi 500', r.status!==500, r.status); });

add('D05',CAT_D,'Mã giảm giá sai trên giao diện: báo lỗi, giữ giỏ, không tạo đơn','Hiện lỗi rõ ràng; giỏ còn; 0 đơn được tạo',async(t,b)=>{
  resetStock(); const u=await newUser(); const {ctx,page}=await makeCtx(b,{user:u,cart:[cartItem(1)]}); await page.goto(`${BASE}/checkout`); await page.getByTestId('checkout-total').waitFor();
  await page.getByPlaceholder('VD: BREW10').fill('SAIMA'); await confirmBtn(page).click(); await page.locator('div[role="alert"].border-red-200').waitFor(); const a=await page.locator('div[role="alert"].border-red-200').innerText();
  t.check('Hiện thông báo mã không hợp lệ', /Mã giảm giá/.test(a), a); await t.shot(page,'bad-coupon'); t.check('Giỏ vẫn còn', (await cartLS(page)).length===1); t.check('Chưa tạo đơn nào', (await myOrders(u)).length===0);
  await page.getByPlaceholder('VD: BREW10').fill('BREW10'); await confirmBtn(page).click(); await page.waitForURL(/paid=1/); t.check('Sửa mã đúng rồi thanh toán được', true); await ctx.close(); });

add('D06',CAT_D,'Thanh toán lỗi: giữ giỏ, giữ đơn, thử lại thành công, điểm chỉ cộng một lần','PAYMENT_FAILED → thử lại → PAID; đúng 1 đơn; điểm cộng 1 lần',async(t,b)=>{
  resetStock(); const u=await newUser(); const {ctx,page}=await makeCtx(b,{user:u,cart:[cartItem(5,'M',[],2)]}); const sum=price(5,'M')*2; const s0=stock(5);
  await page.goto(`${BASE}/checkout`); await page.getByTestId('checkout-total').waitFor(); await page.getByLabel(/Mô phỏng thanh toán lỗi/).check(); await confirmBtn(page).click();
  await page.locator('div[role="alert"].border-red-200').waitFor(); const a=await page.locator('div[role="alert"].border-red-200').innerText(); t.check('Hiện lỗi và nói giỏ được giữ', /Giỏ hàng được giữ nguyên/.test(a), a); await t.shot(page,'failed');
  t.check('Giỏ còn nguyên', (await cartLS(page)).length===1); let o=await myOrders(u); t.check('Có 1 đơn trạng thái PAYMENT_FAILED', o.length===1&&o[0].status==='PAYMENT_FAILED', JSON.stringify(o.map(x=>x.status)));
  t.check('Kho vẫn đang giữ cho đơn (−2)', stock(5)===s0-2, stock(5)); t.check('Chưa có điểm', await pts(u)===0);
  await page.getByLabel(/Mô phỏng thanh toán lỗi/).uncheck(); await confirmBtn(page).click(); await page.waitForURL(/paid=1/); t.check('Thử lại → PAID', (await page.getByTestId('order-status').innerText())==='PAID');
  o=await myOrders(u); t.check('Vẫn chỉ 1 đơn (không tạo đơn mới khi thử lại)', o.length===1, o.length); t.check(`Điểm cộng đúng 1 lần = ${Math.floor(sum/10000)}`, await pts(u)===Math.floor(sum/10000), await pts(u));
  t.check('Số giao dịch thanh toán của đơn = 2 (1 lỗi + 1 thành công)', sql(`select count(*) from payments where "orderId"=${o[0].id}`)==='2', sql(`select count(*) from payments where "orderId"=${o[0].id}`)); await ctx.close(); });

add('D07',CAT_D,'Thanh toán lỗi rồi hủy đơn: kho được hoàn lại','Đơn CANCELLED, kho về như ban đầu',async(t,b)=>{
  resetStock(); const u=await newUser(); const {ctx,page}=await makeCtx(b,{user:u,cart:[cartItem(2,'M',[],3)]}); const s0=stock(2);
  await page.goto(`${BASE}/checkout`); await page.getByLabel(/Mô phỏng thanh toán lỗi/).check(); await confirmBtn(page).click(); await page.locator('div[role="alert"].border-red-200').waitFor(); t.check('Kho bị giữ (−3)', stock(2)===s0-3, stock(2));
  await page.getByRole('link',{name:/Xem \/ hủy đơn/}).click(); await page.getByTestId('order-status').waitFor(); await t.shot(page,'order-failed');
  await page.getByRole('button',{name:'Hủy đơn'}).click(); await page.getByText('CANCELLED').waitFor(); t.check('Đơn CANCELLED', true); t.check('Kho hoàn lại', stock(2)===s0, stock(2)); await t.shot(page,'cancelled');
  t.check('Nút Hủy/Thanh toán biến mất sau khi hủy', (await page.getByRole('button',{name:'Hủy đơn'}).count())===0&&(await page.getByRole('link',{name:/Thanh toán/}).count())===0); await ctx.close(); });

add('D08',CAT_D,'Bấm "Xác nhận thanh toán" liên tục (double / triple click)','Chỉ 1 đơn và 1 giao dịch thành công',async(t,b)=>{
  resetStock(); const u=await newUser(); const {ctx,page}=await makeCtx(b,{user:u,cart:[cartItem(1,'M',[],1)]}); await page.goto(`${BASE}/checkout`); await page.getByTestId('checkout-total').waitFor();
  await confirmBtn(page).click({clickCount:3,delay:10}).catch(()=>{}); await page.waitForURL(/paid=1/,{timeout:12000}).catch(()=>{}); await page.waitForTimeout(800);
  const o=await myOrders(u); t.check('Chỉ 1 đơn được tạo', o.length===1, o.length); t.check('Điểm không bị cộng nhiều lần', await pts(u)===Math.floor(35000/10000), await pts(u));
  t.check('Chỉ 1 giao dịch SUCCESS', sql(`select count(*) from payments where "orderId"=${o[0].id} and status='SUCCESS'`)==='1'); await ctx.close(); });

add('D09',CAT_D,'Mất kết nối ĐÚNG LÚC nhận phản hồi thanh toán, rồi bấm lại','Không trừ tiền hai lần: 1 giao dịch SUCCESS, điểm 1 lần, đơn PAID',async(t,b)=>{
  resetStock(); const u=await newUser(); const {ctx,page}=await makeCtx(b,{user:u,cart:[cartItem(1,'M',[],2)]}); let dropped=false;
  await page.route('**/payments',async r=>{ if(!dropped){ dropped=true; await r.fetch(); await r.abort('connectionreset'); } else r.continue(); });
  await page.goto(`${BASE}/checkout`); await page.getByTestId('checkout-total').waitFor(); await confirmBtn(page).click(); await page.locator('div[role="alert"].border-red-200').waitFor(); const a=await page.locator('div[role="alert"].border-red-200').innerText();
  t.check('Hiện lỗi kết nối, giỏ còn', /Không kết nối được/.test(a)&&(await cartLS(page)).length===1, a); await t.shot(page,'lost');
  const o1=(await myOrders(u))[0]; t.check('Phía server đơn đã PAID (thanh toán đã xử lý)', o1.status==='PAID', o1.status);
  await confirmBtn(page).click(); await page.waitForURL(/paid=1/); t.check('Bấm lại → thấy PAID', (await page.getByTestId('order-status').innerText())==='PAID');
  t.check('Chỉ 1 giao dịch SUCCESS (idempotent)', sql(`select count(*) from payments where "orderId"=${o1.id} and status='SUCCESS'`)==='1'); t.check('Điểm cộng 1 lần', await pts(u)===Math.floor(70000/10000), await pts(u));
  t.check('Chỉ 1 đơn', (await myOrders(u)).length===1); await ctx.close(); });

add('D10',CAT_D,'Mất kết nối ĐÚNG LÚC nhận phản hồi tạo đơn, rồi bấm lại','Không tạo đơn trùng (Idempotency-Key tạo đơn)',async(t,b)=>{
  resetStock(); const u=await newUser(); const {ctx,page}=await makeCtx(b,{user:u,cart:[cartItem(1)]}); let dropped=false; const s0=stock(1);
  await page.route('**/orders',async r=>{ if(r.request().method()==='POST'&&!dropped){ dropped=true; await r.fetch(); await r.abort('connectionreset'); } else r.continue(); });
  await page.goto(`${BASE}/checkout`); await page.getByTestId('checkout-total').waitFor(); await confirmBtn(page).click(); await page.locator('div[role="alert"].border-red-200').waitFor();
  t.check('Server đã tạo 1 đơn dù client không nhận được phản hồi', (await myOrders(u)).length===1); await confirmBtn(page).click(); await page.waitForURL(/paid=1/);
  const o=await myOrders(u); t.check('Sau khi bấm lại vẫn chỉ 1 đơn', o.length===1, o.length); t.check('Kho chỉ trừ 1 lần', stock(1)===s0-1, stock(1)); await ctx.close(); });

add('D11',CAT_D,'Tải lại trang sau khi thanh toán lỗi rồi thanh toán lại','KHÔNG để lại đơn mồ côi giữ kho; chỉ 1 đơn cho 1 giỏ hàng',async(t,b)=>{
  resetStock(); const u=await newUser(); const {ctx,page}=await makeCtx(b,{user:u,cart:[cartItem(5,'M',[],2)]}); const s0=stock(5);
  await page.goto(`${BASE}/checkout`); await page.getByLabel(/Mô phỏng thanh toán lỗi/).check(); await confirmBtn(page).click(); await page.locator('div[role="alert"].border-red-200').waitFor();
  await page.reload(); await page.getByTestId('checkout-total').waitFor(); await confirmBtn(page).click(); await page.waitForURL(/paid=1/);
  const o=await myOrders(u); const st=o.map(x=>x.status).sort().join(',');
  t.check('Chỉ 1 đơn cho 1 giỏ hàng (không có đơn PAYMENT_FAILED mồ côi)', o.length===1, `${o.length} đơn: ${st}`);
  t.check('Kho chỉ bị trừ cho 1 đơn (−2), không bị giữ thừa', stock(5)===s0-2, `kho còn ${stock(5)} / ban đầu ${s0}`); await ctx.close(); });

add('D12',CAT_D,'Thanh toán lại từ trang chi tiết đơn (link "Thanh toán lại")','Sau khi trả tiền thành công, giỏ hàng cũ được dọn (không mua trùng)',async(t,b)=>{
  resetStock(); const u=await newUser(); const {ctx,page}=await makeCtx(b,{user:u,cart:[cartItem(1,'M',[],1)]});
  await page.goto(`${BASE}/checkout`); await page.getByLabel(/Mô phỏng thanh toán lỗi/).check(); await confirmBtn(page).click(); await page.locator('div[role="alert"].border-red-200').waitFor();
  await page.getByRole('link',{name:/Xem \/ hủy đơn/}).click(); await page.getByRole('link',{name:'Thanh toán lại'}).click(); await page.waitForURL(/checkout\?order=/);
  await page.getByTestId('checkout-total').waitFor(); await confirmBtn(page).click(); await page.waitForURL(/paid=1/); t.check('Đơn PAID', (await page.getByTestId('order-status').innerText())==='PAID');
  const c=await cartLS(page); t.check('Giỏ hàng được xóa sau khi trả tiền cho đơn đó', c.length===0, `giỏ còn ${c.length} dòng`); await t.shot(page,'after');
  t.check('Badge giỏ về 0', (await page.getByTestId('cart-badge').innerText())==='0', await page.getByTestId('cart-badge').innerText()); await ctx.close(); });

add('E01',CAT_E,'Lịch sử đơn: trạng thái rỗng, thứ tự mới nhất trước, cô lập giữa người dùng','Người mới chưa có đơn; chỉ thấy đơn của mình; đơn mới ở trên',async(t,b)=>{
  resetStock(); const u=await newUser(), v=await newUser(); const {ctx,page}=await makeCtx(b,{user:u}); await page.goto(`${BASE}/orders`); await page.getByText('Bạn chưa có đơn hàng nào').waitFor(); t.check('Trạng thái rỗng', true); await t.shot(page,'empty');
  const o1=await apiOrder(u,[mk(1)]); const o2=await apiOrder(u,[mk(2,'L',['CREAM'],2)]); await apiOrder(v,[mk(3)]); await apiPay(u,o2.body.id);
  await page.reload(); await page.getByTestId('order-row').first().waitFor(); const rows=await page.getByTestId('order-row').allInnerTexts();
  t.check('Có đúng 2 đơn của mình (không lẫn đơn người khác)', rows.length===2, rows.length); t.check('Đơn mới nhất ở trên cùng', rows[0].includes(o2.body.code), rows[0].replace(/\n/g,' ')); t.check('Hiện trạng thái PAID cho đơn đã trả và "Chờ thanh toán" cho đơn chưa trả', /Đã thanh toán/.test(rows[0])&&/Chờ thanh toán/.test(rows[1]), rows.map(r=>r.replace(/\n/g,' ')).join(' || ')); await t.shot(page,'list'); await ctx.close(); });

add('E02',CAT_E,'Truy cập đơn của người khác / đơn không tồn tại / id sai trên giao diện','Báo lỗi dễ hiểu, không lộ dữ liệu',async(t,b)=>{
  const u=await newUser(), v=await newUser(); const o=await apiOrder(v,[mk(1)]); const {ctx,page}=await makeCtx(b,{user:u});
  await page.goto(`${BASE}/orders/${o.body.id}`); await page.locator('div[role="alert"].border-red-200').waitFor(); const a=await page.locator('div[role="alert"].border-red-200').innerText(); t.check('Đơn người khác → báo không phải đơn của bạn', /không phải đơn của bạn/i.test(a), a); t.check('Không lộ mã/giá của đơn người khác', !a.includes(o.body.code)); await t.shot(page,'forbidden');
  await page.goto(`${BASE}/orders/999999`); await page.locator('div[role="alert"].border-red-200').waitFor(); t.check('Đơn không tồn tại → báo không tìm thấy', /Không tìm thấy/.test(await page.locator('div[role="alert"].border-red-200').innerText()));
  await page.goto(`${BASE}/orders/abc`); await page.locator('div[role="alert"].border-red-200').waitFor(); const a3=await page.locator('div[role="alert"].border-red-200').innerText(); t.check('Id không phải số → lỗi có kiểm soát (không 500)', !/500|Internal/i.test(a3), a3); await ctx.close(); });

add('E03',CAT_E,'Hủy đơn đã thanh toán: hộp xác nhận, hoàn kho; chọn "Hủy" ở hộp thoại thì giữ nguyên','Accept → CANCELLED + kho hoàn; Dismiss → đơn không đổi',async(t,b)=>{
  resetStock(); const u=await newUser(); const o=await apiOrder(u,[mk(1,'M',[],4)]); await apiPay(u,o.body.id); const s=stock(1); const {ctx,page}=await makeCtx(b,{user:u});
  page.removeAllListeners('dialog'); page.once('dialog',d=>d.dismiss()); await page.goto(`${BASE}/orders/${o.body.id}`); await page.getByTestId('order-status').waitFor(); await page.getByRole('button',{name:'Hủy đơn'}).click(); await page.waitForTimeout(600);
  t.check('Từ chối hộp thoại → vẫn PAID', (await page.getByTestId('order-status').innerText())==='PAID');
  page.once('dialog',d=>d.accept()); await page.getByRole('button',{name:'Hủy đơn'}).click(); await page.getByText('CANCELLED').first().waitFor(); t.check('Xác nhận → CANCELLED', true); t.check('Kho hoàn lại +4', stock(1)===s+4, `${s}→${stock(1)}`); await t.shot(page,'cancelled'); await ctx.close(); });

add('E04',CAT_E,'Trạng thái pha chế do nhân viên cập nhật hiện lên trang đơn (tự làm mới)','PAID → PREPARING → READY → COMPLETED hiển thị trong ≤ 6 giây mỗi bước',async(t,b)=>{
  resetStock(); const u=await newUser(); const o=await apiOrder(u,[mk(4)]); await apiPay(u,o.body.id); const st=await staffToken(); const {ctx,page}=await makeCtx(b,{user:u});
  await page.goto(`${BASE}/orders/${o.body.id}`); await page.getByTestId('order-status').waitFor();
  for (const s of ['PREPARING','READY']) { const r=await api(`/orders/${o.body.id}/status`,{method:'PATCH',body:{status:s},token:st}); t.check(`Nhân viên đặt ${s} → ${r.status}`, r.status===200);
    const t0=Date.now(); await page.getByTestId('order-status').filter({hasText:s}).waitFor({timeout:7000}).catch(()=>{}); const ok=(await page.getByTestId('order-status').innerText())===s; t.check(`Trang đơn tự cập nhật sang ${s}`, ok, `${Date.now()-t0}ms`); if(s==='READY') await t.shot(page,'ready'); }
  await api(`/orders/${o.body.id}/status`,{method:'PATCH',body:{status:'COMPLETED'},token:st}); await page.reload(); await page.getByTestId('order-status').waitFor(); t.check('COMPLETED hiển thị, không còn nút hủy', (await page.getByTestId('order-status').innerText())==='COMPLETED'&&(await page.getByRole('button',{name:'Hủy đơn'}).count())===0); await ctx.close(); });

add('E05',CAT_E,'Khách không được hủy đơn khi đã vào pha chế','Ẩn nút Hủy ở PREPARING; API trả 409',async(t,b)=>{
  resetStock(); const u=await newUser(); const o=await apiOrder(u,[mk(1)]); await apiPay(u,o.body.id); const st=await staffToken(); await api(`/orders/${o.body.id}/status`,{method:'PATCH',body:{status:'PREPARING'},token:st});
  const {ctx,page}=await makeCtx(b,{user:u}); await page.goto(`${BASE}/orders/${o.body.id}`); await page.getByTestId('order-status').waitFor();
  t.check('Không có nút Hủy đơn khi PREPARING', (await page.getByRole('button',{name:'Hủy đơn'}).count())===0); const r=await api(`/orders/${o.body.id}/cancel`,{method:'POST',token:u.token}); t.check('API hủy đơn đang pha chế → 409', r.status===409, r.status); await ctx.close(); });

add('E06',CAT_E,'Hủy đơn đã thanh toán: điểm thưởng có bị thu hồi?','Hủy đơn PAID thì điểm đã cộng phải được trừ lại (không "mua rồi hủy" để gom điểm)',async(t,b)=>{
  resetStock(); const u=await newUser(); const o=await apiOrder(u,[mk(8,'M',[],2)]); await apiPay(u,o.body.id); const p1=await pts(u); t.check('Sau khi trả tiền được cộng điểm', p1>0, p1);
  const r=await api(`/orders/${o.body.id}/cancel`,{method:'POST',token:u.token}); t.check('Hủy đơn PAID thành công', r.status===201||r.status===200, r.status); const p2=await pts(u);
  t.check('Điểm được thu hồi sau khi hủy (về 0)', p2===0, `trước hủy ${p1} → sau hủy ${p2}`); });

add('F01',CAT_F,'Đặt vượt tồn kho trên giao diện','Báo hết hàng, giỏ giữ nguyên, kho không đổi, không tạo đơn',async(t,b)=>{
  sql('update products set stock=3 where id=6'); const u=await newUser(); const {ctx,page}=await makeCtx(b,{user:u,cart:[cartItem(6,'M',[],4)]});
  await page.goto(`${BASE}/checkout`); await page.getByTestId('checkout-total').waitFor(); await confirmBtn(page).click(); await page.locator('div[role="alert"].border-red-200').waitFor(); const a=await page.locator('div[role="alert"].border-red-200').innerText();
  t.check('Hiện thông báo hết hàng/không đủ', /hết hàng|không đủ|tồn kho/i.test(a), a); await t.shot(page,'oos'); t.check('Giỏ còn nguyên', (await cartLS(page)).length===1); t.check('Kho không đổi (3)', stock(6)===3, stock(6)); t.check('Không tạo đơn', (await myOrders(u)).length===0); await ctx.close(); resetStock(); });

add('F02',CAT_F,'Hai khách cùng mua ly cuối cùng trên giao diện (2 trình duyệt đồng thời)','Đúng 1 người đặt được, người kia nhận thông báo hết hàng, kho = 0',async(t,b)=>{
  sql('update products set stock=1 where id=7'); const A=await newUser(), B=await newUser();
  const ca=await makeCtx(b,{user:A,cart:[cartItem(7)]}), cb=await makeCtx(b,{user:B,cart:[cartItem(7)]});
  await Promise.all([ca.page.goto(`${BASE}/checkout`),cb.page.goto(`${BASE}/checkout`)]); await Promise.all([confirmBtn(ca.page).waitFor(),confirmBtn(cb.page).waitFor()]);
  await Promise.all([confirmBtn(ca.page).click(),confirmBtn(cb.page).click()]); await Promise.all([ca.page.waitForTimeout(2500),cb.page.waitForTimeout(2500)]);
  const win=[ca.page,cb.page].filter(p=>/paid=1/.test(p.url())).length; const lose=[ca.page,cb.page].filter(p=>!/paid=1/.test(p.url())).length;
  t.check('Đúng 1 người thanh toán thành công', win===1, `${win} thành công`); t.check('Người còn lại nhận lỗi', lose===1); t.check('Kho = 0, không âm', stock(7)===0, stock(7));
  const loser=[ca.page,cb.page].find(p=>!/paid=1/.test(p.url())); if (loser) { await t.shot(loser,'loser'); const a=await loser.locator('div[role="alert"].border-red-200').innerText().catch(()=>''); t.check('Người thua thấy thông báo hết hàng', /hết hàng|không đủ/i.test(a), a); }
  await ca.ctx.close(); await cb.ctx.close(); resetStock(); });

add('F03',CAT_F,'Vòng đời tồn kho: tạo đơn trừ, thanh toán lỗi giữ, hủy hoàn','Kho đúng ở từng bước',async(t,b)=>{
  resetStock(); const u=await newUser(); const s0=stock(4); const o=await apiOrder(u,[mk(4,'M',[],5)]); t.check('Tạo đơn PENDING trừ kho (−5)', stock(4)===s0-5, stock(4));
  await apiPay(u,o.body.id,{simulateFailure:true}); t.check('Thanh toán lỗi vẫn giữ kho', stock(4)===s0-5, stock(4)); await apiPay(u,o.body.id); t.check('Thanh toán thành công không trừ thêm', stock(4)===s0-5, stock(4));
  await api(`/orders/${o.body.id}/cancel`,{method:'POST',token:u.token}); t.check('Hủy → hoàn đủ kho', stock(4)===s0, stock(4)); const r=await api(`/orders/${o.body.id}/cancel`,{method:'POST',token:u.token}); t.check('Hủy lần 2 bị chặn (409), kho không cộng lần hai', r.status===409&&stock(4)===s0, `${r.status}, kho ${stock(4)}`); });

add('F04',CAT_F,'Giá thay đổi sau khi khách đã bỏ món vào giỏ','Khách KHÔNG bị trừ tiền ở giá mới khi chưa được thấy: hệ thống dừng, báo giá mới, chờ xác nhận lại',async(t,b)=>{
  resetStock(); const u=await newUser(); const {ctx,page}=await makeCtx(b,{user:u,cart:[cartItem(1,'M',[],2)]}); sql('update products set price=50000 where id=1');
  try { await page.goto(`${BASE}/checkout`); await page.getByTestId('checkout-total').waitFor(); const shown=money(await page.getByTestId('checkout-total').innerText()); t.note(`Giỏ hiển thị ${fmt(shown)}, giá thật trên server là ${fmt(100000)}`);
    await confirmBtn(page).click(); await page.locator('div[role="alert"].border-red-200').waitFor(); const a=await page.locator('div[role="alert"].border-red-200').innerText(); await t.shot(page,'warning');
    t.check('Hiện cảnh báo giá đã thay đổi kèm tổng mới', /Giá một số món đã thay đổi/.test(a)&&/100\.000đ/.test(a), a);
    const o1=(await myOrders(u))[0]; t.check('Chưa trừ tiền: đơn vẫn PENDING', o1.status==='PENDING', o1.status);
    t.check('Tổng hiển thị đã cập nhật đúng giá mới (100.000đ)', money(await page.getByTestId('checkout-total').innerText())===100000);
    await confirmBtn(page).click(); await page.waitForURL(/paid=1/); const actual=money(await page.locator('p:has-text("Tổng") span').last().innerText()); t.check('Sau khi khách xác nhận, số tiền trả = số tiền đã thấy', actual===100000, fmt(actual)); t.check('Chỉ 1 đơn', (await myOrders(u)).length===1); await t.shot(page,'confirm'); } finally { resetStock(); } await ctx.close(); });

add('F05',CAT_F,'Món đã sold-out sau khi nằm trong giỏ','Báo lỗi rõ khi thanh toán, giỏ giữ nguyên',async(t,b)=>{
  resetStock(); const u=await newUser(); const {ctx,page}=await makeCtx(b,{user:u,cart:[cartItem(8)]}); sql('update products set stock=0 where id=8');
  await page.goto(`${BASE}/checkout`); await confirmBtn(page).click(); await page.locator('div[role="alert"].border-red-200').waitFor(); t.check('Báo hết hàng', /hết hàng|không đủ/i.test(await page.locator('div[role="alert"].border-red-200').innerText())); t.check('Giỏ còn', (await cartLS(page)).length===1); await ctx.close(); resetStock(); });

add('G01',CAT_G,'Xác thực và phân quyền','Không token/sai token → 401; khách đổi trạng thái → 403; staff đặt PAID tay → 400',async(t,b)=>{
  const u=await newUser(); const o=await apiOrder(u,[mk(1)]); const st=await staffToken();
  for (const [m,p] of [['GET','/orders/me'],['POST','/orders'],['POST','/payments'],['GET','/auth/me']]) { const r=await api(p,{method:m,body:m==='POST'?{}:undefined}); t.check(`${m} ${p} không token → 401`, r.status===401, r.status); }
  const r1=await api('/orders/me',{token:'abc.def.ghi'}); t.check('Token sai → 401', r1.status===401, r1.status);
  const r2=await api(`/orders/${o.body.id}/status`,{method:'PATCH',body:{status:'PREPARING'},token:u.token}); t.check('CUSTOMER đổi trạng thái pha chế → 403', r2.status===403, r2.status);
  const r3=await api(`/orders/${o.body.id}/status`,{method:'PATCH',body:{status:'PAID'},token:st}); t.check('STAFF đặt PAID bằng tay → 400', r3.status===400, r3.status);
  const v=await newUser(); const r4=await api(`/orders/${o.body.id}`,{token:v.token}); t.check('Xem đơn người khác → 403', r4.status===403, r4.status); const r5=await api('/payments',{body:{orderId:o.body.id,method:'WALLET'},token:v.token,headers:{'Idempotency-Key':key()}}); t.check('Thanh toán đơn người khác bị chặn (400/403/404)', [400,403,404].includes(r5.status), r5.status);
  const r6=await api(`/orders/${o.body.id}/cancel`,{method:'POST',token:v.token}); t.check('Hủy đơn người khác → 403', r6.status===403, r6.status);
  const me=await api('/auth/me',{token:u.token}); t.check('/auth/me không lộ mật khẩu/hash', !/password/i.test(me.text), me.text.slice(0,120)); const lg=await api('/auth/login',{body:{email:u.email,password:u.password}}); t.check('Đăng nhập không trả hash mật khẩu', !/password/i.test(lg.text)); });

add('G02',CAT_G,'Kiểm tra dữ liệu tạo đơn (validation)','Mọi dữ liệu sai bị từ chối 400, không 500',async(t,b)=>{
  const u=await newUser(); const bad=[['giỏ rỗng',{items:[]}],['qty = 0',{items:[mk(1,'M',[],0)]}],['qty âm',{items:[mk(1,'M',[],-1)]}],['qty 21',{items:[mk(1,'M',[],21)]}],['qty số lẻ 1.5',{items:[mk(1,'M',[],1.5)]}],['qty là chữ',{items:[{...mk(1),qty:'abc'}]}],['size XL',{items:[mk(1,'XL')]}],['productId không tồn tại',{items:[mk(9999)]}],['productId âm',{items:[mk(-1)]}],['thêm trường unitPrice',{items:[{...mk(1),unitPrice:1}]}],['thêm trường total ở đơn',{items:[mk(1)],total:1}],['topping lạ FOO',{items:[mk(1,'M',['FOO'])]}],['topping không phải mảng',{items:[{...mk(1),toppings:'PEARL'}]}],['items không phải mảng',{items:'abc'}],['thiếu items',{}],['51 dòng',{items:Array.from({length:51},()=>mk(1))}],['couponCode quá dài',{items:[mk(1)],couponCode:'x'.repeat(41)}]];
  for (const [name,body] of bad) { const r=await api('/orders',{body,token:u.token,headers:{'Idempotency-Key':key()}}); t.check(`${name} → 400/404`, [400,404].includes(r.status), `${r.status} ${JSON.stringify(r.body?.message)?.slice(0,70)}`); }
  const r=await api('/orders',{body:'{"items":[',token:u.token,headers:{'Idempotency-Key':key()}}); t.check('JSON hỏng → 400', r.status===400, r.status);
  t.check('Không tạo đơn nào từ các request sai', (await myOrders(u)).length===0, (await myOrders(u)).length); });

add('G03',CAT_G,'Tính giá phía server: topping trùng, không tin giá client, đơn nhiều dòng','Giá server đúng công thức, topping lặp chỉ tính 1 lần',async(t,b)=>{
  resetStock(); const u=await newUser(); let r=await apiOrder(u,[mk(3,'L',['PEARL','PEARL','CREAM'],2)]); const want=2*price(3,'L',['PEARL','CREAM']);
  t.check(`Topping lặp tính 1 lần: tổng ${fmt(want)}`, r.status===201&&r.body.total===want, JSON.stringify([r.status,r.body?.total]));
  r=await apiOrder(u,[mk(1,'S'),mk(1,'S'),mk(2,'L',['SHOT'])]); t.check('Đơn nhiều dòng (gồm cùng món lặp) tính đúng', r.status===201&&r.body.total===2*price(1,'S')+price(2,'L',['SHOT']), JSON.stringify([r.status,r.body?.total])); });

add('G04',CAT_G,'Kiểm tra dữ liệu thanh toán và idempotency','Thiếu/quá dài key, method sai, đơn đã xong/đã hủy, key dùng cho đơn khác',async(t,b)=>{
  resetStock(); const u=await newUser(); const o=await apiOrder(u,[mk(1)]); const o2=await apiOrder(u,[mk(2)]);
  let r=await api('/payments',{body:{orderId:o.body.id,method:'WALLET'},token:u.token}); t.check('Thiếu Idempotency-Key → 400', r.status===400, r.status);
  r=await api('/payments',{body:{orderId:o.body.id,method:'WALLET'},token:u.token,headers:{'Idempotency-Key':'x'.repeat(129)}}); t.check('Key dài 129 ký tự → 400', r.status===400, r.status);
  r=await api('/payments',{body:{orderId:o.body.id,method:'CASH'},token:u.token,headers:{'Idempotency-Key':key()}}); t.check('method = CASH (tiền mặt) → 400', r.status===400, r.status);
  for (const bad of [0,-5,1.5,'abc']) { r=await api('/payments',{body:{orderId:bad,method:'WALLET'},token:u.token,headers:{'Idempotency-Key':key()}}); t.check(`orderId = ${JSON.stringify(bad)} → 400`, r.status===400, r.status); }
  r=await api('/payments',{body:{orderId:999999,method:'WALLET'},token:u.token,headers:{'Idempotency-Key':key()}}); t.check('Đơn không tồn tại → 400/404', [400,404].includes(r.status), r.status);
  const k1=key(); r=await api('/payments',{body:{orderId:o.body.id,method:'WALLET'},token:u.token,headers:{'Idempotency-Key':k1}}); t.check('Thanh toán đúng → 200/201', [200,201].includes(r.status), r.status);
  r=await api('/payments',{body:{orderId:o2.body.id,method:'WALLET'},token:u.token,headers:{'Idempotency-Key':k1}}); t.check('Dùng lại key cho ĐƠN KHÁC → 409', r.status===409, r.status);
  r=await api('/payments',{body:{orderId:o.body.id,method:'WALLET'},token:u.token,headers:{'Idempotency-Key':key()}}); t.check('Trả lại đơn đã PAID bằng key mới → 409', r.status===409, r.status);
  await api(`/orders/${o2.body.id}/cancel`,{method:'POST',token:u.token}); r=await api('/payments',{body:{orderId:o2.body.id,method:'WALLET'},token:u.token,headers:{'Idempotency-Key':key()}}); t.check('Trả tiền đơn đã hủy → 409', r.status===409, r.status);
  const k2=key(); const rs=await Promise.all(Array.from({length:6},()=>api('/payments',{body:{orderId:(0)||o.body.id,method:'WALLET'},token:u.token,headers:{'Idempotency-Key':k2}}))); t.check('6 request đồng thời cùng key trên đơn đã PAID: không 500', rs.every(x=>x.status<500), rs.map(x=>x.status).join(',')); });

add('G05',CAT_G,'Thanh toán đồng thời 8 request, 8 key khác nhau cho cùng 1 đơn','Chỉ 1 giao dịch thành công, điểm chỉ cộng 1 lần',async(t,b)=>{
  resetStock(); const u=await newUser(); const o=await apiOrder(u,[mk(8,'M',[],2)]); const rs=await Promise.all(Array.from({length:8},()=>apiPay(u,o.body.id)));
  const ok=rs.filter(r=>[200,201].includes(r.status)&&r.body?.success).length; t.check('Đúng 1 thanh toán thành công', ok===1, rs.map(r=>r.status).join(',')); t.check('Không có lỗi 500', rs.every(r=>r.status<500));
  t.check('Chỉ 1 giao dịch SUCCESS trong CSDL', sql(`select count(*) from payments where "orderId"=${o.body.id} and status='SUCCESS'`)==='1'); t.check('Điểm cộng đúng 1 lần', await pts(u)===Math.floor(110000/10000), await pts(u)); });

add('G06',CAT_G,'Đặt hàng đồng thời: 30 khách mua sản phẩm còn 10','Đúng 10 đơn thành công, kho 0, không âm, không 500',async(t,b)=>{
  sql('update products set stock=10, version=1 where id=2'); const us=await Promise.all(Array.from({length:30},()=>newUser()));
  const rs=await Promise.all(us.map(u=>apiOrder(u,[mk(2)]))); const ok=rs.filter(r=>r.status===201).length; const oos=rs.filter(r=>r.status===409).length;
  t.check('Đúng 10 đơn thành công', ok===10, `${ok} thành công, ${oos} bị 409, khác: ${rs.filter(r=>![201,409].includes(r.status)).map(r=>r.status).join(',')||'không'}`); t.check('Kho = 0', stock(2)===0, stock(2)); t.check('Không có 500', rs.every(r=>r.status<500)); resetStock(); });

add('G07',CAT_G,'CORS và header phản hồi','Chỉ cho phép origin của frontend',async(t,b)=>{
  let r=await api('/products',{origin:'http://localhost:3000'}); t.check('Origin localhost:3000 được phép', r.headers.get('access-control-allow-origin')==='http://localhost:3000', r.headers.get('access-control-allow-origin'));
  r=await api('/products',{origin:'http://evil.example'}); t.check('Origin lạ không được cấp CORS', r.headers.get('access-control-allow-origin')!=='http://evil.example'&&r.headers.get('access-control-allow-origin')!=='*', r.headers.get('access-control-allow-origin')); });

add('H01',CAT_H,'Giao diện điện thoại (375×812): không tràn ngang trên mọi trang chính','scrollWidth ≤ chiều rộng màn hình',async(t,b)=>{
  resetStock(); const u=await newUser(); const o=await apiOrder(u,[mk(1,'M',['PEARL'],2)]); const {ctx,page}=await makeCtx(b,{user:u,cart:[cartItem(3,'L',['PEARL','CREAM'],2),cartItem(4)],viewport:{width:375,height:812}});
  for (const [name,url] of [['menu','/'],['chi-tiet','/products/3'],['gio','/cart'],['thanh-toan','/checkout'],['lich-su','/orders'],['don',`/orders/${o.body.id}`],['dang-nhap','/login'],['dang-ky','/register']]) {
    await page.goto(BASE+url); await page.waitForTimeout(700); const w=await page.evaluate(()=>[document.documentElement.scrollWidth,window.innerWidth]); t.check(`Trang ${name}: không tràn ngang`, w[0]<=w[1], `scrollWidth ${w[0]} / ${w[1]}`); if (['menu','gio','thanh-toan'].includes(name)) await t.shot(page,name); }
  await ctx.close(); });

add('H02',CAT_H,'Bàn phím: Enter để đăng nhập; Tab đi qua form theo thứ tự','Enter gửi form',async(t,b)=>{
  const u=await newUser(); const {ctx,page}=await makeCtx(b); await page.goto(`${BASE}/login`); await page.getByLabel('Email').fill(u.email); await page.getByLabel(/Mật khẩu/).fill(u.password); await page.keyboard.press('Enter');
  await page.getByText('Đơn của tôi').waitFor(); t.check('Enter gửi form đăng nhập', true); await ctx.close(); });

add('H03',CAT_H,'Lỗi console trình duyệt khi đi qua các trang chính','Không có lỗi JavaScript / hydration',async(t,b)=>{
  resetStock(); const u=await newUser(); const o=await apiOrder(u,[mk(1)]); await apiPay(u,o.body.id); const {ctx,page}=await makeCtx(b,{user:u,cart:[cartItem(3)]});
  for (const url of ['/','/products/3','/cart','/checkout','/orders',`/orders/${o.body.id}`,'/login']) { await page.goto(BASE+url); await page.waitForTimeout(900); }
  const errs=page.errors.filter(e=>!/favicon|Failed to load resource: the server responded with a status of (401|403|404|409)/.test(e)); t.check('Không có lỗi console đáng kể', errs.length===0, errs.slice(0,2).join(' | ').slice(0,200)); await ctx.close(); });
module.exports = T;
