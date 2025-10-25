'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/table';
import { Badge } from '@/components/badge';
import { Text } from '@/components/text';
import { Heading } from '@/components/heading';
import { Input } from '@/components/input';
import { getStoredUser } from '@/lib/auth';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  FireIcon,
  CalendarIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NutritionProgram {
  id: number;
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
  calculatedCalories?: number;
  calculatedProtein?: number;
  calculatedCarbs?: number;
  calculatedFats?: number;
  weeks?: any[];
  meals?: any[];
  createdAt: string;
  updatedAt: string;
}

export default function NutritionProgramsPage() {
  const [nutritionPrograms, setNutritionPrograms] = useState<NutritionProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<NutritionProgram | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      fetchNutritionPrograms(storedUser.id);
    }
  }, []);

  const fetchNutritionPrograms = async (trainerId: number, search = '') => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const url = `${apiUrl}/api/nutrition-programs?trainerId=${trainerId}&page=${page}&limit=${pageSize}&search=${search}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setNutritionPrograms(data.programs || []);
        setTotalPages(data.totalPages || 1);
        setError('');
      } else {
        setError('Failed to fetch nutrition programs');
      }
    } catch (error) {
      console.error('Error fetching nutrition programs:', error);
      setError('Failed to fetch nutrition programs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
    if (user) {
      fetchNutritionPrograms(user.id, value);
    }
  };

  const handleDelete = async (program: NutritionProgram) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/nutrition-programs/${program.id}?trainerId=${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNutritionPrograms(programs => programs.filter(p => p.id !== program.id));
        setDeleteConfirm(null);
        setError('');
      } else {
        setError('Failed to delete nutrition program');
      }
    } catch (error) {
      console.error('Error deleting nutrition program:', error);
      setError('Failed to delete nutrition program');
    }
  };

  const handleDuplicateProgram = async (program: NutritionProgram) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const url = `${apiUrl}/api/nutrition-programs/${program.id}/duplicate?trainerId=${user.id}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const duplicatedProgram = await response.json();
        setNutritionPrograms([duplicatedProgram, ...nutritionPrograms]);
        setError('');
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setError('Failed to duplicate nutrition program');
      }
    } catch (error) {
      console.error('Error duplicating nutrition program:', error);
      setError('Failed to duplicate nutrition program');
    }
  };

  const getDurationText = (program: NutritionProgram) => {
    if (program.programDuration && program.durationUnit) {
      return `${program.programDuration} ${program.durationUnit}`;
    }
    return 'Flexible';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading nutrition programs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level={1}>Nutrition Programs</Heading>
          <Text className="text-gray-600 mt-1">
            Create and manage comprehensive nutrition programs for your clients
          </Text>
        </div>
        <Button
          onClick={() => router.push('/nutrition-programs/create')}
          className="flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Create Program
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <Text className="text-red-800">{error}</Text>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search nutrition programs..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Programs Table */}
      {nutritionPrograms.length === 0 ? (
        <div className="text-center py-12">
          <FireIcon className="mx-auto h-12 w-12 text-gray-400" />
          <Heading level={3} className="mt-2 text-gray-900">No nutrition programs</Heading>
          <Text className="mt-1 text-gray-500">
            Get started by creating your first nutrition program.
          </Text>
          <div className="mt-6">
            <Button
              onClick={() => router.push('/nutrition-programs/create')}
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Create Program
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Program</TableHeader>
                <TableHeader>Duration</TableHeader>
                <TableHeader>Goals</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {nutritionPrograms.map((program) => (
                <TableRow key={program.id}>
                  <TableCell>
                    <div className="flex items-start">
                      <div className="flex-1">
                        <Heading level={4} className="text-gray-900">
                          {program.name}
                        </Heading>
                        {program.description && (
                          <Text className="text-sm text-gray-500 mt-1">
                            {program.description}
                          </Text>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            Created {new Date(program.createdAt).toLocaleDateString()}
                          </div>
                          {program.repeatCount && program.repeatCount > 1 && (
                            <Badge className="bg-blue-100 text-blue-800">
                              {program.repeatCount}x repeat
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      <Text className="text-sm">{getDurationText(program)}</Text>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <Text className="font-medium text-gray-900">
                        {program.targetCalories ? `${program.targetCalories} cal` : 'No target set'}
                      </Text>
                      {program.targetCalories && (
                        <Text className="text-gray-500 mt-1">
                          {program.usePercentages ? (
                            `${program.proteinPercentage}%P | ${program.carbsPercentage}%C | ${program.fatsPercentage}%F`
                          ) : (
                            `${program.targetProtein}gP | ${program.targetCarbs}gC | ${program.targetFats}gF`
                          )}
                        </Text>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => router.push(`/nutrition-programs/${program.id}`)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Program"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/nutrition-programs/create?id=${program.id}`)}
                        className="text-gray-600 hover:text-gray-800"
                        title="Edit Program"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicateProgram(program)}
                        className="text-green-600 hover:text-green-800"
                        title="Duplicate Program"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(program)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded p-1 transition-colors"
                        title="Delete Program"
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
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed top-0 left-0 right-0 bg-black/50 z-40 animate-in fade-in duration-200"
            style={{ height: '100vh' }}
            onClick={() => setDeleteConfirm(null)}
          />
          
          {/* Dialog */}
          <div 
            className="fixed top-0 left-0 right-0 flex items-center justify-center z-50 animate-in fade-in duration-200"
            style={{ height: '100vh' }}
          >
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl animate-in zoom-in-95 duration-200">
              <Heading level={3} className="text-gray-900 mb-4">
                Delete Nutrition Program
              </Heading>
              <Text className="text-gray-600 mb-6">
                Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
              </Text>
              <div className="flex justify-end space-x-3">
                <Button
                  outline
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  color="red"
                  onClick={() => handleDelete(deleteConfirm)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}