'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/store';
import { ErrorBox } from './ui';

function Form({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const next = useSearchParams().get('next') ?? '/';
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isReg = mode === 'register';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await api(isReg ? '/auth/register' : '/auth/login', { body: isReg ? { email, password, name: name || undefined } : { email, password } });
      login(res.accessToken, res.user);
      router.replace(next);
    } catch (err) {
      setError((err as ApiError).message);
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-xl font-extrabold">{isReg ? 'Tạo tài khoản' : 'Đăng nhập'}</h1>
      {error && <ErrorBox message={error} />}
      {isReg && <label className="block text-sm font-medium">Tên hiển thị<input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} /></label>}
      <label className="block text-sm font-medium">Email<input type="email" required className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
      <label className="block text-sm font-medium">Mật khẩu<input type="password" required minLength={isReg ? 6 : 1} className="input mt-1" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isReg ? 'new-password' : 'current-password'} />
        {isReg && <span className="text-xs text-espresso-500">Tối thiểu 6 ký tự</span>}</label>
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Đang xử lý…' : isReg ? 'Đăng ký' : 'Đăng nhập'}</button>
      <p className="text-center text-sm text-espresso-500">
        {isReg ? <>Đã có tài khoản? <Link className="font-semibold underline" href={`/login?next=${encodeURIComponent(next)}`}>Đăng nhập</Link></>
          : <>Chưa có tài khoản? <Link className="font-semibold underline" href={`/register?next=${encodeURIComponent(next)}`}>Đăng ký</Link></>}
      </p>
    </form>
  );
}

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  return <Suspense><Form mode={mode} /></Suspense>;
}
