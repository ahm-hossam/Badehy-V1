import { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:4000';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('client@example.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'email' | 'password'>('email');
  const remoteLogo = process.env.EXPO_PUBLIC_LOGO_URL;
  const logoSource: any = remoteLogo ? { uri: remoteLogo } : require('../assets/logo.png');

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
      if (data?.requiresPasswordReset) {
        router.replace('/set-password');
      } else {
        router.replace('/(tabs)/home');
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


