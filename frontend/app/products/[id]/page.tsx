'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { api, ApiError, fmt, ProductDetail } from '@/lib/api';
import { useCart } from '@/lib/store';
import { ErrorBox, Spinner } from '@/components/ui';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const add = useCart((s) => s.add);
  const [p, setP] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState<'S' | 'M' | 'L'>('M');
  const [toppings, setToppings] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api<ProductDetail>(`/products/${id}`).then(setP).catch((e: ApiError) => setError(e.status === 404 ? 'Không tìm thấy sản phẩm.' : e.message));
  }, [id]);

  // Giá hiển thị = giá gốc + chênh lệch size + topping (server sẽ tính lại khi tạo đơn)
  const unit = useMemo(() => {
    if (!p) return 0;
    const sz = p.options.sizes.find((s) => s.code === size)?.delta ?? 0;
    const tp = p.options.toppings.filter((t) => toppings.includes(t.code)).reduce((s, t) => s + t.price, 0);
    return p.price + sz + tp;
  }, [p, size, toppings]);

  if (error) return <ErrorBox message={error} />;
  if (!p) return <Spinner />;

  const onAdd = () => {
    add({ productId: p.id, name: p.name, imageUrl: p.imageUrl, size, toppings, qty, unitPrice: unit });
    setAdded(true);
  };

  return (
    <div>
      <button onClick={() => router.back()} className="mb-4 text-sm font-medium text-espresso-500 hover:underline">← Quay lại</button>
      <div className="card grid gap-6 overflow-hidden md:grid-cols-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.imageUrl} alt={p.name} className="aspect-square w-full bg-espresso-50 object-cover" />
        <div className="space-y-5 p-5">
          <div>
            <h1 className="text-2xl font-extrabold">{p.name}</h1>
            <p className="mt-1 text-espresso-500">{p.description}</p>
            <p className="mt-2 text-sm text-espresso-500">Giá gốc (size M): {fmt(p.price)}</p>
          </div>
          <fieldset>
            <legend className="mb-2 font-semibold">Size</legend>
            <div className="flex gap-2">
              {p.options.sizes.map((s) => (
                <button key={s.code} type="button" onClick={() => setSize(s.code)} aria-pressed={size === s.code}
                  className={`btn flex-1 border ${size === s.code ? 'border-espresso-600 bg-espresso-600 text-white' : 'border-espresso-200 bg-white'}`}>
                  {s.code}<span className="ml-1 text-xs opacity-80">{s.delta === 0 ? '' : `${s.delta > 0 ? '+' : '−'}${Math.abs(s.delta) / 1000}k`}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 font-semibold">Topping</legend>
            <div className="grid grid-cols-2 gap-2">
              {p.options.toppings.map((t) => (
                <label key={t.code} className="flex cursor-pointer items-center gap-2 rounded-xl border border-espresso-200 bg-white px-3 py-2">
                  <input type="checkbox" checked={toppings.includes(t.code)}
                    onChange={(e) => setToppings((cur) => e.target.checked ? [...cur, t.code] : cur.filter((c) => c !== t.code))} />
                  <span className="flex-1 text-sm">{t.name}</span>
                  <span className="text-xs text-espresso-500">+{t.price / 1000}k</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex items-center gap-3">
            <span className="font-semibold">Số lượng</span>
            <button className="btn-ghost !px-3" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Giảm">−</button>
            <span data-testid="qty" className="w-6 text-center font-bold">{qty}</span>
            <button className="btn-ghost !px-3" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="Tăng">+</button>
          </div>
          <div className="flex items-center justify-between border-t border-espresso-100 pt-4">
            <div>
              <p className="text-xs text-espresso-500">Tạm tính</p>
              <p data-testid="price" className="text-2xl font-extrabold text-espresso-700">{fmt(unit * qty)}</p>
            </div>
            <button className="btn-primary" disabled={p.stock === 0} onClick={onAdd}>{p.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}</button>
          </div>
          {added && (
            <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
              Đã thêm vào giỏ hàng. <Link href="/cart" className="font-semibold underline">Xem giỏ</Link> ·{' '}
              <Link href="/" className="font-semibold underline">Chọn thêm món</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
