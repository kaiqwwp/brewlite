import { ReactNode } from 'react';

export function Spinner({ label = 'Đang tải…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-espresso-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-espresso-200 border-t-espresso-600" />
      {label}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p>{message}</p>
      {onRetry && <button onClick={onRetry} className="mt-2 font-semibold underline">Thử lại</button>}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="text-4xl" aria-hidden>🫖</div>
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </div>
  );
}
