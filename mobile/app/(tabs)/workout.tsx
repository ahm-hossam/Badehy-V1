import { useEffect, useState, useCallback } from 'react';
import { 
  SafeAreaView, 
  Text, 
  StyleSheet, 
  ScrollView, 
  View, 
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.3:4000';
const { width } = Dimensions.get('window');

export default function WorkoutTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [assignment, setAssignment] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(0);

  const fetchWorkoutData = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      const token = (globalThis as any).ACCESS_TOKEN as string | undefined;
      if (!token) throw new Error('Not authenticated');

      // Fetch client info and subscription status
      const meRes = await fetch(`${API}/mobile/me`, { headers: { Authorization: `Bearer ${token}` } });
      const meJson = await meRes.json();
      if (meRes.ok) {
        if (meJson?.subscription?.expired) {
          router.replace('/blocked');
          return;
        }
      } else {
        throw new Error(meJson.error || 'Failed to fetch client info');
      }

      // Fetch active program
      const programRes = await fetch(`${API}/mobile/programs/active`, { headers: { Authorization: `Bearer ${token}` } });
      const programJson = await programRes.json();
      if (!programRes.ok) throw new Error(programJson.error || 'Failed to fetch active program');
      setAssignment(programJson.assignment);

      // Fetch active session
      const sessionRes = await fetch(`${API}/mobile/sessions/active`, { headers: { Authorization: `Bearer ${token}` } });
      const sessionJson = await sessionRes.json();
      if (sessionRes.ok) {
        setActiveSession(sessionJson.session);
      }

    } catch (e: any) {
      console.error("Error fetching workout data:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchWorkoutData();
  }, [fetchWorkoutData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWorkoutData();
    setRefreshing(false);
  }, [fetchWorkoutData]);

  const handleDayPress = (day: any) => {
    router.push({
      pathname: '/day-detail',
      params: {
        dayId: day.id,
        assignmentId: assignment.id,
        dayName: day.name || `Day ${day.dayNumber}`
      }
    });
  };

  const getDayStatus = (day: any) => {
    const session = day.workoutSessions?.[0];
    if (session) {
      switch (session.status) {
        case 'completed':
          return { status: 'completed', text: 'Completed', color: '#10B981' };
        case 'active':
          return { status: 'active', text: 'In Progress', color: '#4F46E5' };
        case 'paused':
          return { status: 'paused', text: 'Paused', color: '#F59E0B' };
        default:
          return { status: 'not-started', text: 'Not Started', color: '#6B7280' };
      }
    }
    return { status: 'not-started', text: 'Not Started', color: '#6B7280' };
  };

  const getWeekStatus = (week: any) => {
    if (!week.days || week.days.length === 0) return { isCompleted: false, completedDays: 0, totalDays: 0 };
    
    const totalDays = week.days.length;
    const completedDays = week.days.filter((day: any) => {
      if (day.dayType === 'off') return true; // Rest days are considered "completed"
      
      // Check if there's a completed workout session for this day
      const session = day.workoutSessions?.[0];
      return session && session.status === 'completed';
    }).length;
    
    return {
      isCompleted: completedDays === totalDays,
      completedDays,
      totalDays
    };
  };

  const formatWorkoutDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getWorkoutDuration = (day: any) => {
    const session = day.workoutSessions?.[0];
    if (session && session.status === 'completed' && session.totalDuration) {
      return formatWorkoutDuration(session.totalDuration);
    }
    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading your workout program...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={onRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isEmpty = !assignment || !assignment.program;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: 8 }]}>
        <Text style={styles.headerTitle}>Workout</Text>
        <Text style={styles.headerSubtitle}>Your personalized training program</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <View style={styles.emptyState}>
            <Ionicons name="fitness-outline" size={60} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No workout program assigned yet.</Text>
            <Text style={styles.emptyStateSubText}>Your trainer will assign a program soon!</Text>
          </View>
        ) : (
          <View style={styles.programContainer}>
            {/* Program Summary Card */}
            <View style={styles.programSummaryCard}>
              <View style={styles.programHeader}>
                <View style={styles.programTitleContainer}>
                  <Text style={styles.programName}>{assignment.program.name}</Text>
                  {assignment.program.description && (
                    <Text style={styles.programDescription}>{assignment.program.description}</Text>
                  )}
                </View>
                <View style={styles.weekCountBadge}>
                  <Ionicons name="calendar-outline" size={16} color="#4F46E5" />
                  <Text style={styles.weekCountText}>{assignment.program.weeks.length} Weeks</Text>
                </View>
              </View>
            </View>

            {/* Week Tabs */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weekTabsContainer}
            >
              {assignment.program.weeks.map((week: any, index: number) => {
                const weekStatus = getWeekStatus(week);
                return (
                  <Pressable
                    key={week.id}
                    style={[
                      styles.weekTab,
                      selectedWeek === index && styles.activeWeekTab
                    ]}
                    onPress={() => setSelectedWeek(index)}
                  >
                    <View style={styles.weekTabContent}>
                      {weekStatus.isCompleted && (
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" style={styles.weekSuccessIcon} />
                      )}
                      <Text style={[
                        styles.weekTabText,
                        selectedWeek === index && styles.activeWeekTabText
                      ]}>
                        {week.name || `Week ${week.weekNumber}`}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Days List */}
            <View style={styles.daysContainer}>
              <Text style={styles.daysTitle}>
                {assignment.program.weeks[selectedWeek]?.name || `Week ${assignment.program.weeks[selectedWeek]?.weekNumber}`}
              </Text>
              
              {assignment.program.weeks[selectedWeek]?.days.map((day: any) => {
                const dayStatus = getDayStatus(day);
                const isOffDay = day.dayType === 'off';
                const exerciseCount = day.exercises?.length || 0;
                const workoutDuration = getWorkoutDuration(day);

                return (
                  <Pressable
                    key={day.id}
                    style={[
                      styles.dayCard,
                      isOffDay && styles.offDayCard,
                    ]}
                    onPress={() => !isOffDay && handleDayPress(day)}
                    disabled={isOffDay}
                  >
                    <View style={styles.dayCardHeader}>
                      <View style={styles.dayCardTitleContainer}>
                        <Text style={[styles.dayCardTitle, isOffDay && styles.offDayCardTitle]}>
                          {day.name || `Day ${day.dayNumber}`}
                        </Text>
                        {!isOffDay ? (
                          <View style={styles.dayCardSubtitleContainer}>
                            <Text style={styles.dayCardSubtitle}>
                              {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                            </Text>
                            {workoutDuration && (
                              <Text style={styles.workoutDuration}>
                                Completed in {workoutDuration}
                              </Text>
                            )}
                          </View>
                        ) : (
                          <Text style={styles.restDaySubtitle}>
                            Rest Day
                          </Text>
                        )}
                      </View>
                      <View style={styles.dayCardRight}>
                        {!isOffDay && (
                          <View style={[styles.statusBadge, { backgroundColor: dayStatus.color }]}>
                            <Text style={styles.statusBadgeText}>{dayStatus.text}</Text>
                          </View>
                        )}
                        {isOffDay && (
                          <Ionicons name="cafe-outline" size={24} color="#92400E" />
                        )}
                      </View>
                    </View>

                    {!isOffDay && (
                      <View style={styles.dayCardFooter}>
                        <Text style={styles.dayCardDescription}>
                          Tap to view exercises and start workout
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                      </View>
                    )}
                    {isOffDay && (
                      <View style={styles.dayCardFooter}>
                        <Text style={styles.restDayDescription}>
                          Enjoy your recovery day!
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
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
    paddingBottom: 6,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 15,
    fontWeight: '600',
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 5,
  },
  programContainer: {
    // Styles for the overall program content
  },
  programSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  programTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  programName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  programDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  weekCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  weekCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  weekTabsContainer: {
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  weekTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeWeekTab: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  weekTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekSuccessIcon: {
    marginRight: 6,
  },
  weekTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  activeWeekTabText: {
    color: '#FFFFFF',
  },
  daysContainer: {
    // Styles for days container
  },
  daysTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  offDayCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  dayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dayCardTitleContainer: {
    flex: 1,
  },
  dayCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  offDayCardTitle: {
    color: '#92400E',
  },
  dayCardSubtitleContainer: {
    marginTop: 2,
  },
  dayCardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  workoutDuration: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
    marginTop: 2,
  },
  restDaySubtitle: {
    fontSize: 14,
    color: '#92400E',
    marginTop: 2,
    fontWeight: '600',
  },
  dayCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dayCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  dayCardDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    flex: 1,
  },
  restDayDescription: {
    fontSize: 14,
    color: '#92400E',
    fontStyle: 'italic',
  },
});