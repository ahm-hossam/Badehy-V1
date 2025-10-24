'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Select } from '@/components/select';
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeader } from '@/components/table';
import { Badge } from '@/components/badge';
import { Dialog, DialogTitle, DialogDescription, DialogBody, DialogActions } from '@/components/dialog';
import { Heading } from '@/components/heading';
import { Text } from '@/components/text';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface MealIngredient {
  id: number;
  quantity: number;
  unit: string;
  notes?: string;
  ingredient: {
    id: number;
    name: string;
    category: string;
    cookingState: string;
    caloriesBefore: number;
    proteinBefore: number;
    carbsBefore: number;
    fatsBefore: number;
    caloriesAfter: number;
    proteinAfter: number;
    carbsAfter: number;
    fatsAfter: number;
    fiber: number;
    sugar: number;
    sodium: number;
    unitType: string;
    servingSize: number;
    imageUrl?: string;
  };
}

interface Meal {
  id: number;
  name: string;
  description?: string;
  category: string;
  prepTime?: number;
  cookTime?: number;
  servings: number;
  difficulty?: string;
  instructions?: string;
  imageUrl?: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  totalFiber: number;
  totalSugar: number;
  totalSodium: number;
  mealIngredients: MealIngredient[];
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Dessert',
  'Beverage',
  'Appetizer',
  'Side Dish',
  'Main Course',
  'Other'
];

const DIFFICULTY_LEVELS = [
  'Easy',
  'Medium',
  'Hard'
];

