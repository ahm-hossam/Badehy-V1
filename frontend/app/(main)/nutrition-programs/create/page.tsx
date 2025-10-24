'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import { Select } from '@/components/select';
import { Badge } from '@/components/badge';
import { Text } from '@/components/text';
import { Heading } from '@/components/heading';
import { getStoredUser } from '@/lib/auth';
import { 
  PlusIcon, 
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  CloudArrowUpIcon,
  ChartBarIcon,
  FireIcon,
  CalendarIcon,
  ClockIcon,
  ArrowLeftIcon,
  Bars3Icon,
  EllipsisVerticalIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useRouter, useSearchParams } from 'next/navigation';

interface NutritionProgram {
  id?: number;
  name: string;
  description?: string;
  programDuration?: number;
  durationUnit?: string;
  repeatCount?: number;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFats?: number;
  proteinPercentage?: number;
  carbsPercentage?: number;
  fatsPercentage?: number;
  usePercentages?: boolean;
  weeks?: NutritionProgramWeek[];
}

interface NutritionProgramWeek {
  id?: number;
  weekNumber: number;
  name?: string;
  days?: NutritionProgramDay[];
}

interface NutritionProgramDay {
  id?: number;
  dayOfWeek: number;
  name?: string;
  meals?: NutritionProgramMeal[];
}

interface NutritionProgramMeal {
  id?: number;
  mealId: number;
  mealType: string;
  order?: number;
  isCheatMeal?: boolean;
  cheatDescription?: string;
  cheatImageUrl?: string;
  customQuantity?: number;
  customNotes?: string;
  meal?: {
    id: number;
    name: string;
    description?: string;
    category: string;
    imageUrl?: string;
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFats: number;
  };
}

interface Meal {
  id: number;
  name: string;
  description?: string;
  category: string;
  imageUrl?: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  mealIngredients?: Array<{ ingredientId: number; quantity: number; unit: string; ingredient?: any }>;
}

