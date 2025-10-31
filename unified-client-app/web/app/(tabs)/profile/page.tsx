'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TokenStorage } from '@/lib/storage';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ProfilePage() {
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [err, setErr] = useState('');
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setErr('');
        let token = (globalThis as any).ACCESS_TOKEN || await TokenStorage.getAccessToken();
        if (!token) {
          router.push('/login');
          return;
        }
        const res = await fetch(`${API}/mobile/me`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed');
        setClient(data.client);
        setSubscription(data.subscription);
      } catch (e: any) {
        setErr(e.message);
      }
    };
    run();
  }, [router]);

  const logout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await TokenStorage.clearTokens();
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-4 pt-2 pb-2">
        <div className="flex items-center mb-1.5">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center mr-1.5 hover:bg-slate-100 transition-colors"
          >
            <span className="text-2xl text-slate-900">←</span>
          </button>
          <h1 className="text-2xl font-bold text-slate-900 flex-1">Profile</h1>
        </div>
        <p className="text-sm text-slate-500 ml-10.5">Manage your account</p>
      </div>

      <div className="mt-2 mx-4 bg-white rounded-2xl p-4 shadow-sm">
        {err && <p className="text-red-500 mb-2 text-sm">{err}</p>}
        {!client ? (
          <p className="text-slate-600">Loading…</p>
        ) : (
          <div className="space-y-0">
            <div className="flex justify-between py-2.5 border-b border-slate-200">
              <span className="text-slate-500">Name</span>
              <span className="text-slate-900 font-medium">{client.fullName || '-'}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-slate-200">
              <span className="text-slate-500">Email</span>
              <span className="text-slate-900 font-medium">{client.email || '-'}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-slate-200">
              <span className="text-slate-500">Phone</span>
              <span className="text-slate-900 font-medium">{client.phone || '-'}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-slate-200">
              <span className="text-slate-500">Current package</span>
              <span className="text-slate-900 font-medium">{subscription?.packageName || '-'}</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-slate-200">
              <span className="text-slate-500">Subscription end</span>
              <span className="text-slate-900 font-medium">
                {subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : '-'}
              </span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Duration</span>
              <span className="text-slate-900 font-medium">
                {subscription?.durationValue ? `${subscription.durationValue} ${subscription.durationUnit}` : '-'}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="mt-4 w-full h-12 bg-red-500 rounded-xl flex items-center justify-center text-white font-semibold text-base hover:bg-red-600 transition-colors"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
