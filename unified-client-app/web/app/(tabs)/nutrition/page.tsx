'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MealCompletionStorage, TokenStorage } from '@/lib/storage';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function NutritionPage() {
  const router = useRouter();
  const [assignment, setAssignment] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [completedMeals, setCompletedMeals] = useState<Set<string>>(new Set());
  const [selectedMeal, setSelectedMeal] = useState<any>(null);

  const fetchNutrition = useCallback(async () => {
    try {
      setErr('');
      setLoading(true);
      let token = (globalThis as any).ACCESS_TOKEN || await TokenStorage.getAccessToken();
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch client info
      const meRes = await fetch(`${API}/mobile/me`, { headers: { Authorization: `Bearer ${token}` } });
      const meJson = await meRes.json();
      if (meRes.ok) {
        setClient(meJson.client);
        if (meJson.client?.id) {
          const savedCompletions = await MealCompletionStorage.getMealCompletions(meJson.client.id);
          setCompletedMeals(savedCompletions);
          await MealCompletionStorage.cleanupOldCompletions(meJson.client.id);
        }
      }

      // Fetch nutrition plan
      const res = await fetch(`${API}/mobile/nutrition/active`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const json = await res.json();
      if (res.ok) {
        setAssignment(json.assignment);
        
        // Auto-select today's day
        if (json.assignment?.nutritionProgram?.weeks?.[0]?.days) {
          const todayDayOfWeek = new Date().getDay();
          const today = todayDayOfWeek === 0 ? 7 : todayDayOfWeek;
          const todayDayIndex = json.assignment.nutritionProgram.weeks[0].days.findIndex((day: any) => day.dayOfWeek === today);
          if (todayDayIndex !== -1) {
            setSelectedDay(todayDayIndex);
          }
        }
      } else {
        setAssignment(null);
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { 
    fetchNutrition(); 
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

  const isDayCompleted = (day: any, weekIndex: number, dayIndex: number) => {
    if (!day?.meals || day.meals.length === 0) return false;
    return day.meals.every((meal: any) => {
      const mealKey = `${weekIndex}-${dayIndex}-${meal.id}`;
      return completedMeals.has(mealKey);
    });
  };

  const isWeekCompleted = (week: any, weekIndex: number) => {
    if (!week?.days || week.days.length === 0) return false;
    return week.days.every((day: any, dayIndex: number) => 
      isDayCompleted(day, weekIndex, dayIndex)
    );
  };

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const toggleMealCompletion = async (meal: any) => {
    const mealKey = `${selectedWeek}-${selectedDay}-${meal.id}`;
    const newCompletedMeals = new Set(completedMeals);
    
    if (completedMeals.has(mealKey)) {
      newCompletedMeals.delete(mealKey);
    } else {
      newCompletedMeals.add(mealKey);
    }
    
    setCompletedMeals(newCompletedMeals);
    
    if (client?.id) {
      await MealCompletionStorage.saveMealCompletions(client.id, newCompletedMeals);
    }
  };

  const isMealCompleted = (meal: any) => {
    const mealKey = `${selectedWeek}-${selectedDay}-${meal.id}`;
    return completedMeals.has(mealKey);
  };

  const getMealImageUri = (meal: any) => {
    if (meal.meal?.imageUrl) {
      if (meal.meal.imageUrl.startsWith('http')) {
        return meal.meal.imageUrl;
      } else {
        return `${API}${meal.meal.imageUrl}`;
      }
    }
    return 'https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=Meal';
  };

  const calculateMealNutrition = (meal: any) => {
    if (!meal?.meal?.mealIngredients) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
    
    meal.meal.mealIngredients.forEach((mealIngredient: any) => {
      const ingredient = mealIngredient.ingredient;
      const quantity = mealIngredient.quantity || 1;
      const servingSize = ingredient.servingSize || 100;
      
      const multiplier = quantity / servingSize;
      
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading nutrition plan...</p>
        </div>
      </div>
    );
  }

  const isEmpty = !assignment;
  const macroGoals = getMacroGoals();
  const todaysProgress = getTodaysProgress();
  const todaysMeals = getTodaysMeals();
  const currentWeek = getCurrentWeek();
  const currentDay = getCurrentDay();

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 pt-2 pb-1.5">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Nutrition</h1>
        <p className="text-base text-slate-600">
          {assignment?.nutritionProgram?.name || 'Track your daily nutrition'}
        </p>
      </div>

      <div className="px-4 py-2">
        {err ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-600 flex-1">{err}</p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <p className="text-xl font-medium text-slate-900 mb-2">No Nutrition Plan</p>
            <p className="text-base text-slate-600 text-center">
              Your trainer hasn't assigned a nutrition plan yet.{'\n'}
              Check back later or contact your trainer.
            </p>
          </div>
        ) : (
          <>
            {/* Week Navigation */}
            {assignment?.nutritionProgram?.weeks && assignment.nutritionProgram.weeks.length > 0 && (
              <div className="bg-white rounded-xl py-3 mb-4 shadow-sm overflow-x-auto">
                <div className="flex gap-1 px-2" style={{ width: 'max-content', minWidth: '100%' }}>
                  {assignment.nutritionProgram.weeks.map((week: any, index: number) => {
                    const isCompleted = isWeekCompleted(week, index);
                    return (
                      <button
                        key={week.id || index}
                        onClick={() => {
                          setSelectedWeek(index);
                          setSelectedDay(0);
                        }}
                        className={`px-5 py-2 rounded-full whitespace-nowrap transition-colors ${
                          selectedWeek === index
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium">{week.name || `Week ${week.weekNumber}`}</span>
                          {isCompleted && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Day Navigation */}
            {currentWeek?.days && currentWeek.days.length > 0 && (
              <div className="bg-white rounded-xl py-3 mb-4 shadow-sm overflow-x-auto">
                <div className="flex gap-1 px-2" style={{ width: 'max-content', minWidth: '100%' }}>
                  {currentWeek.days.map((day: any, index: number) => {
                    const isCompleted = isDayCompleted(day, selectedWeek, index);
                    return (
                      <button
                        key={day.id || index}
                        onClick={() => setSelectedDay(index)}
                        className={`px-4 py-2 rounded-2xl whitespace-nowrap transition-colors border ${
                          selectedDay === index
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-600'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium">{day.name || `Day ${day.dayOfWeek}`}</span>
                          {isCompleted && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Macro Progress */}
            <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Daily Macro Goals</h2>
              <div className="grid grid-cols-4 gap-4">
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
                    <div key={macro.key} className="flex flex-col items-center">
                      <div className="relative w-14 h-14 mb-3">
                        {/* Background Circle */}
                        <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                        {/* Progress Circle */}
                        {percentage > 0 && (
                          <div 
                            className="absolute inset-0 rounded-full border-4 border-t-transparent border-r-transparent border-b-transparent transition-all"
                            style={{
                              borderTopColor: macro.color,
                              borderRightColor: percentage > 25 ? macro.color : 'transparent',
                              borderBottomColor: percentage > 50 ? macro.color : 'transparent',
                              borderLeftColor: percentage > 75 ? macro.color : 'transparent',
                              transform: `rotate(${-90 + (percentage * 3.6)}deg)`,
                            }}
                          ></div>
                        )}
                        {/* Center Content */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-semibold text-slate-700">{Math.round(percentage)}%</span>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-slate-900 mb-0.5">{macro.label}</span>
                      <span className="text-xs text-slate-500 text-center">
                        {current}/{goal} {macro.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Today's Meals */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {currentDay?.name || "Today's Meals"}
              </h2>
              {todaysMeals.length > 0 ? (
                <div className="space-y-3">
                  {todaysMeals.map((meal: any, index: number) => {
                    const nutrition = calculateMealNutrition(meal);
                    const isCompleted = isMealCompleted(meal);
                    
                    return (
                      <div
                        key={meal.id || index}
                        onClick={() => setSelectedMeal(meal)}
                        className={`bg-white rounded-xl p-3 border cursor-pointer transition-all ${
                          isCompleted
                            ? 'opacity-90 border-green-200'
                            : 'border-slate-200 hover:shadow-md'
                        }`}
                      >
                        {meal.isCheatMeal ? (
                          <div className="flex gap-3">
                            <div className="relative">
                              {meal.cheatImageUrl ? (
                                <img
                                  src={meal.cheatImageUrl.startsWith('http') ? meal.cheatImageUrl : `${API}${meal.cheatImageUrl}`}
                                  alt="Cheat meal"
                                  className="w-20 h-20 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-20 h-20 rounded-lg bg-amber-100 flex items-center justify-center">
                                  <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                  </svg>
                                </div>
                              )}
                              <div className="absolute -top-1 -right-1 bg-amber-100 border border-amber-600 px-1.5 py-0.5 rounded text-[9px] font-bold text-amber-700">
                                CHEAT
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className={`text-base font-semibold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                Cheat Meal
                              </h3>
                              <p className="text-sm text-slate-600 italic">{meal.cheatDescription || 'Enjoy your treat!'}</p>
                              {isCompleted && (
                                <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-lg mt-2 w-fit">
                                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-xs font-semibold text-green-600">Completed</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <img
                              src={getMealImageUri(meal)}
                              alt={meal.meal?.name || 'Meal'}
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <h3 className={`text-base font-semibold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {meal.meal?.name || `${meal.mealType || 'Meal'}`}
                              </h3>
                              {meal.meal?.description && (
                                <p className="text-sm text-slate-600 mb-1">{meal.meal.description}</p>
                              )}
                              <p className="text-xs text-slate-600 mb-2">
                                P: {Math.round(nutrition.protein)}g | C: {Math.round(nutrition.carbs)}g | F: {Math.round(nutrition.fat)}g | {Math.round(nutrition.calories)} cal
                              </p>
                              {meal.meal?.mealIngredients && meal.meal.mealIngredients.length > 0 && (
                                <div className="text-xs text-slate-700 space-y-0.5 mb-2">
                                  {meal.meal.mealIngredients.slice(0, 3).map((mealIngredient: any, idx: number) => (
                                    <div key={idx}>
                                      • {mealIngredient.ingredient.name} ({mealIngredient.quantity}{mealIngredient.ingredient.unitType})
                                    </div>
                                  ))}
                                  {meal.meal.mealIngredients.length > 3 && (
                                    <div className="text-slate-500">+ {meal.meal.mealIngredients.length - 3} more</div>
                                  )}
                                </div>
                              )}
                              {isCompleted && (
                                <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-lg mt-1 w-fit">
                                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-xs font-semibold text-green-600">Completed</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8">
                  <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <p className="text-base text-slate-600">No meals planned for this day</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Meal Details Bottom Sheet */}
      {selectedMeal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black bg-opacity-50" onClick={() => setSelectedMeal(null)}>
          <div className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end p-4 border-b border-slate-200">
              <button
                onClick={() => setSelectedMeal(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5">
              {selectedMeal.isCheatMeal ? (
                <div>
                  <div className="flex justify-center mb-4 relative">
                    {selectedMeal.cheatImageUrl ? (
                      <img
                        src={selectedMeal.cheatImageUrl.startsWith('http') ? selectedMeal.cheatImageUrl : `${API}${selectedMeal.cheatImageUrl}`}
                        alt="Cheat meal"
                        className="w-30 h-30 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="w-30 h-30 rounded-2xl bg-amber-100 flex items-center justify-center">
                        <svg className="w-12 h-12 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-amber-100 border-2 border-amber-600 px-2 py-1 rounded-xl">
                      <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      <span className="text-xs font-bold text-amber-700">CHEAT MEAL</span>
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Cheat Meal</h2>
                  <p className="text-base text-slate-600 text-center italic mb-6">
                    {selectedMeal.cheatDescription || 'Enjoy your treat! No nutritional tracking needed.'}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex justify-center mb-4">
                    <img
                      src={getMealImageUri(selectedMeal)}
                      alt={selectedMeal.meal?.name || 'Meal'}
                      className="w-30 h-30 rounded-2xl object-cover"
                    />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
                    {selectedMeal.meal?.name || `${selectedMeal.mealType || 'Meal'}`}
                  </h2>
                  
                  {selectedMeal.meal?.description && (
                    <p className="text-base text-slate-600 text-center mb-6 leading-6">
                      {selectedMeal.meal.description}
                    </p>
                  )}

                  {/* Nutrition Facts */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Nutrition Facts</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {(() => {
                        const nutrition = calculateMealNutrition(selectedMeal);
                        return [
                          { label: 'Calories', value: Math.round(nutrition.calories), unit: 'kcal', color: '#4F46E5' },
                          { label: 'Protein', value: Math.round(nutrition.protein), unit: 'g', color: '#10B981' },
                          { label: 'Carbs', value: Math.round(nutrition.carbs), unit: 'g', color: '#F59E0B' },
                          { label: 'Fat', value: Math.round(nutrition.fat), unit: 'g', color: '#EF4444' },
                        ].map((macro) => (
                          <div key={macro.label} className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: macro.color }}></div>
                            <span className="text-lg font-bold text-slate-900 mb-1">{macro.value}{macro.unit}</span>
                            <span className="text-xs text-slate-600 text-center">{macro.label}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Ingredients */}
                  {selectedMeal.meal?.mealIngredients && selectedMeal.meal.mealIngredients.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">Ingredients</h3>
                      <div className="space-y-2">
                        {selectedMeal.meal.mealIngredients.map((mealIngredient: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 py-2 border-b border-slate-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                            <span className="flex-1 text-base font-medium text-slate-900">
                              {mealIngredient.ingredient.name}
                            </span>
                            <span className="text-sm text-slate-600 font-medium">
                              {mealIngredient.quantity}{mealIngredient.ingredient.unitType}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Sheet Actions */}
            <div className="p-5 border-t border-slate-200">
              <button
                onClick={() => {
                  toggleMealCompletion(selectedMeal);
                  setSelectedMeal(null);
                }}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-base transition-colors ${
                  isMealCompleted(selectedMeal)
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d={isMealCompleted(selectedMeal) ? "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" : "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"} clipRule="evenodd" />
                </svg>
                <span>{isMealCompleted(selectedMeal) ? 'Mark as Incomplete' : 'Mark as Complete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