export default function NutritionProgramBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = searchParams.get('id');
  const isEdit = !!programId;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [selectedDay, setSelectedDay] = useState<NutritionProgramDay | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedMealFromDropdown, setSelectedMealFromDropdown] = useState<Meal | null>(null);
  const [isCreatingNewMeal, setIsCreatingNewMeal] = useState(false);
  const [selectedMealsForDay, setSelectedMealsForDay] = useState<Array<{ meal: Meal; mealType: string; customIngredients?: Array<{ ingredientId: number; quantity: number; unit: string }> }>>([]);
  const [editingMealIndex, setEditingMealIndex] = useState<number | null>(null);
  const [mealAddedMessage, setMealAddedMessage] = useState<string | null>(null);
  const [showExistingMealAccordion, setShowExistingMealAccordion] = useState(false);
  const [showNewMealAccordion, setShowNewMealAccordion] = useState(false);
  const [showMealTypeDropdown, setShowMealTypeDropdown] = useState(false);
  const [showSaveMealDropdown, setShowSaveMealDropdown] = useState(false);
  const [newMealForm, setNewMealForm] = useState({
    name: '',
    description: '',
    category: '',
    ingredients: [] as Array<{ ingredientId: number; quantity: number; unit: string }>
  });
  const [availableMeals, setAvailableMeals] = useState<Meal[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<any[]>([]);

  // Program form state
  const [program, setProgram] = useState<NutritionProgram>({
    name: '',
    description: '',
    programDuration: 1,
    durationUnit: 'weeks',
    repeatCount: 1,
    targetCalories: 2000,
    targetProtein: 150,
    targetCarbs: 200,
    targetFats: 80,
    proteinPercentage: 30,
    carbsPercentage: 40,
    fatsPercentage: 30,
    usePercentages: false,
    weeks: []
  });

  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]));
  const [openWeekDropdown, setOpenWeekDropdown] = useState<number | null>(null);
  const [openDayDropdown, setOpenDayDropdown] = useState<{ weekNumber: number; dayOfWeek: number } | null>(null);
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [editingDay, setEditingDay] = useState<{ weekNumber: number; dayOfWeek: number } | null>(null);
  const [tempWeekName, setTempWeekName] = useState<string>('');
  const [tempDayName, setTempDayName] = useState<string>('');

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      if (isEdit) {
        fetchProgram(storedUser.id);
      } else {
        // Create default week with 7 days
        createDefaultWeek();
      }
      fetchAvailableMeals(storedUser.id);
    }
  }, [isEdit, programId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking on the dropdown button or dropdown content
      if (!target.closest('[data-dropdown-trigger]') && !target.closest('[data-dropdown-content]')) {
        setOpenWeekDropdown(null);
        setOpenDayDropdown(null);
        setShowMealTypeDropdown(false);
        setShowSaveMealDropdown(false);
      }
    };

    if (openWeekDropdown !== null || openDayDropdown !== null || showMealTypeDropdown || showSaveMealDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openWeekDropdown, openDayDropdown, showMealTypeDropdown]);

  const fetchProgram = async (trainerId: number) => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/nutrition-programs/${programId}?trainerId=${trainerId}`);
      
      if (response.ok) {
        const data = await response.json();
        setProgram(data);
        // Expand first week by default
        if (data.weeks && data.weeks.length > 0) {
          setExpandedWeeks(new Set([data.weeks[0].weekNumber]));
        }
      } else {
        setError('Failed to fetch program');
      }
    } catch (error) {
      console.error('Error fetching program:', error);
      setError('Failed to fetch program');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMeals = async (trainerId: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/meals?trainerId=${trainerId}`);
      
      if (response.ok) {
        const data = await response.json();
        setAvailableMeals(data.meals || []);
      }
    } catch (error) {
      console.error('Error fetching meals:', error);
    }
  };

  const createDefaultWeek = () => {
    const defaultWeek: NutritionProgramWeek = {
      weekNumber: 1,
      name: 'Week 1',
      days: [
        {
          id: Math.floor(Date.now() * 1000 + Math.random() * 1000), // Unique ID
          dayOfWeek: 1,
          name: 'Day 1',
          meals: []
        }
      ]
    };

    setProgram(prev => ({
      ...prev,
      weeks: [defaultWeek]
    }));
  };

  const addWeek = () => {
    const nextWeekNumber = Math.max(...program.weeks!.map(w => w.weekNumber), 0) + 1;
    const newWeek: NutritionProgramWeek = {
      weekNumber: nextWeekNumber,
      name: `Week ${nextWeekNumber}`,
      days: [
        {
          id: Math.floor(Date.now() * 1000 + Math.random() * 1000), // Unique ID
          dayOfWeek: 1,
          name: 'Day 1',
          meals: []
        }
      ]
    };

    setProgram(prev => ({
      ...prev,
      weeks: [...(prev.weeks || []), newWeek]
    }));

    // Expand the new week
    setExpandedWeeks(prev => new Set([...prev, nextWeekNumber]));
  };

  const duplicateWeek = (weekNumber: number) => {
    const weekToDuplicate = program.weeks!.find(w => w.weekNumber === weekNumber);
    if (!weekToDuplicate) return;

    const nextWeekNumber = Math.max(...program.weeks!.map(w => w.weekNumber), 0) + 1;
    const duplicatedWeek: NutritionProgramWeek = {
      weekNumber: nextWeekNumber,
      name: `Copy of ${weekToDuplicate.name}`,
      days: weekToDuplicate.days!.map(day => ({
        ...day,
        meals: day.meals!.map(meal => ({ ...meal }))
      }))
    };

    setProgram(prev => ({
      ...prev,
      weeks: [...(prev.weeks || []), duplicatedWeek]
    }));

    // Expand the duplicated week
    setExpandedWeeks(prev => new Set([...prev, nextWeekNumber]));
  };

  const removeWeek = (weekNumber: number) => {
    if (program.weeks!.length <= 1) return; // Don't remove the last week

    setProgram(prev => ({
      ...prev,
      weeks: prev.weeks!.filter(w => w.weekNumber !== weekNumber)
    }));

    setExpandedWeeks(prev => {
      const newSet = new Set(prev);
      newSet.delete(weekNumber);
      return newSet;
    });
  };

  // Week name editing functions
  const startEditingWeek = (weekNumber: number, currentName: string) => {
    setEditingWeek(weekNumber);
    setTempWeekName(currentName);
  };

  const saveWeekName = (weekNumber: number) => {
    setProgram(prev => ({
      ...prev,
      weeks: prev.weeks!.map(week =>
        week.weekNumber === weekNumber
          ? { ...week, name: tempWeekName }
          : week
      )
    }));
    setEditingWeek(null);
    setTempWeekName('');
  };

  const cancelEditingWeek = () => {
    setEditingWeek(null);
    setTempWeekName('');
  };

  // Day name editing functions
  const startEditingDay = (weekNumber: number, dayOfWeek: number, currentName: string) => {
    setEditingDay({ weekNumber, dayOfWeek });
    setTempDayName(currentName);
  };

  const saveDayName = (weekNumber: number, dayOfWeek: number) => {
    setProgram(prev => ({
      ...prev,
      weeks: prev.weeks!.map(week =>
        week.weekNumber === weekNumber
          ? {
              ...week,
              days: week.days!.map(day =>
                day.dayOfWeek === dayOfWeek
                  ? { ...day, name: tempDayName }
                  : day
              )
            }
          : week
      )
    }));
    setEditingDay(null);
    setTempDayName('');
  };

  const cancelEditingDay = () => {
    setEditingDay(null);
    setTempDayName('');
  };

  const toggleWeekExpansion = (weekNumber: number) => {
    setExpandedWeeks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(weekNumber)) {
        newSet.delete(weekNumber);
      } else {
        newSet.add(weekNumber);
      }
      return newSet;
    });
  };

  const openMealSelector = (weekId: number, dayId: number, dayOfWeek: number) => {
    // Find the actual day object
    const week = program.weeks!.find(w => w.weekNumber === weekId);
    const day = week?.days?.find(d => d.id === dayId);
    setSelectedDay(day || null);
    setShowSidePanel(true);
  };

  const addMealToDay = (meal: Meal, mealType: string) => {
    // Recalculate nutritional values based on current ingredient quantities
    const recalculatedMeal = {
      ...meal,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0
    };

    if (meal.mealIngredients) {
      meal.mealIngredients.forEach((ingredient: any) => {
        const ing = ingredient.ingredient;
        if (ing) {
          const caloriesPerUnit = ing.caloriesAfter || ing.caloriesBefore || 0;
          const proteinPerUnit = ing.proteinAfter || ing.proteinBefore || 0;
          const carbsPerUnit = ing.carbsAfter || ing.carbsBefore || 0;
          const fatsPerUnit = ing.fatsAfter || ing.fatsBefore || 0;
          const servingSize = ing.servingSize || 1;
          
          const multiplier = ingredient.quantity / servingSize;
          
          recalculatedMeal.totalCalories += caloriesPerUnit * multiplier;
          recalculatedMeal.totalProtein += proteinPerUnit * multiplier;
          recalculatedMeal.totalCarbs += carbsPerUnit * multiplier;
          recalculatedMeal.totalFats += fatsPerUnit * multiplier;
        }
      });
    }

    const newMealEntry = {
      meal: recalculatedMeal,
      mealType,
      customIngredients: meal.mealIngredients?.map((mi: any) => ({
        ingredientId: mi.ingredientId,
        quantity: mi.quantity,
        unit: mi.unit
      })) || []
    };
    
    setSelectedMealsForDay(prev => [...prev, newMealEntry]);
    setSelectedMealFromDropdown(null);
    // Show success message
    setMealAddedMessage(`${recalculatedMeal.name} added to day!`);
    setTimeout(() => setMealAddedMessage(null), 2000);
    // Don't close the side panel - let trainer add more meals
  };

  const removeMealFromList = (index: number) => {
    setSelectedMealsForDay(prev => prev.filter((_, i) => i !== index));
  };

  const editMealInList = (index: number) => {
    const mealEntry = selectedMealsForDay[index];
    setSelectedMealFromDropdown(mealEntry.meal);
    setEditingMealIndex(index);
    setShowExistingMealAccordion(true);
    setShowNewMealAccordion(false);
  };

  const updateMealIngredient = (mealIndex: number, ingredientIndex: number, field: string, value: any) => {
    setSelectedMealsForDay(prev => prev.map((mealEntry, i) => 
      i === mealIndex 
        ? {
            ...mealEntry,
            customIngredients: mealEntry.customIngredients?.map((ing, j) => 
              j === ingredientIndex ? { ...ing, [field]: value } : ing
            ) || []
          }
        : mealEntry
    ));
  };

  const saveMealsToDay = () => {
    if (!selectedDay) return;

    const newMeals: NutritionProgramMeal[] = selectedMealsForDay.map((mealEntry, index) => ({
      mealId: mealEntry.meal.id,
      mealType: mealEntry.mealType,
      order: index,
      customQuantity: 1,
      meal: mealEntry.meal
    }));

    setProgram(prev => ({
      ...prev,
      weeks: prev.weeks!.map(week => 
        week.days?.some(d => d.id === selectedDay.id)
          ? {
              ...week,
              days: week.days!.map(day =>
                day.id === selectedDay.id
                  ? {
                      ...day,
                      meals: [...(day.meals || []), ...newMeals]
                    }
                  : day
              )
            }
          : week
      )
    }));

    // Reset states
    setSelectedMealsForDay([]);
    setSelectedMealFromDropdown(null);
    setIsCreatingNewMeal(false);
    setShowSidePanel(false);
    setSelectedDay(null);
  };

  const cancelMealSelection = () => {
    setSelectedMealsForDay([]);
    setSelectedMealFromDropdown(null);
    setIsCreatingNewMeal(false);
    setMealAddedMessage(null);
    setShowSidePanel(false);
    setSelectedDay(null);
  };

  const removeMealFromDay = (weekNumber: number, dayOfWeek: number, mealIndex: number) => {
    setProgram(prev => ({
      ...prev,
      weeks: prev.weeks!.map(week =>
        week.weekNumber === weekNumber
          ? {
              ...week,
              days: week.days!.map(day =>
                day.dayOfWeek === dayOfWeek
                  ? {
                      ...day,
                      meals: day.meals!.filter((_, index) => index !== mealIndex)
                    }
                  : day
              )
            }
          : week
      )
    }));
  };

  const duplicateDay = (weekNumber: number, dayOfWeek: number) => {
    // Find the day to duplicate
    const week = program.weeks!.find(w => w.weekNumber === weekNumber);
    const dayToDuplicate = week?.days?.find(d => d.dayOfWeek === dayOfWeek);
    
    if (!dayToDuplicate) return;

    // Find the next available day of week (or use the same if it's empty)
    const nextDayOfWeek = dayOfWeek === 7 ? 1 : dayOfWeek + 1;
    
    // Create duplicated day with unique ID
    const duplicatedDay: NutritionProgramDay = {
      id: Math.floor(Date.now() * 1000 + Math.random() * 1000), // Unique ID
      dayOfWeek: nextDayOfWeek,
      name: `Copy of ${dayToDuplicate.name}`,
      meals: dayToDuplicate.meals!.map(meal => ({ ...meal }))
    };

    setProgram(prev => ({
      ...prev,
      weeks: prev.weeks!.map(week =>
        week.weekNumber === weekNumber
          ? {
              ...week,
              days: [...(week.days || []), duplicatedDay]
            }
          : week
      )
    }));
  };

  const editMeal = (meal: NutritionProgramMeal) => {
    // Set the selected meal for editing and open the side panel
    if (meal.meal) {
      setSelectedMeal(meal.meal);
      setShowSidePanel(true);
    }
  };

  const addDay = (weekNumber: number) => {
    const week = program.weeks!.find(w => w.weekNumber === weekNumber);
    if (!week) return;

    // Find the next available day number
    const nextDayNumber = Math.max(...(week.days || []).map(d => d.dayOfWeek), 0) + 1;
    
    const newDay: NutritionProgramDay = {
      id: Math.floor(Date.now() * 1000 + Math.random() * 1000), // Unique ID
      dayOfWeek: nextDayNumber,
      name: `Day ${nextDayNumber}`,
      meals: []
    };

    setProgram(prev => ({
      ...prev,
      weeks: prev.weeks!.map(week =>
        week.weekNumber === weekNumber
          ? {
              ...week,
              days: [...(week.days || []), newDay]
            }
          : week
      )
    }));
  };

  const removeDay = (weekNumber: number, dayOfWeek: number) => {
    setProgram(prev => ({
      ...prev,
      weeks: prev.weeks!.map(week =>
        week.weekNumber === weekNumber
          ? {
              ...week,
              days: (week.days || []).filter(day => day.dayOfWeek !== dayOfWeek)
            }
          : week
      )
    }));
  };

  const calculateDailyNutrition = (day: NutritionProgramDay) => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fats = 0;

    day.meals?.forEach(meal => {
      const quantity = meal.customQuantity || 1;
      calories += (meal.meal?.totalCalories || 0) * quantity;
      protein += (meal.meal?.totalProtein || 0) * quantity;
      carbs += (meal.meal?.totalCarbs || 0) * quantity;
      fats += (meal.meal?.totalFats || 0) * quantity;
    });

    return { calories: Math.round(calories), protein: Math.round(protein), carbs: Math.round(carbs), fats: Math.round(fats) };
  };

  const calculateProgress = (day: NutritionProgramDay) => {
    const nutrition = calculateDailyNutrition(day);
    const targetCalories = program.targetCalories || 0;
    
    if (targetCalories === 0) return 0;
    return Math.min(100, Math.round((nutrition.calories / targetCalories) * 100));
  };

  // Calculate macro targets based on percentages or direct grams
  const getMacroTargets = () => {
    const targetCalories = program.targetCalories || 0;
    
    if (program.usePercentages) {
      // Calculate grams from percentages
      // Protein: 4 cal/g, Carbs: 4 cal/g, Fats: 9 cal/g
      const proteinCalories = (program.proteinPercentage || 0) / 100 * targetCalories;
      const carbsCalories = (program.carbsPercentage || 0) / 100 * targetCalories;
      const fatsCalories = (program.fatsPercentage || 0) / 100 * targetCalories;
      
      return {
        protein: Math.round(proteinCalories / 4), // 4 cal/g
        carbs: Math.round(carbsCalories / 4),    // 4 cal/g
        fats: Math.round(fatsCalories / 9)        // 9 cal/g
      };
    } else {
      // Use direct gram values
      return {
        protein: program.targetProtein || 0,
        carbs: program.targetCarbs || 0,
        fats: program.targetFats || 0
      };
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      const url = isEdit 
        ? `${apiUrl}/api/nutrition-programs/${programId}`
        : `${apiUrl}/api/nutrition-programs`;
      
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...program,
          trainerId: user.id,
        }),
      });

      if (response.ok) {
        router.push('/nutrition-programs');
      } else {
        setError('Failed to save program');
      }
    } catch (error) {
      console.error('Error saving program:', error);
      setError('Failed to save program');
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayOfWeek - 1];
  };

  const getMealTypeColor = (mealType: string) => {
    const colors = {
      'Breakfast': 'bg-yellow-100 text-yellow-800',
      'Lunch': 'bg-green-100 text-green-800',
      'Dinner': 'bg-blue-100 text-blue-800',
      'Snack': 'bg-purple-100 text-purple-800',
    };
    return colors[mealType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading program...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/nutrition-programs')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to nutrition programs"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <Heading level={1}>
              {isEdit ? 'Edit Nutrition Program' : 'Create Nutrition Program'}
            </Heading>
            <Text className="text-gray-600 mt-1">
              Build a comprehensive nutrition program with week-based meal planning
            </Text>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <Text className="text-red-800">{error}</Text>
        </div>
      )}

      {/* Program Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <Heading level={3} className="mb-4">Program Settings</Heading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Program Name *
            </label>
            <Input
              value={program.name}
              onChange={(e) => setProgram(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter program name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (weeks)
            </label>
            <Input
              type="number"
              value={program.programDuration || 1}
              onChange={(e) => setProgram(prev => ({ ...prev, programDuration: parseInt(e.target.value) || 1 }))}
              min="1"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              value={program.description || ''}
              onChange={(e) => setProgram(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter program description"
              rows={3}
            />
          </div>
        </div>

        {/* Goal Settings */}
        <div className="mt-6 pt-6 border-t">
          <Heading level={4} className="mb-4">Nutrition Goals</Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Calories
              </label>
              <Input
                type="number"
                value={program.targetCalories || ''}
                onChange={(e) => setProgram(prev => ({ ...prev, targetCalories: parseInt(e.target.value) || 0 }))}
                placeholder="2000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Protein ({program.usePercentages ? '%' : 'g'})
              </label>
              <Input
                type="number"
                value={program.usePercentages ? (program.proteinPercentage || '') : (program.targetProtein || '')}
                onChange={(e) => setProgram(prev => ({ 
                  ...prev, 
                  [program.usePercentages ? 'proteinPercentage' : 'targetProtein']: parseInt(e.target.value) || 0 
                }))}
                placeholder={program.usePercentages ? "30" : "150"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Carbs ({program.usePercentages ? '%' : 'g'})
              </label>
              <Input
                type="number"
                value={program.usePercentages ? (program.carbsPercentage || '') : (program.targetCarbs || '')}
                onChange={(e) => setProgram(prev => ({ 
                  ...prev, 
                  [program.usePercentages ? 'carbsPercentage' : 'targetCarbs']: parseInt(e.target.value) || 0 
                }))}
                placeholder={program.usePercentages ? "40" : "200"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fats ({program.usePercentages ? '%' : 'g'})
              </label>
              <Input
                type="number"
                value={program.usePercentages ? (program.fatsPercentage || '') : (program.targetFats || '')}
                onChange={(e) => setProgram(prev => ({ 
                  ...prev, 
                  [program.usePercentages ? 'fatsPercentage' : 'targetFats']: parseInt(e.target.value) || 0 
                }))}
                placeholder={program.usePercentages ? "30" : "80"}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={program.usePercentages || false}
                onChange={(e) => setProgram(prev => ({ ...prev, usePercentages: e.target.checked }))}
                className="mr-2"
              />
              <Text className="text-sm">Use percentages instead of grams</Text>
            </label>
          </div>
        </div>
      </div>

      {/* Weeks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Heading level={3}>Program Weeks</Heading>
          <Button
            onClick={addWeek}
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Week
          </Button>
        </div>

        {program.weeks?.map((week) => (
          <div key={week.weekNumber} className="bg-white border border-gray-200 rounded-lg">
            {/* Week Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleWeekExpansion(week.weekNumber)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {expandedWeeks.has(week.weekNumber) ? (
                    <ChevronDownIcon className="w-5 h-5" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5" />
                  )}
                </button>
                <div className="flex items-center gap-2">
                  {editingWeek === week.weekNumber ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={tempWeekName}
                        onChange={(e) => setTempWeekName(e.target.value)}
                        className="text-sm font-medium"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveWeekName(week.weekNumber);
                          } else if (e.key === 'Escape') {
                            cancelEditingWeek();
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => saveWeekName(week.weekNumber)}
                        className="text-green-600 hover:text-green-800"
                        title="Save"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEditingWeek}
                        className="text-gray-400 hover:text-gray-600"
                        title="Cancel"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Heading level={4} className="text-gray-900">
                        {week.name || `Week ${week.weekNumber}`}
                      </Heading>
                      <button
                        onClick={() => startEditingWeek(week.weekNumber, week.name || `Week ${week.weekNumber}`)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Edit week name"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="relative">
                  <button
                    onClick={() => setOpenWeekDropdown(openWeekDropdown === week.weekNumber ? null : week.weekNumber)}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                    title="More actions"
                    data-dropdown-trigger
                  >
                    <EllipsisVerticalIcon className="w-4 h-4" />
                  </button>
                  
                  {openWeekDropdown === week.weekNumber && (
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[160px]" data-dropdown-content>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            addDay(week.weekNumber);
                            setOpenWeekDropdown(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Add day
                        </button>
                        <button
                          onClick={() => {
                            duplicateWeek(week.weekNumber);
                            setOpenWeekDropdown(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Duplicate Week
                        </button>
                        {program.weeks!.length > 1 && (
                          <button
                            onClick={() => {
                              removeWeek(week.weekNumber);
                              setOpenWeekDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Remove week
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Week Content */}
            {expandedWeeks.has(week.weekNumber) && (
              <div className="p-4">
                {week.days && week.days.length > 0 ? (
                  <div className="space-y-4">
                    {week.days.map((day) => {
                      const progress = calculateProgress(day);
                      const nutrition = calculateDailyNutrition(day);
                      
                      return (
                        <div key={day.id || day.dayOfWeek} className="bg-white border border-gray-200 rounded-lg">
                          {/* Day Header */}
                          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {editingDay?.weekNumber === week.weekNumber && editingDay?.dayOfWeek === day.dayOfWeek ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={tempDayName}
                                      onChange={(e) => setTempDayName(e.target.value)}
                                      className="text-sm font-medium"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          saveDayName(week.weekNumber, day.dayOfWeek);
                                        } else if (e.key === 'Escape') {
                                          cancelEditingDay();
                                        }
                                      }}
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => saveDayName(week.weekNumber, day.dayOfWeek)}
                                      className="text-green-600 hover:text-green-800"
                                      title="Save"
                                    >
                                      <CheckIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={cancelEditingDay}
                                      className="text-gray-400 hover:text-gray-600"
                                      title="Cancel"
                                    >
                                      <XMarkIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <Heading level={5} className="text-gray-900">
                                      {day.name}
                                    </Heading>
                                    <button
                                      onClick={() => startEditingDay(week.weekNumber, day.dayOfWeek, day.name || '')}
                                      className="text-gray-400 hover:text-gray-600"
                                      title="Edit day name"
                                    >
                                      <PencilIcon className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {/* Nutrition Progress Circles in Header */}
                            <div className="flex items-center gap-6">
                              {/* Calories Progress */}
                              {program.targetCalories && (
                                <div className="text-center">
                                  <div className="relative w-12 h-12">
                                    <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                                      <path
                                        className="text-gray-200"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      />
                                      <path
                                        className="text-blue-600"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        fill="none"
                                        strokeDasharray={`${Math.min(100, (nutrition.calories / program.targetCalories) * 100)}, 100`}
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                      />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <Text className="text-xs font-bold text-blue-900">
                                        {Math.round((nutrition.calories / program.targetCalories) * 100)}%
                                      </Text>
                                    </div>
                                  </div>
                                  <Text className="text-xs text-blue-700 font-medium">Cal</Text>
                                </div>
                              )}

                              {/* Protein Progress */}
                              {(() => {
                                const targets = getMacroTargets();
                                return targets.protein > 0 && (
                                  <div className="text-center">
                                    <div className="relative w-12 h-12">
                                      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                                        <path
                                          className="text-gray-200"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                          fill="none"
                                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                          className="text-green-600"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                          fill="none"
                                          strokeDasharray={`${Math.min(100, (nutrition.protein / targets.protein) * 100)}, 100`}
                                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                      </svg>
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <Text className="text-xs font-bold text-green-900">
                                          {Math.round((nutrition.protein / targets.protein) * 100)}%
                                        </Text>
                                      </div>
                                    </div>
                                    <Text className="text-xs text-green-700 font-medium">Pro</Text>
                                  </div>
                                );
                              })()}

                              {/* Carbs Progress */}
                              {(() => {
                                const targets = getMacroTargets();
                                return targets.carbs > 0 && (
                                  <div className="text-center">
                                    <div className="relative w-12 h-12">
                                      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                                        <path
                                          className="text-gray-200"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                          fill="none"
                                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                          className="text-yellow-600"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                          fill="none"
                                          strokeDasharray={`${Math.min(100, (nutrition.carbs / targets.carbs) * 100)}, 100`}
                                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                      </svg>
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <Text className="text-xs font-bold text-yellow-900">
                                          {Math.round((nutrition.carbs / targets.carbs) * 100)}%
                                        </Text>
                                      </div>
                                    </div>
                                    <Text className="text-xs text-yellow-700 font-medium">Carb</Text>
                                  </div>
                                );
                              })()}

                              {/* Fats Progress */}
                              {(() => {
                                const targets = getMacroTargets();
                                return targets.fats > 0 && (
                                  <div className="text-center">
                                    <div className="relative w-12 h-12">
                                      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                                        <path
                                          className="text-gray-200"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                          fill="none"
                                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                          className="text-red-600"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                          fill="none"
                                          strokeDasharray={`${Math.min(100, (nutrition.fats / targets.fats) * 100)}, 100`}
                                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                      </svg>
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <Text className="text-xs font-bold text-red-900">
                                          {Math.round((nutrition.fats / targets.fats) * 100)}%
                                        </Text>
                                      </div>
                                    </div>
                                    <Text className="text-xs text-red-700 font-medium">Fat</Text>
                                  </div>
                                );
                              })()}
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <div className="relative">
                                <button
                                  onClick={() => setOpenDayDropdown(openDayDropdown?.weekNumber === week.weekNumber && openDayDropdown?.dayOfWeek === day.dayOfWeek ? null : { weekNumber: week.weekNumber, dayOfWeek: day.dayOfWeek })}
                                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                                  title="More actions"
                                  data-dropdown-trigger
                                >
                                  <EllipsisVerticalIcon className="w-4 h-4" />
                                </button>
                                
                                {openDayDropdown?.weekNumber === week.weekNumber && openDayDropdown?.dayOfWeek === day.dayOfWeek && (
                                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[160px]" data-dropdown-content>
                                    <div className="py-1">
                                      <button
                                        onClick={() => {
                                          const weekObj = program.weeks!.find(w => w.weekNumber === week.weekNumber);
                                          const dayObj = weekObj?.days?.find((d: any) => d.id === day.id);
                                          setSelectedDay(dayObj || null);
                                          setShowSidePanel(true);
                                          setOpenDayDropdown(null);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                      >
                                        Add meal
                                      </button>
                                      <button
                                        onClick={() => {
                                          duplicateDay(week.weekNumber, day.dayOfWeek);
                                          setOpenDayDropdown(null);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                      >
                                        Duplicate day
                                      </button>
                                      {week.days!.length > 1 && (
                                        <button
                                          onClick={() => {
                                            removeDay(week.weekNumber, day.dayOfWeek);
                                            setOpenDayDropdown(null);
                                          }}
                                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                          Remove day
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Day Content */}
                          <div className="p-4">
                            {day.meals && day.meals.length > 0 ? (
                              <div className="space-y-3">
                                {day.meals.map((meal, index) => (
                                  <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center gap-3">
                                      {meal.meal?.imageUrl && (
                                        <img
                                          src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${meal.meal.imageUrl}`}
                                          alt={meal.meal.name}
                                          className="w-10 h-10 rounded-lg object-cover"
                                        />
                                      )}
                                      <div className="flex-1">
                                        <Text className="font-medium text-gray-900">{meal.meal?.name}</Text>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge className={`text-xs ${getMealTypeColor(meal.mealType)}`}>
                                            {meal.mealType}
                                          </Badge>
                                          <Text className="text-xs text-gray-500">
                                            {meal.meal?.totalCalories} cal
                                          </Text>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => editMeal(meal)}
                                        className="text-gray-600 hover:text-gray-800"
                                        title="Edit Meal"
                                      >
                                        <PencilIcon className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => removeMealFromDay(week.weekNumber, day.dayOfWeek, index)}
                                        className="text-red-500 hover:text-red-700"
                                        title="Remove Meal"
                                      >
                                        <TrashIcon className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-12 text-gray-500">
                                <Text className="text-sm">No meals yet.</Text>
                                <Text className="text-sm">Click "Add Meal" to get started</Text>
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })}
                    
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <Text className="text-lg font-medium mb-2">No days added yet</Text>
                    <Text className="text-sm mb-4">Add days to start building your nutrition program</Text>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Meal Selection Side Panel */}
      {showSidePanel && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed top-0 left-0 right-0 bg-black/50 z-40 transition-opacity duration-300"
            style={{ height: '100vh' }}
            onClick={() => {
              setShowSidePanel(false);
              setSelectedMeal(null);
            }}
          />
          
          {/* Side Panel */}
          <div className="fixed top-0 right-0 w-[800px] bg-white shadow-xl z-50 flex flex-col transition-transform duration-300 ease-out" style={{ height: '100vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
              <h3 className="text-lg font-semibold text-zinc-900">
                {selectedMeal ? 'Edit Meal' : 'Select Meal'}
              </h3>
              <button
                onClick={() => {
                  setShowSidePanel(false);
                  setSelectedMeal(null);
                }}
                className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Success Message */}
              {mealAddedMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-green-700">{mealAddedMessage}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                {/* Action Button */}
                <div className="relative flex justify-end">
                  <button
                    onClick={() => setShowMealTypeDropdown(!showMealTypeDropdown)}
                    data-dropdown-trigger
                    className="border-2 border-dashed border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-400 font-normal px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Meal
                    <ChevronDownIcon className="w-4 h-4 ml-2" />
                  </button>
                  
                  {showMealTypeDropdown && (
                    <div 
                      data-dropdown-content
                      className="absolute top-full right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 min-w-[200px]"
                    >
                      <button
                        onClick={() => {
                          setShowExistingMealAccordion(true);
                          setShowNewMealAccordion(false);
                          setShowMealTypeDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 border-b border-zinc-100"
                      >
                        <PlusIcon className="w-3 h-3" />
                        Add Existing Meal
                      </button>
                      <button
                        onClick={async () => {
                          setShowNewMealAccordion(true);
                          setShowExistingMealAccordion(false);
                          setShowMealTypeDropdown(false);
                          
                          // Fetch available ingredients
                          try {
                            console.log('Fetching ingredients for trainerId:', user.id);
                          console.log('User object:', user);
                            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/ingredients?trainerId=${user.id}`);
                            console.log('Ingredients response:', response);
                            if (response.ok) {
                              const data = await response.json();
                              console.log('Ingredients data:', data);
                              setAvailableIngredients(data.ingredients || []);
                              console.log('Set availableIngredients to:', data.ingredients || []);
                            } else {
                              console.error('Failed to fetch ingredients:', response.status, response.statusText);
                            }
                          } catch (error) {
                            console.error('Failed to fetch ingredients:', error);
                          }
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                      >
                        <PlusIcon className="w-3 h-3" />
                        Create New Meal
                      </button>
                    </div>
                  )}
                </div>

                {/* Add Existing Meal Accordion */}
                {showExistingMealAccordion && (
                  <div className="border border-zinc-200 rounded-xl bg-white shadow-sm">
                    <div className="p-6">
                      <div className="space-y-6">
                        <div>
                          <Text className="text-sm font-medium text-zinc-900 mb-3">Select Existing Meal</Text>
                          <Select 
                            value={selectedMealFromDropdown?.id || ''}
                            onChange={(e) => {
                              const mealId = parseInt(e.target.value);
                              const meal = availableMeals.find(m => m.id === mealId);
                              setSelectedMealFromDropdown(meal || null);
                            }}
                            className="w-full"
                          >
                            <option value="">Choose a meal from your library...</option>
                            {availableMeals.map((meal) => (
                              <option key={meal.id} value={meal.id}>{meal.name}</option>
                            ))}
                          </Select>
                        </div>
                        
                        {selectedMealFromDropdown && (
                          <div className="border border-zinc-100 rounded-lg p-4 bg-zinc-50/50">
                            <div className="flex items-start gap-4 mb-4">
                              {selectedMealFromDropdown.imageUrl && (
                                <img
                                  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${selectedMealFromDropdown.imageUrl}`}
                                  alt={selectedMealFromDropdown.name}
                                  className="w-14 h-14 rounded-lg object-cover border border-zinc-200"
                                />
                              )}
                              <div className="flex-1">
                                <Text className="text-base font-semibold text-zinc-900">{selectedMealFromDropdown.name}</Text>
                                <Text className="text-sm text-zinc-500 mt-1">{selectedMealFromDropdown.description}</Text>
                                <div className="flex items-center gap-3 mt-2">
                                  <Badge className="text-xs bg-zinc-100 text-zinc-700">
                                    {Math.round(selectedMealFromDropdown.totalCalories || 0)} cal
                                  </Badge>
                                  <Badge className="text-xs bg-zinc-100 text-zinc-700">
                                    {Math.round(selectedMealFromDropdown.totalProtein || 0)}gP
                                  </Badge>
                                  <Badge className="text-xs bg-zinc-100 text-zinc-700">
                                    {Math.round(selectedMealFromDropdown.totalCarbs || 0)}gC
                                  </Badge>
                                  <Badge className="text-xs bg-zinc-100 text-zinc-700">
                                    {Math.round(selectedMealFromDropdown.totalFats || 0)}gF
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            {/* Ingredients */}
                            {selectedMealFromDropdown.mealIngredients && selectedMealFromDropdown.mealIngredients.length > 0 && (
                              <div>
                                <Text className="text-sm font-medium text-zinc-700 mb-3">Adjust Ingredients</Text>
                                <div className="space-y-2">
                                  {selectedMealFromDropdown.mealIngredients.map((ingredient: any, index: number) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-zinc-100">
                                      <div className="flex-1">
                                        <Text className="text-sm font-medium text-zinc-900">
                                          {ingredient.ingredient?.name || 'Unknown Ingredient'}
                                        </Text>
                                        <Text className="text-xs text-zinc-500">
                                          {ingredient.ingredient?.category || 'Unknown'}
                                        </Text>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          value={ingredient.quantity}
                                          onChange={(e) => {
                                            const newQuantity = parseFloat(e.target.value) || 0;
                                            setSelectedMealFromDropdown(prev => {
                                              if (!prev) return prev;
                                              return {
                                                ...prev,
                                                mealIngredients: prev.mealIngredients?.map((ing, idx) => 
                                                  idx === index ? { ...ing, quantity: newQuantity } : ing
                                                ) || []
                                              };
                                            });
                                          }}
                                          className="w-20 text-sm text-center"
                                          min="0"
                                          step="0.1"
                                        />
                                        <Text className="text-xs text-zinc-500 w-12">
                                          {ingredient.unit}
                                        </Text>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-200 bg-zinc-50/50">
                      <button
                        onClick={() => {
                          setSelectedMealFromDropdown(null);
                          setEditingMealIndex(null);
                          setShowExistingMealAccordion(false);
                        }}
                        className="bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <Button
                        onClick={() => {
                          if (selectedMealFromDropdown) {
                            if (editingMealIndex !== null) {
                              // Update existing meal
                              setSelectedMealsForDay(prev => prev.map((mealEntry, i) => 
                                i === editingMealIndex 
                                  ? { ...mealEntry, meal: selectedMealFromDropdown }
                                  : mealEntry
                              ));
                              setEditingMealIndex(null);
                            } else {
                              // Add new meal
                              addMealToDay(selectedMealFromDropdown, selectedMealFromDropdown.category || 'Meal');
                            }
                            setSelectedMealFromDropdown(null);
                            setShowExistingMealAccordion(false);
                          }
                        }}
                        disabled={!selectedMealFromDropdown}
                      >
                        {editingMealIndex !== null ? 'Update Meal' : 'Add to Day'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Create New Meal Accordion */}
                {showNewMealAccordion && (
                  <div className="border border-zinc-200 rounded-xl bg-white shadow-sm">
                    <div className="p-6">
                      <div className="space-y-6">
                        <div>
                          <Text className="text-sm font-medium text-zinc-900 mb-3">Meal Details</Text>
                          <div className="space-y-4">
                            <div>
                              <Text className="text-xs font-medium text-zinc-700 mb-2">Meal Name</Text>
                              <Input
                                value={newMealForm.name}
                                onChange={(e) => setNewMealForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter meal name"
                                className="w-full"
                              />
                            </div>
                            
                            <div>
                              <Text className="text-xs font-medium text-zinc-700 mb-2">Description</Text>
                              <Textarea
                                value={newMealForm.description}
                                onChange={(e) => setNewMealForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Enter meal description"
                                rows={3}
                                className="w-full"
                              />
                            </div>
                            
                            <div>
                              <Text className="text-xs font-medium text-zinc-700 mb-2">Category</Text>
                              <Select
                                value={newMealForm.category}
                                onChange={(e) => setNewMealForm(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full"
                              >
                                <option value="">Select category</option>
                                <option value="Breakfast">Breakfast</option>
                                <option value="Lunch">Lunch</option>
                                <option value="Dinner">Dinner</option>
                                <option value="Snack">Snack</option>
                              </Select>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center justify-between">
                              <Text className="text-sm font-medium text-zinc-900">Ingredients</Text>
                              <Text className="text-xs text-zinc-500">({availableIngredients.length} available)</Text>
                            </div>
                            <button
                              onClick={() => {
                                setNewMealForm(prev => ({
                                  ...prev,
                                  ingredients: [...prev.ingredients, { ingredientId: 0, quantity: 0, unit: 'g', ingredientName: '' }]
                                }));
                              }}
                              className="text-xs px-3 py-1 h-8 bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 rounded-lg font-bold transition-colors flex items-center gap-1"
                            >
                              <PlusIcon className="w-3 h-3" />
                              Add Ingredient
                            </button>
                          </div>
                          
                          <div className="space-y-2">
                            {newMealForm.ingredients.map((ingredient, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 border border-zinc-100 rounded-lg bg-zinc-50/50">
                                <Select
                                  value={ingredient.ingredientId}
                                  onChange={(e) => {
                                    const ingredientId = parseInt(e.target.value);
                                    const selectedIngredient = availableIngredients.find(ing => ing.id === ingredientId);
                                    setNewMealForm(prev => ({
                                      ...prev,
                                      ingredients: prev.ingredients.map((ing, i) => 
                                        i === index ? { 
                                          ...ing, 
                                          ingredientId, 
                                          unit: selectedIngredient?.unitType || 'g',
                                          ingredientName: selectedIngredient?.name || ''
                                        } : ing
                                      )
                                    }));
                                  }}
                                  className="w-64"
                                >
                                  <option value="">Select ingredient</option>
                                  {availableIngredients.length > 0 ? (
                                    availableIngredients.map((ing) => (
                                      <option key={ing.id} value={ing.id}>{ing.name}</option>
                                    ))
                                  ) : (
                                    <option value="" disabled>Loading ingredients...</option>
                                  )}
                                </Select>
                                <Input
                                  type="number"
                                  value={ingredient.quantity}
                                  onChange={(e) => {
                                    const quantity = parseFloat(e.target.value) || 0;
                                    setNewMealForm(prev => ({
                                      ...prev,
                                      ingredients: prev.ingredients.map((ing, i) => 
                                        i === index ? { ...ing, quantity } : ing
                                      )
                                    }));
                                  }}
                                  placeholder="Amount"
                                  className="w-24"
                                  min="0"
                                  step="0.1"
                                />
                                <div className="w-20 px-3 py-2 border border-zinc-300 rounded-md bg-zinc-50 text-sm text-zinc-700 text-center">
                                  {ingredient.unit || '-'}
                                </div>
                                <button
                                  onClick={() => {
                                    setNewMealForm(prev => ({
                                      ...prev,
                                      ingredients: prev.ingredients.filter((_, i) => i !== index)
                                    }));
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1 rounded"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            
                            {newMealForm.ingredients.length === 0 && (
                              <div className="text-center py-8 text-zinc-400">
                                <PlusIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <Text className="text-sm">No ingredients added yet</Text>
                                <Text className="text-xs">Click "Add Ingredient" to get started</Text>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-200 bg-zinc-50/50">
                      <button
                        onClick={() => {
                          setNewMealForm({
                            name: '',
                            description: '',
                            category: '',
                            ingredients: []
                          });
                          setShowNewMealAccordion(false);
                        }}
                        className="bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <div className="relative" data-dropdown-trigger>
                        <Button
                          onClick={() => setShowSaveMealDropdown(!showSaveMealDropdown)}
                          disabled={!newMealForm.name || !newMealForm.category || newMealForm.ingredients.length === 0}
                          className="text-xs px-3 py-1 h-8 flex items-center gap-2"
                        >
                          Save Meal
                          <ChevronDownIcon className="w-3 h-3" />
                        </Button>
                        
                        {/* Dropdown Menu */}
                        {showSaveMealDropdown && (
                          <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-zinc-200 rounded-lg shadow-lg z-10" data-dropdown-content>
                          <button
                            onClick={async () => {
                              // Save to meals list AND add to day
                              try {
                                console.log('Saving meal to global list and adding to day:', newMealForm);
                                
                                // First, save the meal to the global meals list
                                const mealData = {
                                  name: newMealForm.name,
                                  description: newMealForm.description,
                                  category: newMealForm.category,
                                  ingredients: newMealForm.ingredients.map(ing => ({
                                    ingredientId: ing.ingredientId,
                                    quantity: ing.quantity,
                                    unit: ing.unit
                                  }))
                                };
                                
                                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/meals`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    ...mealData,
                                    trainerId: user.id
                                  })
                                });
                                
                                if (response.ok) {
                                  const savedMeal = await response.json();
                                  console.log('Meal saved globally:', savedMeal);
                                  
                                  // Now add this meal to the current day
                                  const mealToAdd = {
                                    meal: savedMeal,
                                    mealType: newMealForm.category,
                                    customIngredients: newMealForm.ingredients.map(ing => ({
                                      ingredientId: ing.ingredientId,
                                      quantity: ing.quantity,
                                      unit: ing.unit
                                    }))
                                  };
                                  
                                  setSelectedMealsForDay(prev => [...prev, mealToAdd]);
                                  
                                  // Reset form and close accordion
                                  setNewMealForm({
                                    name: '',
                                    description: '',
                                    category: '',
                                    ingredients: []
                                  });
                                  setShowNewMealAccordion(false);
                                  setShowSaveMealDropdown(false);
                                } else {
                                  console.error('Failed to save meal globally');
                                }
                              } catch (error) {
                                console.error('Error saving meal:', error);
                              }
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 border-b border-zinc-100 whitespace-nowrap"
                          >
                            {/* <CloudArrowUpIcon className="w-5 h-5" /> */}
                            Save to Meals & Add to Day
                          </button>
                          
                          <button
                            onClick={() => {
                              // Add to day only (without saving globally)
                              console.log('Adding meal to day only:', newMealForm);
                              
                              const mealToAdd = {
                                meal: {
                                  id: -1, // Temporary ID for meals not saved globally
                                  name: newMealForm.name,
                                  description: newMealForm.description,
                                  category: newMealForm.category,
                                  imageUrl: undefined,
                                  totalCalories: 0,
                                  totalProtein: 0,
                                  totalCarbs: 0,
                                  totalFats: 0
                                },
                                mealType: newMealForm.category,
                                customIngredients: newMealForm.ingredients.map(ing => ({
                                  ingredientId: ing.ingredientId,
                                  quantity: ing.quantity,
                                  unit: ing.unit
                                }))
                              };
                              
                              setSelectedMealsForDay(prev => [...prev, mealToAdd]);
                              
                              // Reset form and close accordion
                              setNewMealForm({
                                name: '',
                                description: '',
                                category: '',
                                ingredients: []
                              });
                              setShowNewMealAccordion(false);
                              setShowSaveMealDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 whitespace-nowrap"
                          >
                            {/* <PlusIcon className="w-5 h-5" /> */}
                            Add to Day Only
                          </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Meals Section */}
                {selectedMealsForDay.length > 0 && (
                  <div>
                    <Text className="text-sm font-medium text-zinc-900 mb-4">
                      Meals for this Day ({selectedMealsForDay.length})
                    </Text>
                    <div className="space-y-3">
                      {selectedMealsForDay.map((mealEntry, index) => (
                        <div key={index} className="border border-zinc-200 rounded-lg p-4 bg-white shadow-sm">
                          <div className="flex items-start gap-4">
                            {mealEntry.meal.imageUrl && (
                              <img
                                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${mealEntry.meal.imageUrl}`}
                                alt={mealEntry.meal.name}
                                className="w-12 h-12 rounded-lg object-cover border border-zinc-200"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Text className="text-sm font-semibold text-zinc-900">{mealEntry.meal.name}</Text>
                                <Badge className="text-xs bg-zinc-100 text-zinc-700">
                                  {mealEntry.mealType}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mb-3">
                                <Badge className="text-xs bg-zinc-100 text-zinc-700">
                                  {Math.round(mealEntry.meal.totalCalories)} cal
                                </Badge>
                                <Badge className="text-xs bg-zinc-100 text-zinc-700">
                                  {Math.round(mealEntry.meal.totalProtein)}gP
                                </Badge>
                                <Badge className="text-xs bg-zinc-100 text-zinc-700">
                                  {Math.round(mealEntry.meal.totalCarbs)}gC
                                </Badge>
                                <Badge className="text-xs bg-zinc-100 text-zinc-700">
                                  {Math.round(mealEntry.meal.totalFats)}gF
                                </Badge>
                              </div>
                              
                              {/* Ingredients */}
                              {mealEntry.meal.mealIngredients && mealEntry.meal.mealIngredients.length > 0 && (
                                <div className="space-y-2">
                                  <Text className="text-xs font-medium text-zinc-600">Ingredients:</Text>
                                  <div className="space-y-1">
                                    {mealEntry.meal.mealIngredients.map((ingredient: any, ingIndex: number) => (
                                      <div key={ingIndex} className="flex items-center gap-2 text-xs">
                                        <Text className="text-zinc-700">{ingredient.ingredient?.name}</Text>
                                        <Text className="text-zinc-500">({ingredient.quantity} {ingredient.unit})</Text>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => editMealInList(index)}
                                className="text-zinc-500 hover:text-zinc-700 p-1 rounded"
                                title="Edit Meal"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeMealFromList(index)}
                                className="text-red-500 hover:text-red-700 p-1 rounded"
                                title="Remove Meal"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {selectedMealsForDay.length === 0 && (
                  <div className="text-center py-12 text-zinc-500">
                    <svg className="mx-auto h-12 w-12 text-zinc-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <Text className="text-lg font-medium mb-2">No meals added yet</Text>
                    <Text className="text-sm mb-4">Add existing meals or create new ones to get started</Text>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-200">
              <button
                onClick={cancelMealSelection}
                className="bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <Button
                onClick={saveMealsToDay}
                disabled={selectedMealsForDay.length === 0}
              >
                Save Meals ({selectedMealsForDay.length})
              </Button>
            </div>
          </div>
        </>
      )}


      {/* Action Buttons - Bottom of Page */}
      <div className="flex gap-3 justify-end mt-10">
        <Button 
          color="white" 
          className="font-semibold border border-zinc-200" 
          onClick={() => setShowSidePanel(true)}
        >
          <EyeIcon className="w-4 h-4 mr-2" />
          Preview Program
        </Button>
        <Button 
          onClick={handleSave}
          disabled={loading}
          className="font-semibold bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Program'}
        </Button>
      </div>
    </div>
  );
} 
