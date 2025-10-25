'use client';

import { useState, useEffect, useCallback } from 'react';

// Add CSS animations
const sidePanelStyles = `
  @keyframes slideInFromRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutToRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
  
  .slide-in-right {
    animation: slideInFromRight 0.3s ease-out;
  }
  
  .slide-out-right {
    animation: slideOutToRight 0.3s ease-out;
  }
  
  .fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  
  .fade-out {
    animation: fadeOut 0.3s ease-out;
  }
`;
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
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isPreviewClosing, setIsPreviewClosing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<NutritionProgramDay | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [editingMealData, setEditingMealData] = useState<NutritionProgramMeal | null>(null);
  const [tempEditingMeals, setTempEditingMeals] = useState<NutritionProgramMeal[]>([]);
  const [selectedMealFromDropdown, setSelectedMealFromDropdown] = useState<Meal | null>(null);
  const [isCreatingNewMeal, setIsCreatingNewMeal] = useState(false);
  const [selectedMealsForDay, setSelectedMealsForDay] = useState<Array<{ meal: Meal; mealType: string; customIngredients?: Array<{ ingredientId: number; quantity: number; unit: string }> }>>([]);
  const [editingMealIndex, setEditingMealIndex] = useState<number | null>(null);
  const [mealAddedMessage, setMealAddedMessage] = useState<string | null>(null);
  const [showExistingMealAccordion, setShowExistingMealAccordion] = useState(false);
  const [showNewMealAccordion, setShowNewMealAccordion] = useState(false);
  const [showCheatMealAccordion, setShowCheatMealAccordion] = useState(false);
  const [showMealTypeDropdown, setShowMealTypeDropdown] = useState(false);
  const [showSaveMealDropdown, setShowSaveMealDropdown] = useState(false);
  const [newMealForm, setNewMealForm] = useState({
    name: '',
    description: '',
    category: '',
    imageUrl: '',
    ingredients: [] as Array<{ ingredientId: number; quantity: number; unit: string }>
  });
  const [cheatMealForm, setCheatMealForm] = useState({
    description: '',
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploadMethod, setImageUploadMethod] = useState<'upload' | 'url'>('upload');
  const [availableMeals, setAvailableMeals] = useState<Meal[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<any[]>([]);

  // Image upload handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setNewMealForm(prev => ({ ...prev, imageUrl: '' })); // Clear URL when uploading file
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMealForm(prev => ({ ...prev, imageUrl: e.target.value }));
    setImageFile(null); // Clear file when entering URL
  };

  // Calculate nutritional totals for new meal form
  const calculateNewMealNutritionTotals = () => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    if (availableIngredients.length === 0) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0
      };
    }

    newMealForm.ingredients.forEach((ingredient) => {
      if (ingredient.ingredientId && ingredient.quantity) {
        const quantity = parseFloat(ingredient.quantity.toString()) || 0;
        const ingredientData = availableIngredients.find(ing => ing.id === ingredient.ingredientId);
        
        if (ingredientData) {
          const isCooked = ingredientData.cookingState === 'after_cook';
          const calories = isCooked ? ingredientData.caloriesAfter : ingredientData.caloriesBefore;
          const protein = isCooked ? ingredientData.proteinAfter : ingredientData.proteinBefore;
          const carbs = isCooked ? ingredientData.carbsAfter : ingredientData.carbsBefore;
          const fats = isCooked ? ingredientData.fatsAfter : ingredientData.fatsBefore;
          const servingSize = ingredientData.servingSize || 1;
          
          const multiplier = quantity / servingSize;
          
          totalCalories += calories * multiplier;
          totalProtein += protein * multiplier;
          totalCarbs += carbs * multiplier;
          totalFats += fats * multiplier;
        }
      }
    });

    return {
      calories: Math.round(totalCalories * 100) / 100,
      protein: Math.round(totalProtein * 100) / 100,
      carbs: Math.round(totalCarbs * 100) / 100,
      fats: Math.round(totalFats * 100) / 100
    };
  };

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

  // Define functions before useEffect to avoid ReferenceError
  const fetchProgram = useCallback(async (trainerId: number) => {
    if (!programId) return;
    
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
  }, [programId]);

  const createDefaultWeek = useCallback(() => {
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
  }, []);

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

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      if (programId) {
        // Edit mode - fetch existing program
        fetchProgram(storedUser.id);
      } else {
        // Create mode - create default week
        createDefaultWeek();
      }
      fetchAvailableMeals(storedUser.id);
    }
  }, [programId]);

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
    
    // Initialize selectedMealsForDay with existing meals from the day
    if (day?.meals && day.meals.length > 0) {
      const existingMeals = day.meals.map(meal => ({
        meal: meal.meal!,
        mealType: meal.mealType,
        customIngredients: meal.meal?.mealIngredients?.map(mi => ({
          ingredientId: mi.ingredientId,
          quantity: mi.quantity,
          unit: mi.unit
        }))
      }));
      setSelectedMealsForDay(existingMeals);
    } else {
      setSelectedMealsForDay([]);
    }
    
    setIsClosing(false);
    setShowSidePanel(true);
  };

  const closeSidePanel = () => {
    setIsClosing(true);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      cancelMealSelection();
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  const closePreviewPanel = () => {
    setIsPreviewClosing(true);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      setShowPreviewPanel(false);
      setIsPreviewClosing(false);
    }, 300); // Match animation duration
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
    console.log('Editing meal:', mealEntry);
    
    // Set the meal for editing with proper ingredient data
    setSelectedMealFromDropdown({
      ...mealEntry.meal,
      mealIngredients: mealEntry.meal?.mealIngredients || mealEntry.customIngredients?.map(ci => ({
        ingredientId: ci.ingredientId,
        quantity: ci.quantity,
        unit: ci.unit,
        ingredient: availableIngredients.find(ai => ai.id === ci.ingredientId)
      })) || []
    });
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

    const newMeals: NutritionProgramMeal[] = selectedMealsForDay.map((mealEntry, index) => {
      const mealData = {
        mealId: mealEntry.meal?.id || null,
        mealType: mealEntry.mealType,
        order: index,
        customQuantity: 1,
        isCheatMeal: mealEntry.meal?.isCheatMeal || false,
        cheatDescription: mealEntry.meal?.cheatDescription || null,
        cheatImageUrl: mealEntry.meal?.cheatImageUrl || null,
        customNotes: null,
        meal: mealEntry.meal // Keep this for frontend display, but it won't be sent to backend
      };
      
      
      return mealData;
    });

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
                      meals: newMeals // Replace meals instead of appending
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
    setSelectedMeal(null);
    setEditingMealData(null);
    setTempEditingMeals([]);
    setEditingMealIndex(null);
    setShowExistingMealAccordion(false);
    setShowNewMealAccordion(false);
    setShowCheatMealAccordion(false);
    setShowMealTypeDropdown(false);
    setShowSaveMealDropdown(false);
    setIsClosing(false);
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
      // Set a dummy meal to indicate edit mode
      setSelectedMeal(meal.meal);
      setEditingMealData(meal);
      setIsClosing(false);
      
      // Find which day this meal belongs to by searching through all weeks and days
      let foundDay = null;
      for (const week of program.weeks || []) {
        for (const day of week.days || []) {
          if (day.meals?.find(m => m.id === meal.id)) {
            foundDay = day;
            break;
          }
        }
        if (foundDay) break;
      }
      
      if (foundDay) {
        setSelectedDay(foundDay);
        // Initialize temporary editing state with a deep copy of the meals
        setTempEditingMeals(foundDay.meals?.map(meal => ({
          ...meal,
          meal: meal.meal ? {
            ...meal.meal,
            mealIngredients: meal.meal.mealIngredients?.map(ing => ({ ...ing }))
          } : meal.meal
        })) || []);
      }
      
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

      // Clean the program data for backend
      const cleanedProgram = {
        ...program,
        trainerId: user.id,
        weeks: program.weeks?.map(week => ({
          weekNumber: week.weekNumber,
          name: week.name,
          days: week.days?.map(day => ({
            dayOfWeek: day.dayOfWeek,
            name: day.name,
            meals: day.meals?.map(meal => ({
              mealId: meal.mealId,
              mealType: meal.mealType,
              order: meal.order,
              customQuantity: meal.customQuantity,
              isCheatMeal: meal.isCheatMeal,
              cheatDescription: meal.cheatDescription,
              cheatImageUrl: meal.cheatImageUrl,
              customNotes: meal.customNotes
            })) || []
          })) || []
        })) || []
      };

      console.log('Sending program data:', cleanedProgram);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedProgram),
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
    <>
      {/* Inject CSS animations */}
      <style dangerouslySetInnerHTML={{ __html: sidePanelStyles }} />
      
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
                                          openMealSelector(week.weekNumber, day.id, day.dayOfWeek);
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
                                          src={meal.meal.imageUrl.startsWith('blob:') || meal.meal.imageUrl.startsWith('http') 
                                            ? meal.meal.imageUrl 
                                            : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${meal.meal.imageUrl}`}
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
                                          {/* Only show calories for non-cheat meals */}
                                          {!meal.meal?.isCheatMeal && (
                                            <Text className="text-xs text-gray-500">
                                              {meal.meal?.totalCalories} cal
                                            </Text>
                                          )}
                                        </div>
                                        {/* Ingredients List */}
                                        {meal.meal?.mealIngredients && meal.meal.mealIngredients.length > 0 && (
                                          <div className="mt-2">
                                            <Text className="text-xs text-gray-600 mb-1">Ingredients:</Text>
                                            <div className="flex flex-wrap gap-1">
                                              {meal.meal.mealIngredients.map((ingredient: any, ingIndex: number) => (
                                                <span key={ingIndex} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                  {ingredient.ingredient?.name || `Ingredient ${ingredient.ingredientId}`} ({ingredient.quantity} {ingredient.unit})
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
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
            className={`fixed top-0 left-0 right-0 bg-black/50 z-40 ${isClosing ? 'fade-out' : 'fade-in'}`}
            style={{ height: '100vh' }}
            onClick={closeSidePanel}
          />
          
          {/* Side Panel */}
          <div 
            className={`fixed top-0 right-0 w-[800px] bg-white shadow-xl z-50 flex flex-col ${isClosing ? 'slide-out-right' : 'slide-in-right'}`}
            style={{ height: '100vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
              <h3 className="text-lg font-semibold text-zinc-900">
                {selectedMeal ? 'Edit Meal' : 'Select Meal'}
              </h3>
              <button
                onClick={closeSidePanel}
                className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Daily Nutrition Progress */}
            {selectedDay && (
              <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50">
                <Text className="text-sm font-medium text-zinc-900 mb-3">Daily Nutrition Progress</Text>
                <div className="flex items-center justify-center gap-6">
                  {/* Calories Progress */}
                  {(() => {
                    // Calculate nutrition from saved meals
                    const savedNutrition = selectedDay.meals?.reduce((acc, meal) => {
                      // Skip cheat meals (they don't have meal data)
                      if (meal.meal) {
                        acc.calories += meal.meal.totalCalories || 0;
                        acc.protein += meal.meal.totalProtein || 0;
                        acc.carbs += meal.meal.totalCarbs || 0;
                        acc.fats += meal.meal.totalFats || 0;
                      }
                      return acc;
                    }, { calories: 0, protein: 0, carbs: 0, fats: 0 }) || { calories: 0, protein: 0, carbs: 0, fats: 0 };

                    // Calculate nutrition from temporary meals
                    const tempNutrition = selectedMealsForDay.reduce((acc, mealEntry) => {
                      // Skip cheat meals (they don't have nutritional values)
                      if (mealEntry.meal && !mealEntry.meal.isCheatMeal) {
                        acc.calories += mealEntry.meal.totalCalories || 0;
                        acc.protein += mealEntry.meal.totalProtein || 0;
                        acc.carbs += mealEntry.meal.totalCarbs || 0;
                        acc.fats += mealEntry.meal.totalFats || 0;
                      }
                      return acc;
                    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

                    // Combine both
                    const nutrition = {
                      calories: savedNutrition.calories + tempNutrition.calories,
                      protein: savedNutrition.protein + tempNutrition.protein,
                      carbs: savedNutrition.carbs + tempNutrition.carbs,
                      fats: savedNutrition.fats + tempNutrition.fats
                    };

                    return (
                      <div className="text-center">
                        <div className="relative w-16 h-16">
                          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
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
                        <Text className="text-xs text-blue-700 font-medium mt-1">Cal</Text>
                      </div>
                    );
                  })()}

                  {/* Protein Progress */}
                  {(() => {
                    // Calculate nutrition from saved meals
                    const savedNutrition = selectedDay.meals?.reduce((acc, meal) => {
                      // Skip cheat meals (they don't have meal data)
                      if (meal.meal) {
                        acc.calories += meal.meal.totalCalories || 0;
                        acc.protein += meal.meal.totalProtein || 0;
                        acc.carbs += meal.meal.totalCarbs || 0;
                        acc.fats += meal.meal.totalFats || 0;
                      }
                      return acc;
                    }, { calories: 0, protein: 0, carbs: 0, fats: 0 }) || { calories: 0, protein: 0, carbs: 0, fats: 0 };

                    // Calculate nutrition from temporary meals
                    const tempNutrition = selectedMealsForDay.reduce((acc, mealEntry) => {
                      // Skip cheat meals (they don't have nutritional values)
                      if (mealEntry.meal && !mealEntry.meal.isCheatMeal) {
                        acc.calories += mealEntry.meal.totalCalories || 0;
                        acc.protein += mealEntry.meal.totalProtein || 0;
                        acc.carbs += mealEntry.meal.totalCarbs || 0;
                        acc.fats += mealEntry.meal.totalFats || 0;
                      }
                      return acc;
                    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

                    // Combine both
                    const nutrition = {
                      calories: savedNutrition.calories + tempNutrition.calories,
                      protein: savedNutrition.protein + tempNutrition.protein,
                      carbs: savedNutrition.carbs + tempNutrition.carbs,
                      fats: savedNutrition.fats + tempNutrition.fats
                    };
                    const targets = getMacroTargets();

                    return targets.protein > 0 && (
                      <div className="text-center">
                        <div className="relative w-16 h-16">
                          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
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
                        <Text className="text-xs text-green-700 font-medium mt-1">Pro</Text>
                      </div>
                    );
                  })()}

                  {/* Carbs Progress */}
                  {(() => {
                    // Calculate nutrition from saved meals
                    const savedNutrition = selectedDay.meals?.reduce((acc, meal) => {
                      // Skip cheat meals (they don't have meal data)
                      if (meal.meal) {
                        acc.calories += meal.meal.totalCalories || 0;
                        acc.protein += meal.meal.totalProtein || 0;
                        acc.carbs += meal.meal.totalCarbs || 0;
                        acc.fats += meal.meal.totalFats || 0;
                      }
                      return acc;
                    }, { calories: 0, protein: 0, carbs: 0, fats: 0 }) || { calories: 0, protein: 0, carbs: 0, fats: 0 };

                    // Calculate nutrition from temporary meals
                    const tempNutrition = selectedMealsForDay.reduce((acc, mealEntry) => {
                      // Skip cheat meals (they don't have nutritional values)
                      if (mealEntry.meal && !mealEntry.meal.isCheatMeal) {
                        acc.calories += mealEntry.meal.totalCalories || 0;
                        acc.protein += mealEntry.meal.totalProtein || 0;
                        acc.carbs += mealEntry.meal.totalCarbs || 0;
                        acc.fats += mealEntry.meal.totalFats || 0;
                      }
                      return acc;
                    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

                    // Combine both
                    const nutrition = {
                      calories: savedNutrition.calories + tempNutrition.calories,
                      protein: savedNutrition.protein + tempNutrition.protein,
                      carbs: savedNutrition.carbs + tempNutrition.carbs,
                      fats: savedNutrition.fats + tempNutrition.fats
                    };
                    const targets = getMacroTargets();

                    return targets.carbs > 0 && (
                      <div className="text-center">
                        <div className="relative w-16 h-16">
                          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-gray-200"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-orange-600"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              strokeDasharray={`${Math.min(100, (nutrition.carbs / targets.carbs) * 100)}, 100`}
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Text className="text-xs font-bold text-orange-900">
                              {Math.round((nutrition.carbs / targets.carbs) * 100)}%
                            </Text>
                          </div>
                        </div>
                        <Text className="text-xs text-orange-700 font-medium mt-1">Carb</Text>
                      </div>
                    );
                  })()}

                  {/* Fats Progress */}
                  {(() => {
                    // Calculate nutrition from saved meals
                    const savedNutrition = selectedDay.meals?.reduce((acc, meal) => {
                      // Skip cheat meals (they don't have meal data)
                      if (meal.meal) {
                        acc.calories += meal.meal.totalCalories || 0;
                        acc.protein += meal.meal.totalProtein || 0;
                        acc.carbs += meal.meal.totalCarbs || 0;
                        acc.fats += meal.meal.totalFats || 0;
                      }
                      return acc;
                    }, { calories: 0, protein: 0, carbs: 0, fats: 0 }) || { calories: 0, protein: 0, carbs: 0, fats: 0 };

                    // Calculate nutrition from temporary meals
                    const tempNutrition = selectedMealsForDay.reduce((acc, mealEntry) => {
                      // Skip cheat meals (they don't have nutritional values)
                      if (mealEntry.meal && !mealEntry.meal.isCheatMeal) {
                        acc.calories += mealEntry.meal.totalCalories || 0;
                        acc.protein += mealEntry.meal.totalProtein || 0;
                        acc.carbs += mealEntry.meal.totalCarbs || 0;
                        acc.fats += mealEntry.meal.totalFats || 0;
                      }
                      return acc;
                    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

                    // Combine both
                    const nutrition = {
                      calories: savedNutrition.calories + tempNutrition.calories,
                      protein: savedNutrition.protein + tempNutrition.protein,
                      carbs: savedNutrition.carbs + tempNutrition.carbs,
                      fats: savedNutrition.fats + tempNutrition.fats
                    };
                    const targets = getMacroTargets();

                    return targets.fats > 0 && (
                      <div className="text-center">
                        <div className="relative w-16 h-16">
                          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-gray-200"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-purple-600"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              strokeDasharray={`${Math.min(100, (nutrition.fats / targets.fats) * 100)}, 100`}
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Text className="text-xs font-bold text-purple-900">
                              {Math.round((nutrition.fats / targets.fats) * 100)}%
                            </Text>
                          </div>
                        </div>
                        <Text className="text-xs text-purple-700 font-medium mt-1">Fat</Text>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Success Message */}
              {mealAddedMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg fade-in">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-green-700">{mealAddedMessage}</span>
                  </div>
                </div>
              )}

              {/* Edit Existing Meal Section */}
              {selectedMeal && selectedDay && (
                <div className="mb-6 p-4 border border-zinc-200 rounded-xl bg-white shadow-sm fade-in">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Text className="text-lg font-semibold text-zinc-900">Edit Meals for {selectedDay.name}</Text>
                      <button
                        onClick={() => {
                          setSelectedMeal(null);
                          setEditingMealData(null);
                        }}
                        className="text-zinc-400 hover:text-zinc-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Meals List with Editable Quantities */}
                    <div className="space-y-3">
                      {tempEditingMeals.map((meal, index) => (
                        <div key={meal.id || index} className="border border-zinc-200 rounded-lg p-4">
                          {/* Meal Header */}
                          <div className="flex items-center gap-4 mb-3">
                            {/* Meal Image */}
                            {meal.meal?.imageUrl && (
                              <img
                                src={meal.meal.imageUrl.startsWith('blob:') || meal.meal.imageUrl.startsWith('http') 
                                  ? meal.meal.imageUrl 
                                  : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${meal.meal.imageUrl}`}
                                alt={meal.meal.name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            )}
                            
                            {/* Meal Info */}
                            <div className="flex-1">
                              <Text className="text-sm font-medium text-zinc-900">{meal.meal?.name}</Text>
                              <Text className="text-xs text-zinc-500">{meal.mealType}</Text>
                              {/* Only show nutritional badges for non-cheat meals */}
                              {!meal.meal?.isCheatMeal && (
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {Math.round((meal.meal?.totalCalories || 0) * (meal.customQuantity || 1))} cal
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {Math.round((meal.meal?.totalProtein || 0) * (meal.customQuantity || 1))}gP
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {Math.round((meal.meal?.totalCarbs || 0) * (meal.customQuantity || 1))}gC
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {Math.round((meal.meal?.totalFats || 0) * (meal.customQuantity || 1))}gF
                                  </Badge>
                                </div>
                              )}
                            </div>
                            
                            
                            {/* Remove Button */}
                            <button
                              onClick={() => {
                                setTempEditingMeals(prev => prev.filter((_, i) => i !== index));
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Remove meal"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          {/* Ingredients List */}
                          {meal.meal?.mealIngredients && meal.meal.mealIngredients.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-zinc-100">
                              <Text className="text-xs font-medium text-zinc-600 mb-2">Ingredients:</Text>
                              <div className="space-y-2">
                                {meal.meal.mealIngredients.map((ingredient: any, ingIndex: number) => (
                                  <div key={ingIndex} className="flex items-center gap-3 p-2 bg-zinc-50 rounded-lg">
                                    <div className="flex-1">
                                      <Text className="text-sm font-medium text-zinc-900">
                                        {ingredient.ingredient?.name || `Ingredient ${ingredient.ingredientId}`}
                                      </Text>
                                      <Text className="text-xs text-zinc-500">
                                        {ingredient.quantity} {ingredient.unit}
                                      </Text>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Text className="text-xs text-zinc-600">Amount:</Text>
                                      <Input
                                        type="number"
                                        value={ingredient.quantity}
                                        onChange={(e) => {
                                          const newQuantity = parseFloat(e.target.value) || 0;
                                          setTempEditingMeals(prev => prev.map((m, mealIndex) =>
                                            mealIndex === index ? {
                                              ...m,
                                              meal: m.meal ? {
                                                ...m.meal,
                                                mealIngredients: m.meal.mealIngredients?.map((ing, idx) =>
                                                  idx === ingIndex ? { ...ing, quantity: newQuantity } : ing
                                                )
                                              } : m.meal
                                            } : m
                                          ));
                                        }}
                                        min="0"
                                        step="0.1"
                                        className="w-20 text-center text-xs"
                                      />
                                      <Text className="text-xs text-zinc-500">{ingredient.unit}</Text>
                                      <button
                                        onClick={() => {
                                          setTempEditingMeals(prev => prev.map((m, mealIndex) =>
                                            mealIndex === index ? {
                                              ...m,
                                              meal: m.meal ? {
                                                ...m.meal,
                                                mealIngredients: m.meal.mealIngredients?.filter((_, idx) => idx !== ingIndex)
                                              } : m.meal
                                            } : m
                                          ));
                                        }}
                                        className="text-red-500 hover:text-red-700 p-1 ml-2"
                                        title="Remove ingredient"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Save/Cancel Actions */}
                    <div className="flex gap-3 pt-4 border-t border-zinc-200">
                      <button
                        onClick={() => {
                          // Apply changes to the main program
                          if (selectedDay) {
                            setProgram(prev => ({
                              ...prev,
                              weeks: prev.weeks!.map(week => ({
                                ...week,
                                days: week.days!.map(day =>
                                  day.id === selectedDay.id ? {
                                    ...day,
                                    meals: tempEditingMeals
                                  } : day
                                )
                              }))
                            }));
                          }
                          // Close the edit view
                          setSelectedMeal(null);
                          setEditingMealData(null);
                          setTempEditingMeals([]);
                        }}
                        className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => {
                          // Discard changes and close
                          setSelectedMeal(null);
                          setEditingMealData(null);
                          setTempEditingMeals([]);
                        }}
                        className="bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    
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
                      className="absolute top-full right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 min-w-[200px] fade-in"
                    >
                      <button
                        onClick={() => {
                          setShowExistingMealAccordion(true);
                          setShowNewMealAccordion(false);
                          setShowMealTypeDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 border-b border-zinc-100"
                      >
                        {/* <PlusIcon className="w-3 h-3" /> */}
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
                        {/* <PlusIcon className="w-3 h-3" /> */}
                        Create New Meal
                      </button>
                      <button
                        onClick={() => {
                          setShowCheatMealAccordion(true);
                          setShowExistingMealAccordion(false);
                          setShowNewMealAccordion(false);
                          setShowMealTypeDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                      >
                        {/* <PlusIcon className="w-3 h-3" /> */}
                        Add Cheat Meal
                      </button>
                    </div>
                  )}
                </div>

                {/* Add Existing Meal Accordion */}
                {showExistingMealAccordion && (
                  <div className="border border-zinc-200 rounded-xl bg-white shadow-sm fade-in">
                    <div className="p-6">
                      <div className="space-y-6">
                        {/* Only show dropdown when not editing an existing meal */}
                        {editingMealIndex === null && (
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
                        )}
                        
                        {selectedMealFromDropdown && (
                          <div className="border border-zinc-100 rounded-lg p-4 bg-zinc-50/50">
                            <div className="flex items-start gap-4 mb-4">
                              {selectedMealFromDropdown.imageUrl && (
                                <img
                                  src={selectedMealFromDropdown.imageUrl.startsWith('blob:') || selectedMealFromDropdown.imageUrl.startsWith('http') 
                                    ? selectedMealFromDropdown.imageUrl 
                                    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${selectedMealFromDropdown.imageUrl}`}
                                  alt={selectedMealFromDropdown.name}
                                  className="w-14 h-14 rounded-lg object-cover border border-zinc-200"
                                />
                              )}
                              <div className="flex-1">
                                <Text className="text-base font-semibold text-zinc-900">{selectedMealFromDropdown.name}</Text>
                                <Text className="text-sm text-zinc-500 mt-1">{selectedMealFromDropdown.description}</Text>
                                {/* Only show nutritional badges for non-cheat meals */}
                                {!selectedMealFromDropdown.isCheatMeal && (
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
                                )}
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
                  <div className="border border-zinc-200 rounded-xl bg-white shadow-sm fade-in">
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

                        {/* Image Upload Section */}
                        <div>
                          <Text className="text-sm font-medium text-zinc-900 mb-3">Image</Text>
                          
                          {/* Tab Navigation */}
                          <div className="flex border-b border-zinc-200 mb-4">
                            <button
                              type="button"
                              onClick={() => setImageUploadMethod('upload')}
                              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                imageUploadMethod === 'upload'
                                  ? 'border-blue-500 text-blue-600'
                                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
                              }`}
                            >
                              Upload File
                            </button>
                            <button
                              type="button"
                              onClick={() => setImageUploadMethod('url')}
                              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                imageUploadMethod === 'url'
                                  ? 'border-blue-500 text-blue-600'
                                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
                              }`}
                            >
                              Image URL
                            </button>
                          </div>
                          
                          {/* Tab Content */}
                          {imageUploadMethod === 'upload' ? (
                            <div>
                              <Text className="text-xs text-zinc-600 mb-2">Choose file from your computer</Text>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              />
                              {imageFile && (
                                <Text className="mt-2 text-sm text-green-600">
                                  Selected: {imageFile.name}
                                </Text>
                              )}
                            </div>
                          ) : (
                            <div>
                              <Text className="text-xs text-zinc-600 mb-2">Enter image URL</Text>
                              <Input
                                type="url"
                                value={newMealForm.imageUrl}
                                onChange={handleImageUrlChange}
                                placeholder="https://example.com/image.jpg"
                                className="w-full"
                              />
                            </div>
                          )}
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

                        {/* Meal Summary Section */}
                        <div>
                          <Text className="text-sm font-medium text-zinc-900 mb-3">Meal Summary</Text>
                          <div className="bg-zinc-50 rounded-lg p-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-zinc-900">
                                  {calculateNewMealNutritionTotals().calories}
                                </div>
                                <div className="text-sm text-zinc-600">Calories</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-zinc-900">
                                  {calculateNewMealNutritionTotals().protein}g
                                </div>
                                <div className="text-sm text-zinc-600">Protein</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-zinc-900">
                                  {calculateNewMealNutritionTotals().carbs}g
                                </div>
                                <div className="text-sm text-zinc-600">Carbs</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-zinc-900">
                                  {calculateNewMealNutritionTotals().fats}g
                                </div>
                                <div className="text-sm text-zinc-600">Fats</div>
                              </div>
                            </div>
                            {newMealForm.ingredients.length === 0 && (
                              <div className="text-center text-zinc-500 text-sm mt-2">
                                Add ingredients to see nutritional summary
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
                            imageUrl: '',
                            ingredients: []
                          });
                          setImageFile(null);
                          setImageUploadMethod('upload');
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
                          <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 fade-in" data-dropdown-content>
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
                                  imageUrl: newMealForm.imageUrl,
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
                                  
                                  // Now add this meal to the current day with proper nutritional values
                                  const mealToAdd = {
                                    meal: {
                                      ...savedMeal,
                                      // Ensure nutritional values are properly set from backend response
                                      totalCalories: savedMeal.totalCalories || 0,
                                      totalProtein: savedMeal.totalProtein || 0,
                                      totalCarbs: savedMeal.totalCarbs || 0,
                                      totalFats: savedMeal.totalFats || 0,
                                      mealIngredients: savedMeal.mealIngredients || []
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
                                    imageUrl: '',
                                    ingredients: []
                                  });
                                  setImageFile(null);
                                  setImageUploadMethod('upload');
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
                              // Add to day only (without saving globally) - calculate nutritional values locally
                              console.log('Adding meal to day only:', newMealForm);
                              
                              let totalCalories = 0;
                              let totalProtein = 0;
                              let totalCarbs = 0;
                              let totalFats = 0;
                              
                              // Calculate nutritional values from ingredients
                              for (const ing of newMealForm.ingredients) {
                                if (ing.ingredientId && ing.quantity > 0) {
                                  const ingredient = availableIngredients.find(ai => ai.id === ing.ingredientId);
                                  if (ingredient) {
                                    const caloriesPerUnit = ingredient.caloriesAfter || ingredient.caloriesBefore || 0;
                                    const proteinPerUnit = ingredient.proteinAfter || ingredient.proteinBefore || 0;
                                    const carbsPerUnit = ingredient.carbsAfter || ingredient.carbsBefore || 0;
                                    const fatsPerUnit = ingredient.fatsAfter || ingredient.fatsBefore || 0;
                                    const servingSize = ingredient.servingSize || 1;
                                    
                                    const multiplier = ing.quantity / servingSize;
                                    
                                    totalCalories += caloriesPerUnit * multiplier;
                                    totalProtein += proteinPerUnit * multiplier;
                                    totalCarbs += carbsPerUnit * multiplier;
                                    totalFats += fatsPerUnit * multiplier;
                                  }
                                }
                              }
                              
                              const mealToAdd = {
                                meal: {
                                  id: -1, // Temporary ID for meals not saved globally
                                  name: newMealForm.name,
                                  description: newMealForm.description,
                                  category: newMealForm.category,
                                  imageUrl: undefined,
                                  totalCalories: Math.round(totalCalories * 100) / 100,
                                  totalProtein: Math.round(totalProtein * 100) / 100,
                                  totalCarbs: Math.round(totalCarbs * 100) / 100,
                                  totalFats: Math.round(totalFats * 100) / 100,
                                  mealIngredients: newMealForm.ingredients.map(ing => ({
                                    ingredientId: ing.ingredientId,
                                    quantity: ing.quantity,
                                    unit: ing.unit,
                                    ingredient: availableIngredients.find(ai => ai.id === ing.ingredientId)
                                  }))
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
                                imageUrl: '',
                                ingredients: []
                              });
                              setImageFile(null);
                              setImageUploadMethod('upload');
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
                  <div className="fade-in">
                    <Text className="text-sm font-medium text-zinc-900 mb-4">
                      Meals for this Day ({selectedMealsForDay.length})
                    </Text>
                    <div className="space-y-3">
                      {selectedMealsForDay.map((mealEntry, index) => (
                        <div key={index} className="border border-zinc-200 rounded-lg p-4 bg-white shadow-sm">
                          <div className="flex items-start gap-4">
                            {mealEntry.meal?.imageUrl && (
                              <img
                                src={mealEntry.meal.imageUrl.startsWith('blob:') || mealEntry.meal.imageUrl.startsWith('http') 
                                  ? mealEntry.meal.imageUrl 
                                  : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${mealEntry.meal.imageUrl}`}
                                alt={mealEntry.meal.name}
                                className="w-12 h-12 rounded-lg object-cover border border-zinc-200"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Text className="text-sm font-semibold text-zinc-900">{mealEntry.meal?.name || 'Cheat Meal'}</Text>
                                <Badge className="text-xs bg-zinc-100 text-zinc-700">
                                  {mealEntry.mealType}
                                </Badge>
                              </div>
                              {/* Only show nutritional badges for non-cheat meals */}
                              {mealEntry.meal && !mealEntry.meal.isCheatMeal && (
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
                              )}
                              
                              {/* Ingredients */}
                              {mealEntry.meal?.mealIngredients && mealEntry.meal.mealIngredients.length > 0 && (
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

                {/* Add Cheat Meal Accordion */}
                {showCheatMealAccordion && (
                  <div className="border border-zinc-200 rounded-xl bg-white shadow-sm fade-in">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-semibold text-sm">CM</span>
                          </div>
                          <div>
                            <Text className="text-lg font-semibold text-zinc-900">Add Cheat Meal</Text>
                            <Text className="text-sm text-zinc-500">Add a cheat meal with custom description</Text>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowCheatMealAccordion(false);
                            setCheatMealForm({ description: '', imageUrl: '' });
                          }}
                          className="text-zinc-400 hover:text-zinc-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="space-y-4">
                        {/* Cheat Meal Description */}
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-2">
                            Cheat Meal Description
                          </label>
                          <Textarea
                            value={cheatMealForm.description}
                            onChange={(e) => setCheatMealForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe the cheat meal... (e.g., 'Pizza night with friends', 'Ice cream sundae', 'Burger and fries')"
                            rows={4}
                            className="w-full"
                          />
                        </div>

                        {/* Image Upload Section */}
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-2">
                            Cheat Meal Image (Optional)
                          </label>
                          <div className="border border-zinc-200 rounded-lg p-4">
                            <div className="flex gap-4">
                              {/* Upload File Tab */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className={`w-2 h-2 rounded-full ${imageUploadMethod === 'upload' ? 'bg-zinc-900' : 'bg-zinc-300'}`}></div>
                                  <Text className="text-sm font-medium text-zinc-700">Upload File</Text>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setImageFile(file);
                                      setImageUploadMethod('upload');
                                    }
                                  }}
                                  className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
                                />
                              </div>

                              {/* Divider */}
                              <div className="flex items-center">
                                <div className="w-px h-8 bg-zinc-200"></div>
                              </div>

                              {/* Image URL Tab */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className={`w-2 h-2 rounded-full ${imageUploadMethod === 'url' ? 'bg-zinc-900' : 'bg-zinc-300'}`}></div>
                                  <Text className="text-sm font-medium text-zinc-700">Image URL</Text>
                                </div>
                                <Input
                                  type="url"
                                  value={cheatMealForm.imageUrl}
                                  onChange={(e) => {
                                    setCheatMealForm(prev => ({ ...prev, imageUrl: e.target.value }));
                                    setImageUploadMethod('url');
                                  }}
                                  placeholder="https://example.com/image.jpg"
                                  className="w-full"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Add to Day Button */}
                        <div className="flex gap-3 pt-4 border-t border-zinc-200">
                          <button
                            onClick={async () => {
                              if (!cheatMealForm.description.trim()) {
                                alert('Please enter a cheat meal description');
                                return;
                              }

                              // Create a cheat meal object
                              let imageUrl = '';
                              
                              // Handle image upload for cheat meals
                              try {
                                if (imageUploadMethod === 'url' && cheatMealForm.imageUrl) {
                                  imageUrl = cheatMealForm.imageUrl;
                                } else if (imageFile && imageUploadMethod === 'upload') {
                                  // Upload file to server
                                  const formData = new FormData();
                                  formData.append('image', imageFile);
                                  
                                  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/meals/upload-cheat`, {
                                    method: 'POST',
                                    body: formData,
                                  });
                                  
                                  if (!response.ok) {
                                    const errorData = await response.json();
                                    throw new Error(errorData.error || 'Failed to upload image');
                                  }
                                  
                                  const uploadResult = await response.json();
                                  imageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${uploadResult.imageUrl}`;
                                }
                              } catch (uploadError) {
                                console.error('Error uploading cheat meal image:', uploadError);
                                alert(`Failed to upload image: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
                                return;
                              }
                              
                              
                              const cheatMeal = {
                                id: Math.floor(Date.now() * 1000 + Math.random() * 1000),
                                name: cheatMealForm.description || 'Cheat Meal',
                                description: cheatMealForm.description,
                                cheatDescription: cheatMealForm.description,
                                category: 'cheat',
                                totalCalories: 0, // Cheat meals don't count towards calories
                                totalProtein: 0,
                                totalCarbs: 0,
                                totalFats: 0,
                                imageUrl: imageUrl,
                                cheatImageUrl: imageUrl,
                                mealIngredients: [],
                                isCheatMeal: true
                              };

                              // Add to selected meals for the day
                              setSelectedMealsForDay(prev => [...prev, {
                                meal: cheatMeal,
                                mealType: 'Cheat Meal',
                                customIngredients: []
                              }]);

                              // Reset form
                              setCheatMealForm({ description: '', imageUrl: '' });
                              setImageFile(null);
                              setShowCheatMealAccordion(false);

                              // Show success message
                              setMealAddedMessage('Cheat meal added successfully!');
                              setTimeout(() => setMealAddedMessage(null), 3000);
                            }}
                            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                          >
                            Add Cheat Meal to Day
                          </button>
                          <button
                            onClick={() => {
                              setShowCheatMealAccordion(false);
                              setCheatMealForm({ description: '', imageUrl: '' });
                              setImageFile(null);
                            }}
                            className="bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
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
                onClick={closeSidePanel}
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

      {/* Program Preview Side Panel */}
      {showPreviewPanel && (
        <>
          {/* Backdrop */}
          <div 
            className={`fixed top-0 left-0 right-0 bg-black/50 z-40 ${isPreviewClosing ? 'fade-out' : 'fade-in'}`}
            style={{ height: '100vh' }}
            onClick={closePreviewPanel}
          />
          
          {/* Preview Panel */}
          <div 
            className={`fixed top-0 right-0 w-[900px] bg-white shadow-xl z-50 flex flex-col ${isPreviewClosing ? 'slide-out-right' : 'slide-in-right'}`}
            style={{ height: '100vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
              <h3 className="text-lg font-semibold text-zinc-900">Program Preview</h3>
              <button
                onClick={closePreviewPanel}
                className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Program Info */}
                <div className="bg-zinc-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-zinc-900 mb-2">{program.name || 'Untitled Program'}</h4>
                  <p className="text-zinc-600">{program.description || 'No description provided'}</p>
                </div>

                {/* Nutrition Goals */}
                <div className="bg-zinc-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-zinc-900 mb-3">Nutrition Goals</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Text className="text-sm font-medium text-zinc-700">Target Calories</Text>
                      <Text className="text-lg font-semibold text-zinc-900">{program.targetCalories}</Text>
                    </div>
                    <div>
                      <Text className="text-sm font-medium text-zinc-700">Protein</Text>
                      <Text className="text-lg font-semibold text-zinc-900">
                        {program.usePercentages ? `${program.targetProtein}%` : `${program.targetProtein}g`}
                      </Text>
                    </div>
                    <div>
                      <Text className="text-sm font-medium text-zinc-700">Carbs</Text>
                      <Text className="text-lg font-semibold text-zinc-900">
                        {program.usePercentages ? `${program.targetCarbs}%` : `${program.targetCarbs}g`}
                      </Text>
                    </div>
                    <div>
                      <Text className="text-sm font-medium text-zinc-700">Fats</Text>
                      <Text className="text-lg font-semibold text-zinc-900">
                        {program.usePercentages ? `${program.targetFats}%` : `${program.targetFats}g`}
                      </Text>
                    </div>
                  </div>
                </div>

                {/* Program Weeks */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-zinc-900">Program Structure</h4>
                  {program.weeks?.map((week, weekIndex) => (
                    <div key={week.id || weekIndex} className="border border-zinc-200 rounded-lg">
                      {/* Week Header */}
                      <div className="bg-zinc-100 px-4 py-3 border-b border-zinc-200">
                        <h5 className="font-semibold text-zinc-900">Week {week.weekNumber}</h5>
                      </div>

                      {/* Days */}
                      <div className="p-4 space-y-3">
                        {week.days?.map((day, dayIndex) => (
                          <div key={day.id || dayIndex} className="border border-zinc-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h6 className="font-medium text-zinc-900">{day.name}</h6>
                              {day.isOffDay && (
                                <Badge className="bg-yellow-100 text-yellow-800">Rest Day</Badge>
                              )}
                            </div>

                            {/* Meals */}
                            {day.meals && day.meals.length > 0 ? (
                              <div className="space-y-2">
                                {day.meals.map((meal, mealIndex) => (
                                  <div key={meal.id || mealIndex} className="bg-zinc-50 rounded-lg p-3">
                                    <div className="flex items-start gap-3">
                                      {meal.meal?.imageUrl && (
                                        <img
                                          src={meal.meal.imageUrl.startsWith('blob:') || meal.meal.imageUrl.startsWith('http') 
                                            ? meal.meal.imageUrl 
                                            : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${meal.meal.imageUrl}`}
                                          alt={meal.meal.name}
                                          className="w-12 h-12 rounded-lg object-cover"
                                        />
                                      )}
                                      <div className="flex-1">
                                        <Text className="font-medium text-zinc-900">{meal.meal?.name}</Text>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge className={`text-xs ${getMealTypeColor(meal.mealType)}`}>
                                            {meal.mealType}
                                          </Badge>
                                          {/* Only show calories for non-cheat meals */}
                                          {!meal.meal?.isCheatMeal && (
                                            <Text className="text-xs text-zinc-500">
                                              {meal.meal?.totalCalories} cal
                                            </Text>
                                          )}
                                        </div>
                                        {/* Ingredients */}
                                        {meal.meal?.mealIngredients && meal.meal.mealIngredients.length > 0 && (
                                          <div className="mt-2">
                                            <Text className="text-xs text-zinc-600 mb-1">Ingredients:</Text>
                                            <div className="flex flex-wrap gap-1">
                                              {meal.meal.mealIngredients.map((ingredient: any, ingIndex: number) => (
                                                <span key={ingIndex} className="text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded">
                                                  {ingredient.ingredient?.name || `Ingredient ${ingredient.ingredientId}`} ({ingredient.quantity} {ingredient.unit})
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <Text className="text-zinc-500 text-sm">No meals assigned</Text>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Action Buttons - Bottom of Page */}
      <div className="flex gap-3 justify-end mt-10">
        <Button 
          color="white" 
          className="font-semibold border border-zinc-200" 
          onClick={() => {
            setIsPreviewClosing(false);
            setShowPreviewPanel(true);
          }}
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
    </>
  );
} 
