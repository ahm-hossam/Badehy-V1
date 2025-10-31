'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { TokenStorage } from '@/lib/storage';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function MessagesBadge() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let intervalId: NodeJS.Timeout;

    const fetchUnreadCount = async () => {
      try {
        const token = (globalThis as any).ACCESS_TOKEN || await TokenStorage.getAccessToken();
        if (!token) return;

        const meRes = await fetch(`${API}/mobile/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const meData = await meRes.json();
        if (!meRes.ok || !meData.client) return;

        const trainerId = meData.client.trainerId;
        const clientId = meData.client.id;

        if (!trainerId || !clientId) return;

        const res = await fetch(`${API}/api/messages/unread-count-client?trainerId=${trainerId}&clientId=${clientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok && !cancelled) {
          const data = await res.json();
          setUnreadCount(Number(data.unread || 0));
        }
      } catch (e) {
        // Silent fail
      }
    };

    fetchUnreadCount();
    intervalId = setInterval(fetchUnreadCount, 5000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  if (unreadCount === 0) return null;

  return (
    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
  );
}

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { href: '/home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { href: '/workout', label: 'Workout', icon: 'barbell-outline', activeIcon: 'barbell' },
    { href: '/nutrition', label: 'Nutrition', icon: 'nutrition-outline', activeIcon: 'nutrition' },
    { href: '/messages', label: 'Messages', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles' },
    { href: '/profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
  ];

  // Check auth on mount - but only if we're on a protected route
  useEffect(() => {
    const checkAuth = async () => {
      // Don't check auth if we're already on login/blocked pages
      if (pathname === '/login' || pathname === '/blocked' || pathname === '/set-password') {
        return;
      }
      
      // In WebView, wait a bit for token injection from native
      const isWebView = typeof window !== 'undefined' && !!(window as any).ReactNativeWebView;
      
      if (isWebView) {
        // Wait up to 5 seconds for token injection (don't interfere with root page)
        let attempts = 0;
        const maxAttempts = 100; // 5 seconds
        const checkInterval = setInterval(() => {
          attempts++;
          const token = localStorage.getItem('client_access_token');
          
          if (token && token.trim().length > 0) {
            clearInterval(checkInterval);
            // Token found, set it globally
            (globalThis as any).ACCESS_TOKEN = token;
            return;
          }
          
          // Only redirect if we're NOT on the root page (which handles its own redirect)
          if (attempts >= maxAttempts && pathname !== '/') {
            clearInterval(checkInterval);
            // Still no token after waiting, redirect to login
            router.push('/login');
          }
        }, 50);
        
        return () => clearInterval(checkInterval);
      } else {
        // Regular browser - check immediately
        const token = localStorage.getItem('client_access_token');
        if (!token && pathname !== '/') {
          router.push('/login');
        }
      }
    };
    checkAuth();
  }, [router, pathname]);

  return (
    <div className="flex flex-col h-screen bg-white">
      <main className="flex-1 overflow-y-auto pb-16">
        {children}
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-14 px-2">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const iconName = isActive ? tab.activeIcon : tab.icon;
            
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-1.5 min-w-0 ${
                  isActive ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                <div className="relative">
                  {/* Icons using Heroicons style */}
                  <svg
                    className={`w-[22px] h-[22px] ${isActive ? 'text-slate-900' : 'text-slate-500'}`}
                    fill={isActive ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={isActive ? 0 : 2}
                  >
                    {iconName === 'home-outline' || iconName === 'home' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    ) : iconName === 'barbell-outline' || iconName === 'barbell' ? (
                      <>
                        {isActive ? (
                          <path fill="currentColor" d="M6 9a3 3 0 100 6 3 3 0 000-6zm12 0a3 3 0 100 6 3 3 0 000-6zM8 11h8v2H8v-2z"/>
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9a3 3 0 100 6 3 3 0 000-6zm12 0a3 3 0 100 6 3 3 0 000-6zM8 11h8v2H8v-2z"/>
                        )}
                      </>
                    ) : iconName === 'nutrition-outline' || iconName === 'nutrition' ? (
                      <>
                        {isActive ? (
                          <path fill="currentColor" d="M12 4c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zm0 14c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6zM8 12c0-1.5 1.5-3 4-3s4 1.5 4 3"/>
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zm0 14c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6zM8 12c0-1.5 1.5-3 4-3s4 1.5 4 3"/>
                        )}
                      </>
                    ) : iconName === 'chatbubbles-outline' || iconName === 'chatbubbles' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    )}
                  </svg>
                  {tab.href === '/messages' && <MessagesBadge />}
                </div>
                <span className={`text-xs font-semibold mt-0.5 ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

