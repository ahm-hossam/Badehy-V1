import { useEffect, useMemo, useState } from 'react';
import { Text, View, ScrollView, StyleSheet, Pressable, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.3:4000';

export default function ProgramScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string>('');
  const [client, setClient] = useState<any>(null);

  const remoteLogo = process.env.EXPO_PUBLIC_LOGO_URL;
  const logoSource: any = remoteLogo ? { uri: remoteLogo } : require('../assets/logo.png');
  const avatarPlaceholderUrl = process.env.EXPO_PUBLIC_AVATAR_PLACEHOLDER_URL as string | undefined;

  const fetchAll = async () => {
    try {
      setErr('');
      const token = (globalThis as any).ACCESS_TOKEN as string | undefined;
      if (!token) throw new Error('Not authenticated');

      const meRes = await fetch(`${API}/mobile/me`, { headers: { Authorization: `Bearer ${token}` } });
      const meJson = await meRes.json();
      if (meRes.ok) {
        setClient(meJson.client);
        if (meJson?.subscription?.expired) {
          router.replace('/blocked');
          return;
        }
      }

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

  useEffect(() => { fetchAll(); }, []);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  // ---------- Layout constants ----------
  const H_PADDING = 16;         // horizontal padding shared by header + content
  const AVATAR_SIZE = 36;
  const LOGO_TARGET_HEIGHT = 45; // visual size for the header
  // Optional: nudge the bitmap left to hide any transparent left padding inside the PNG
  const LOGO_SHIFT_X = 0;       // set to 0 if you crop the asset; tweak -4..-10 if needed

  // Keep logo crisp and proportional on every device
  const logoStyle = useMemo(() => {
    // Try to get intrinsic ratio for local/remote images
    // (if remote and not yet resolved, we’ll just fall back to a ~1.2 ratio)
    const src = Image.resolveAssetSource(logoSource as any);
    const ar = src?.width && src?.height ? src.width / src.height : 1.2;

    return {
      height: LOGO_TARGET_HEIGHT,
      aspectRatio: ar,
      resizeMode: 'contain' as const,
      transform: [{ translateX: LOGO_SHIFT_X }],
    };
  }, [logoSource]);

  // Compute header spacer so ScrollView content starts below the fixed header
  const headerSpacer = insets.top + styles.fixedHeader.paddingVertical + Math.max(LOGO_TARGET_HEIGHT, AVATAR_SIZE);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Fixed header */}
      <View
        style={[
          styles.fixedHeader,
          { paddingTop: insets.top + styles.fixedHeader.paddingVertical, paddingHorizontal: H_PADDING }
        ]}
      >
        <View style={styles.headerRow}>
          {/* Clip wrapper hides any leftover transparent margin on the left */}
          <View style={{ height: LOGO_TARGET_HEIGHT, overflow: 'hidden' }}>
            <Image source={logoSource} style={logoStyle} />
          </View>

          <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.profileSection}>
            <Text style={styles.clientName}>
              {(client?.fullName || client?.email || 'User').toString()}
            </Text>
            {client?.avatarUrl || client?.photoUrl || client?.imageUrl || client?.profileImageUrl ? (
              <Image
                source={{ uri: (client?.avatarUrl || client?.photoUrl || client?.imageUrl || client?.profileImageUrl) as string }}
                style={styles.avatar}
              />
            ) : avatarPlaceholderUrl ? (
              <Image source={{ uri: avatarPlaceholderUrl }} style={styles.avatar} />
            ) : (
              <Svg width={AVATAR_SIZE} height={AVATAR_SIZE} viewBox="0 0 40 40">
                <Circle cx="20" cy="20" r="20" fill="#111827" />
                <G transform="translate(0,-2)">
                  <Circle cx="20" cy="15" r="6" fill="#fff" />
                  <Path d="M12 32c0-4 3.9-7.2 8-7.2s8 3.2 8 7.2v2H12v-2z" fill="#fff" />
                </G>
              </Svg>
            )}
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: H_PADDING, paddingTop: headerSpacer }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Your Program</Text>
        {err ? <Text style={styles.err}>{err}</Text> : null}
        {!data ? (
          <Text>Loading...</Text>
        ) : (
          <View>
            <Text style={styles.name}>{data.program?.name || 'No active program'}</Text>
            {data.program?.weeks?.map((w: any) => (
              <View key={w.id} style={styles.card}>
                <Text style={styles.week}>Week {w.weekNumber} {w.name ? `- ${w.name}` : ''}</Text>
                {w.days?.map((d: any) => (
                  <View key={d.id} style={{ marginTop: 8 }}>
                    <Text style={styles.day}>Day {d.dayNumber} {d.name ? `- ${d.name}` : ''}</Text>
                    {d.exercises?.map((pe: any) => (
                      <Text key={pe.id} style={styles.exercise}>
                        • {pe.exercise?.name} {pe.sets ? `x${pe.sets}` : ''} {pe.reps ? `${pe.reps} reps` : ''}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // keep vertical padding here so we can reuse it in calculations
  fixedHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 1000,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    paddingVertical: 12, // <— used in headerSpacer calc
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
  },

  title: { fontSize: 24, fontWeight: '600', marginBottom: 12 },
  name: { fontSize: 18, fontWeight: '500', marginBottom: 8 },
  card: { backgroundColor: '#f7f7f7', borderRadius: 12, padding: 12, marginBottom: 12 },
  week: { fontWeight: '600' },
  day: { marginTop: 4, fontWeight: '500' },
  exercise: { marginLeft: 8, marginTop: 2 },
  err: { color: 'red', marginBottom: 8 },
});
