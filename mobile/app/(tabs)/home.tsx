import { useEffect, useState, useCallback } from 'react';
import { 
  SafeAreaView, 
  Text, 
  View, 
  ScrollView, 
  StyleSheet, 
  Pressable, 
  Image, 
  RefreshControl,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, G } from 'react-native-svg';
import NotificationBell from '../../components/NotificationBell';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.3:4000';
const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const remoteLogo = process.env.EXPO_PUBLIC_LOGO_URL;
  const logoSource: any = remoteLogo ? { uri: remoteLogo } : require('../../assets/logo.png');
  const avatarPlaceholderUrl = process.env.EXPO_PUBLIC_AVATAR_PLACEHOLDER_URL as string | undefined;

  const fetchAll = useCallback(async () => {
    try {
      setError('');
      const token = (globalThis as any).ACCESS_TOKEN as string | undefined;
      if (!token) throw new Error('Not authenticated');

      // Fetch client info
      const meRes = await fetch(`${API}/mobile/me`, { headers: { Authorization: `Bearer ${token}` } });
      const meJson = await meRes.json();
      if (meRes.ok) {
        setClient(meJson.client);
        if (meJson?.subscription?.expired) {
          router.replace('/blocked');
          return;
        }
      }

      // Fetch active program
      const programRes = await fetch(`${API}/mobile/programs/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const programJson = await programRes.json();
      if (programRes.ok) {
        setData(programJson.assignment);
      }

      // Fetch active session
      const sessionRes = await fetch(`${API}/mobile/sessions/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sessionJson = await sessionRes.json();
      if (sessionRes.ok) {
        setActiveSession(sessionJson.session);
      }

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { 
    fetchAll(); 
  }, [fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getSubscriptionStatus = () => {
    if (!client?.subscriptions?.[0]) return { status: 'No Subscription', color: '#EF4444' };
    
    const subscription = client.subscriptions[0];
    const endDate = new Date(subscription.endDate);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { status: 'Expired', color: '#EF4444' };
    if (daysLeft <= 7) return { status: `${daysLeft} days left`, color: '#F59E0B' };
    return { status: 'Active', color: '#10B981' };
  };

  const getNextWorkout = () => {
    if (!data?.program?.weeks) return null;
    
    // Find the first incomplete day
    for (const week of data.program.weeks) {
      for (const day of week.days) {
        if (day.dayType !== 'off') {
          return { week, day };
        }
      }
    }
    return null;
  };

  const getWorkoutProgress = () => {
    if (!data?.program?.weeks) return { completed: 0, total: 0 };
    
    let completed = 0;
    let total = 0;
    
    data.program.weeks.forEach((week: any) => {
      week.days.forEach((day: any) => {
        if (day.dayType !== 'off') {
          total++;
          if (day.workoutSessions?.[0]?.status === 'completed') {
            completed++;
          }
        }
      });
    });
    
    return { completed, total };
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const subscriptionStatus = getSubscriptionStatus();
  const nextWorkout = getNextWorkout();
  const workoutProgress = getWorkoutProgress();

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ height: 45, overflow: 'hidden' }}>
            <Image source={logoSource} style={styles.logo} />
          </View>
          <View style={styles.headerActions}>
            <NotificationBell clientId={client?.id} />
            <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.profileSection}>
              <Text style={styles.clientName}>
                {client?.fullName || client?.email || 'User'}
              </Text>
              {client?.avatarUrl ? (
                <Image source={{ uri: client.avatarUrl }} style={styles.avatar} />
              ) : (
                <Svg width={36} height={36} viewBox="0 0 40 40">
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
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>{getGreeting()}, {client?.fullName?.split(' ')[0] || 'there'}!</Text>
          <Text style={styles.subtitle}>Ready to crush your fitness goals today?</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="barbell" size={24} color="#4F46E5" />
            </View>
            <Text style={styles.statNumber}>{workoutProgress.completed}</Text>
            <Text style={styles.statLabel}>Workouts{'\n'}Completed</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="calendar" size={24} color="#10B981" />
            </View>
            <Text style={styles.statNumber}>{workoutProgress.total}</Text>
            <Text style={styles.statLabel}>Total{'\n'}Workouts</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="trophy" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statNumber}>
              {workoutProgress.total > 0 ? Math.round((workoutProgress.completed / workoutProgress.total) * 100) : 0}%
            </Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
        </View>

        {/* Active Session Card */}
        {activeSession && (
          <View style={styles.activeSessionCard}>
            <View style={styles.activeSessionHeader}>
              <Ionicons name="play-circle" size={24} color="#4F46E5" />
              <Text style={styles.activeSessionTitle}>Active Workout</Text>
            </View>
            <Text style={styles.activeSessionText}>
              You have an active workout session. Tap to continue.
            </Text>
            <Pressable 
              style={styles.activeSessionButton}
              onPress={() => router.push('/(tabs)/workout')}
            >
              <Text style={styles.activeSessionButtonText}>Continue Workout</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </Pressable>
          </View>
        )}

        {/* Next Workout Card */}
        {nextWorkout && !activeSession && (
          <View style={styles.nextWorkoutCard}>
            <View style={styles.nextWorkoutHeader}>
              <Ionicons name="barbell-outline" size={24} color="#111827" />
              <Text style={styles.nextWorkoutTitle}>Next Workout</Text>
            </View>
            <Text style={styles.nextWorkoutText}>
              Week {nextWorkout.week.weekNumber} - Day {nextWorkout.day.dayNumber}
            </Text>
            <Text style={styles.nextWorkoutSubtext}>
              {nextWorkout.day.exercises?.length || 0} exercises planned
            </Text>
            <Pressable 
              style={styles.nextWorkoutButton}
              onPress={() => router.push('/(tabs)/workout')}
            >
              <Text style={styles.nextWorkoutButtonText}>Start Workout</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </Pressable>
          </View>
        )}

        {/* Program Overview */}
        {data?.program && (
          <View style={styles.programCard}>
            <View style={styles.programHeader}>
              <Ionicons name="list" size={24} color="#111827" />
              <Text style={styles.programTitle}>Current Program</Text>
            </View>
            <Text style={styles.programName}>{data.program.name}</Text>
            <Text style={styles.programDescription}>
              {data.program.weeks?.length || 0} weeks • {data.program.weeks?.reduce((acc: number, week: any) => 
                acc + (week.days?.filter((day: any) => day.dayType !== 'off').length || 0), 0
              )} workout days
            </Text>
            <Pressable 
              style={styles.programButton}
              onPress={() => router.push('/(tabs)/workout')}
            >
              <Text style={styles.programButtonText}>View Program</Text>
              <Ionicons name="arrow-forward" size={20} color="#4F46E5" />
            </Pressable>
          </View>
        )}

        {/* Subscription Status */}
        <View style={styles.subscriptionCard}>
          <View style={styles.subscriptionHeader}>
            <Ionicons name="card" size={24} color={subscriptionStatus.color} />
            <Text style={styles.subscriptionTitle}>Subscription</Text>
          </View>
          <Text style={[styles.subscriptionStatus, { color: subscriptionStatus.color }]}>
            {subscriptionStatus.status}
          </Text>
          <Pressable 
            style={styles.subscriptionButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.subscriptionButtonText}>View Details</Text>
            <Ionicons name="arrow-forward" size={20} color="#6B7280" />
          </Pressable>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <Pressable 
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)/workout')}
            >
              <Ionicons name="barbell" size={28} color="#4F46E5" />
              <Text style={styles.quickActionText}>Workout</Text>
            </Pressable>
            
            <Pressable 
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)/nutrition')}
            >
              <Ionicons name="nutrition" size={28} color="#10B981" />
              <Text style={styles.quickActionText}>Nutrition</Text>
            </Pressable>
            
            <Pressable 
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)/checkins')}
            >
              <Ionicons name="checkmark-done" size={28} color="#F59E0B" />
              <Text style={styles.quickActionText}>Check-in</Text>
            </Pressable>
            
            <Pressable 
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Ionicons name="person" size={28} color="#8B5CF6" />
              <Text style={styles.quickActionText}>Profile</Text>
            </Pressable>
          </View>
        </View>

        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="warning" size={24} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    height: 45,
    aspectRatio: 1.2,
    resizeMode: 'contain',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 20,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  activeSessionCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  activeSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeSessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4F46E5',
    marginLeft: 8,
  },
  activeSessionText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  activeSessionButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSessionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  nextWorkoutCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nextWorkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nextWorkoutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  nextWorkoutText: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  nextWorkoutSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  nextWorkoutButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextWorkoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  programCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  programTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  programName: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  programDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  programButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#4F46E5',
    borderRadius: 12,
  },
  programButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  subscriptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  subscriptionStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  subscriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  subscriptionButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  quickActionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  quickActionText: {
    fontSize: 12,
    color: '#111827',
    marginTop: 8,
    fontWeight: '500',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});



