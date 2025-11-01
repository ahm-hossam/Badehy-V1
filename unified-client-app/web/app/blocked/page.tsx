'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TokenStorage } from '@/lib/storage';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function BlockedPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = (globalThis as any).ACCESS_TOKEN || await TokenStorage.getAccessToken();
        if (!token) {
          router.push('/login');
          return;
        }

        // Fetch user info to get more details about why they're blocked
        try {
          const res = await fetch(`${API}/mobile/auth/verify-token`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (res.ok) {
            // Safe JSON parsing
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              try {
                const data = await res.json();
                setUserInfo(data.user || data.client);
              } catch (e) {
                console.warn('[Blocked] Failed to parse JSON');
              }
            }
          }
        } catch (e) {
          console.error('Error fetching user info:', e);
        }
      } catch (e) {
        console.error('Auth check error:', e);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await TokenStorage.clearTokens();
      (globalThis as any).ACCESS_TOKEN = null;
      router.push('/login');
    } catch (e) {
      console.error('Logout error:', e);
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 pb-20">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Account Access Restricted</h1>
          
          {/* Message */}
          <p className="text-base text-slate-600 mb-6 leading-relaxed">
            Your account access has been restricted. This may be due to an expired subscription or account restrictions.
          </p>

          {userInfo && (
            <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-slate-700 mb-2">
                <span className="font-semibold">Name:</span> {userInfo.fullName || userInfo.name || 'N/A'}
              </p>
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Email:</span> {userInfo.email || 'N/A'}
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-800 font-semibold mb-2">What should I do?</p>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Contact your trainer to restore access</li>
              <li>Verify your subscription status</li>
              <li>Check if any payment is required</li>
            </ul>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
}

