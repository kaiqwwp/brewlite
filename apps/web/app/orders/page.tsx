'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, fmt, OrderView, STATUS_LABEL } from '@/lib/api';
import { useRequireAuth } from '@/components/useRequireAuth';
import { Empty, ErrorBox, Spinner } from '@/components/ui';

export default function OrdersPage() {
  const token = useRequireAuth();
  const [orders, setOrders] = useState<OrderView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    api<OrderView[]>('/orders/me', { token }).then(setOrders).catch((e: ApiError) => setError(e.message));
  }, [token]);
  useEffect(load, [load]);

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!orders) return <Spinner />;
  if (orders.length === 0) return <Empty title="Bạn chưa có đơn hàng nào"><Link href="/" className="btn-primary">Đặt món ngay</Link></Empty>;
  return (
    <>
      <h1 className="mb-3 text-xl font-extrabold">Lịch sử đơn hàng</h1>
      <ul className="space-y-3">
        {orders.map((o) => {
          const st = STATUS_LABEL[o.status] ?? { text: o.status, cls: 'bg-stone-200', hint: '' };
          return (
            <li key={o.id}>
              <Link href={`/orders/${o.id}`} data-testid="order-row" className="card flex items-center justify-between gap-3 p-4 hover:shadow-md">
                <div>
                  <p className="font-bold">Đơn {o.code}</p>
                  <p className="text-xs text-espresso-500">{new Date(o.createdAt).toLocaleString('vi-VN')} · {o.items.reduce((s, i) => s + i.qty, 0)} món</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{fmt(o.total)}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.cls}`}>{st.text}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
