import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = { title: 'BrewLite – Đặt cà phê không tiền mặt', description: 'Đặt và thanh toán đồ uống chỉ trong vài chạm.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="py-8 text-center text-xs text-espresso-500">BrewLite – Bài tập lớn Công nghệ Phần mềm, ĐH Sài Gòn</footer>
      </body>
    </html>
  );
}
