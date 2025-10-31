// Authentication utilities with token refresh support

import { TokenStorage } from './storage';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

    const res = await fetch(`${API}/mobile/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
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

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  headers['Authorization'] = `Bearer ${token}`;

  let response = await fetch(`${API}${endpoint}`, {
    ...options,
    headers,
  });

  // If 401, try to refresh token and retry once
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      // Retry with new token
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${API}${endpoint}`, {
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

