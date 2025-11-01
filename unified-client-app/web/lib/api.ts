// API configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await import('./storage').then(m => m.TokenStorage.getAccessToken());
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'skip_zrok_interstitial': 'true',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
}

