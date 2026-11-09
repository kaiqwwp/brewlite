'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect, useState } from 'react';

export interface CartItem {
  key: string; productId: number; name: string; imageUrl: string;
  size: 'S' | 'M' | 'L'; toppings: string[]; qty: number; unitPrice: number;
}

interface CartState {
  items: CartItem[];
  add: (i: Omit<CartItem, 'key'>) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

export const itemKey = (productId: number, size: string, toppings: string[]) =>
  `${productId}|${size}|${[...toppings].sort().join(',')}`;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (i) => set((s) => {
        const key = itemKey(i.productId, i.size, i.toppings);
        const found = s.items.find((x) => x.key === key);
        if (found) return { items: s.items.map((x) => (x.key === key ? { ...x, qty: Math.min(20, x.qty + i.qty) } : x)) };
        return { items: [...s.items, { ...i, key }] };
      }),
      setQty: (key, qty) => set((s) => ({
        items: qty <= 0 ? s.items.filter((x) => x.key !== key) : s.items.map((x) => (x.key === key ? { ...x, qty: Math.min(20, qty) } : x)),
      })),
      remove: (key) => set((s) => ({ items: s.items.filter((x) => x.key !== key) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'brewlite-cart' },
  ),
);

export const cartTotal = (items: CartItem[]) => items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
export const cartCount = (items: CartItem[]) => items.reduce((s, i) => s + i.qty, 0);

export interface AuthUser { id: number; email: string; name: string; role: string; loyaltyPoints: number }
interface AuthState {
  token: string | null; user: AuthUser | null;
  login: (token: string, user: AuthUser) => void; logout: () => void; setUser: (u: AuthUser) => void;
}
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null, user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      setUser: (user) => set({ user }),
    }),
    { name: 'brewlite-auth' },
  ),
);

/** Tránh lệch hydrate: chỉ đọc state đã lưu (localStorage) sau khi mount. */
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
