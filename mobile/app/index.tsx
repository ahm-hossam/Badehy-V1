import { useEffect, useState, useCallback } from 'react';
import { Redirect, useFocusEffect } from 'expo-router';
import { TokenStorage } from '../lib/storage';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadToken = useCallback(async () => {
    try {
      const savedToken = await TokenStorage.getAccessToken();
      setToken(savedToken);
      // Also ensure it's in globalThis
      if (savedToken && !(globalThis as any).ACCESS_TOKEN) {
        (globalThis as any).ACCESS_TOKEN = savedToken;
      }
    } catch (error) {
      console.error('Error loading token:', error);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  // Reload token when screen comes into focus (e.g., app returns from background)
  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        loadToken();
      }
      return () => {}; // cleanup function
    }, [loading, loadToken])
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return token ? <Redirect href="/(tabs)/home" /> : <Redirect href="/login" />;
}


