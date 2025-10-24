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
  EyeIcon
} from '@heroicons/react/24/outline';

interface Ingredient {
  id: number;
  name: string;
  category: string;
  description?: string;
  cookingState: string;
  // Before cook values
  caloriesBefore: number;
  proteinBefore: number;
  carbsBefore: number;
  fatsBefore: number;
  // After cook values
  caloriesAfter: number;
  proteinAfter: number;
  carbsAfter: number;
  fatsAfter: number;
  // Common values
  fiber: number;
  sugar: number;
  sodium: number;
  unitType: string;
  servingSize: number;
  costPerUnit?: number;
  allergens?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  'Protein',
  'Carbs',
  'Fats',
  'Vegetables',
  'Fruits',
  'Dairy',
  'Grains',
  'Nuts & Seeds',
  'Legumes',
  'Beverages',
  'Condiments',
  'Other'
];

export default function IngredientsPage() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Ingredient | null>(null);

  // Get trainer ID from localStorage
  const [trainerId, setTrainerId] = useState<number | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    console.log('User from localStorage:', user);
    if (user?.id) {
      setTrainerId(user.id);
      fetchIngredients(user.id);
    } else {
      console.log('No user found in localStorage');
      setLoading(false);
      setError('Please log in to access ingredients. If you need to set up a test user, visit /test-user-setup.html');
    }
  }, []);

  const fetchIngredients = async (trainerId: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        trainerId: trainerId.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      console.log('API URL:', apiUrl);
      console.log('Fetching ingredients with params:', params.toString());
      const response = await fetch(`${apiUrl}/api/ingredients?${params}`);
      const data = await response.json();

      if (response.ok) {
        setIngredients(data.ingredients || []);
      } else {
        setError(data.error || 'Failed to fetch ingredients');
      }
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      setError('Failed to fetch ingredients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trainerId) {
      fetchIngredients(trainerId);
    }
  }, [trainerId]);

  // Debounced search effect
  useEffect(() => {
    if (!trainerId) return;
    
    const timeoutId = setTimeout(() => {
      fetchIngredients(trainerId);
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm, categoryFilter, trainerId]);

  const handleDelete = async (ingredient: Ingredient) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const url = `${apiUrl}/api/ingredients/${ingredient.id}`;
      
      console.log('Delete URL:', url);
      console.log('Deleting ingredient:', ingredient);

      const response = await fetch(url, {
        method: 'DELETE',
      });

      console.log('Delete response status:', response.status);

      if (response.ok) {
        setIngredients(ingredients.filter(i => i.id !== ingredient.id));
        setDeleteConfirm(null);
      } else {
        const errorText = await response.text();
        console.error('Delete error response:', errorText);
        
        // Check if it's an HTML error page
        if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
          setError(`Server returned HTML instead of JSON. This usually means the API URL is incorrect or the server is not running. Status: ${response.status}`);
        } else {
          try {
            const errorData = JSON.parse(errorText);
            setError(errorData.error || 'Failed to delete ingredient');
          } catch {
            setError(`Failed to delete ingredient: ${errorText}`);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      setError('Failed to delete ingredient');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Protein': 'bg-red-100 text-red-800',
      'Carbs': 'bg-blue-100 text-blue-800',
      'Fats': 'bg-yellow-100 text-yellow-800',
      'Vegetables': 'bg-green-100 text-green-800',
      'Fruits': 'bg-purple-100 text-purple-800',
      'Dairy': 'bg-indigo-100 text-indigo-800',
      'Grains': 'bg-orange-100 text-orange-800',
      'Nuts & Seeds': 'bg-amber-100 text-amber-800',
      'Legumes': 'bg-emerald-100 text-emerald-800',
      'Beverages': 'bg-cyan-100 text-cyan-800',
      'Condiments': 'bg-pink-100 text-pink-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || ingredient.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
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
            Please log in to access the ingredients management system.
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
          <h1 className="text-2xl font-bold text-gray-900">Ingredients</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your ingredient library for nutrition programs
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
                placeholder="Search ingredients..."
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
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Ingredient
          </Button>
        </div>
      </div>


      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <Text className="text-red-800">{error}</Text>
        </div>
      )}

      {/* Ingredients Table */}
      {filteredIngredients.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Category</TableHeader>
                <TableHeader>Calories</TableHeader>
                <TableHeader>Macros</TableHeader>
                <TableHeader>Unit</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredIngredients.map((ingredient) => (
                <TableRow key={ingredient.id}>
                  <TableCell>
                    <div className="flex items-center">
                      {ingredient.imageUrl && (
                        <img
                          src={ingredient.imageUrl}
                          alt={ingredient.name}
                          className="w-8 h-8 rounded-full object-cover mr-3"
                        />
                      )}
                      <div>
                        <Text className="font-medium">{ingredient.name}</Text>
                        {ingredient.description && (
                          <Text className="text-sm text-gray-500 truncate max-w-xs">
                            {ingredient.description}
                          </Text>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(ingredient.category)}>
                      {ingredient.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Text className="font-medium">
                        {ingredient.cookingState === 'before_cook' 
                          ? ingredient.caloriesBefore 
                          : ingredient.caloriesAfter}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        ({ingredient.cookingState === 'before_cook' ? 'Raw' : 'Cooked'})
                      </Text>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>P: {ingredient.cookingState === 'before_cook' 
                        ? ingredient.proteinBefore 
                        : ingredient.proteinAfter}g</div>
                      <div>C: {ingredient.cookingState === 'before_cook' 
                        ? ingredient.carbsBefore 
                        : ingredient.carbsAfter}g</div>
                      <div>F: {ingredient.cookingState === 'before_cook' 
                        ? ingredient.fatsBefore 
                        : ingredient.fatsAfter}g</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Text className="text-sm">
                      {ingredient.servingSize}{ingredient.unitType}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setEditingIngredient(ingredient)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(ingredient)}
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
            {searchTerm || categoryFilter !== 'all' ? 'No ingredients found' : 'No ingredients yet'}
          </Heading>
          <Text className="text-gray-600 mb-6">
            {searchTerm || categoryFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first ingredient to start building nutrition programs.'
            }
          </Text>
          {!searchTerm && categoryFilter === 'all' && (
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Your First Ingredient
            </Button>
          )}
        </div>
      )}

      {/* Create/Edit Ingredient Modal */}
      <IngredientModal
        isOpen={showCreateModal || !!editingIngredient}
        onClose={() => {
          setShowCreateModal(false);
          setEditingIngredient(null);
        }}
        ingredient={editingIngredient}
        onSave={(ingredient) => {
          if (editingIngredient) {
            setIngredients(ingredients.map(i => i.id === ingredient.id ? ingredient : i));
          } else {
            setIngredients([...ingredients, ingredient]);
          }
          setShowCreateModal(false);
          setEditingIngredient(null);
        }}
        categories={CATEGORIES}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Ingredient</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
        </DialogDescription>
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
    </div>
  );
}

// Ingredient Modal Component
function IngredientModal({ 
  isOpen, 
  onClose, 
  ingredient, 
  onSave, 
  categories 
}: {
  isOpen: boolean;
  onClose: () => void;
  ingredient?: Ingredient | null;
  onSave: (ingredient: Ingredient) => void;
  categories: string[];
}) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    cookingState: 'before_cook',
    unitType: 'grams',
    servingSize: '100',
    // Before cook values
    caloriesBefore: '',
    proteinBefore: '',
    carbsBefore: '',
    fatsBefore: '',
    // After cook values
    caloriesAfter: '',
    proteinAfter: '',
    carbsAfter: '',
    fatsAfter: '',
    imageUrl: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploadMethod, setImageUploadMethod] = useState<'file' | 'url'>('file');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Clear URL when file is selected
      setFormData(prev => ({ ...prev, imageUrl: '' }));
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, imageUrl: e.target.value }));
    // Clear file when URL is entered
    setImageFile(null);
  };

  useEffect(() => {
    if (ingredient) {
      setFormData({
        name: ingredient.name,
        category: ingredient.category,
        description: ingredient.description || '',
        cookingState: ingredient.cookingState || 'before_cook',
        unitType: ingredient.unitType,
        servingSize: ingredient.servingSize.toString(),
        // Before cook values
        caloriesBefore: ingredient.caloriesBefore?.toString() || '',
        proteinBefore: ingredient.proteinBefore?.toString() || '',
        carbsBefore: ingredient.carbsBefore?.toString() || '',
        fatsBefore: ingredient.fatsBefore?.toString() || '',
        // After cook values
        caloriesAfter: ingredient.caloriesAfter?.toString() || '',
        proteinAfter: ingredient.proteinAfter?.toString() || '',
        carbsAfter: ingredient.carbsAfter?.toString() || '',
        fatsAfter: ingredient.fatsAfter?.toString() || '',
        imageUrl: ingredient.imageUrl || '',
      });
    } else {
      setFormData({
        name: '',
        category: '',
        description: '',
        cookingState: 'before_cook',
        unitType: 'grams',
        servingSize: '100',
        // Before cook values
        caloriesBefore: '',
        proteinBefore: '',
        carbsBefore: '',
        fatsBefore: '',
        // After cook values
        caloriesAfter: '',
        proteinAfter: '',
        carbsAfter: '',
        fatsAfter: '',
        imageUrl: '',
      });
    }
    setImageFile(null);
  }, [ingredient]);

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

      const payload = {
        ...formData,
        trainerId,
        // Set default values for removed fields
        fiber: 0,
        sugar: 0,
        sodium: 0,
        allergens: '[]',
        costPerUnit: null,
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const url = ingredient 
        ? `${apiUrl}/api/ingredients/${ingredient.id}`
        : `${apiUrl}/api/ingredients`;

      console.log('API URL:', apiUrl);
      console.log('Full URL:', url);
      console.log('Payload:', payload);

      const method = ingredient ? 'PUT' : 'POST';

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
      console.error('Error saving ingredient:', error);
      setError('Failed to save ingredient');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} size="2xl">
      <DialogTitle>
        {ingredient ? 'Edit Ingredient' : 'Add New Ingredient'}
      </DialogTitle>
      
      <DialogBody>
        <form onSubmit={handleSubmit} className="space-y-6">
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
                {categories.map(category => (
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

            {/* Serving Size, Unit Type, and Cooking State - all in one row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serving Size
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.servingSize}
                  onChange={(e) => setFormData({ ...formData, servingSize: e.target.value })}
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Type
                </label>
                <Select
                  value={formData.unitType}
                  onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                >
                  <option value="grams">Grams</option>
                  <option value="cups">Cups</option>
                  <option value="pieces">Pieces</option>
                  <option value="tablespoons">Tablespoons</option>
                  <option value="teaspoons">Teaspoons</option>
                  <option value="ml">Milliliters</option>
                  <option value="oz">Ounces</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cooking State
                </label>
                <Select
                  value={formData.cookingState}
                  onChange={(e) => setFormData({ ...formData, cookingState: e.target.value })}
                >
                  <option value="before_cook">Before Cook (Raw)</option>
                  <option value="after_cook">After Cook (Cooked)</option>
                </Select>
              </div>
            </div>

          {/* Nutritional Information - Before Cook */}
          {formData.cookingState === 'before_cook' && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Nutritional Information (Before Cook)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calories
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.caloriesBefore}
                    onChange={(e) => setFormData({ ...formData, caloriesBefore: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Protein (g)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.proteinBefore}
                    onChange={(e) => setFormData({ ...formData, proteinBefore: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carbs (g)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.carbsBefore}
                    onChange={(e) => setFormData({ ...formData, carbsBefore: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fats (g)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.fatsBefore}
                    onChange={(e) => setFormData({ ...formData, fatsBefore: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Nutritional Information - After Cook */}
          {formData.cookingState === 'after_cook' && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Nutritional Information (After Cook)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calories
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.caloriesAfter}
                    onChange={(e) => setFormData({ ...formData, caloriesAfter: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Protein (g)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.proteinAfter}
                    onChange={(e) => setFormData({ ...formData, proteinAfter: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carbs (g)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.carbsAfter}
                    onChange={(e) => setFormData({ ...formData, carbsAfter: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fats (g)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.fatsAfter}
                    onChange={(e) => setFormData({ ...formData, fatsAfter: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}


          {/* Image Upload Section - Tabbed Design */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Image</label>
            
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                type="button"
                onClick={() => setImageUploadMethod('file')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  imageUploadMethod === 'file'
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
            {imageUploadMethod === 'file' ? (
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
                  value={formData.imageUrl}
                  onChange={handleImageUrlChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            )}
          </div>

        </form>
      </DialogBody>
      
      <DialogActions>
        <button 
          type="button" 
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <Button type="submit" disabled={loading} onClick={handleSubmit}>
          {loading ? 'Saving...' : (ingredient ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
