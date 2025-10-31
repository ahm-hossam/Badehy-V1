'use client';

import { useEffect } from 'react';

// Component to ensure tokens persist across app closes
export function PersistTokens() {
  useEffect(() => {
    // On mount, restore token to global if it exists
    const savedToken = localStorage.getItem('client_access_token');
    if (savedToken) {
      (globalThis as any).ACCESS_TOKEN = savedToken;
      console.log('[PersistTokens] Restored token from localStorage on mount');
    }

    // Before page unload, ensure token is saved
    const handleBeforeUnload = () => {
      const token = (globalThis as any).ACCESS_TOKEN || localStorage.getItem('client_access_token');
      if (token) {
        localStorage.setItem('client_access_token', token);
        console.log('[PersistTokens] Ensured token is saved before unload');
      }
    };

    // On visibility change (app goes to background), ensure token is saved
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const token = (globalThis as any).ACCESS_TOKEN || localStorage.getItem('client_access_token');
        if (token) {
          localStorage.setItem('client_access_token', token);
          console.log('[PersistTokens] Ensured token is saved when app goes to background');
        }
      }
    };

    // On page hide (app closes/switches), ensure token is saved
    const handlePageHide = () => {
      const token = (globalThis as any).ACCESS_TOKEN || localStorage.getItem('client_access_token');
      if (token) {
        localStorage.setItem('client_access_token', token);
        console.log('[PersistTokens] Ensured token is saved on page hide');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  // This component doesn't render anything
  return null;
}

