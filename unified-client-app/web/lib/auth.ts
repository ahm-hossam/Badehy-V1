// Authentication utilities with token refresh support

import { TokenStorage } from './storage';

// Use relative paths to go through Next.js rewrites (works in both browser and WebView)
// In browser/WebView, empty string means relative paths which go through Next.js rewrites
// For SSR or direct backend access, use the full URL
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return ''; // Use relative paths (goes through Next.js rewrites)
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
};

// Initialize token from localStorage on module load
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('client_access_token');
  if (token) {
    (globalThis as any).ACCESS_TOKEN = token;
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = await TokenStorage.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/mobile/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      return null;
    }

    // Safe JSON parsing
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('[Auth] Token refresh returned non-JSON');
      return null;
    }

    const data = await res.json();
    if (data.accessToken) {
      await TokenStorage.saveTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    }

    return null;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = (globalThis as any).ACCESS_TOKEN;
  
  // If not in memory, load from storage
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('client_access_token');
    if (token) {
      (globalThis as any).ACCESS_TOKEN = token;
    }
  }
  
  // If still no token, try async get
  if (!token) {
    token = await TokenStorage.getAccessToken();
  }
  
  if (!token) {
    throw new Error('No access token available');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'skip_zrok_interstitial': 'true',
    ...(options.headers as Record<string, string>),
  };

  headers['Authorization'] = `Bearer ${token}`;

  const apiUrl = getApiUrl();
  let response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers,
  });

  // If 401, try to refresh token and retry once
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      // Retry with new token
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${apiUrl}${endpoint}`, {
        ...options,
        headers,
      });
    } else {
      // Refresh failed, clear tokens
      await TokenStorage.clearTokens();
      throw new Error('Session expired. Please login again.');
    }
  }

  return response;
}

export async function checkAuthStatus(): Promise<{ authenticated: boolean; shouldRedirect?: string }> {
  try {
    // Check localStorage directly first for faster check
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('client_access_token');
      if (token) {
        (globalThis as any).ACCESS_TOKEN = token;
      }
    }
    
    // If not in localStorage, try async get
    if (!token) {
      token = await TokenStorage.getAccessToken();
    }
    
    if (!token) {
      return { authenticated: false, shouldRedirect: '/login' };
    }

    // Verify token is still valid by making a lightweight request
    const response = await apiRequest('/mobile/me', { method: 'GET' });
    
    if (response.ok) {
      return { authenticated: true };
    }

    // If still not ok after refresh attempt, redirect to login
    return { authenticated: false, shouldRedirect: '/login' };
  } catch (error) {
    return { authenticated: false, shouldRedirect: '/login' };
  }
}

