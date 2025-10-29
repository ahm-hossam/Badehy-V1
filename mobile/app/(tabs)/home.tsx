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
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, G } from 'react-native-svg';
import NotificationBell from '../../components/NotificationBell';
import { TokenStorage, MealCompletionStorage } from '../../lib/storage';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.3:4000';
const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<any>(null);
  const [nutritionData, setNutritionData] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [assignedForms, setAssignedForms] = useState<any[]>([]);
  const [completedMeals, setCompletedMeals] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const remoteLogo = process.env.EXPO_PUBLIC_LOGO_URL;
  const logoSource: any = remoteLogo ? { uri: remoteLogo } : require('../../assets/logo.png');
  const avatarPlaceholderUrl = process.env.EXPO_PUBLIC_AVATAR_PLACEHOLDER_URL as string | undefined;

  const fetchAll = useCallback(async () => {
    try {
      setError('');
      // Load token from storage if not in memory
      let token = (globalThis as any).ACCESS_TOKEN as string | undefined;
      if (!token) {
        token = (await TokenStorage.getAccessToken()) || undefined;
      }
      if (!token) throw new Error('Not authenticated');

      // Fetch client info and subscription
      const meRes = await fetch(`${API}/mobile/me`, { headers: { Authorization: `Bearer ${token}` } });
      const meJson = await meRes.json();
      if (meRes.ok) {
        setClient(meJson.client);
        setSubscription(meJson.subscription);
        // Load saved meal completions from AsyncStorage (only today's completions)
        if (meJson.client?.id) {
          const savedCompletions = await MealCompletionStorage.getMealCompletions(meJson.client.id); // Automatically filters to today
          setCompletedMeals(savedCompletions);
          // Clean up old completions periodically
          await MealCompletionStorage.cleanupOldCompletions(meJson.client.id);
        }
        if (meJson?.subscription?.expired) {
          router.replace('/blocked');
          return;
        }
      }

      // Fetch active workout program
      const programRes = await fetch(`${API}/mobile/programs/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const programJson = await programRes.json();
      if (programRes.ok) {
        // API returns { assignment: {...} }, so data will be the assignment object
        setData(programJson.assignment || programJson);
      }

      // Fetch active nutrition program
      const nutritionRes = await fetch(`${API}/mobile/nutrition/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const nutritionJson = await nutritionRes.json();
      if (nutritionRes.ok) {
        // API returns { assignment: {...} }, so nutritionData will be the assignment object
        setNutritionData(nutritionJson.assignment || nutritionJson);
      }

      // Fetch assigned forms
      const formsRes = await fetch(`${API}/mobile/forms/assigned`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const formsJson = await formsRes.json();
      if (formsRes.ok) {
        setAssignedForms(formsJson.forms || []);
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

  // Reload meal completions when screen comes into focus (only today's completions)
  useFocusEffect(
    useCallback(() => {
      const reloadMealCompletions = async () => {
        if (client?.id) {
          // Get only today's completions (system automatically filters by date)
          const savedCompletions = await MealCompletionStorage.getMealCompletions(client.id);
          setCompletedMeals(savedCompletions);
          // Clean up old completions periodically
          await MealCompletionStorage.cleanupOldCompletions(client.id);
        }
      };
      reloadMealCompletions();
    }, [client?.id])
  );

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
    if (!subscription) {
      // Try to get from client.subscriptions as fallback
      if (client?.subscriptions?.[0]) {
        const sub = client.subscriptions[0];
        const endDate = new Date(sub.endDate);
        const now = new Date();
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysLeft < 0 || sub.isCanceled) return { status: 'Expired', color: '#EF4444' };
        if (daysLeft <= 7) return { status: `${daysLeft} days left`, color: '#F59E0B' };
        return { status: 'Active', color: '#10B981' };
      }
      return { status: 'No Subscription', color: '#EF4444' };
    }
    
    if (subscription.expired) {
      return { status: 'Expired', color: '#EF4444' };
    }
    
    if (subscription.endDate) {
      const endDate = new Date(subscription.endDate);
      const now = new Date();
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft < 0) return { status: 'Expired', color: '#EF4444' };
      if (daysLeft <= 7) return { status: `${daysLeft} days left`, color: '#F59E0B' };
      if (daysLeft <= 30) return { status: `Active (${daysLeft} days left)`, color: '#10B981' };
      return { status: 'Active', color: '#10B981' };
    }
    
    return { status: 'Active', color: '#10B981' };
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

  // Check if today's workout is completed
  const getTodayWorkoutStatus = () => {
    // data is the assignment object, so program is at data.program
    const program = data?.program;
    if (!program?.weeks) {
      return { completed: false, hasWorkout: false };
    }
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    
    // Check all weeks and days for completed sessions today
    let foundCompletedToday = false;
    let hasActiveSessionToday = false;
    
    // Iterate through all weeks and days to find today's completed workout
    for (const week of program.weeks || []) {
      for (const day of week.days || []) {
        if (day.dayType !== 'off' && day.workoutSessions) {
          for (const session of day.workoutSessions) {
            // Check if session was completed today
            if (session.status === 'completed' && session.completedAt) {
              const completedDate = new Date(session.completedAt);
              if (completedDate >= todayStart && completedDate < todayEnd) {
                foundCompletedToday = true;
                break;
              }
            }
            // Check if there's an active session today
            if (session.status === 'active' || session.status === 'paused') {
              const startedDate = session.startedAt ? new Date(session.startedAt) : null;
              if (startedDate && startedDate >= todayStart && startedDate < todayEnd) {
                hasActiveSessionToday = true;
              }
            }
          }
        }
        if (foundCompletedToday) break;
      }
      if (foundCompletedToday) break;
    }
    
    // Also check if there's a program assigned (hasWorkout = true if program exists)
    return { 
      completed: foundCompletedToday, 
      hasWorkout: foundCompletedToday || hasActiveSessionToday || Boolean(program)
    };
  };

  // Check if today's meals are completed
  const getTodayMealsStatus = () => {
    // nutritionData is the assignment object, so nutritionProgram is at nutritionData.nutritionProgram
    const nutritionProgram = nutritionData?.nutritionProgram;
    if (!nutritionProgram?.weeks) {
      return { completed: false, hasMeals: false, completedCount: 0, totalCount: 0 };
    }
    
    // Get today's meals based on the current week and day
    // Find the current week (first week for now, or we can calculate based on start date)
    const currentWeekIndex = 0; // Start with week 0 (first week)
    const currentWeek = nutritionProgram.weeks[currentWeekIndex];
    if (!currentWeek?.days || currentWeek.days.length === 0) {
      return { completed: false, hasMeals: false, completedCount: 0, totalCount: 0 };
    }
    
    // Get today's day of week (0 = Sunday, 6 = Saturday)
    const todayDayOfWeek = new Date().getDay();
    // Backend uses 1-7 where 1=Monday, 7=Sunday
    // JavaScript uses 0-6 where 0=Sunday, 6=Saturday
    // Map: JS Sunday(0) -> Backend Sunday(7), JS Monday(1) -> Backend Monday(1), ..., JS Saturday(6) -> Backend Saturday(6)
    const today = todayDayOfWeek === 0 ? 7 : todayDayOfWeek;
    
    // Find the day that matches today by dayOfWeek
    const todayDayIndex = currentWeek.days.findIndex((day: any) => day.dayOfWeek === today);
    if (todayDayIndex === -1) {
      return { completed: false, hasMeals: false, completedCount: 0, totalCount: 0 };
    }
    
    const todayDay = currentWeek.days[todayDayIndex];
    if (!todayDay.meals || todayDay.meals.length === 0) {
      return { completed: false, hasMeals: true, completedCount: 0, totalCount: 0 };
    }
    
    const totalMeals = todayDay.meals.length;
    
    // Check meal completions from AsyncStorage
    // The meal key format must match exactly with what's saved in nutrition tab
    // Format: `${weekIndex}-${dayIndex}-${meal.id}` where indices are 0-based array positions
    // Note: nutrition tab uses selectedWeek and selectedDay (array indices), so we must match those
    let completedCount = 0;
    const mealKeys: string[] = [];
    todayDay.meals.forEach((meal: any) => {
      // Use the same key format as nutrition tab: week index, day index (array position), meal id
      const mealKey = `${currentWeekIndex}-${todayDayIndex}-${meal.id}`;
      mealKeys.push(mealKey);
      if (completedMeals.has(mealKey)) {
        completedCount++;
      }
    });
    
    
    const allCompleted = completedCount === totalMeals && totalMeals > 0;
    
    return { 
      completed: allCompleted,
      hasMeals: true,
      completedCount,
      totalCount: totalMeals
    };
  };

  const workoutStatus = getTodayWorkoutStatus();
  const mealsStatus = getTodayMealsStatus();

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

        {/* Quick Status Cards */}
        <View style={styles.quickStatusContainer}>
          {/* Today's Workout Status */}
          <View style={styles.quickStatusCard}>
            <View style={styles.quickStatusIconContainer}>
              <Ionicons 
                name="barbell" 
                size={24} 
                color={data?.program ? "#6B7280" : "#9CA3AF"} 
              />
            </View>
            <View style={styles.quickStatusContent}>
              <Text style={styles.quickStatusTitle}>Today's Workout</Text>
              <Text style={[
                styles.quickStatusText,
                !data?.program && { color: '#9CA3AF' }
              ]}>
                {workoutStatus.completed 
                  ? 'Completed' 
                  : data?.program 
                    ? 'Not Started' 
                    : 'No program assigned'}
              </Text>
            </View>
            {workoutStatus.completed && (
              <View style={styles.quickStatusCheckmark}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              </View>
            )}
          </View>

          {/* Today's Meals Status */}
          <View style={styles.quickStatusCard}>
            <View style={styles.quickStatusIconContainer}>
              <Ionicons 
                name="nutrition" 
                size={24} 
                color={nutritionData?.nutritionProgram ? "#6B7280" : "#9CA3AF"} 
              />
            </View>
            <View style={styles.quickStatusContent}>
              <Text style={styles.quickStatusTitle}>Today's Meals</Text>
              <Text style={[
                styles.quickStatusText,
                !nutritionData?.nutritionProgram && { color: '#9CA3AF' }
              ]}>
                {mealsStatus.completed 
                  ? 'All Completed' 
                  : mealsStatus.totalCount > 0 
                    ? `${mealsStatus.completedCount}/${mealsStatus.totalCount} Completed`
                    : nutritionData?.nutritionProgram
                      ? 'No meals scheduled'
                      : 'No program assigned'}
              </Text>
            </View>
            {mealsStatus.completed && (
              <View style={styles.quickStatusCheckmark}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              </View>
            )}
          </View>
        </View>

        {/* Assigned Forms Section */}
        {assignedForms.length > 0 && (
          <View style={styles.assignedFormsCard}>
            <View style={styles.assignedFormsHeader}>
              <Ionicons name="document-text" size={24} color="#4F46E5" />
              <Text style={styles.assignedFormsTitle}>Forms to Complete</Text>
            </View>
            {assignedForms.map((form) => (
              <Pressable
                key={form.id}
                style={styles.assignedFormItem}
                onPress={() => router.push(`/form/${form.form.id}?assignedId=${form.id}`)}
              >
                <View style={styles.assignedFormInfo}>
                  <View style={styles.assignedFormIcon}>
                    <Ionicons name="clipboard-outline" size={20} color="#4F46E5" />
                  </View>
                  <View style={styles.assignedFormContent}>
                    <Text style={styles.assignedFormName}>{form.form.name}</Text>
                    {form.message && (
                      <Text style={styles.assignedFormMessage}>{form.message}</Text>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </Pressable>
            ))}
          </View>
        )}


        {/* Program Overview - Enhanced */}
        {(data?.program || nutritionData?.nutritionProgram) && (
          <>
            {data?.program && (
              <View style={styles.programCard}>
                <View style={styles.programHeader}>
                  <Ionicons name="barbell" size={24} color="#4F46E5" />
                  <Text style={styles.programTitle}>Current Workout Program</Text>
                </View>
                <Text style={styles.programName}>{data.program.name}</Text>
                {data.program.description && (
                  <Text style={styles.programDescription}>{data.program.description}</Text>
                )}
                <View style={styles.programStats}>
                  <View style={styles.programStatItem}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.programStatText}>
                      {data.program.weeks?.length || 0} weeks
                    </Text>
                  </View>
                  <View style={styles.programStatItem}>
                    <Ionicons name="fitness-outline" size={16} color="#6B7280" />
                    <Text style={styles.programStatText}>
                      {data.program.weeks?.reduce((acc: number, week: any) => 
                        acc + (week.days?.filter((day: any) => day.dayType !== 'off').length || 0), 0
                      ) || 0} workout days
                    </Text>
                  </View>
                </View>
                <Pressable 
                  style={styles.programButton}
                  onPress={() => router.push('/(tabs)/workout')}
                >
                  <Text style={styles.programButtonText}>View Program</Text>
                  <Ionicons name="arrow-forward" size={20} color="#4F46E5" />
                </Pressable>
              </View>
            )}
            
            {nutritionData?.nutritionProgram && (
              <View style={styles.programCard}>
                <View style={styles.programHeader}>
                  <Ionicons name="nutrition" size={24} color="#10B981" />
                  <Text style={styles.programTitle}>Current Nutrition Program</Text>
                </View>
                <Text style={styles.programName}>{nutritionData.nutritionProgram.name}</Text>
                {nutritionData.nutritionProgram.description && (
                  <Text style={styles.programDescription}>{nutritionData.nutritionProgram.description}</Text>
                )}
                <View style={styles.programStats}>
                  <View style={styles.programStatItem}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.programStatText}>
                      {nutritionData.nutritionProgram.weeks?.length || 0} weeks
                    </Text>
                  </View>
                  {nutritionData.nutritionProgram.targetCalories && (
                    <View style={styles.programStatItem}>
                      <Ionicons name="flame-outline" size={16} color="#6B7280" />
                      <Text style={styles.programStatText}>
                        {Math.round(nutritionData.nutritionProgram.targetCalories)} cal/day
                      </Text>
                    </View>
                  )}
                </View>
                <Pressable 
                  style={[styles.programButton, { borderColor: '#10B981' }]}
                  onPress={() => router.push('/(tabs)/nutrition')}
                >
                  <Text style={[styles.programButtonText, { color: '#10B981' }]}>View Program</Text>
                  <Ionicons name="arrow-forward" size={20} color="#10B981" />
                </Pressable>
              </View>
            )}
          </>
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
    marginBottom: 12,
    lineHeight: 20,
  },
  programStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  programStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  programStatText: {
    fontSize: 14,
    color: '#6B7280',
  },
  programButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#4F46E5',
    borderRadius: 12,
    marginTop: 4,
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
  assignedFormsCard: {
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
  assignedFormsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  assignedFormsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  assignedFormItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  assignedFormInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assignedFormIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  assignedFormContent: {
    flex: 1,
  },
  assignedFormName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  assignedFormMessage: {
    fontSize: 14,
    color: '#6B7280',
  },
  quickStatusContainer: {
    marginBottom: 16,
    gap: 12,
  },
  quickStatusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickStatusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickStatusContent: {
    flex: 1,
  },
  quickStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  quickStatusText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  quickStatusCheckmark: {
    marginLeft: 8,
  },
});



