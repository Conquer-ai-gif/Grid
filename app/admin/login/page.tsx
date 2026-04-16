'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Zap, ShieldCheck } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        setAttempts((a) => a + 1);
        setError(data.error ?? 'Incorrect password.');
        setPassword('');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-1">
            <Zap size={28} className="fill-black text-black" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text-1">Yoom AI</h1>
            <p className="text-sm text-text-3 mt-0.5">Admin access</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border-1 bg-surface-1 p-6">
          <div className="mb-6 flex items-center gap-2">
            <ShieldCheck size={18} className="text-amber-1" />
            <h2 className="text-base font-semibold text-text-1">Enter admin password</h2>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* Password field */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-2">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock size={15} className="text-text-3" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter admin password"
                  autoFocus
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-border-1 bg-surface-2 py-3 pl-9 pr-10 text-sm text-text-1 placeholder:text-text-3 focus:border-amber-1 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
                {error}
                {attempts >= 3 && (
                  <p className="mt-1 text-xs text-red-400/70">
                    {5 - attempts} attempt{5 - attempts !== 1 ? 's' : ''} remaining before lockout.
                  </p>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full rounded-xl bg-amber-1 py-3 text-sm font-bold text-black hover:bg-amber-4 disabled:opacity-40 transition-all"
            >
              {isLoading ? 'Verifying...' : 'Access admin dashboard'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-text-3">
            This area is restricted to platform administrators only.
          </p>
        </div>

        {/* Back link */}
        <p className="mt-6 text-center text-xs text-text-3">
          <a href="/" className="hover:text-amber-1 transition-colors">← Back to Yoom AI</a>
        </p>
      </div>
    </div>
  );
}
