import { useEffect, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:4000';

export default function WorkoutTab() {
  const [assignment, setAssignment] = useState<any>(null);
  const [err, setErr] = useState('');

  const fetchWorkout = async () => {
    try {
      setErr('');
      const token = (globalThis as any).ACCESS_TOKEN as string | undefined;
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(`${API}/mobile/programs/active`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setAssignment(json.assignment);
    } catch (e: any) {
      setErr(e.message);
    }
  };

  useEffect(() => { fetchWorkout(); }, []);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorkout();
    setRefreshing(false);
  };

  const isEmpty = !assignment;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={isEmpty ? styles.center : { padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {err ? <Text style={{ color: 'red', textAlign: 'center' }}>{err}</Text> : null}
        {isEmpty ? (
          <Text style={styles.empty}>No workouts assigned yet.</Text>
        ) : (
          <Text>{assignment.program?.name || 'Workout program'}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { fontSize: 16, color: '#6b7280' },
});


