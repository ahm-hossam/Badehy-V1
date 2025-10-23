import { useEffect, useState, useCallback } from 'react';
import { 
  SafeAreaView, 
  Text, 
  StyleSheet, 
  RefreshControl, 
  ScrollView, 
  View, 
  Pressable,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.3:4000';
const { width } = Dimensions.get('window');

export default function NutritionTab() {
  const insets = useSafeAreaInsets();
  const [assignment, setAssignment] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState('');
  const [selectedDay, setSelectedDay] = useState(0);

  const fetchNutrition = useCallback(async () => {
    try {
      setErr('');
      setLoading(true);
      const token = (globalThis as any).ACCESS_TOKEN as string | undefined;
      if (!token) throw new Error('Not authenticated');

      // Fetch client info
      const meRes = await fetch(`${API}/mobile/me`, { headers: { Authorization: `Bearer ${token}` } });
      const meJson = await meRes.json();
      if (meRes.ok) {
        setClient(meJson.client);
      }

      // Fetch nutrition plan
      const res = await fetch(`${API}/mobile/nutrition/active`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const json = await res.json();
      if (res.ok) {
        setAssignment(json.assignment);
      } else {
        // If no nutrition plan, that's okay - show empty state
        setAssignment(null);
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchNutrition(); 
  }, [fetchNutrition]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNutrition();
    setRefreshing(false);
  }, [fetchNutrition]);

  const getTodaysMeals = () => {
    if (!assignment?.nutritionProgram?.meals) return [];
    
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[today];
    
    return assignment.nutritionProgram.meals.filter((meal: any) => 
      meal.days?.includes(todayName) || meal.days?.includes('daily')
    );
  };

  const getMacroGoals = () => {
    // Mock macro goals - in real app, these would come from the nutrition plan
    return {
      calories: 2000,
      protein: 150,
      carbs: 200,
      fat: 80,
      fiber: 25
    };
  };

  const getTodaysProgress = () => {
    // Mock progress - in real app, this would come from logged meals
    return {
      calories: 1200,
      protein: 90,
      carbs: 120,
      fat: 45,
      fiber: 15
    };
  };

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const getMealTime = (mealType: string) => {
    const times: { [key: string]: string } = {
      'breakfast': '8:00 AM',
      'lunch': '1:00 PM',
      'dinner': '7:00 PM',
      'snack': '3:00 PM',
      'pre-workout': '5:30 PM',
      'post-workout': '6:30 PM'
    };
    return times[mealType.toLowerCase()] || 'TBD';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading nutrition plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isEmpty = !assignment;
  const macroGoals = getMacroGoals();
  const todaysProgress = getTodaysProgress();
  const todaysMeals = getTodaysMeals();

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: 8 }]}>
        <Text style={styles.headerTitle}>Nutrition</Text>
        <Text style={styles.headerSubtitle}>Track your daily nutrition</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {err ? (
          <View style={styles.errorCard}>
            <Ionicons name="warning" size={24} color="#EF4444" />
            <Text style={styles.errorText}>{err}</Text>
          </View>
        ) : isEmpty ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="nutrition-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Nutrition Plan</Text>
            <Text style={styles.emptySubtitle}>
              Your trainer hasn't assigned a nutrition plan yet.{'\n'}
              Check back later or contact your trainer.
            </Text>
          </View>
        ) : (
          <>
            {/* Macro Progress */}
            <View style={styles.macroCard}>
              <Text style={styles.cardTitle}>Today's Macros</Text>
              <View style={styles.macroGrid}>
                {[
                  { key: 'calories', label: 'Calories', unit: 'kcal', color: '#4F46E5', icon: 'flame' },
                  { key: 'protein', label: 'Protein', unit: 'g', color: '#10B981', icon: 'fitness' },
                  { key: 'carbs', label: 'Carbs', unit: 'g', color: '#F59E0B', icon: 'leaf' },
                  { key: 'fat', label: 'Fat', unit: 'g', color: '#EF4444', icon: 'water' },
                ].map((macro) => {
                  const current = todaysProgress[macro.key as keyof typeof todaysProgress];
                  const goal = macroGoals[macro.key as keyof typeof macroGoals];
                  const percentage = getProgressPercentage(current, goal);
                  
                  return (
                    <View key={macro.key} style={styles.macroItem}>
                      <View style={styles.macroHeader}>
                        <Ionicons name={macro.icon as any} size={20} color={macro.color} />
                        <Text style={styles.macroLabel}>{macro.label}</Text>
                      </View>
                      <Text style={styles.macroValue}>
                        {current}/{goal} {macro.unit}
                      </Text>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { 
                              width: `${percentage}%`, 
                              backgroundColor: macro.color 
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.macroPercentage}>{Math.round(percentage)}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Today's Meals */}
            <View style={styles.mealsCard}>
              <Text style={styles.cardTitle}>Today's Meals</Text>
              {todaysMeals.length > 0 ? (
                todaysMeals.map((meal: any, index: number) => (
                  <View key={index} style={styles.mealItem}>
                    <View style={styles.mealHeader}>
                      <View style={styles.mealInfo}>
                        <Text style={styles.mealName}>{meal.name || `Meal ${index + 1}`}</Text>
                        <Text style={styles.mealTime}>{getMealTime(meal.type || 'meal')}</Text>
                      </View>
                      <Pressable style={styles.logMealButton}>
                        <Ionicons name="add" size={20} color="#4F46E5" />
                      </Pressable>
                    </View>
                    {meal.description && (
                      <Text style={styles.mealDescription}>{meal.description}</Text>
                    )}
                    {meal.foods && meal.foods.length > 0 && (
                      <View style={styles.foodsList}>
                        {meal.foods.map((food: any, foodIndex: number) => (
                          <Text key={foodIndex} style={styles.foodItem}>
                            • {food.name} ({food.quantity})
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.noMealsContainer}>
                  <Ionicons name="restaurant-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.noMealsText}>No meals planned for today</Text>
                </View>
              )}
            </View>

            {/* Nutrition Plan Info */}
            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <Ionicons name="document-text" size={24} color="#111827" />
                <Text style={styles.planTitle}>Nutrition Plan</Text>
              </View>
              <Text style={styles.planName}>{assignment.nutritionProgram?.name || 'Active Plan'}</Text>
              <Text style={styles.planDescription}>
                {assignment.nutritionProgram?.description || 'Your personalized nutrition plan'}
              </Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsCard}>
              <Text style={styles.cardTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <Pressable style={styles.quickActionButton}>
                  <Ionicons name="add-circle" size={28} color="#4F46E5" />
                  <Text style={styles.quickActionText}>Log Meal</Text>
                </Pressable>
                
                <Pressable style={styles.quickActionButton}>
                  <Ionicons name="water" size={28} color="#06B6D4" />
                  <Text style={styles.quickActionText}>Log Water</Text>
                </Pressable>
                
                <Pressable style={styles.quickActionButton}>
                  <Ionicons name="scale" size={28} color="#10B981" />
                  <Text style={styles.quickActionText}>Log Weight</Text>
                </Pressable>
                
                <Pressable style={styles.quickActionButton}>
                  <Ionicons name="analytics" size={28} color="#8B5CF6" />
                  <Text style={styles.quickActionText}>Progress</Text>
                </Pressable>
              </View>
            </View>
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
    padding: 16,
    paddingBottom: 20,
    paddingTop: 6,
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
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
  macroCard: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  macroItem: {
    width: (width - 64) / 2,
    marginBottom: 16,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 8,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  macroPercentage: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  mealsCard: {
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
  mealItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  mealTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  logMealButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  foodsList: {
    marginTop: 4,
  },
  foodItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  noMealsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noMealsText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  planCard: {
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
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  planName: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7280',
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
});


