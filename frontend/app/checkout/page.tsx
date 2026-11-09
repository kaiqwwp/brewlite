'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { api, ApiError, fmt, OrderView } from '@/lib/api';
import { uuid } from '@/lib/uuid';
import { cartTotal, useAuth, useCart, useMounted } from '@/lib/store';
import { useRequireAuth } from '@/components/useRequireAuth';
import { Empty, ErrorBox, Spinner } from '@/components/ui';

function Checkout() {
  const mounted = useMounted();
  const token = useRequireAuth();
  const router = useRouter();
  const retryId = useSearchParams().get('order');
  const { items, clear } = useCart();
  const { logout, setUser } = useAuth();

  const [method, setMethod] = useState<'WALLET' | 'CARD'>('WALLET');
  const [coupon, setCoupon] = useState('');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [order, setOrder] = useState<OrderView | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(!!retryId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Idempotency-Key giữ nguyên cho tới khi nhận được phản hồi dứt khoát → bấm lặp/mất mạng không tạo đơn/trừ tiền 2 lần
  const orderKey = useRef(uuid());
  const payKey = useRef(uuid());

  useEffect(() => {
    if (!token || !retryId) return;
    api<OrderView>(`/orders/${retryId}`, { token }).then(setOrder).catch((e: ApiError) => setError(e.message)).finally(() => setLoadingOrder(false));
  }, [token, retryId]);

  if (!mounted || !token || loadingOrder) return <Spinner />;
  const fromCart = !retryId && !order;
  if (fromCart && items.length === 0) return <Empty title="Giỏ hàng trống"><Link href="/" className="btn-primary">Xem menu</Link></Empty>;
  const payable = !order || ['PENDING', 'PAYMENT_FAILED'].includes(order.status);
  const total = order ? order.total : cartTotal(items);

  async function submit() {
    setBusy(true); setError(null);
    try {
      let current = order;
      if (!current) {
        current = await api<OrderView>('/orders', {
          token, headers: { 'Idempotency-Key': orderKey.current },
          body: {
            items: items.map((i) => ({ productId: i.productId, size: i.size, toppings: i.toppings, qty: i.qty })),
            couponCode: coupon.trim() || undefined,
          },
        });
        setOrder(current);
      }
      const res = await api<any>('/payments', {
        token, headers: { 'Idempotency-Key': payKey.current },
        body: { orderId: current.id, method, simulateFailure: simulateFailure || undefined },
      });
      payKey.current = uuid(); // phản hồi dứt khoát → lần thử sau dùng key mới
      setOrder(res.order);
      if (!res.success) { setError(`${res.message}. Giỏ hàng được giữ nguyên, bạn có thể thử lại.`); return; }
      if (!retryId) clear();
      api('/auth/me', { token }).then(setUser).catch(() => {});
      router.push(`/orders/${current.id}?paid=1`);
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 401) { logout(); router.replace('/login?next=/checkout'); return; }
      setError(err.message);
    } finally { setBusy(false); }
  }

  const lines = order ? order.items.map((i) => ({ k: String(i.id), name: `${i.productName} · ${i.size}`, qty: i.qty, amount: i.lineTotal })) :
    items.map((i) => ({ k: i.key, name: `${i.name} · ${i.size}`, qty: i.qty, amount: i.unitPrice * i.qty }));

  return (
    <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
      <section className="card space-y-3 p-4">
        <h1 className="text-xl font-extrabold">Thanh toán</h1>
        {order && <p className="text-sm text-espresso-500">Đơn {order.code} · {order.status}</p>}
        <ul className="divide-y divide-espresso-100 text-sm">
          {lines.map((l) => <li key={l.k} className="flex justify-between py-2"><span>{l.name} × {l.qty}</span><span>{fmt(l.amount)}</span></li>)}
        </ul>
        {order && order.discount > 0 && <p className="flex justify-between text-sm text-emerald-700"><span>Giảm giá ({order.couponCode})</span><span>−{fmt(order.discount)}</span></p>}
        <p className="flex justify-between border-t border-espresso-100 pt-3 text-lg font-extrabold"><span>Tổng</span><span data-testid="checkout-total">{fmt(total)}</span></p>
      </section>

      <section className="card space-y-4 p-4">
        <fieldset>
          <legend className="mb-2 font-semibold">Phương thức (không dùng tiền mặt)</legend>
          {([['WALLET', 'Ví điện tử'], ['CARD', 'Thẻ ngân hàng']] as const).map(([v, label]) => (
            <label key={v} className="mb-2 flex cursor-pointer items-center gap-3 rounded-xl border border-espresso-200 bg-white px-3 py-2.5">
              <input type="radio" name="method" checked={method === v} onChange={() => setMethod(v)} /> {label}
            </label>
          ))}
        </fieldset>
        {!order && (
          <label className="block text-sm font-medium">Mã giảm giá (tuỳ chọn)
            <input className="input mt-1 uppercase" placeholder="VD: BREW10" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
          </label>
        )}
        <label className="flex items-center gap-2 text-xs text-espresso-500">
          <input type="checkbox" checked={simulateFailure} onChange={(e) => setSimulateFailure(e.target.checked)} />
          Mô phỏng thanh toán lỗi (chỉ để demo)
        </label>
        {error && <ErrorBox message={error} />}
        {payable ? (
          <button className="btn-primary w-full" disabled={busy} onClick={submit}>{busy ? 'Đang xử lý…' : `Xác nhận thanh toán ${fmt(total)}`}</button>
        ) : (
          <p className="text-sm">Đơn này không thể thanh toán ở trạng thái hiện tại. <Link className="underline" href={`/orders/${order!.id}`}>Xem đơn</Link></p>
        )}
        {order && payable && <Link href={`/orders/${order.id}`} className="block text-center text-sm text-espresso-500 hover:underline">Xem / hủy đơn {order.code}</Link>}
      </section>
    </div>
  );
}

export default function CheckoutPage() { return <Suspense><Checkout /></Suspense>; }
