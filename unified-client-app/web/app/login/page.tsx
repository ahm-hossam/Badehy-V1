'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TokenStorage } from '@/lib/storage';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'email' | 'password'>('email');

  // Logo source - same as mobile app: env variable OR local file
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL || '/logo.png';

  const checkFormCompletion = async () => {
    try {
      const token = (globalThis as any).ACCESS_TOKEN || await TokenStorage.getAccessToken();
      if (!token) {
        router.push('/home');
        return;
      }

      const response = await fetch(`${API}/mobile/forms/main`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.completed) {
          router.push('/home');
        } else {
          // Form not completed - skip for now as per requirements
          router.push('/home');
        }
      } else {
        // On error, go to main app
        router.push('/home');
      }
    } catch (error) {
      console.error('Error checking form completion:', error);
      router.push('/home');
    }
  };

  const startByEmail = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/mobile/auth/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      if (data?.firstLogin && data?.firstLoginToken) {
        router.push(`/set-password?token=${data.firstLoginToken}`);
        return;
      }
      setPhase('password');
    } catch (e: any) {
      setError(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const loginWithPassword = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/mobile/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Login failed');
      
      // Save tokens
      await TokenStorage.saveTokens(data.accessToken, data.refreshToken);
      
      if (data?.subscriptionExpired) {
        router.push('/blocked');
        return;
      }
      if (data?.requiresPasswordReset) {
        router.push('/set-password');
      } else {
        checkFormCompletion();
      }
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center px-4 pt-12 pb-4">
        <div className="w-full max-w-[280px] mb-2 h-12">
          <img
            src={logoUrl}
            alt="Logo"
            className="w-full h-full object-contain"
          />
        </div>
        
        <div className="w-full max-w-md px-4">
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1.5">Sign in to continue</p>
        </div>

        <div className="w-full max-w-md mt-4 mx-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          {error && (
            <div className="mb-2 text-sm text-red-500">{error}</div>
          )}

          <div className="mb-3">
            <label className="block text-xs text-slate-500 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 h-11 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          {phase === 'password' && (
            <div className="mb-3">
              <label className="block text-xs text-slate-500 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 h-11 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          )}

          <button
            onClick={phase === 'email' ? startByEmail : loginWithPassword}
            disabled={loading}
            className="mt-1.5 w-full h-12 bg-slate-900 rounded-xl text-white font-semibold text-base hover:bg-slate-800 active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Please wait…' : phase === 'email' ? 'Next' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}

