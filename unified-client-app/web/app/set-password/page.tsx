'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TokenStorage } from '@/lib/storage';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function SetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL || '/logo.png';
  const isFirstLogin = !!token;

  const checkFormCompletion = async () => {
    try {
      const authToken = (globalThis as any).ACCESS_TOKEN || await TokenStorage.getAccessToken();
      if (!authToken) {
        router.push('/home');
        return;
      }

      const response = await fetch(`${API}/mobile/forms/main`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      // Safe JSON parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('[SetPassword] Non-JSON response, skipping');
        router.push('/home');
        return;
      }
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.completed) {
          router.push('/home');
        } else {
          router.push('/home');
        }
      } else {
        router.push('/home');
      }
    } catch (error) {
      console.error('Error checking form completion:', error);
      router.push('/home');
    }
  };

  const submit = async () => {
    try {
      setError('');
      if (!next || next.length < 8) {
        setError('New password must be at least 8 characters.');
        return;
      }
      if (next !== confirm) {
        setError('Passwords do not match.');
        return;
      }
      setLoading(true);
      
      let res: Response;
      try {
        if (isFirstLogin && token) {
          res = await fetch(`${API}/mobile/auth/first-set-password`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'skip_zrok_interstitial': 'true'
            },
            body: JSON.stringify({ token, newPassword: next }),
          });
        } else {
          const authToken = (globalThis as any).ACCESS_TOKEN || await TokenStorage.getAccessToken();
          if (!authToken) {
            setError('Not authenticated');
            setLoading(false);
            return;
          }
          res = await fetch(`${API}/mobile/auth/change-password`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'skip_zrok_interstitial': 'true',
              Authorization: `Bearer ${authToken}`
            },
            body: JSON.stringify({ currentPassword: current, newPassword: next }),
          });
        }
      } catch (networkError: any) {
        // Network error (connection refused, timeout, etc.)
        console.error('Network error:', networkError);
        console.error('API URL:', `${API}/mobile/auth/first-set-password`);
        console.error('Error details:', networkError.message, networkError.stack);
        
        // More specific error message
        let errorMsg = 'Connection failed. ';
        if (networkError.message?.includes('Failed to fetch') || networkError.message?.includes('NetworkError')) {
          errorMsg += 'Unable to reach the server. Please ensure the backend is running and try again.';
        } else if (networkError.message?.includes('timeout')) {
          errorMsg += 'Request timed out. Please try again.';
        } else {
          errorMsg += networkError.message || 'Please check your internet connection and try again.';
        }
        
        setError(errorMsg);
        setLoading(false);
        return;
      }
      
      // Check if response is ok before trying to parse JSON
      let data: any = {};
      try {
        const text = await res.text();
        if (text) {
          data = JSON.parse(text);
        }
      } catch (parseError) {
        // If response is not JSON, use status text or default error
        throw new Error(res.statusText || `Server error (${res.status})`);
      }
      
      if (!res.ok) {
        throw new Error(data?.error || data?.message || `Failed to set password (${res.status})`);
      }
      
      if (data?.accessToken) {
        await TokenStorage.saveTokens(data.accessToken, data.refreshToken);
      }
      
      checkFormCompletion();
    } catch (e: any) {
      console.error('Password set error:', e);
      setError(e.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center px-4 pt-12 pb-4 relative">
        <Link 
          href="/login"
          className="absolute left-4 top-3 w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
        >
          <span className="text-xl text-slate-900">←</span>
        </Link>

        <div className="w-full max-w-[280px] mb-2 h-12">
          <img
            src={logoUrl}
            alt="Logo"
            className="w-full h-full object-contain"
          />
        </div>
        
        <div className="w-full max-w-md px-4">
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {isFirstLogin ? 'Create your password' : 'Change your password'}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            {isFirstLogin ? 'Secure your account to continue' : 'Update your password to keep your account secure'}
          </p>
        </div>

        <div className="w-full max-w-md mt-4 mx-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          {error && (
            <div className="mb-2 text-sm text-red-500">{error}</div>
          )}

          {!isFirstLogin && (
            <div className="mb-3">
              <label className="block text-xs text-slate-500 mb-1.5">Current password</label>
              <input
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="Current password"
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 h-11 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          )}

          <div className="mb-3">
            <label className="block text-xs text-slate-500 mb-1.5">New password</label>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="New password (min 8)"
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 h-11 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div className="mb-3">
            <label className="block text-xs text-slate-500 mb-1.5">Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 h-11 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <button
            onClick={submit}
            disabled={loading}
            className="mt-1.5 w-full h-12 bg-slate-900 rounded-xl text-white font-semibold text-base hover:bg-slate-800 active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving…' : 'Save password'}
          </button>
        </div>
      </div>
    </div>
  );
}

