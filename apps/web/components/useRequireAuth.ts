'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth, useMounted } from '@/lib/store';

/** Chuyển tới /login?next=... nếu chưa đăng nhập. Trả về token (hoặc null khi chưa sẵn sàng). */
export function useRequireAuth() {
  const mounted = useMounted();
  const token = useAuth((s) => s.token);
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    if (mounted && !token) router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [mounted, token, router, path]);
  return mounted ? token : null;
}
