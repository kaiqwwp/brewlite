'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cartTotal, useAuth, useCart, useMounted } from '@/lib/store';
import { fmt } from '@/lib/api';
import { Empty } from '@/components/ui';

const TOPPING_NAMES: Record<string, string> = { PEARL: 'Trân châu', CREAM: 'Kem', JELLY: 'Thạch dừa', SHOT: 'Espresso shot' };

export default function CartPage() {
  const mounted = useMounted();
  const router = useRouter();
  const { items, setQty, remove, clear } = useCart();
  const token = useAuth((s) => s.token);
  if (!mounted) return null;

  if (items.length === 0) {
    return <Empty title="Giỏ hàng trống"><Link href="/" className="btn-primary">Xem menu</Link></Empty>;
  }
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-extrabold">Giỏ hàng</h1>
          <button onClick={clear} className="text-sm text-espresso-500 hover:underline">Xóa tất cả</button>
        </div>
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.key} data-testid="cart-item" className="card flex gap-3 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.imageUrl} alt="" className="h-20 w-20 rounded-xl bg-espresso-50 object-cover" />
              <div className="flex-1">
                <p className="font-semibold">{i.name} <span className="text-espresso-500">· {i.size}</span></p>
                {i.toppings.length > 0 && <p className="text-xs text-espresso-500">+ {i.toppings.map((t) => TOPPING_NAMES[t] ?? t).join(', ')}</p>}
                <p className="text-sm text-espresso-600">{fmt(i.unitPrice)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button className="btn-ghost !px-2.5 !py-1" onClick={() => setQty(i.key, i.qty - 1)} aria-label="Giảm">−</button>
                  <span className="w-5 text-center font-bold">{i.qty}</span>
                  <button className="btn-ghost !px-2.5 !py-1" onClick={() => setQty(i.key, i.qty + 1)} aria-label="Tăng">+</button>
                  <button onClick={() => remove(i.key)} className="ml-auto text-sm text-red-600 hover:underline">Xóa</button>
                </div>
              </div>
              <p className="font-bold">{fmt(i.unitPrice * i.qty)}</p>
            </li>
          ))}
        </ul>
      </section>
      <aside className="card h-fit space-y-3 p-4">
        <div className="flex items-center justify-between"><span>Tổng tiền</span><span data-testid="cart-total" className="text-xl font-extrabold text-espresso-700">{fmt(cartTotal(items))}</span></div>
        <button className="btn-primary w-full" onClick={() => router.push(token ? '/checkout' : '/login?next=/checkout')}>
          Thanh toán {fmt(cartTotal(items))}
        </button>
        <Link href="/" className="block text-center text-sm text-espresso-500 hover:underline">+ Thêm sản phẩm khác</Link>
      </aside>
    </div>
  );
}
