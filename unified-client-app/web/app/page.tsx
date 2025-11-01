'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const hasRedirected = useRef(false);

  useEffect(() => {
    // CRITICAL: Prevent multiple redirects
    if (hasRedirected.current) {
      return;
    }

    const redirectToHome = () => {
      if (hasRedirected.current) return;
      hasRedirected.current = true;
      console.log('[Root Page] ✓✓✓ REDIRECTING TO /HOME');
      setChecking(false);
      router.replace('/home');
    };

    const redirectToLogin = () => {
      if (hasRedirected.current) return;
      hasRedirected.current = true;
      console.log('[Root Page] ✗✗✗ REDIRECTING TO /LOGIN (NO TOKEN FOUND)');
      setChecking(false);
      router.replace('/login');
    };

    const checkForToken = () => {
      try {
        if (typeof window === 'undefined') return null;
        const token = localStorage.getItem('client_access_token');
        return token && token.trim().length > 0 ? token : null;
      } catch (e) {
        return null;
      }
    };

    // Check if in WebView
    const isWebView = typeof window !== 'undefined' && !!(window as any).ReactNativeWebView;

    if (isWebView) {
      console.log('[Root Page] WebView detected - checking for token...');
      
      // CRITICAL: Check IMMEDIATELY first (token should be injected via injectedJavaScriptBeforeContentLoaded)
      const immediateToken = checkForToken();
      if (immediateToken) {
        console.log('[Root Page] ✓✓✓ TOKEN FOUND IMMEDIATELY! Length:', immediateToken.length);
        (globalThis as any).ACCESS_TOKEN = immediateToken;
        redirectToHome();
        return;
      }
      
      console.log('[Root Page] No token immediately, waiting for injection...');
      
      // Listen for token injection event
      const tokenInjectedListener = ((event: any) => {
        const token = checkForToken();
        if (token && !hasRedirected.current) {
          console.log('[Root Page] ✓✓✓ Token found via event! Length:', token.length);
          (globalThis as any).ACCESS_TOKEN = token;
          redirectToHome();
        }
      }) as EventListener;
      
      window.addEventListener('tokenInjected', tokenInjectedListener);
      
      // Request token from native (in case it wasn't injected yet)
      const requestToken = () => {
        try {
          if ((window as any).ReactNativeWebView && !hasRedirected.current) {
            (window as any).ReactNativeWebView.postMessage(JSON.stringify({
              type: 'REQUEST_TOKEN'
            }));
          }
        } catch (e) {}
      };
      
      // Request immediately and multiple times
      requestToken();
      setTimeout(requestToken, 50);
      setTimeout(requestToken, 200);
      setTimeout(requestToken, 500);
      setTimeout(requestToken, 1000);
      
      // AGGRESSIVE CHECKING - Check every 10ms for first 2 seconds, then every 50ms
      let attempts = 0;
      let checkInterval: NodeJS.Timeout | null = null;
      
      // Fast checking for first 2 seconds (every 10ms)
      const fastInterval = setInterval(() => {
        attempts++;
        
        if (hasRedirected.current) {
          clearInterval(fastInterval);
          window.removeEventListener('tokenInjected', tokenInjectedListener);
          return;
        }
        
        const token = checkForToken();
        
        if (token) {
          console.log(`[Root Page] ✓✓✓✓✓ TOKEN FOUND on attempt #${attempts} (after ${attempts * 10}ms)`);
          clearInterval(fastInterval);
          if (checkInterval) clearInterval(checkInterval);
          window.removeEventListener('tokenInjected', tokenInjectedListener);
          (globalThis as any).ACCESS_TOKEN = token;
          redirectToHome();
          return;
        }
        
        // Request token every 500ms during fast checking
        if (attempts % 50 === 0) {
          requestToken();
        }
        
        // Switch to slower checking after 2 seconds (200 attempts * 10ms)
        if (attempts >= 200) {
          clearInterval(fastInterval);
          
          // Start slower checking (every 50ms)
          const intervalId = setInterval(() => {
            attempts++;
            
            if (hasRedirected.current) {
              clearInterval(intervalId);
              window.removeEventListener('tokenInjected', tokenInjectedListener);
              return;
            }
            
            const token = checkForToken();
            
            if (token) {
              const elapsed = 2000 + (attempts - 200) * 50;
              console.log(`[Root Page] ✓✓✓✓✓ TOKEN FOUND on attempt #${attempts} (after ${elapsed}ms)`);
              clearInterval(intervalId);
              window.removeEventListener('tokenInjected', tokenInjectedListener);
              (globalThis as any).ACCESS_TOKEN = token;
              redirectToHome();
              return;
            }
            
            // Request token every second
            if ((attempts - 200) % 20 === 0) {
              console.log(`[Root Page] Still waiting... (attempt ${attempts})`);
              requestToken();
            }
            
            // Max 30 seconds total (200 * 10ms + 600 * 50ms = 32 seconds)
            if (attempts >= 800) {
              console.log('[Root Page] Max attempts reached - final check...');
              const finalToken = checkForToken();
              console.log('[Root Page] Final check:', finalToken ? `✓ TOKEN FOUND (${finalToken.length} chars)` : '✗ NO TOKEN');
              console.log('[Root Page] localStorage keys:', Object.keys(localStorage));
              console.log('[Root Page] localStorage.getItem result:', localStorage.getItem('client_access_token') ? 'HAS VALUE' : 'NULL');
              clearInterval(intervalId);
              window.removeEventListener('tokenInjected', tokenInjectedListener);
              
              if (finalToken) {
                (globalThis as any).ACCESS_TOKEN = finalToken;
                redirectToHome();
              } else {
                redirectToLogin();
              }
            }
          }, 50);
          checkInterval = intervalId;
        }
      }, 10); // Check every 10ms for first 2 seconds
      
      return () => {
        clearInterval(fastInterval);
        if (checkInterval) clearInterval(checkInterval);
        window.removeEventListener('tokenInjected', tokenInjectedListener);
      };
    } else {
      // Regular browser - check immediately
      console.log('[Root Page] Regular browser - checking auth...');
      const token = checkForToken();
      if (token) {
        (globalThis as any).ACCESS_TOKEN = token;
        redirectToHome();
      } else {
        redirectToLogin();
      }
    }
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }
  
  return null;
}