export default function MealsPage() {
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Meal | null>(null);

  // Get trainer ID from localStorage
  const [trainerId, setTrainerId] = useState<number | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    console.log('User from localStorage:', user);
    if (user?.id) {
      setTrainerId(user.id);
      fetchMeals(user.id);
    } else {
      console.log('No user found in localStorage');
      setLoading(false);
      setError('Please log in to access meals. If you need to set up a test user, visit /test-user-setup.html');
    }
  }, []);

  const fetchMeals = async (trainerId: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        trainerId: trainerId.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      console.log('API URL:', apiUrl);
      console.log('Fetching meals with params:', params.toString());
      const response = await fetch(`${apiUrl}/api/meals?${params}`);
      const data = await response.json();

      if (response.ok) {
        setMeals(data.meals || []);
      } else {
        setError(data.error || 'Failed to fetch meals');
      }
    } catch (error) {
      console.error('Error fetching meals:', error);
      setError('Failed to fetch meals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trainerId) {
      fetchMeals(trainerId);
    }
  }, [trainerId]);

  // Debounced search effect
  useEffect(() => {
    if (!trainerId) return;
    
    const timeoutId = setTimeout(() => {
      fetchMeals(trainerId);
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm, categoryFilter, trainerId]);

  const handleDelete = async (meal: Meal) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const url = `${apiUrl}/api/meals/${meal.id}?trainerId=${trainerId}`;
      
      console.log('Delete URL:', url);
      console.log('Deleting meal:', meal);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setMeals(meals.filter(m => m.id !== meal.id));
        setDeleteConfirm(null);
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
          setError(`Server returned HTML instead of JSON. This usually means the API URL is incorrect or the server is not running. Status: ${response.status}`);
        } else {
          try {
            const errorData = JSON.parse(errorText);
            setError(errorData.error || 'Failed to delete meal');
          } catch {
            setError(`Server error: ${response.status} - ${errorText}`);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting meal:', error);
      setError('Failed to delete meal');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Breakfast': 'bg-yellow-100 text-yellow-800',
      'Lunch': 'bg-blue-100 text-blue-800',
      'Dinner': 'bg-purple-100 text-purple-800',
      'Snack': 'bg-green-100 text-green-800',
      'Dessert': 'bg-pink-100 text-pink-800',
      'Beverage': 'bg-cyan-100 text-cyan-800',
      'Appetizer': 'bg-orange-100 text-orange-800',
      'Side Dish': 'bg-gray-100 text-gray-800',
      'Main Course': 'bg-red-100 text-red-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: { [key: string]: string } = {
      'Easy': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Hard': 'bg-red-100 text-red-800',
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const filteredMeals = meals.filter(meal => {
    const matchesSearch = meal.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || meal.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading meals...</p>
        </div>
      </div>
    );
  }

  if (!trainerId) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FunnelIcon className="w-8 h-8 text-gray-400" />
          </div>
          <Heading level={3} className="text-gray-900 mb-2">
            Authentication Required
          </Heading>
          <Text className="text-gray-600 mb-6">
            Please log in to access the meals management system.
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Meals</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your meal library for nutrition programs
          </p>
        </div>

        {/* Search and Add Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                key="search-input"
                type="text"
                placeholder="Search meals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="block w-48 pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <Button onClick={() => setShowCreatePanel(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Meal
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <Text className="text-red-800">{error}</Text>
        </div>
      )}

      {/* Meals Table */}
      {filteredMeals.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Meal</TableHeader>
                <TableHeader>Category</TableHeader>
                <TableHeader>Ingredients</TableHeader>
                <TableHeader>Nutrition</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMeals.map((meal) => (
                <TableRow key={meal.id}>
                  <TableCell>
                    <div className="flex items-center">
                      {meal.imageUrl && (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${meal.imageUrl}`}
                          alt={meal.name}
                          className="w-12 h-12 rounded-lg object-cover mr-3"
                        />
                      )}
                      <div>
                        <Text className="font-medium">{meal.name}</Text>
                        {meal.description && (
                          <Text className="text-sm text-gray-500 truncate max-w-xs">
                            {meal.description}
                          </Text>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(meal.category)}>
                      {meal.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {meal.mealIngredients && meal.mealIngredients.length > 0 ? (
                        <div className="space-y-1">
                          {meal.mealIngredients.map((ingredient, index) => (
                            <div key={index} className="text-gray-700">
                              {ingredient.quantity} {ingredient.unit} {ingredient.ingredient?.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">No ingredients</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{Math.round(meal.totalCalories)} cal</div>
                      <div className="text-gray-500">
                        P: {Math.round(meal.totalProtein)}g | C: {Math.round(meal.totalCarbs)}g | F: {Math.round(meal.totalFats)}g
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setEditingMeal(meal);
                          setShowCreatePanel(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(meal)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded p-1 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FunnelIcon className="w-8 h-8 text-gray-400" />
          </div>
          <Heading level={3} className="text-gray-900 mb-2">
            {searchTerm ? 'No meals found' : 'No meals yet'}
          </Heading>
          <Text className="text-gray-600 mb-6">
            {searchTerm
              ? 'Try adjusting your search criteria.'
              : 'Create your first meal to start building nutrition programs.'
            }
          </Text>
          {!searchTerm && (
            <Button onClick={() => setShowCreatePanel(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Your First Meal
            </Button>
          )}
        </div>
      )}

      {/* Create/Edit Meal Side Panel */}
      {showCreatePanel && (
        <MealSidePanel
          meal={editingMeal}
          onSave={(meal) => {
            if (editingMeal) {
              setMeals(meals.map(m => m.id === meal.id ? meal : m));
            } else {
              setMeals([meal, ...meals]);
            }
            setShowCreatePanel(false);
            setEditingMeal(null);
          }}
          onClose={() => {
            setShowCreatePanel(false);
            setEditingMeal(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
          <DialogTitle>Delete Meal</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
          </DialogDescription>
          <DialogBody>
            <Text className="text-gray-600">
              This will permanently remove the meal and all its associated data.
            </Text>
          </DialogBody>
          <DialogActions>
            <button 
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button 
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 hover:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Delete
            </button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}

// Meal Side Panel Component
function MealSidePanel({ meal, onSave, onClose }: { 
  meal: Meal | null; 
  onSave: (meal: Meal) => void; 
  onClose: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    instructions: '',
    imageUrl: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploadMethod, setImageUploadMethod] = useState<'upload' | 'url'>('upload');

  const [ingredients, setIngredients] = useState<any[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpening, setIsOpening] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (meal) {
      setFormData({
        name: meal.name,
        description: meal.description || '',
        category: meal.category,
        instructions: meal.instructions || '',
        imageUrl: meal.imageUrl || '',
      });
      setIngredients(meal.mealIngredients || []);
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        instructions: '',
        imageUrl: '',
      });
      setIngredients([]);
    }
  }, [meal]);

  // Handle opening animation
  useEffect(() => {
    const timer = setTimeout(() => setIsOpening(false), 10);
    return () => clearTimeout(timer);
  }, []);

  // Fetch available ingredients
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
        if (user?.id) {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
          const response = await fetch(`${apiUrl}/api/ingredients?trainerId=${user.id}`);
          const data = await response.json();
          if (response.ok) {
            setAvailableIngredients(data.ingredients || []);
          }
        }
      } catch (error) {
        console.error('Error fetching ingredients:', error);
      }
    };

    fetchIngredients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.name.trim()) {
      setError('Name is required');
      setLoading(false);
      return;
    }
    if (!formData.category) {
      setError('Category is required');
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
      const trainerId = user.id;

      if (!trainerId) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      let imageUrl = formData.imageUrl;

      // Handle image upload if file is selected
      if (imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', imageFile);
        
        const uploadResponse = await fetch(`${apiUrl}/api/meals/upload`, {
          method: 'POST',
          body: formDataUpload,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.imageUrl;
        } else {
          const errorText = await uploadResponse.text();
          setError(`Failed to upload image: ${errorText}`);
          setLoading(false);
          return;
        }
      }

      const payload = {
        ...formData,
        imageUrl,
        trainerId,
        ingredients: ingredients.map(ing => ({
          ingredientId: ing.ingredientId || ing.ingredient?.id,
          quantity: parseFloat(ing.quantity),
          unit: ing.unit,
          notes: ing.notes,
        })),
      };
      const url = meal 
        ? `${apiUrl}/api/meals/${meal.id}`
        : `${apiUrl}/api/meals`;

      console.log('API URL:', apiUrl);
      console.log('Full URL:', url);
      console.log('Payload:', payload);

      const method = meal ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        // Check if it's an HTML error page
        if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
          setError(`Server returned HTML instead of JSON. This usually means the API URL is incorrect or the server is not running. Status: ${response.status}`);
        } else {
          setError(`Server error: ${response.status} - ${errorText}`);
        }
        return;
      }

      const data = await response.json();
      onSave(data);
      onClose();
    } catch (error) {
      console.error('Error saving meal:', error);
      setError('Failed to save meal');
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { ingredientId: '', quantity: '', unit: '', notes: '' }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    
    // If ingredientId is being updated, automatically set the unit based on the ingredient
    if (field === 'ingredientId' && value) {
      // Convert value to number for comparison
      const selectedIngredient = availableIngredients.find(ing => ing.id === parseInt(value));
      if (selectedIngredient) {
        updated[index].unit = selectedIngredient.unitType;
      }
    }
    setIngredients(updated);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setFormData({ ...formData, imageUrl: '' }); // Clear URL when uploading file
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, imageUrl: e.target.value });
    setImageFile(null); // Clear file when entering URL
  };

  // Calculate total nutritional values from ingredients
  const calculateNutritionTotals = () => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    console.log('Calculating nutrition totals...');
    console.log('Ingredients:', ingredients);
    console.log('Available ingredients:', availableIngredients);

    // Only calculate if we have available ingredients loaded
    if (availableIngredients.length === 0) {
      console.log('No available ingredients loaded yet');
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0
      };
    }

    ingredients.forEach((ingredient, index) => {
      console.log(`Processing ingredient ${index}:`, ingredient);
      
      if (ingredient.ingredientId && ingredient.quantity) {
        const quantity = parseFloat(ingredient.quantity) || 0;
        console.log(`Quantity: ${quantity}`);
        
        // Find the ingredient data from availableIngredients
        // Try both string and number comparison
        const ingredientData = availableIngredients.find(ing => 
          ing.id === ingredient.ingredientId || 
          ing.id === parseInt(ingredient.ingredientId) ||
          ing.id.toString() === ingredient.ingredientId.toString()
        );
        console.log(`Found ingredient data:`, ingredientData);
        
        if (ingredientData) {
          // Use cooking state to determine which nutritional values to use
          const isCooked = ingredientData.cookingState === 'after_cook';
          console.log(`Cooking state: ${ingredientData.cookingState}, isCooked: ${isCooked}`);
          
          const calories = isCooked ? ingredientData.caloriesAfter : ingredientData.caloriesBefore;
          const protein = isCooked ? ingredientData.proteinAfter : ingredientData.proteinBefore;
          const carbs = isCooked ? ingredientData.carbsAfter : ingredientData.carbsBefore;
          const fats = isCooked ? ingredientData.fatsAfter : ingredientData.fatsBefore;
          
          console.log(`Nutritional values:`, { calories, protein, carbs, fats });
          
          // Calculate based on quantity and the ingredient's defined serving size
          // Nutritional values are stored per ingredientData.servingSize
          const baseServingSize = parseFloat(ingredientData.servingSize) || 1; // Default to 1 to prevent division by zero
          const multiplier = quantity / baseServingSize;
          
          console.log(`Quantity-based calculation:`, { 
            quantity, 
            baseServingSize,
            multiplier,
            ingredientUnitType: ingredientData.unitType,
            caloriesPerServing: calories,
            proteinPerServing: protein,
            carbsPerServing: carbs,
            fatsPerServing: fats
          });
          
          const caloriesToAdd = (parseFloat(calories) || 0) * multiplier;
          const proteinToAdd = (parseFloat(protein) || 0) * multiplier;
          const carbsToAdd = (parseFloat(carbs) || 0) * multiplier;
          const fatsToAdd = (parseFloat(fats) || 0) * multiplier;
          
          console.log(`Calculated values:`, { 
            caloriesToAdd, 
            proteinToAdd, 
            carbsToAdd, 
            fatsToAdd,
            multiplier
          });
          
          console.log(`Adding to totals:`, { caloriesToAdd, proteinToAdd, carbsToAdd, fatsToAdd });
          
          totalCalories += caloriesToAdd;
          totalProtein += proteinToAdd;
          totalCarbs += carbsToAdd;
          totalFats += fatsToAdd;
        } else {
          console.log(`No ingredient data found for ID: ${ingredient.ingredientId}`);
        }
      } else {
        console.log(`Missing ingredientId or quantity:`, { ingredientId: ingredient.ingredientId, quantity: ingredient.quantity });
      }
    });

    console.log('Final totals:', { totalCalories, totalProtein, totalCarbs, totalFats });

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10, // Round to 1 decimal
      carbs: Math.round(totalCarbs * 10) / 10,
      fats: Math.round(totalFats * 10) / 10
    };
  };

  const nutritionTotals = calculateNutritionTotals();

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match the transition duration
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 h-screen ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />
      
      {/* Side Panel */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 flex flex-col transition-transform duration-300 ease-out ${
        isClosing ? 'translate-x-full' : isOpening ? 'translate-x-full' : 'translate-x-0'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {meal ? 'Edit Meal' : 'Create New Meal'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {meal ? 'Update the meal details below.' : 'Fill in the details to create a new meal.'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <Text className="text-red-800">{error}</Text>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="">Select category</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Image Upload Section - Tabbed Design */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Image</label>
            
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                type="button"
                onClick={() => setImageUploadMethod('upload')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  imageUploadMethod === 'upload'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Image URL
              </button>
            </div>
            
            {/* Tab Content */}
            {imageUploadMethod === 'upload' ? (
              <div>
                <label className="block text-sm text-gray-600 mb-2">Choose file from your computer</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {imageFile && (
                  <p className="mt-2 text-sm text-green-600">
                    Selected: {imageFile.name}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm text-gray-600 mb-2">Enter image URL</label>
                <Input
                  type="url"
                  value={formData.imageUrl}
                  onChange={handleImageUrlChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructions
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Step-by-step cooking instructions..."
            />
          </div>

          {/* Ingredients Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Ingredients
              </label>
              <Button type="button" onClick={addIngredient} size="sm" outline>
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Ingredient
              </Button>
            </div>
            
            {ingredients.length > 0 ? (
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <Select
                        value={ingredient.ingredientId || ingredient.ingredient?.id || ''}
                        onChange={(e) => updateIngredient(index, 'ingredientId', e.target.value)}
                      >
                        <option value="">Select ingredient</option>
                        {availableIngredients.map(ing => (
                          <option key={ing.id} value={ing.id}>{ing.name}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        step="0.1"
                        value={ingredient.quantity}
                        onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                        placeholder="100"
                      />
                    </div>
                    <div className="w-20">
                      <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-700 text-center">
                        {ingredient.unit || '-'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="text"
                        value={ingredient.notes || ''}
                        onChange={(e) => updateIngredient(index, 'notes', e.target.value)}
                        placeholder="Notes (optional)"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FunnelIcon className="w-8 h-8 mx-auto mb-2" />
                <p>No ingredients added yet. Click "Add Ingredient" to get started.</p>
              </div>
            )}
          </div>

          {/* Meal Summary Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Meal Summary
            </label>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {nutritionTotals.calories}
                  </div>
                  <div className="text-sm text-gray-600">Calories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {nutritionTotals.protein}g
                  </div>
                  <div className="text-sm text-gray-600">Protein</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {nutritionTotals.carbs}g
                  </div>
                  <div className="text-sm text-gray-600">Carbs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {nutritionTotals.fats}g
                  </div>
                  <div className="text-sm text-gray-600">Fats</div>
                </div>
              </div>
              {ingredients.length === 0 && (
                <div className="text-center text-gray-500 text-sm mt-2">
                  Add ingredients to see nutritional summary
                </div>
              )}
            </div>
          </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button 
            type="button" 
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <Button 
            type="submit" 
            disabled={loading}
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-gray-900 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (meal ? 'Update' : 'Create')}
          </Button>
        </div>
      </div>
    </>
  );
}
