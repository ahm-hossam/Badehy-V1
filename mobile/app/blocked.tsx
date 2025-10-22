import { SafeAreaView, View, Text, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.3:4000';

export default function BlockedScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      setRefreshing(true);
      const token = (globalThis as any).ACCESS_TOKEN as string | undefined;
      if (!token) return;
      const res = await fetch(`${API}/mobile/me`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (res.ok && json?.subscription && json.subscription.expired === false) {
        router.replace('/(tabs)/home');
        return;
      }
    } catch {}
    finally {
      setRefreshing(false);
    }
  }, [router]);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={checkStatus} />}>
        <View style={styles.card}>
          <Text style={styles.title}>Subscription expired</Text>
          <Text style={styles.subtitle}>Your subscription has ended. Please contact your trainer to renew.
          Pull down to refresh after renewal.</Text>
          <Pressable onPress={() => router.replace('/login')} style={styles.button}>
            <Text style={styles.buttonText}>Back to login</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  card: { width: '90%', backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { marginTop: 8, fontSize: 14, color: '#6b7280' },
  button: { marginTop: 16, height: 48, backgroundColor: '#111827', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});


