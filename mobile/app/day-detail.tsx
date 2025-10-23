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
    if (activeSession) {
      if (activeSession.status === 'active') {
        if (timerRef.current) clearInterval(timerRef.current);
        const startTime = new Date(activeSession.startedAt).getTime();
        const pausedTime = activeSession.pausedAt ? new Date(activeSession.pausedAt).getTime() - startTime : 0;
        const resumedTime = activeSession.resumedAt ? new Date(activeSession.resumedAt).getTime() : 0;
        
        timerRef.current = setInterval(() => {
          const now = Date.now();
          const baseTime = resumedTime > 0 ? resumedTime : startTime;
          const elapsed = Math.floor((now - baseTime) / 1000) + Math.floor(pausedTime / 1000);
          setSessionTimer(elapsed);
        }, 1000);
      } else if (activeSession.status === 'paused') {
        // Calculate total elapsed time when paused
        const startTime = new Date(activeSession.startedAt).getTime();
        const pausedTime = activeSession.pausedAt ? new Date(activeSession.pausedAt).getTime() - startTime : 0;
        setSessionTimer(Math.floor(pausedTime / 1000));
      }
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

  const formatSets = (sets: any, exercise: any) => {
    if (!sets) return 'No sets defined';
    
    try {
      const setsArray = Array.isArray(sets) ? sets : JSON.parse(sets);
      if (!Array.isArray(setsArray) || setsArray.length === 0) return 'No sets defined';
      
      return setsArray.map((set: any, index: number) => {
        let reps = set.reps || 'N/A';
        const rest = set.rest ? `${set.rest}s` : '';
        const tempo = set.tempo || '';
        const modifiers = [];
        
        // Apply exercise-level flags
        if (exercise.dropset) modifiers.push('Dropset');
        if (exercise.singleLeg) modifiers.push('Single Leg');
        if (exercise.failure) {
          modifiers.push('To Failure');
          reps = 'Failure'; // Replace reps with "Failure" when failure flag is set
        }

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
      <View style={[styles.header, { paddingTop: 8 }]}>
        <Pressable onPress={() => router.push('/(tabs)/workout')} style={styles.backButton}>
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
                {/* Timer Display */}
                <View style={styles.timerSection}>
                  <View style={styles.timerIconContainer}>
                    <Ionicons name="time" size={24} color="#4F46E5" />
                  </View>
                  <View style={styles.timerTextContainer}>
                    <Text style={styles.timerLabel}>Workout Time</Text>
                    <Text style={styles.timerValue}>{formatTime(sessionTimer)}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                  <Pressable 
                    style={[styles.actionButton, styles.pauseButton]} 
                    onPress={handlePauseResumeWorkout}
                  >
                    <Ionicons 
                      name={activeSession.status === 'active' ? 'pause' : 'play'} 
                      size={20} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.actionButtonText}>
                      {activeSession.status === 'active' ? 'Pause' : 'Resume'}
                    </Text>
                  </Pressable>
                  
                  <Pressable 
                    style={[styles.actionButton, styles.completeButton]} 
                    onPress={handleCompleteWorkout}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Complete</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Exercises - Grouped by Superset */}
            {(() => {
              const exercises = dayData.exercises || [];
              const groupedExercises: any[] = [];
              const processedIds = new Set<number>();

              // Group exercises by superset
              exercises.forEach((exercise: any) => {
                if (processedIds.has(exercise.id)) return;

                if (exercise.groupType && exercise.groupType !== 'single' && exercise.groupType !== 'none') {
                  // Find all exercises in the same group
                  const groupExercises = exercises.filter((e: any) => 
                    e.groupId === exercise.groupId && e.groupType === exercise.groupType
                  );
                  
                  groupExercises.forEach(e => processedIds.add(e.id));
                  groupedExercises.push({
                    type: 'group',
                    groupType: exercise.groupType,
                    groupId: exercise.groupId,
                    exercises: groupExercises
                  });
                } else {
                  processedIds.add(exercise.id);
                  groupedExercises.push({
                    type: 'single',
                    exercise: exercise
                  });
                }
              });

              return groupedExercises.map((item, index) => {
                if (item.type === 'group') {
                  const groupColor = getGroupTypeColor(item.groupType);
                  return (
                    <View key={`group-${item.groupId}`} style={styles.supersetGroup}>
                      {/* Superset Header */}
                      <View style={styles.supersetHeader}>
                        <View style={styles.supersetBadge}>
                          <Text style={styles.supersetBadgeText}>
                            {item.groupType.toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.supersetTitle}>
                          {item.exercises.length} Linked Exercises
                        </Text>
                      </View>

                      {/* Superset Exercises */}
                      {item.exercises.map((exercise: any, exerciseIndex: number) => {
                        const videoUrl = getExerciseVideoUrl(exercise);
                        const groupType = exercise.groupType || 'single';

                        return (
                          <View key={exercise.id} style={[
                            styles.exerciseCard,
                            styles.supersetExerciseCard,
                            exerciseIndex === item.exercises.length - 1 && styles.lastSupersetExercise
                          ]}>
                            {/* Exercise Header with Title and Video */}
                            <View style={styles.exerciseHeader}>
                              <Text style={styles.exerciseTitle}>{exercise.exercise?.name}</Text>
                              {videoUrl && (
                                <Pressable onPress={() => openVideoModal(videoUrl)} style={styles.videoButton}>
                                  <Ionicons name="play" size={20} color="#FFFFFF" />
                                </Pressable>
                              )}
                            </View>

                            {/* Description */}
                            {exercise.exercise?.description && (
                              <Text style={styles.exerciseDescription}>{exercise.exercise.description}</Text>
                            )}

                            {/* Sets - Full Width */}
                            <View style={styles.setsItem}>
                              <Text style={styles.infoLabel}>Sets & Reps</Text>
                              <View style={styles.setsDetails}>
                                {formatSets(exercise.sets, exercise).split('\n').map((set: string, idx: number) => (
                                  <Text key={idx} style={styles.setItem}>
                                    {set}
                                  </Text>
                                ))}
                              </View>
                            </View>

                            {/* Notes */}
                            {exercise.notes && (
                              <View style={styles.notesSection}>
                                <Text style={styles.notesTitle}>Notes</Text>
                                <Text style={styles.notesText}>{exercise.notes}</Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  );
                } else {
                  // Single exercise
                  const exercise = item.exercise;
                  const videoUrl = getExerciseVideoUrl(exercise);
                  const groupType = exercise.groupType || 'single';
                  const groupColor = getGroupTypeColor(groupType);

                  return (
                    <View key={exercise.id} style={styles.exerciseCard}>
                      {/* Exercise Header with Title and Video */}
                      <View style={styles.exerciseHeader}>
                        <Text style={styles.exerciseTitle}>{exercise.exercise?.name}</Text>
                        {videoUrl && (
                          <Pressable onPress={() => openVideoModal(videoUrl)} style={styles.videoButton}>
                            <Ionicons name="play" size={20} color="#FFFFFF" />
                          </Pressable>
                        )}
                      </View>

                      {/* Description */}
                      {exercise.exercise?.description && (
                        <Text style={styles.exerciseDescription}>{exercise.exercise.description}</Text>
                      )}

                      {/* Exercise Info Grid */}
                      <View style={styles.infoGrid}>
                        {/* Type */}
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Type</Text>
                          <Text style={[styles.infoValue, { color: groupColor }]}>
                            {groupType === 'single' || groupType === 'none' ? 'Single' : groupType.charAt(0).toUpperCase() + groupType.slice(1)}
                          </Text>
                        </View>

                        {/* Sets - Full Width */}
                        <View style={styles.setsItem}>
                          <Text style={styles.infoLabel}>Sets & Reps</Text>
                          <View style={styles.setsDetails}>
                            {formatSets(exercise.sets, exercise).split('\n').map((set: string, idx: number) => (
                              <Text key={idx} style={styles.setItem}>
                                {set}
                              </Text>
                            ))}
                          </View>
                        </View>
                      </View>

                      {/* Notes */}
                      {exercise.notes && (
                        <View style={styles.notesSection}>
                          <Text style={styles.notesTitle}>Notes</Text>
                          <Text style={styles.notesText}>{exercise.notes}</Text>
                        </View>
                      )}
                    </View>
                  );
                }
              });
            })()}

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
    paddingBottom: 6,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  timerTextContainer: {
    flex: 1,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pauseButton: {
    backgroundColor: '#6B7280',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  supersetGroup: {
    marginBottom: 20,
  },
  supersetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  supersetBadge: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 12,
  },
  supersetBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  supersetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  supersetExerciseCard: {
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  lastSupersetExercise: {
    marginBottom: 0,
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  videoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
    marginTop: 2,
  },
  infoGrid: {
    flexDirection: 'column',
    marginBottom: 16,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setsItem: {
    flex: 1,
  },
  setsDetails: {
    marginTop: 6,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  setItem: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
    lineHeight: 20,
  },
  linkedSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4F46E5',
  },
  linkedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  linkedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  linkedBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4F46E5',
    marginRight: 8,
  },
  linkedText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  notesSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
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
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 24,
    gap: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startWorkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
