import { useEffect, useState } from 'react';
import { Text, View, ScrollView, StyleSheet, SafeAreaView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path, G } from 'react-native-svg';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:4000';

export default function ProgramScreen() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string>('');
  const [client, setClient] = useState<any>(null);
  const remoteLogo = process.env.EXPO_PUBLIC_LOGO_URL;
  const logoSource: any = remoteLogo ? { uri: remoteLogo } : require('../assets/logo.png');
  const avatarPlaceholderUrl = process.env.EXPO_PUBLIC_AVATAR_PLACEHOLDER_URL as string | undefined;

  useEffect(() => {
    const run = async () => {
      try {
        setErr('');
        const token = (globalThis as any).ACCESS_TOKEN as string | undefined;
        if (!token) throw new Error('Not authenticated');
        // fetch profile (for avatar)
        const meRes = await fetch(`${API}/mobile/me`, { headers: { Authorization: `Bearer ${token}` } });
        const meJson = await meRes.json();
        if (meRes.ok) setClient(meJson.client);
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
      <View style={styles.header}>
        <Image source={logoSource} style={styles.headerLogo} resizeMode="contain" />
        <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.profileRow} accessibilityRole="button" accessibilityLabel="Open profile">
          <Text numberOfLines={1} style={styles.clientName}>{(client?.fullName || client?.email || 'User').toString()}</Text>
          {client?.avatarUrl || client?.photoUrl || client?.imageUrl || client?.profileImageUrl ? (
            <Image
              source={{ uri: (client?.avatarUrl || client?.photoUrl || client?.imageUrl || client?.profileImageUrl) as string }}
              style={styles.avatar}
            />
          ) : avatarPlaceholderUrl ? (
            <Image source={{ uri: avatarPlaceholderUrl }} style={styles.avatar} />
          ) : (
            <Svg width={40} height={40} viewBox="0 0 40 40">
              <Circle cx="20" cy="20" r="20" fill="#111827" />
              <G transform="translate(0,-2)">
                <Circle cx="20" cy="15" r="6" fill="#fff" />
                <Path d="M12 32c0-4 3.9-7.2 8-7.2s8 3.2 8 7.2v2H12v-2z" fill="#fff" />
              </G>
            </Svg>
          )}
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>Your Program</Text>
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
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLogo: { width: 140, height: 36 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  clientName: { maxWidth: 160, color: '#111827', fontWeight: '600', marginRight: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e5e7eb' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 12 },
  name: { fontSize: 18, fontWeight: '500', marginBottom: 8 },
  card: { backgroundColor: '#f7f7f7', borderRadius: 12, padding: 12, marginBottom: 12 },
  week: { fontWeight: '600' },
  day: { marginTop: 4, fontWeight: '500' },
  exercise: { marginLeft: 8, marginTop: 2 },
  err: { color: 'red', marginBottom: 8 },
});
