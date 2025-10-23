import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  SafeAreaView, 
  Text, 
  StyleSheet, 
  ScrollView, 
  View, 
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.3:4000';
const { width } = Dimensions.get('window');

export default function DayDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dayId, assignmentId, dayName } = useLocalSearchParams();
  
  const [dayData, setDayData] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimer, setSessionTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDayData = useCallback(async () => {
    try {
      setLoading(true);
      const token = (globalThis as any).ACCESS_TOKEN as string | undefined;
      if (!token) throw new Error('Not authenticated');

      // Fetch active program to get day data
      const programRes = await fetch(`${API}/mobile/programs/active`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const programJson = await programRes.json();
      if (!programRes.ok) throw new Error(programJson.error || 'Failed to fetch program');

      // Find the specific day
      const day = programJson.assignment.program.weeks
        .flatMap((week: any) => week.days)
        .find((d: any) => d.id === Number(dayId));

      if (!day) throw new Error('Day not found');
      setDayData(day);

      // Fetch active session
      const sessionRes = await fetch(`${API}/mobile/sessions/active`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const sessionJson = await sessionRes.json();
      if (sessionRes.ok) {
        setActiveSession(sessionJson.session);
      }

    } catch (e: any) {
      console.error("Error fetching day data:", e);
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }, [dayId]);

  useEffect(() => {
    fetchDayData();
  }, [fetchDayData]);

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

  const handleStartWorkout = async () => {
    try {
      const token = (globalThis as any).ACCESS_TOKEN as string | undefined;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API}/mobile/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assignmentId: Number(assignmentId), dayId: Number(dayId) }),
      });
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error || 'Failed to start workout');
      setActiveSession(json.session);
      Alert.alert("Workout Started", "Your workout session has begun!");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handlePauseResumeWorkout = async () => {
    try {
      let token = (globalThis as any).ACCESS_TOKEN as string | undefined;
      if (!token) throw new Error('Not authenticated');

      const action = activeSession.status === 'active' ? 'pause' : 'resume';
      let res = await fetch(`${API}/mobile/sessions/${activeSession.id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      // If token expired, try to refresh it
      if (res.status === 401) {
        const refreshRes = await fetch(`${API}/mobile/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: (globalThis as any).REFRESH_TOKEN }),
        });
        
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          (globalThis as any).ACCESS_TOKEN = refreshData.accessToken;
          token = refreshData.accessToken;
          
          res = await fetch(`${API}/mobile/sessions/${activeSession.id}/${action}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
          });
        }
      }

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
      router.back();
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
        body: JSON.stringify({ setsCompleted: 1 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to complete exercise');
      await fetchDayData(); // Refresh data
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

  const formatSets = (sets: any) => {
    if (!sets) return 'No sets defined';
    
    try {
      const setsArray = Array.isArray(sets) ? sets : JSON.parse(sets);
      if (!Array.isArray(setsArray) || setsArray.length === 0) return 'No sets defined';
      
      return setsArray.map((set: any, index: number) => {
        const reps = set.reps || 'N/A';
        const rest = set.rest ? `${set.rest}s` : '';
        const tempo = set.tempo || '';
        const modifiers = [];
        if (set.dropset) modifiers.push('Dropset');
        if (set.singleLeg) modifiers.push('Single Leg');
        if (set.failure) modifiers.push('To Failure');

        return `${index + 1}. ${reps} reps${rest ? ` | Rest: ${rest}` : ''}${tempo ? ` | Tempo: ${tempo}` : ''}${modifiers.length > 0 ? ` | ${modifiers.join(', ')}` : ''}`;
      }).join('\n');
    } catch {
      return 'Invalid sets data';
    }
  };

  const getGroupTypeColor = (groupType: string) => {
    switch (groupType?.toLowerCase()) {
      case 'superset': return '#4F46E5';
      case 'giant': return '#7C3AED';
      case 'circuit': return '#059669';
      case 'emom': return '#DC2626';
      case 'tabata': return '#EA580C';
      case 'rft': return '#0891B2';
      case 'amrap': return '#BE185D';
      default: return '#6B7280';
    }
  };

  const openVideoModal = (videoUrl: string) => {
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
          <Text style={styles.loadingText}>Loading workout details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!dayData) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Day not found</Text>
          <Pressable onPress={() => router.back()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isOffDay = dayData.dayType === 'off';
  const isCurrentDayActive = activeSession && activeSession.dayId === Number(dayId) && (activeSession.status === 'active' || activeSession.status === 'paused');

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{dayData.name || `Day ${dayData.dayNumber}`}</Text>
          <Text style={styles.headerSubtitle}>{dayData.exercises?.length || 0} exercises</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isOffDay ? (
          <View style={styles.offDayContainer}>
            <Ionicons name="cafe-outline" size={80} color="#9CA3AF" />
            <Text style={styles.offDayTitle}>Rest Day</Text>
            <Text style={styles.offDaySubtitle}>Enjoy your recovery day!</Text>
          </View>
        ) : (
          <>
            {/* Session Controls */}
            {isCurrentDayActive && (
              <View style={styles.sessionControls}>
                <View style={styles.sessionTimerContainer}>
                  <Ionicons name="time-outline" size={24} color="#4F46E5" />
                  <Text style={styles.sessionTimerText}>{formatTime(sessionTimer)}</Text>
                </View>
                <Pressable 
                  style={styles.sessionActionButton} 
                  onPress={handlePauseResumeWorkout}
                >
                  <Ionicons 
                    name={activeSession.status === 'active' ? 'pause' : 'play'} 
                    size={20} 
                    color="#fff" 
                  />
                  <Text style={styles.sessionActionButtonText}>
                    {activeSession.status === 'active' ? 'Pause' : 'Resume'}
                  </Text>
                </Pressable>
                <Pressable 
                  style={[styles.sessionActionButton, styles.completeSessionButton]} 
                  onPress={handleCompleteWorkout}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.sessionActionButtonText}>Complete</Text>
                </Pressable>
              </View>
            )}

            {/* Exercises */}
            {dayData.exercises?.map((exercise: any, index: number) => {
              const videoUrl = getExerciseVideoUrl(exercise);
              const isExerciseCompleted = activeSession?.exerciseCompletions?.some((ec: any) => ec.exerciseId === exercise.id);
              const groupType = exercise.groupType || 'single';
              const groupColor = getGroupTypeColor(groupType);

              return (
                <View key={exercise.id} style={styles.exerciseCard}>
                  {/* Exercise Header */}
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseTitleContainer}>
                      <Text style={styles.exerciseTitle}>{exercise.exercise?.name}</Text>
                      {videoUrl && (
                        <Pressable onPress={() => openVideoModal(videoUrl)} style={styles.videoButton}>
                          <Ionicons name="videocam-outline" size={24} color="#4F46E5" />
                        </Pressable>
                      )}
                    </View>
                    {groupType !== 'single' && groupType !== 'none' && (
                      <View style={[styles.groupTypeBadge, { backgroundColor: groupColor }]}>
                        <Text style={styles.groupTypeText}>{groupType.toUpperCase()}</Text>
                      </View>
                    )}
                  </View>

                  {/* Exercise Description */}
                  {exercise.exercise?.description && (
                    <Text style={styles.exerciseDescription}>{exercise.exercise.description}</Text>
                  )}

                  {/* Sets & Reps */}
                  <View style={styles.setsContainer}>
                    <Text style={styles.setsTitle}>Sets & Reps:</Text>
                    <Text style={styles.setsText}>{formatSets(exercise.sets)}</Text>
                  </View>

                  {/* Notes */}
                  {exercise.notes && (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesTitle}>Notes:</Text>
                      <Text style={styles.notesText}>{exercise.notes}</Text>
                    </View>
                  )}

                  {/* Exercise Actions */}
                  {isCurrentDayActive && !isExerciseCompleted && (
                    <Pressable 
                      style={styles.completeExerciseButton}
                      onPress={() => handleCompleteExercise(exercise.id)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                      <Text style={styles.completeExerciseButtonText}>Mark as Complete</Text>
                    </Pressable>
                  )}
                  
                  {isExerciseCompleted && (
                    <View style={styles.completedExerciseBadge}>
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                      <Text style={styles.completedExerciseText}>Completed</Text>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Start Workout Button */}
            {!isCurrentDayActive && (
              <Pressable style={styles.startWorkoutButton} onPress={handleStartWorkout}>
                <Ionicons name="play" size={24} color="#fff" />
                <Text style={styles.startWorkoutButtonText}>Start Workout</Text>
              </Pressable>
            )}
          </>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
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
  offDayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  offDayTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 20,
  },
  offDaySubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 8,
  },
  sessionControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    borderRadius: 15,
    paddingVertical: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sessionTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionTimerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4F46E5',
  },
  sessionActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  sessionActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completeSessionButton: {
    backgroundColor: '#10B981',
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 10,
  },
  videoButton: {
    padding: 4,
  },
  groupTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 10,
  },
  groupTypeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  exerciseDescription: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 22,
  },
  setsContainer: {
    marginBottom: 12,
  },
  setsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  setsText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  notesContainer: {
    marginBottom: 12,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  completeExerciseButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
    gap: 8,
  },
  completeExerciseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completedExerciseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  completedExerciseText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  startWorkoutButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 15,
    marginTop: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startWorkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
