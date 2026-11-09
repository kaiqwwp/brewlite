'use client';
import Link from 'next/link';
import { cartCount, useAuth, useCart, useMounted } from '@/lib/store';

export default function Header() {
  const mounted = useMounted();
  const items = useCart((s) => s.items);
  const { user, logout } = useAuth();
  const count = mounted ? cartCount(items) : 0;
  return (
    <header className="sticky top-0 z-10 border-b border-espresso-100 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold text-espresso-700">
          <span aria-hidden>☕</span> BrewLite
        </Link>
        <nav className="flex items-center gap-3 text-sm font-medium">
          {mounted && user ? (
            <>
              <Link href="/orders" className="hover:underline">Đơn của tôi</Link>
              <span className="hidden rounded-full bg-espresso-100 px-2.5 py-1 text-xs sm:inline" title="Điểm tích lũy">★ {user.loyaltyPoints} điểm</span>
              <button onClick={logout} className="text-espresso-500 hover:underline">Đăng xuất</button>
            </>
          ) : (
            <Link href="/login" className="hover:underline">Đăng nhập</Link>
          )}
          <Link href="/cart" className="btn-primary relative !px-3 !py-2" aria-label="Giỏ hàng">
            🛒 Giỏ hàng
            <span data-testid="cart-badge" className="ml-2 min-w-6 rounded-full bg-white px-1.5 text-center text-xs font-bold text-espresso-700">{count}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
