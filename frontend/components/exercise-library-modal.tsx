'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@/components/dialog';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { 
  MagnifyingGlassIcon, 
  PlayIcon, 
  PlusIcon, 
  FunnelIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/20/solid';
import { 
  fetchAllExercises, 
  fetchExercisesByTarget, 
  fetchExercisesByBodyPart, 
  fetchExercisesByEquipment,
  fetchTargetMuscles,
  fetchBodyParts,
  fetchEquipment,
  searchExercises,
  convertExerciseDBToLocal,
  type ExerciseDBExercise,
  type ExerciseDBTarget,
  type ExerciseDBBodyPart,
  type ExerciseDBEquipment
} from '@/lib/exercise-api';
import { 
  SAMPLE_EXERCISES, 
  SAMPLE_TARGETS, 
  SAMPLE_BODY_PARTS, 
  SAMPLE_EQUIPMENT 
} from '@/lib/sample-exercises';

interface ExerciseLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (exercises: any[]) => void;
  trainerId: number;
}

export default function ExerciseLibraryModal({ 
  open, 
  onClose, 
  onImport, 
  trainerId 
}: ExerciseLibraryModalProps) {
  const [exercises, setExercises] = useState<ExerciseDBExercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<ExerciseDBExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'target' | 'bodyPart' | 'equipment'>('all');
  const [filterValue, setFilterValue] = useState('');
  const [filterOptions, setFilterOptions] = useState<{
    targets: ExerciseDBTarget[];
    bodyParts: ExerciseDBBodyPart[];
    equipment: ExerciseDBEquipment[];
  }>({ targets: [], bodyParts: [], equipment: [] });
  const [error, setError] = useState<string | null>(null);

  // Load filter options on mount
  useEffect(() => {
    if (open) {
      loadFilterOptions();
      loadExercises();
    }
  }, [open]);

  // Load exercises based on current filter
  useEffect(() => {
    if (open) {
      loadExercises();
    }
  }, [filterType, filterValue, open]);

  // Filter exercises based on search term
  useEffect(() => {
    const filtered = exercises.filter(exercise =>
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.bodyPart.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredExercises(filtered);
  }, [exercises, searchTerm]);

  const loadFilterOptions = async () => {
    try {
      setError(null);
      const [targets, bodyParts, equipment] = await Promise.all([
        fetchTargetMuscles(),
        fetchBodyParts(),
        fetchEquipment()
      ]);
      setFilterOptions({ targets, bodyParts, equipment });
    } catch (error) {
      console.error('Error loading filter options:', error);
      setError('Using sample data due to API limitations. You can still import these exercises.');
      // Use sample data as fallback
      setFilterOptions({ 
        targets: SAMPLE_TARGETS, 
        bodyParts: SAMPLE_BODY_PARTS, 
        equipment: SAMPLE_EQUIPMENT 
      });
    }
  };

  const loadExercises = async () => {
    setLoading(true);
    setError(null);
    try {
      let exercisesData: ExerciseDBExercise[] = [];

      switch (filterType) {
        case 'target':
          if (filterValue) {
            exercisesData = await fetchExercisesByTarget(filterValue);
          }
          break;
        case 'bodyPart':
          if (filterValue) {
            exercisesData = await fetchExercisesByBodyPart(filterValue);
          }
          break;
        case 'equipment':
          if (filterValue) {
            exercisesData = await fetchExercisesByEquipment(filterValue);
          }
          break;
        default:
          exercisesData = await fetchAllExercises();
      }

      setExercises(exercisesData);
    } catch (error) {
      console.error('Error loading exercises:', error);
      setError('Using sample exercises due to API limitations. You can still import these exercises.');
      // Use sample data as fallback
      setExercises(SAMPLE_EXERCISES);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadExercises();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const searchResults = await searchExercises(searchTerm);
      setExercises(searchResults);
    } catch (error) {
      console.error('Error searching exercises:', error);
      setError('Failed to search exercises. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExerciseSelection = (exerciseId: string) => {
    const newSelected = new Set(selectedExercises);
    if (newSelected.has(exerciseId)) {
      newSelected.delete(exerciseId);
    } else {
      newSelected.add(exerciseId);
    }
    setSelectedExercises(newSelected);
  };

  const handleImport = () => {
    const selectedExerciseData = exercises.filter(exercise => 
      selectedExercises.has(exercise.id)
    );
    
    const convertedExercises = selectedExerciseData.map(exercise => 
      convertExerciseDBToLocal(exercise, trainerId)
    );
    
    onImport(convertedExercises);
    onClose();
    setSelectedExercises(new Set());
  };

  const getFilterOptions = () => {
    switch (filterType) {
      case 'target':
        return filterOptions.targets.map(t => ({ value: t.name, label: t.name }));
      case 'bodyPart':
        return filterOptions.bodyParts.map(b => ({ value: b.name, label: b.name }));
      case 'equipment':
        return filterOptions.equipment.map(e => ({ value: e.name, label: e.name }));
      default:
        return [];
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Exercise Library</h2>
            <p className="text-gray-600 mt-1">
              Browse and import exercises from the ExerciseDB library
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search exercises by name, target, or body part..."
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              Search
            </Button>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filter by:</span>
            </div>
            
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as any);
                setFilterValue('');
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Exercises</option>
              <option value="target">Target Muscle</option>
              <option value="bodyPart">Body Part</option>
              <option value="equipment">Equipment</option>
            </select>

            {filterType !== 'all' && (
              <select
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Select {filterType === 'target' ? 'muscle' : filterType === 'bodyPart' ? 'body part' : 'equipment'}</option>
                {getFilterOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    if (open) {
                      loadFilterOptions();
                      loadExercises();
                    }
                  }}
                  className="mt-1 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Exercise List */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {loading ? 'Loading...' : `${filteredExercises.length} exercises found`}
              </span>
              {selectedExercises.size > 0 && (
                <span className="text-sm text-blue-600">
                  {selectedExercises.size} selected
                </span>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="text-gray-400">Loading exercises...</div>
              </div>
            ) : filteredExercises.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-2">No exercises found</div>
                <div className="text-sm text-gray-600">Try adjusting your search or filters</div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      selectedExercises.has(exercise.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => toggleExerciseSelection(exercise.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          {selectedExercises.has(exercise.id) ? (
                            <CheckIcon className="w-6 h-6 text-blue-600" />
                          ) : (
                            <PlayIcon className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {exercise.name}
                        </h3>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {exercise.target}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {exercise.bodyPart}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {exercise.equipment}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            {selectedExercises.size > 0 && (
              <span>{selectedExercises.size} exercise(s) selected for import</span>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button outline onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={selectedExercises.size === 0}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Import Selected ({selectedExercises.size})
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
} 