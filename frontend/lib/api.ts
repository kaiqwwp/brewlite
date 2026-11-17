import { useAuth } from './store';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: any) { super(message); }
}

interface Opts { method?: string; body?: unknown; token?: string | null; headers?: Record<string, string> }

export async function api<T = any>(path: string, opts: Opts = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opts.method ?? (opts.body ? 'POST' : 'GET'),
      headers: {
        ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
        ...opts.headers,
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(0, 'Không kết nối được máy chủ. Vui lòng thử lại.');
  }
  // Token hết hạn/không hợp lệ: đăng xuất để giao diện đưa khách về trang đăng nhập (thay vì kẹt ở thông báo lỗi)
  if (res.status === 401 && opts.token) useAuth.getState().logout();
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok && res.status !== 402) {
    const msg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message ?? `Lỗi ${res.status}`;
    throw new ApiError(res.status, msg, data);
  }
  return Object.assign(data ?? {}, { __status: res.status }) as T;
}

export interface Product { id: number; name: string; description: string; price: number; imageUrl: string; stock: number }
export interface SizeOpt { code: 'S' | 'M' | 'L'; label: string; delta: number }
export interface ToppingOpt { code: string; name: string; price: number }
export interface ProductDetail extends Product { options: { sizes: SizeOpt[]; toppings: ToppingOpt[] } }
export interface OrderItemView { id: number; productId: number; productName: string; size: string; toppings: string[]; qty: number; unitPrice: number; lineTotal: number }
export interface OrderView {
  id: number; code: string; status: string; subtotal: number; discount: number; total: number;
  couponCode: string | null; createdAt: string; items: OrderItemView[];
}

export const fmt = (n: number) => `${n.toLocaleString('vi-VN')}đ`;

export const STATUS_LABEL: Record<string, { text: string; cls: string; hint: string }> = {
  PENDING: { text: 'Chờ thanh toán', cls: 'bg-amber-100 text-amber-800', hint: 'Đơn đã tạo, đang chờ thanh toán.' },
  PAID: { text: 'Đã thanh toán', cls: 'bg-emerald-100 text-emerald-800', hint: 'Mời tới quầy lấy nước khi đơn sẵn sàng.' },
  PREPARING: { text: 'Đang pha chế', cls: 'bg-sky-100 text-sky-800', hint: 'Barista đang pha đồ uống của bạn.' },
  READY: { text: 'Sẵn sàng', cls: 'bg-indigo-100 text-indigo-800', hint: 'Đồ uống đã xong, mời bạn tới quầy nhận.' },
  COMPLETED: { text: 'Hoàn tất', cls: 'bg-stone-200 text-stone-700', hint: 'Cảm ơn bạn đã ghé BrewLite!' },
  PAYMENT_FAILED: { text: 'Thanh toán lỗi', cls: 'bg-red-100 text-red-800', hint: 'Thanh toán chưa thành công. Bạn có thể thử lại.' },
  CANCELLED: { text: 'Đã hủy', cls: 'bg-stone-200 text-stone-600', hint: 'Đơn đã bị hủy.' },
};
