'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TokenStorage } from '@/lib/storage';

// Use relative paths to go through Next.js rewrites (works in both browser and WebView)
// In browser/WebView, empty string means relative paths which go through Next.js rewrites
// For SSR or direct backend access, use the full URL
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // Check if we're in a WebView - WebView might need absolute URLs
    const isWebView = !!(window as any).ReactNativeWebView;
    if (isWebView) {
      // In WebView, use the same origin as the page (localhost:3002)
      // This will go through Next.js rewrites
      const protocol = window.location.protocol;
      const host = window.location.host;
      return `${protocol}//${host}`;
    }
    return ''; // Use relative paths (goes through Next.js rewrites)
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
};

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
        let res: Response;
        const apiUrl = getApiUrl();
        const meUrl = `${apiUrl}/mobile/me`;
        console.log('[Profile] Fetching:', meUrl);
        
        try {
          res = await fetch(meUrl, { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'skip_zrok_interstitial': 'true'
            } 
          });
        } catch (networkError: any) {
          console.error('[Profile] Network error fetching profile:', networkError);
          throw new Error('Connection failed. Please check your internet connection and try again.');
        }
        
        console.log('[Profile] Response status:', res.status, 'Content-Type:', res.headers.get('content-type'));
        
        // Check content type BEFORE reading body
        const contentType = res.headers.get('content-type');
        const text = await res.text();
        
        // Check if response is HTML (zrok interstitial or Next.js error page)
        const isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');
        if (isHtml) {
          console.error('[Profile] Received HTML instead of JSON:', text.substring(0, 300));
          const isZrok = text.includes('zrok') || text.includes('interstitial');
          if (isZrok) {
            console.warn('[Profile] Zrok interstitial detected - request blocked by proxy');
            throw new Error('Network proxy issue. Please wait a moment and try again.');
          }
          throw new Error('Server returned an error page. Please try again.');
        }
        
        if (!res.ok) {
          // Check if it's actually JSON before trying to parse
          if (contentType && contentType.includes('application/json')) {
            try {
              const errorJson = text ? JSON.parse(text) : {};
              throw new Error(errorJson?.error || errorJson?.message || `Failed to load profile (${res.status})`);
            } catch (parseError: any) {
              if (parseError.message && parseError.message.includes('Failed to load')) {
                throw parseError;
              }
              throw new Error(`Failed to load profile (${res.status})`);
            }
          } else {
            // HTML error page or non-JSON response
            console.error('[Profile] Non-JSON error response:', text.substring(0, 200));
            throw new Error(`Server error: ${res.status} ${res.statusText}`);
          }
        }
        
        // Check content type for successful responses
        if (!contentType || !contentType.includes('application/json')) {
          console.error('[Profile] Non-JSON success response:', text.substring(0, 200));
          throw new Error('Server returned non-JSON response');
        }
        
        let data: any = {};
        try {
          if (!text || text.trim() === '') {
            throw new Error('Empty response from server');
          }
          data = JSON.parse(text);
        } catch (parseError: any) {
          console.error('[Profile] JSON parse error:', parseError, 'Text:', text.substring(0, 200));
          throw new Error(parseError.message || 'Failed to parse server response');
        }
        
        setClient(data.client);
        setSubscription(data.subscription);
      } catch (e: any) {
        console.error('Error fetching profile:', e);
        setErr(e.message || 'Failed to load profile. Please try again.');
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
