import { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:4000';

export default function SetPasswordScreen() {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      const token = (globalThis as any).ACCESS_TOKEN;
      const res = await fetch(`${API}/mobile/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed');
      router.replace('/program');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>Set your password</Text>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <TextInput value={current} onChangeText={setCurrent} placeholder="Current password" secureTextEntry style={styles.input} />
        <TextInput value={next} onChangeText={setNext} placeholder="New password (min 8)" secureTextEntry style={styles.input} />
        <TextInput value={confirm} onChangeText={setConfirm} placeholder="Confirm new password" secureTextEntry style={styles.input} />
        <Pressable onPress={submit} style={styles.button} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Saving…' : 'Save password'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  card: { width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 12, height: 44, fontSize: 16, marginBottom: 10 },
  button: { height: 48, backgroundColor: '#111827', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  error: { color: '#ef4444', marginBottom: 8 },
});


