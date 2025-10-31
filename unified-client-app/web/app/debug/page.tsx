'use client';

import { useState, useEffect } from 'react';

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isWebView, setIsWebView] = useState(false);

  useEffect(() => {
    // Check if in WebView
    const webView = !!(window as any).ReactNativeWebView;
    setIsWebView(webView);
    
    // Get current token
    const currentToken = localStorage.getItem('client_access_token');
    setToken(currentToken);
    
    // Add initial log
    setLogs(prev => [...prev, `[DEBUG] Page loaded`]);
    setLogs(prev => [...prev, `[DEBUG] In WebView: ${webView ? 'YES' : 'NO'}`]);
    setLogs(prev => [...prev, `[DEBUG] Token in localStorage: ${currentToken ? 'FOUND (' + currentToken.substring(0, 20) + '...)' : 'NOT FOUND'}`]);
    
    // Listen for token injection events
    const tokenListener = (event: any) => {
      setLogs(prev => [...prev, `[DEBUG] Token injected event received`]);
      const newToken = localStorage.getItem('client_access_token');
      setToken(newToken);
    };
    
    window.addEventListener('tokenInjected', tokenListener);
    
    // Monitor localStorage changes
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key: string, value: string) {
      originalSetItem.call(this, key, value);
      if (key === 'client_access_token') {
        setLogs(prev => [...prev, `[DEBUG] Token saved to localStorage: ${value.substring(0, 20)}...`]);
        setToken(value);
      }
    };
    
    // Request token from native if in WebView
    if (webView) {
      setTimeout(() => {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'REQUEST_TOKEN'
        }));
        setLogs(prev => [...prev, `[DEBUG] Requested token from native`]);
      }, 500);
    }
    
    return () => {
      window.removeEventListener('tokenInjected', tokenListener);
      localStorage.setItem = originalSetItem;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Debug: Token Persistence</h1>
        
        <div className="bg-slate-100 p-4 rounded mb-4">
          <div className="font-semibold mb-2">Status:</div>
          <div>In WebView: {isWebView ? '✅ YES' : '❌ NO'}</div>
          <div className="mt-2">
            Token: {token ? `✅ Found (${token.substring(0, 30)}...)` : '❌ Not Found'}
          </div>
        </div>
        
        <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
          <div className="font-bold mb-2 text-white">Console Logs:</div>
          {logs.map((log, i) => (
            <div key={i} className="mb-1">{log}</div>
          ))}
        </div>
        
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              const newToken = localStorage.getItem('client_access_token');
              setToken(newToken);
              setLogs(prev => [...prev, `[DEBUG] Manual check - Token: ${newToken ? 'FOUND' : 'NOT FOUND'}`]);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Check Token
          </button>
          <button
            onClick={() => {
              if ((window as any).ReactNativeWebView) {
                (window as any).ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'REQUEST_TOKEN'
                }));
                setLogs(prev => [...prev, `[DEBUG] Manually requested token from native`]);
              }
            }}
            className="px-4 py-2 bg-green-500 text-white rounded"
            disabled={!isWebView}
          >
            Request from Native
          </button>
          <button
            onClick={() => setLogs([])}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Clear Logs
          </button>
        </div>
      </div>
    </div>
  );
}

