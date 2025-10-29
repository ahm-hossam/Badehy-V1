import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = '@badehy_access_token';
const REFRESH_TOKEN_KEY = '@badehy_refresh_token';
const MEAL_COMPLETIONS_KEY = '@badehy_meal_completions';

// Token storage
export const TokenStorage = {
  async saveTokens(accessToken: string, refreshToken?: string) {
    try {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
      // Also set in globalThis for immediate use
      (globalThis as any).ACCESS_TOKEN = accessToken;
      if (refreshToken) {
        (globalThis as any).REFRESH_TOKEN = refreshToken;
      }
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  },

  async getAccessToken(): Promise<string | null> {
    try {
      let token = (globalThis as any).ACCESS_TOKEN;
      if (!token) {
        token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
        if (token) {
          (globalThis as any).ACCESS_TOKEN = token;
        }
      }
      return token;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      let token = (globalThis as any).REFRESH_TOKEN;
      if (!token) {
        token = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        if (token) {
          (globalThis as any).REFRESH_TOKEN = token;
        }
      }
      return token;
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  },

  async clearTokens() {
    try {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      (globalThis as any).ACCESS_TOKEN = undefined;
      (globalThis as any).REFRESH_TOKEN = undefined;
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  },
};

// Meal completion storage - now includes date to reset daily
interface MealCompletion {
  mealKey: string;
  date: string; // YYYY-MM-DD format
}

export const MealCompletionStorage = {
  async saveMealCompletions(clientId: number, completions: Set<string>) {
    try {
      const key = `${MEAL_COMPLETIONS_KEY}_${clientId}`;
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Get existing completions
      const existing = await this.getMealCompletions(clientId);
      const existingData: MealCompletion[] = [];
      
      // Load all stored completions and filter out old ones (older than today)
      const storedData = await AsyncStorage.getItem(key);
      if (storedData) {
        try {
          const stored = JSON.parse(storedData) as MealCompletion[];
          // Keep only today's and future dates
          stored.forEach(item => {
            if (item.date >= today) {
              existingData.push(item);
            }
          });
        } catch (e) {
          // If old format (just strings), ignore it
        }
      }
      
      // Add/update today's completions
      completions.forEach(mealKey => {
        const existingIndex = existingData.findIndex(
          item => item.mealKey === mealKey && item.date === today
        );
        if (existingIndex >= 0) {
          existingData[existingIndex] = { mealKey, date: today };
        } else {
          existingData.push({ mealKey, date: today });
        }
      });
      
      // Remove any today's completions that are no longer in the set
      const todayCompletions = Array.from(completions);
      const filtered = existingData.filter(
        item => item.date !== today || todayCompletions.includes(item.mealKey)
      );
      
      await AsyncStorage.setItem(key, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error saving meal completions:', error);
    }
  },

  async getMealCompletions(clientId: number, forDate?: string): Promise<Set<string>> {
    try {
      const key = `${MEAL_COMPLETIONS_KEY}_${clientId}`;
      const date = forDate || new Date().toISOString().split('T')[0]; // Default to today
      const data = await AsyncStorage.getItem(key);
      
      if (data) {
        try {
          // Try new format (with dates)
          const completionsArray = JSON.parse(data) as MealCompletion[];
          const todayCompletions = completionsArray
            .filter(item => item.date === date)
            .map(item => item.mealKey);
          return new Set(todayCompletions);
        } catch (e) {
          // Fallback for old format (just strings) - filter by date
          const oldFormat = JSON.parse(data) as string[];
          // If old format exists, return empty set (they're not date-specific)
          return new Set<string>();
        }
      }
      return new Set<string>();
    } catch (error) {
      console.error('Error getting meal completions:', error);
      return new Set<string>();
    }
  },

  async clearMealCompletions(clientId: number) {
    try {
      const key = `${MEAL_COMPLETIONS_KEY}_${clientId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing meal completions:', error);
    }
  },

  // Clean up old completions (older than today)
  async cleanupOldCompletions(clientId: number) {
    try {
      const key = `${MEAL_COMPLETIONS_KEY}_${clientId}`;
      const today = new Date().toISOString().split('T')[0];
      const data = await AsyncStorage.getItem(key);
      
      if (data) {
        try {
          const completions = JSON.parse(data) as MealCompletion[];
          const filtered = completions.filter(item => item.date >= today);
          await AsyncStorage.setItem(key, JSON.stringify(filtered));
        } catch (e) {
          // Ignore parse errors
        }
      }
    } catch (error) {
      console.error('Error cleaning up old completions:', error);
    }
  },
};

