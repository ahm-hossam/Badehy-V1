import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View, Button, TextInput, StyleSheet, SafeAreaView } from 'react-native';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:4000';

export default function HomeScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('client@example.com');
  const [password, setPassword] = useState('password123');
  const [msg, setMsg] = useState<string>('');

  const login = async () => {
    try {
      setMsg('');
      const res = await fetch(`${API}/mobile/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      globalThis.ACCESS_TOKEN = data.accessToken;
      setMsg('Logged in');
      router.push('/program');
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Badehy Mobile</Text>
      <TextInput value={email} onChangeText={setEmail} placeholder="email" style={styles.input} autoCapitalize='none' />
      <TextInput value={password} onChangeText={setPassword} placeholder="password" secureTextEntry style={styles.input} />
      <Button title="Login" onPress={login} />
      {!!msg && <Text style={styles.msg}>{msg}</Text>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 20 },
  input: { width: '100%', borderColor: '#ddd', borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  msg: { marginTop: 10, color: 'red' },
});


