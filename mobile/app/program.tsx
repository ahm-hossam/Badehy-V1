import { useEffect, useState } from 'react';
import { Text, View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:4000';

export default function ProgramScreen() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    const run = async () => {
      try {
        setErr('');
        const token = (globalThis as any).ACCESS_TOKEN as string | undefined;
        if (!token) throw new Error('Not authenticated');
        const res = await fetch(`${API}/mobile/programs/active`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed');
        setData(json.assignment);
      } catch (e: any) {
        setErr(e.message);
      }
    };
    run();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>Love You Hanody from the mobile app ♥️</Text>
        {err ? <Text style={styles.err}>{err}</Text> : null}
        {!data ? <Text>Loading...</Text> : (
          <View>
            <Text style={styles.name}>{data.program?.name || 'No active program'}</Text>
            {data.program?.weeks?.map((w: any) => (
              <View key={w.id} style={styles.card}>
                <Text style={styles.week}>Week {w.weekNumber} {w.name ? `- ${w.name}` : ''}</Text>
                {w.days?.map((d: any) => (
                  <View key={d.id} style={{ marginTop: 8 }}>
                    <Text style={styles.day}>Day {d.dayNumber} {d.name ? `- ${d.name}` : ''}</Text>
                    {d.exercises?.map((pe: any) => (
                      <Text key={pe.id} style={styles.exercise}>• {pe.exercise?.name} {pe.sets ? `x${pe.sets}` : ''} {pe.reps ? `${pe.reps} reps` : ''}</Text>
                    ))}
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 12 },
  name: { fontSize: 18, fontWeight: '500', marginBottom: 8 },
  card: { backgroundColor: '#f7f7f7', borderRadius: 12, padding: 12, marginBottom: 12 },
  week: { fontWeight: '600' },
  day: { marginTop: 4, fontWeight: '500' },
  exercise: { marginLeft: 8, marginTop: 2 },
  err: { color: 'red', marginBottom: 8 },
});
