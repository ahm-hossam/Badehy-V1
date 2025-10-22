import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  SafeAreaView, 
  Text, 
  StyleSheet, 
  ScrollView, 
  View, 
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// import { Video } from 'expo-av'; // Temporarily disabled for Expo Go compatibility

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
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    if (activeSession && activeSession.status === 'active') {
      if (timerRef.current) clearInterval(timerRef.current);
      const startTime = new Date(activeSession.startedAt).getTime();
      timerRef.current = setInterval(() => {
        setSessionTimer(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setSessionTimer(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWorkoutData();
    setRefreshing(false);
  }, [fetchWorkoutData]);

  const handleStartWorkout = async (dayId: number, assignmentId: number) => {
    try {
      const token = (globalThis as any).ACCESS_TOKEN as string | undefined;
      if (!token) {
        Alert.alert("Not Logged In", "Please log in first to start a workout.");
        return;
      }

      const res = await fetch(`${API}/mobile/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assignmentId, dayId }),
      });
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error || 'Failed to start workout');
      setActiveSession(json.session);
      Alert.alert("Workout Started", "Your workout session has begun!");
      openDayModal(json.session.day); // Open the day modal for the started workout
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handlePauseResumeWorkout = async () => {
    try {
      const token = (globalThis as any).ACCESS_TOKEN as string | undefined;
      if (!token) throw new Error('Not authenticated');

      const action = activeSession.status === 'active' ? 'pause' : 'resume';
      const res = await fetch(`${API}/mobile/sessions/${activeSession.id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Failed to ${action} workout`);
      setActiveSession(json.session);
      Alert.alert("Session Updated", `Workout session ${action}d.`);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      const token = (globalThis as any).ACCESS_TOKEN as string | undefined;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API}/mobile/sessions/${activeSession.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to complete workout');
      setActiveSession(null);
      Alert.alert("Workout Completed", "Great job! Your workout session is finished.");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleCompleteExercise = async (exerciseId: number) => {
    try {
      const token = (globalThis as any).ACCESS_TOKEN as string | undefined;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API}/mobile/sessions/${activeSession.id}/exercises/${exerciseId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ setsCompleted: 1 }), // Simplified for now
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to complete exercise');
      // Refresh session data to show completion
      await fetchWorkoutData();
      Alert.alert("Exercise Completed", "Exercise marked as done!");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const getExerciseVideoUrl = (exercise: any) => {
    if (exercise.videoUrl) {
      return exercise.videoUrl.startsWith('http') 
        ? exercise.videoUrl 
        : `${API}/${exercise.videoUrl}`;
    }
    if (exercise.exercise?.videoUrl) {
      return exercise.exercise.videoUrl.startsWith('http') 
        ? exercise.exercise.videoUrl 
        : `${API}/${exercise.exercise.videoUrl}`;
    }
    return null;
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
      .map(v => v < 10 ? "0" + v : v)
      .filter((v, i) => v !== "00" || i > 0)
      .join(":");
  };

  const getDayStatus = (day: any) => {
    if (day.dayType === 'off') return { status: 'off', color: '#F59E0B', text: 'Rest Day' };
    
    const isCurrentDayActive = activeSession && activeSession.dayId === day.id;
    const isDayCompleted = activeSession && activeSession.dayId === day.id && activeSession.status === 'completed';
    
    if (isDayCompleted) return { status: 'completed', color: '#10B981', text: 'Completed' };
    if (isCurrentDayActive) return { status: 'active', color: '#4F46E5', text: 'Active' };
    return { status: 'pending', color: '#6B7280', text: 'Pending' };
  };

  const openDayModal = (day: any) => {
    setSelectedDay(day);
    setShowDayModal(true);
  };

  const openVideoModal = (videoUrl: string) => {
    // For now, just show an alert with the video URL
    Alert.alert(
      "Video Preview", 
      `Video URL: ${videoUrl}\n\nNote: Full video playback requires a development build.`,
      [{ text: "OK" }]
    );
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
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Workout</Text>
        <Text style={styles.headerSubtitle}>Your personalized training program</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Workout Program</Text>
            <Text style={styles.emptySubtitle}>
              Your trainer hasn't assigned a workout program yet.{'\n'}
              Check back later or contact your trainer.
            </Text>
          </View>
        ) : (
          <>
            {/* Program Header */}
            <View style={styles.programHeader}>
              <View style={styles.programInfo}>
                <Text style={styles.programName}>{assignment.program.name}</Text>
                <Text style={styles.programDescription}>
                  {assignment.program.description || 'Your personalized workout program'}
                </Text>
              </View>
              <View style={styles.programStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{assignment.program.weeks?.length || 0}</Text>
                  <Text style={styles.statLabel}>Weeks</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {assignment.program.weeks?.reduce((acc: number, week: any) => 
                      acc + (week.days?.filter((day: any) => day.dayType !== 'off').length || 0), 0
                    ) || 0}
                  </Text>
                  <Text style={styles.statLabel}>Workouts</Text>
                </View>
              </View>
            </View>

            {/* Active Session Card */}
            {activeSession && (
              <View style={styles.activeSessionCard}>
                <View style={styles.activeSessionHeader}>
                  <Ionicons name="play-circle" size={24} color="#4F46E5" />
                  <Text style={styles.activeSessionTitle}>Active Workout</Text>
                  <Text style={styles.sessionTimer}>{formatTime(sessionTimer)}</Text>
                </View>
                <Text style={styles.activeSessionText}>
                  You have an active workout session. Tap to continue.
                </Text>
                <View style={styles.sessionActions}>
                  <Pressable 
                    style={styles.sessionActionButton}
                    onPress={handlePauseResumeWorkout}
                  >
                    <Ionicons 
                      name={activeSession.status === 'active' ? 'pause' : 'play'} 
                      size={20} 
                      color="#fff" 
                    />
                    <Text style={styles.sessionActionText}>
                      {activeSession.status === 'active' ? 'Pause' : 'Resume'}
                    </Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.sessionActionButton, styles.completeButton]}
                    onPress={handleCompleteWorkout}
                  >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.sessionActionText}>Complete</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Program Weeks */}
            {assignment.program.weeks?.map((week: any, weekIndex: number) => (
              <View key={week.id} style={styles.weekCard}>
                <View style={styles.weekHeader}>
                  <View style={styles.weekInfo}>
                    <Text style={styles.weekTitle}>Week {week.weekNumber}</Text>
                    {week.name && <Text style={styles.weekSubtitle}>{week.name}</Text>}
                  </View>
                  <View style={styles.weekProgress}>
                    <Text style={styles.weekProgressText}>
                      {week.days?.filter((day: any) => day.dayType !== 'off').length || 0} workouts
                    </Text>
                  </View>
                </View>

                <View style={styles.daysContainer}>
                  {week.days?.map((day: any, dayIndex: number) => {
                    const dayStatus = getDayStatus(day);
                    const isOffDay = day.dayType === 'off';
                    const isCurrentDayActive = activeSession && activeSession.dayId === day.id;
                    
                    return (
                      <Pressable
                        key={day.id}
                        style={[
                          styles.dayCard,
                          isCurrentDayActive && styles.activeDayCard,
                          dayStatus.status === 'completed' && styles.completedDayCard
                        ]}
                        onPress={() => !isOffDay && openDayModal(day)}
                      >
                        <View style={styles.dayHeader}>
                          <View style={styles.dayInfo}>
                            <Text style={styles.dayTitle}>
                              Day {day.dayNumber}
                              {day.name && ` - ${day.name}`}
                            </Text>
                            <Text style={styles.daySubtitle}>
                              {isOffDay ? 'Rest Day' : `${day.exercises?.length || 0} exercises`}
                            </Text>
                          </View>
                          <View style={[styles.dayStatusBadge, { backgroundColor: dayStatus.color + '20' }]}>
                            <Text style={[styles.dayStatusText, { color: dayStatus.color }]}>
                              {dayStatus.text}
                            </Text>
                          </View>
                        </View>

                        {!isOffDay && (
                          <View style={styles.dayActions}>
                            <View style={styles.exercisePreview}>
                              {day.exercises?.slice(0, 3).map((exercise: any, index: number) => {
                                const videoUrl = getExerciseVideoUrl(exercise);
                                return (
                                  <View key={exercise.id} style={styles.exerciseThumbnail}>
                                    {videoUrl ? (
                                      <Pressable onPress={() => openVideoModal(videoUrl)}>
                                        <View style={styles.videoThumbnail}>
                                          <Ionicons name="play-circle" size={24} color="#4F46E5" />
                                        </View>
                                      </Pressable>
                                    ) : (
                                      <View style={styles.noVideoThumbnail}>
                                        <Ionicons name="barbell" size={20} color="#6B7280" />
                                      </View>
                                    )}
                                  </View>
                                );
                              })}
                              {day.exercises?.length > 3 && (
                                <View style={styles.moreExercises}>
                                  <Text style={styles.moreExercisesText}>
                                    +{day.exercises.length - 3}
                                  </Text>
                                </View>
                              )}
                            </View>
                            
                            {!isCurrentDayActive && (
                              <Pressable 
                                style={styles.startWorkoutButton}
                                onPress={() => handleStartWorkout(day.id, assignment.id)}
                              >
                                <Ionicons name="play" size={20} color="#fff" />
                                <Text style={styles.startWorkoutText}>Start</Text>
                              </Pressable>
                            )}
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Day Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDayModal}
        onRequestClose={() => setShowDayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Day {selectedDay?.dayNumber} - {selectedDay?.name || 'Workout'}
              </Text>
              <Pressable onPress={() => setShowDayModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {selectedDay?.exercises?.map((exercise: any, index: number) => {
                const videoUrl = getExerciseVideoUrl(exercise);
                const isExerciseCompleted = activeSession?.exerciseCompletions?.some(
                  (ec: any) => ec.exerciseId === exercise.id
                );
                
                return (
                  <View key={exercise.id} style={styles.exerciseCard}>
                    <View style={styles.exerciseHeader}>
                      <View style={styles.exerciseNumber}>
                        <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{exercise.exercise?.name}</Text>
                        <Text style={styles.exerciseDetails}>
                          {exercise.sets?.length || 0} sets • {exercise.sets?.[0]?.reps || 'N/A'} reps
                          {exercise.sets?.[0]?.rest && ` • ${exercise.sets[0].rest}s rest`}
                        </Text>
                      </View>
                      {videoUrl && (
                        <Pressable 
                          style={styles.videoButton}
                          onPress={() => openVideoModal(videoUrl)}
                        >
                          <Ionicons name="play-circle" size={32} color="#4F46E5" />
                        </Pressable>
                      )}
                    </View>

                    {exercise.notes && (
                      <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
                    )}

                    {activeSession && activeSession.status === 'active' && !isExerciseCompleted && (
                      <Pressable 
                        style={styles.completeExerciseButton}
                        onPress={() => handleCompleteExercise(exercise.id)}
                      >
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text style={styles.completeExerciseText}>Mark Complete</Text>
                      </Pressable>
                    )}

                    {isExerciseCompleted && (
                      <View style={styles.completedExercise}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text style={styles.completedExerciseText}>Completed</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    padding: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  programHeader: {
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
  programInfo: {
    marginBottom: 16,
  },
  programName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  programDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
  },
  programStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
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
    flex: 1,
  },
  sessionTimer: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4F46E5',
  },
  activeSessionText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  sessionActionButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  sessionActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  weekCard: {
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
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weekInfo: {
    flex: 1,
  },
  weekTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  weekSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  weekProgress: {
    alignItems: 'flex-end',
  },
  weekProgressText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  daysContainer: {
    gap: 12,
  },
  dayCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeDayCard: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  completedDayCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayInfo: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  daySubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  dayStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dayStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exercisePreview: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  exerciseThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  noVideoThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreExercises: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreExercisesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  startWorkoutButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  startWorkoutText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: 400,
    padding: 20,
  },
  exerciseCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseNumberText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  videoButton: {
    padding: 4,
  },
  exerciseNotes: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  completeExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  completeExerciseText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  completedExercise: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  completedExerciseText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});