'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, fmt, Product } from '@/lib/api';
import { Empty, ErrorBox, Spinner } from '@/components/ui';

export default function MenuPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null); setProducts(null);
    api<Product[]>('/products').then(setProducts).catch((e: ApiError) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  return (
    <>
      <section className="mb-6 rounded-3xl bg-espresso-700 px-6 py-8 text-white">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Đặt cà phê, không cần xếp hàng</h1>
        <p className="mt-1 text-espresso-100">Chọn đồ uống, thanh toán không tiền mặt và nhận nhanh tại quầy.</p>
      </section>
      <h2 className="mb-3 text-lg font-bold">Menu</h2>
      {error && <ErrorBox message={error} onRetry={load} />}
      {!error && products === null && <Spinner label="Đang tải menu…" />}
      {products && products.length === 0 && <Empty title="Menu đang trống">Vui lòng quay lại sau nhé.</Empty>}
      {products && products.length > 0 && (
        <ul data-testid="menu-grid" className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <li key={p.id}>
              <Link href={`/products/${p.id}`} className="card block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="aspect-square bg-espresso-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold leading-tight">{p.name}</h3>
                  <p className="mt-1 text-sm font-bold text-espresso-600">{fmt(p.price)}</p>
                  {p.stock === 0 && <p className="mt-1 text-xs font-semibold text-red-600">Hết hàng</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
