'use client';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { api, ApiError, fmt, OrderView, STATUS_LABEL } from '@/lib/api';
import { useRequireAuth } from '@/components/useRequireAuth';
import { ErrorBox, Spinner } from '@/components/ui';

const LIVE = ['PAID', 'PREPARING', 'READY'];
const CANCELLABLE = ['PENDING', 'PAYMENT_FAILED', 'PAID'];

function Confirmation() {
  const { id } = useParams<{ id: string }>();
  const justPaid = useSearchParams().get('paid') === '1';
  const token = useRequireAuth();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    api<OrderView>(`/orders/${id}`, { token }).then(setOrder).catch((e: ApiError) => setError(e.message));
  }, [token, id]);
  useEffect(load, [load]);
  // Cập nhật trạng thái pha chế khi đơn còn đang xử lý
  useEffect(() => {
    if (!order || !LIVE.includes(order.status)) return;
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [order, load]);

  async function cancel() {
    if (!token || !confirm('Bạn chắc chắn muốn hủy đơn này?')) return;
    setBusy(true);
    try { setOrder(await api<OrderView>(`/orders/${id}/cancel`, { method: 'POST', token, body: undefined })); }
    catch (e) { setError((e as ApiError).message); }
    finally { setBusy(false); }
  }

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!order) return <Spinner />;
  const st = STATUS_LABEL[order.status] ?? { text: order.status, cls: 'bg-stone-200', hint: '' };
  const ok = ['PAID', 'PREPARING', 'READY', 'COMPLETED'].includes(order.status);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="card p-6 text-center">
        <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-2xl ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`} aria-hidden>{ok ? '✓' : '!'}</div>
        <h1 className="text-xl font-extrabold">{justPaid && ok ? 'Đặt hàng thành công' : `Đơn ${order.code}`}</h1>
        <p data-testid="order-code" className="mt-1 text-2xl font-black text-espresso-700">Mã đơn: {order.code}</p>
        <p className="mt-2">Trạng thái: <span data-testid="order-status" className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${st.cls}`}>{order.status}</span> <span className="text-sm text-espresso-500">({st.text})</span></p>
        <p className="mt-2 text-sm text-espresso-500">{st.hint}</p>
      </div>
      <div className="card space-y-2 p-4 text-sm">
        <ul className="divide-y divide-espresso-100">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between py-2"><span>{i.productName} · {i.size}{i.toppings.length ? ` (+${i.toppings.length} topping)` : ''} × {i.qty}</span><span>{fmt(i.lineTotal)}</span></li>
          ))}
        </ul>
        {order.discount > 0 && <p className="flex justify-between text-emerald-700"><span>Giảm giá ({order.couponCode})</span><span>−{fmt(order.discount)}</span></p>}
        <p className="flex justify-between border-t border-espresso-100 pt-2 text-base font-extrabold"><span>Tổng</span><span>{fmt(order.total)}</span></p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {['PENDING', 'PAYMENT_FAILED'].includes(order.status) && <Link href={`/checkout?order=${order.id}`} className="btn-primary">Thanh toán {order.status === 'PAYMENT_FAILED' ? 'lại' : 'ngay'}</Link>}
        {CANCELLABLE.includes(order.status) && <button className="btn-ghost" disabled={busy} onClick={cancel}>Hủy đơn</button>}
        <Link href="/orders" className="btn-ghost">Lịch sử đơn</Link>
        <Link href="/" className="btn-ghost">Về trang chủ</Link>
      </div>
    </div>
  );
}

export default function OrderPage() { return <Suspense><Confirmation /></Suspense>; }
