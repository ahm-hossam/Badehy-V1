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
  Dimensions,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.3:4000';
const { width } = Dimensions.get('window');

export default function NutritionTab() {
  const insets = useSafeAreaInsets();
  const [assignment, setAssignment] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [completedMeals, setCompletedMeals] = useState<Set<string>>(new Set());

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

  const getCurrentWeek = () => {
    if (!assignment?.nutritionProgram?.weeks) return null;
    return assignment.nutritionProgram.weeks[selectedWeek] || assignment.nutritionProgram.weeks[0];
  };

  const getCurrentDay = () => {
    const currentWeek = getCurrentWeek();
    if (!currentWeek?.days) return null;
    return currentWeek.days[selectedDay] || currentWeek.days[0];
  };

  const getTodaysMeals = () => {
    const currentDay = getCurrentDay();
    return currentDay?.meals || [];
  };

  const getMacroGoals = () => {
    if (!assignment?.nutritionProgram) {
      return { calories: 2000, protein: 150, carbs: 200, fat: 80 };
    }
    
    return {
      calories: assignment.nutritionProgram.targetCalories || 2000,
      protein: assignment.nutritionProgram.targetProtein || 150,
      carbs: assignment.nutritionProgram.targetCarbs || 200,
      fat: assignment.nutritionProgram.targetFats || 80
    };
  };

  const getTodaysProgress = () => {
    const todaysMeals = getTodaysMeals();
    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
    
    todaysMeals.forEach((meal: any) => {
      const mealKey = `${selectedWeek}-${selectedDay}-${meal.id}`;
      if (completedMeals.has(mealKey)) {
        const nutrition = calculateMealNutrition(meal);
        totalCalories += nutrition.calories;
        totalProtein += nutrition.protein;
        totalCarbs += nutrition.carbs;
        totalFat += nutrition.fat;
      }
    });
    
    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10
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
    return times[mealType.toLowerCase()] || '12:00 PM';
  };

  const toggleMealCompletion = (meal: any) => {
    const mealKey = `${selectedWeek}-${selectedDay}-${meal.id}`;
    const newCompletedMeals = new Set(completedMeals);
    
    if (completedMeals.has(mealKey)) {
      newCompletedMeals.delete(mealKey);
    } else {
      newCompletedMeals.add(mealKey);
    }
    
    setCompletedMeals(newCompletedMeals);
  };

  const isMealCompleted = (meal: any) => {
    const mealKey = `${selectedWeek}-${selectedDay}-${meal.id}`;
    return completedMeals.has(mealKey);
  };

  const getMealImageUri = (meal: any) => {
    if (meal.meal?.imageUrl) {
      // If it's a full URL, use it directly, otherwise prepend API URL
      if (meal.meal.imageUrl.startsWith('http')) {
        return meal.meal.imageUrl;
      } else {
        return `${API}${meal.meal.imageUrl}`;
      }
    }
    // Default meal image - you can replace this with your default image URL
    return 'https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=Meal';
  };

  const calculateMealNutrition = (meal: any) => {
    if (!meal?.meal?.mealIngredients) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
    
    meal.meal.mealIngredients.forEach((mealIngredient: any) => {
      const ingredient = mealIngredient.ingredient;
      const quantity = mealIngredient.quantity || 1;
      const servingSize = ingredient.servingSize || 100;
      
      // Calculate nutrition per serving
      const multiplier = quantity / servingSize;
      
      // Use cooking state values if available
      const calories = ingredient.cookingState === 'after_cook' ? ingredient.caloriesAfter : ingredient.caloriesBefore;
      const protein = ingredient.cookingState === 'after_cook' ? ingredient.proteinAfter : ingredient.proteinBefore;
      const carbs = ingredient.cookingState === 'after_cook' ? ingredient.carbsAfter : ingredient.carbsBefore;
      const fat = ingredient.cookingState === 'after_cook' ? ingredient.fatsAfter : ingredient.fatsBefore;
      
      totalCalories += (calories || 0) * multiplier;
      totalProtein += (protein || 0) * multiplier;
      totalCarbs += (carbs || 0) * multiplier;
      totalFat += (fat || 0) * multiplier;
    });
    
    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10
    };
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
  const currentWeek = getCurrentWeek();
  const currentDay = getCurrentDay();

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: 8 }]}>
        <Text style={styles.headerTitle}>Nutrition</Text>
        <Text style={styles.headerSubtitle}>
          {assignment?.nutritionProgram?.name || 'Track your daily nutrition'}
        </Text>
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
            {/* Week Navigation */}
            {assignment?.nutritionProgram?.weeks && assignment.nutritionProgram.weeks.length > 1 && (
              <View style={styles.weekNavigation}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {assignment.nutritionProgram.weeks.map((week: any, index: number) => (
                    <Pressable
                      key={week.id || index}
                      style={[
                        styles.weekTab,
                        selectedWeek === index && styles.weekTabActive
                      ]}
                      onPress={() => {
                        setSelectedWeek(index);
                        setSelectedDay(0);
                      }}
                    >
                      <Text style={[
                        styles.weekTabText,
                        selectedWeek === index && styles.weekTabTextActive
                      ]}>
                        {week.name || `Week ${week.weekNumber}`}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Day Navigation */}
            {currentWeek?.days && currentWeek.days.length > 1 && (
              <View style={styles.dayNavigation}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {currentWeek.days.map((day: any, index: number) => (
                    <Pressable
                      key={day.id || index}
                      style={[
                        styles.dayTab,
                        selectedDay === index && styles.dayTabActive
                      ]}
                      onPress={() => setSelectedDay(index)}
                    >
                      <Text style={[
                        styles.dayTabText,
                        selectedDay === index && styles.dayTabTextActive
                      ]}>
                        {day.name || `Day ${day.dayOfWeek}`}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Macro Progress */}
            <View style={styles.macroCard}>
              <Text style={styles.cardTitle}>Daily Macro Goals</Text>
              <View style={styles.macroChartsRow}>
                {[
                  { key: 'calories', label: 'Calories', unit: 'kcal', color: '#4F46E5' },
                  { key: 'protein', label: 'Protein', unit: 'g', color: '#10B981' },
                  { key: 'carbs', label: 'Carbs', unit: 'g', color: '#F59E0B' },
                  { key: 'fat', label: 'Fat', unit: 'g', color: '#EF4444' },
                ].map((macro) => {
                  const current = todaysProgress[macro.key as keyof typeof todaysProgress];
                  const goal = macroGoals[macro.key as keyof typeof macroGoals];
                  const percentage = getProgressPercentage(current, goal);
                  
                  return (
                    <View key={macro.key} style={styles.macroChartItem}>
                      <View style={styles.pieChartContainer}>
                        <Svg width={60} height={60} style={styles.pieChart}>
                          {/* Background circle */}
                          <Circle
                            cx={30}
                            cy={30}
                            r={25}
                            stroke="#F3F4F6"
                            strokeWidth={6}
                            fill="transparent"
                          />
                          {/* Progress arc */}
                          <Circle
                            cx={30}
                            cy={30}
                            r={25}
                            stroke={macro.color}
                            strokeWidth={6}
                            fill="transparent"
                            strokeDasharray={`${(percentage / 100) * 157} 157`}
                            strokeDashoffset={0}
                            strokeLinecap="round"
                            transform="rotate(-90 30 30)"
                          />
                        </Svg>
                        <View style={styles.pieChartCenter}>
                          <Text style={styles.pieChartPercentage}>{Math.round(percentage)}%</Text>
                        </View>
                      </View>
                      <Text style={styles.macroChartLabel}>{macro.label}</Text>
                      <Text style={styles.macroChartValue}>
                        {current}/{goal} {macro.unit}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Today's Meals */}
            <View style={styles.mealsCard}>
              <Text style={styles.cardTitle}>
                {currentDay?.name || 'Today\'s Meals'}
              </Text>
              {todaysMeals.length > 0 ? (
                todaysMeals.map((meal: any, index: number) => {
                  const nutrition = calculateMealNutrition(meal);
                  const isCompleted = isMealCompleted(meal);
                  
                  return (
                    <View key={meal.id || index} style={[
                      styles.mealCard,
                      isCompleted && styles.mealCardCompleted
                    ]}>
                      {meal.isCheatMeal ? (
                        // Cheat Meal Display
                        <>
                          <View style={styles.mealCardHeader}>
                            <View style={styles.mealCardInfo}>
                              <View style={styles.cheatBadge}>
                                <Ionicons name="fast-food" size={12} color="#F59E0B" />
                                <Text style={styles.cheatBadgeText}>CHEAT</Text>
                              </View>
                            </View>
                            <Pressable 
                              style={styles.completionButton}
                              onPress={() => toggleMealCompletion(meal)}
                            >
                              <Ionicons 
                                name={isCompleted ? "checkmark-circle" : "radio-button-off"} 
                                size={22} 
                                color={isCompleted ? "#10B981" : "#D1D5DB"} 
                              />
                            </Pressable>
                          </View>
                          
                          <View style={styles.mealCardContent}>
                            <View style={styles.cheatMealInfo}>
                              <Text style={[styles.mealCardName, isCompleted && styles.mealCardNameCompleted]}>
                                {meal.cheatDescription || 'Cheat Meal'}
                              </Text>
                              {meal.cheatImageUrl && (
                                <Image 
                                  source={{ uri: meal.cheatImageUrl.startsWith('http') ? meal.cheatImageUrl : `${API}${meal.cheatImageUrl}` }}
                                  style={styles.cheatMealImage}
                                  resizeMode="cover"
                                />
                              )}
                            </View>
                          </View>
                        </>
                      ) : (
                        // Regular Meal Display
                        <>
                          <View style={styles.mealCardHeader}>
                            <View style={styles.mealCardInfo}>
                              <Text style={[styles.mealCardName, isCompleted && styles.mealCardNameCompleted]}>
                                {meal.meal?.name || `${meal.mealType || 'Meal'}`}
                              </Text>
                            </View>
                            <Pressable 
                              style={styles.completionButton}
                              onPress={() => toggleMealCompletion(meal)}
                            >
                              <Ionicons 
                                name={isCompleted ? "checkmark-circle" : "radio-button-off"} 
                                size={22} 
                                color={isCompleted ? "#10B981" : "#D1D5DB"} 
                              />
                            </Pressable>
                          </View>
                          
                          <View style={styles.mealCardContent}>
                            {/* Meal Image & Quick Info */}
                            <View style={styles.mealImageContainer}>
                              <Image 
                                source={{ uri: getMealImageUri(meal) }}
                                style={styles.mealCardImage}
                                resizeMode="cover"
                              />
                              <View style={styles.nutritionOverlay}>
                                <Text style={styles.caloriesText}>{nutrition.calories} cal</Text>
                              </View>
                            </View>
                            
                            {/* Compact Nutrition & Ingredients */}
                            <View style={styles.mealDetails}>
                              <View style={styles.macrosRow}>
                                <View style={styles.macroChip}>
                                  <Text style={styles.macroChipText}>P: {nutrition.protein}g</Text>
                                </View>
                                <View style={styles.macroChip}>
                                  <Text style={styles.macroChipText}>C: {nutrition.carbs}g</Text>
                                </View>
                                <View style={styles.macroChip}>
                                  <Text style={styles.macroChipText}>F: {nutrition.fat}g</Text>
                                </View>
                              </View>
                              
                              {meal.meal?.mealIngredients && meal.meal.mealIngredients.length > 0 && (
                                <View style={styles.ingredientsCompact}>
                                  <Text style={styles.ingredientsLabel}>Ingredients:</Text>
                                  <Text style={styles.ingredientsText} numberOfLines={2}>
                                    {meal.meal.mealIngredients.map((mealIngredient: any) => 
                                      `${mealIngredient.ingredient.name} (${mealIngredient.quantity}${mealIngredient.ingredient.unitType})`
                                    ).join(', ')}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </>
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={styles.noMealsContainer}>
                  <Ionicons name="restaurant-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.noMealsText}>No meals planned for this day</Text>
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
              <View style={styles.planStats}>
                <View style={styles.planStat}>
                  <Text style={styles.planStatValue}>{assignment.nutritionProgram?.weeks?.length || 0}</Text>
                  <Text style={styles.planStatLabel}>Weeks</Text>
                </View>
                <View style={styles.planStat}>
                  <Text style={styles.planStatValue}>{assignment.nutritionProgram?.targetCalories || 0}</Text>
                  <Text style={styles.planStatLabel}>Daily Calories</Text>
                </View>
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
  macroChartsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroChartItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  pieChartContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  pieChart: {
    // SVG styles handled by the component
  },
  pieChartCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieChartPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  macroChartLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  macroChartValue: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
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
  mealCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  mealCardCompleted: {
    opacity: 0.8,
    borderColor: '#D1FAE5',
    backgroundColor: '#F0FDF4',
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  mealCardInfo: {
    flex: 1,
  },
  mealCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  mealCardNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  completionButton: {
    padding: 4,
  },
  mealCardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  mealImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  mealCardImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
  },
  nutritionOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  caloriesText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  mealDetails: {
    gap: 8,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  macroChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  ingredientsCompact: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  ingredientsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  ingredientsText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
  },
  // Cheat Meal Styles
  cheatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  cheatBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 4,
  },
  cheatMealInfo: {
    gap: 8,
  },
  cheatMealImage: {
    width: '100%',
    height: 100,
    borderRadius: 12,
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
  // Week Navigation
  weekNavigation: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  weekTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  weekTabActive: {
    backgroundColor: '#4F46E5',
  },
  weekTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  weekTabTextActive: {
    color: '#ffffff',
  },
  // Day Navigation
  dayNavigation: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dayTabActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  dayTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  dayTabTextActive: {
    color: '#4F46E5',
  },
  // Cheat Meal Styles
  cheatMealContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  cheatMealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  cheatMealBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 4,
  },
  cheatMealImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  cheatMealDescription: {
    fontSize: 14,
    color: '#92400E',
    fontStyle: 'italic',
  },
  // Plan Stats
  planStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  planStat: {
    alignItems: 'center',
  },
  planStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  planStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});


