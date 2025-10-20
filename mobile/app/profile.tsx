import { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:4000';

export default function ProfileScreen() {
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        setErr('');
        const token = (globalThis as any).ACCESS_TOKEN as string | undefined;
        if (!token) throw new Error('Not authenticated');
        const res = await fetch(`${API}/mobile/me`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed');
        setClient(data.client);
      } catch (e: any) {
        setErr(e.message);
      }
    };
    run();
  }, []);

  const logout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => {
        (globalThis as any).ACCESS_TOKEN = undefined;
        router.replace('/login');
      } },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.headerArea}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <Text style={styles.headerSubtitle}>Manage your account</Text>
      </View>

      <View style={styles.card}>
        {err ? <Text style={styles.err}>{err}</Text> : null}
        {!client ? <Text>Loading…</Text> : (
          <View>
            <View style={styles.row}><Text style={styles.label}>Name</Text><Text style={styles.value}>{client.fullName || '-'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Email</Text><Text style={styles.value}>{client.email || '-'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Phone</Text><Text style={styles.value}>{client.phone || '-'}</Text></View>
          </View>
        )}

        <Pressable onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  headerArea: { paddingHorizontal: 16, paddingTop: 48, paddingBottom: 16, alignItems: 'flex-start' },
  backButton: { position: 'absolute', left: 16, top: 12, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: '#111827' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#0f172a', textAlign: 'left' },
  headerSubtitle: { marginTop: 6, fontSize: 14, color: '#64748b', textAlign: 'left' },
  card: { marginTop: 16, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7eb' },
  label: { color: '#6b7280' },
  value: { color: '#111827', fontWeight: '500' },
  err: { color: '#ef4444', marginBottom: 8 },
  logoutButton: { marginTop: 16, height: 48, backgroundColor: '#ef4444', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});


