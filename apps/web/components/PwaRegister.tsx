'use client';
import { useEffect } from 'react';

/** Đăng ký service worker ở bản production (dev bỏ qua để không bị cache khi sửa code). */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* trình duyệt chặn service worker: ứng dụng vẫn chạy bình thường */
    });
  }, []);
  return null;
}
