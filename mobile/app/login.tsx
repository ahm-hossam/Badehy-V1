import { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import NotificationService from '../services/NotificationService';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'email' | 'password'>('email');
  const remoteLogo = process.env.EXPO_PUBLIC_LOGO_URL;
  const logoSource: any = remoteLogo ? { uri: remoteLogo } : require('../assets/logo.png');

  const registerPushNotifications = async (clientId: number) => {
    try {
      // Register for push notifications
      const pushToken = await NotificationService.registerForPushNotifications();
      
      if (pushToken) {
        // Register token with backend
        await NotificationService.registerTokenWithBackend(clientId, pushToken);
        console.log('Push notifications registered successfully');
      }
    } catch (error) {
      console.error('Error registering push notifications:', error);
      // Don't block the login flow if push notification registration fails
    }
  };

  const checkFormCompletion = async () => {
    try {
      const token = (globalThis as any).ACCESS_TOKEN;
      const response = await fetch(`${API}/mobile/forms/main`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Register push notifications after successful authentication
        if (data.clientId) {
          registerPushNotifications(data.clientId);
        }
        
        if (data.completed) {
          // Form already completed, go to main app
          router.replace('/(tabs)/home');
        } else {
          // Form not completed, redirect to form
          router.replace('/form');
        }
      } else {
        console.error('Form API error:', data);
        // If error is 404 (no form found), still try to show the form screen
        // The form screen will handle displaying the appropriate error message
        if (response.status === 404) {
          router.replace('/form');
        } else {
          // For other errors, go to main app
          router.replace('/(tabs)/home');
        }
      }
    } catch (error) {
      console.error('Error checking form completion:', error);
      // On network error, go to main app
      router.replace('/(tabs)/home');
    }
  };

  const startByEmail = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/mobile/auth/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      if (data?.firstLogin && data?.firstLoginToken) {
        router.replace({ pathname: '/set-password', params: { token: data.firstLoginToken } as any });
        return;
      }
      setPhase('password');
    } catch (e: any) {
      setError(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const loginWithPassword = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/mobile/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
          if (!res.ok) throw new Error(data?.error || 'Login failed');
          (globalThis as any).ACCESS_TOKEN = data.accessToken;
          (globalThis as any).REFRESH_TOKEN = data.refreshToken;
      if (data?.subscriptionExpired) {
        router.replace('/blocked');
        return;
      }
      if (data?.requiresPasswordReset) {
        router.replace('/set-password');
      } else {
        // Check if client needs to complete main form
        checkFormCompletion();
      }
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
        <View style={styles.headerArea}>
          <Image source={logoSource} style={styles.logo} resizeMode="contain" />
          <View style={{ alignSelf: 'stretch', paddingHorizontal: 16 }}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>
        </View>

        <View style={styles.card}>
          {!!error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          {phase === 'password' && (
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                style={styles.input}
              />
            </View>
          )}

          <Pressable onPress={phase === 'email' ? startByEmail : loginWithPassword} style={({ pressed }) => [styles.button, pressed && { opacity: 0.9 }]}>
            <Text style={styles.buttonText}>{loading ? 'Please wait…' : phase === 'email' ? 'Next' : 'Sign in'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  headerArea: { paddingHorizontal: 16, paddingTop: 48, paddingBottom: 16, alignItems: 'center' },
  logo: { width: 280, height: 80, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginTop: 4, textAlign: 'left' },
  subtitle: { marginTop: 6, fontSize: 14, color: '#64748b', textAlign: 'left' },
  card: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  field: { marginBottom: 12 },
  label: { fontSize: 12, color: '#64748b', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 16,
    color: '#0f172a',
  },
  button: {
    marginTop: 6,
    height: 48,
    backgroundColor: '#111827',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  error: { color: '#ef4444', marginBottom: 8 },
});


