import { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:4000';

export default function SetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams() as any;
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const remoteLogo = process.env.EXPO_PUBLIC_LOGO_URL;
  const logoSource: any = remoteLogo ? { uri: remoteLogo } : require('../assets/logo.png');

  const submit = async () => {
    try {
      setError('');
      if (!next || next.length < 8) {
        setError('New password must be at least 8 characters.');
        return;
      }
      if (next !== confirm) {
        setError('Passwords do not match.');
        return;
      }
      setLoading(true);
      const firstLoginToken = params?.token as string | undefined;
      let res: Response;
      if (firstLoginToken) {
        // First login flow: no current password required
        res = await fetch(`${API}/mobile/auth/first-set-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: firstLoginToken, newPassword: next }),
        });
      } else {
        const token = (globalThis as any).ACCESS_TOKEN;
        res = await fetch(`${API}/mobile/auth/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ currentPassword: current, newPassword: next }),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed');
      if (data?.accessToken) {
        (globalThis as any).ACCESS_TOKEN = data.accessToken;
      }
      router.replace('/program');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const isFirstLogin = !!params?.token;

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
        <View style={styles.headerArea}>
          <Image source={logoSource} style={styles.logo} resizeMode="contain" />
          <View style={{ alignSelf: 'stretch', paddingHorizontal: 16 }}>
            <Text style={styles.headerTitle}>{isFirstLogin ? 'Create your password' : 'Change your password'}</Text>
            <Text style={styles.headerSubtitle}>{isFirstLogin ? 'Secure your account to continue' : 'Update your password to keep your account secure'}</Text>
          </View>
        </View>

        <View style={styles.card}>          
          {!!error && <Text style={styles.error}>{error}</Text>}

          {!isFirstLogin && (
            <View style={styles.field}>
              <Text style={styles.label}>Current password</Text>
              <TextInput value={current} onChangeText={setCurrent} placeholder="Current password" secureTextEntry style={styles.input} />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>New password</Text>
            <TextInput value={next} onChangeText={setNext} placeholder="New password (min 8)" secureTextEntry style={styles.input} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm new password</Text>
            <TextInput value={confirm} onChangeText={setConfirm} placeholder="Confirm new password" secureTextEntry style={styles.input} />
          </View>

          <Pressable onPress={submit} style={styles.button} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Saving…' : 'Save password'}</Text>
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
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginTop: 4, textAlign: 'left' },
  headerSubtitle: { marginTop: 6, fontSize: 14, color: '#64748b', textAlign: 'left' },
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
  input: { borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 12, height: 44, fontSize: 16, color: '#0f172a' },
  button: { marginTop: 6, height: 48, backgroundColor: '#111827', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  error: { color: '#ef4444', marginBottom: 8 },
});


