// Web version of token storage (uses localStorage instead of AsyncStorage)

const ACCESS_TOKEN_KEY = 'client_access_token';
const REFRESH_TOKEN_KEY = 'client_refresh_token';

export const TokenStorage = {
  async saveTokens(accessToken: string, refreshToken?: string): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        // Save tokens synchronously to ensure they're persisted immediately
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        if (refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }
        // Also set in global for immediate access
        (globalThis as any).ACCESS_TOKEN = accessToken;
        
        // Notify native app to save token (for WebView persistence)
        // CRITICAL: This must happen for persistence to work
        try {
          if ((window as any).ReactNativeWebView) {
            // Use postMessage multiple times to ensure it gets through
            const message = JSON.stringify({
              type: 'SAVE_TOKEN',
              token: accessToken,
              refreshToken: refreshToken
            });
            
            // Send immediately
            (window as any).ReactNativeWebView.postMessage(message);
            
            // Send again after small delay (in case first one didn't go through)
            setTimeout(() => {
              try {
                (window as any).ReactNativeWebView.postMessage(message);
              } catch (e) {
                console.error('[Storage] Error sending token sync (retry):', e);
              }
            }, 100);
            
            // One more retry
            setTimeout(() => {
              try {
                (window as any).ReactNativeWebView.postMessage(message);
              } catch (e) {
                console.error('[Storage] Error sending token sync (retry 2):', e);
              }
            }, 500);
            
            console.log('[Storage] Token sync message sent to native app');
          } else {
            console.log('[Storage] Not in WebView, skipping native sync');
          }
        } catch (e) {
          console.error('[Storage] Error notifying native app:', e);
        }
        
        // Verify the token was saved
        const saved = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (!saved || saved !== accessToken) {
          console.error('Failed to save token to localStorage');
        } else {
          console.log('Token saved successfully to localStorage');
        }
      } catch (error) {
        console.error('Error saving tokens:', error);
        throw error;
      }
    }
  },

  async getAccessToken(): Promise<string | null> {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (token) {
        (globalThis as any).ACCESS_TOKEN = token;
      }
      return token;
    }
    return null;
  },

  async getRefreshToken(): Promise<string | null> {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  },

  async clearTokens(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      delete (globalThis as any).ACCESS_TOKEN;
      
      // Notify native app to clear token
      try {
        if ((window as any).ReactNativeWebView) {
          (window as any).ReactNativeWebView.postMessage(JSON.stringify({
            type: 'CLEAR_TOKEN'
          }));
        }
      } catch (e) {
        // Not in WebView, ignore
      }
    }
  },
};

// Meal completion storage (for tracking daily meal completions)
export const MealCompletionStorage = {
  async getMealCompletions(clientId: number): Promise<Set<string>> {
    if (typeof window === 'undefined') return new Set();
    
    const today = new Date().toISOString().split('T')[0];
    const key = `meal_completions_${clientId}_${today}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) return new Set();
    
    try {
      const data = JSON.parse(stored);
      if (data.date === today) {
        return new Set(data.completions || []);
      }
    } catch {
      // Invalid data, return empty set
    }
    
    return new Set();
  },

  async saveMealCompletion(clientId: number, mealId: string): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const today = new Date().toISOString().split('T')[0];
    const key = `meal_completions_${clientId}_${today}`;
    const completions = await this.getMealCompletions(clientId);
    completions.add(mealId);
    
    localStorage.setItem(key, JSON.stringify({
      date: today,
      completions: Array.from(completions),
    }));
  },

  async saveMealCompletions(clientId: number, completions: Set<string>): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const today = new Date().toISOString().split('T')[0];
    const key = `meal_completions_${clientId}_${today}`;
    
    localStorage.setItem(key, JSON.stringify({
      date: today,
      completions: Array.from(completions),
    }));
  },

  async cleanupOldCompletions(clientId: number): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const today = new Date().toISOString().split('T')[0];
    // Remove all keys that don't match today's date
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`meal_completions_${clientId}_`) && !key.endsWith(`_${today}`)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  },
};

