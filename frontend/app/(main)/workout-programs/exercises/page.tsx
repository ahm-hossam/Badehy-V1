'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import { Dialog } from '@/components/dialog';
import { getStoredUser } from '@/lib/auth';
import { PlusIcon, PencilIcon, TrashIcon, PlayIcon, LinkIcon, PhotoIcon, MagnifyingGlassIcon, BookOpenIcon } from '@heroicons/react/20/solid';


interface Exercise {
  id: number;
  name: string;
  videoUrl?: string;
  description?: string;
  category?: string;
  trainerId: number;
  createdAt: string;
  updatedAt: string;
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    videoUrl: '',
    description: '',
    category: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [videoInputType, setVideoInputType] = useState<'youtube' | 'upload'>('youtube');
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [showDeletedToast, setShowDeletedToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [videoModal, setVideoModal] = useState<{ open: boolean; url: string | null }>({ open: false, url: null });

  // Filter exercises based on search term
  const filteredExercises = exercises.filter(exercise => {
    return exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (exercise.description && exercise.description.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  useEffect(() => {
    const storedUser = getStoredUser();
    console.log('Stored user:', storedUser);
    
    if (storedUser && storedUser.id) {
      console.log('Using trainerId:', storedUser.id);
      setUser(storedUser);
      fetchExercises(storedUser.id);
    } else {
      console.error('No valid user found');
      setLoading(false);
    }
  }, []);

  const fetchExercises = async (trainerId: number) => {
    try {
      console.log('Fetching custom exercises for trainerId:', trainerId);
      const response = await fetch(`/api/exercises?trainerId=${trainerId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Custom exercises API response data:', data, 'Type:', typeof data);
        
        // Ensure data is an array
        if (Array.isArray(data)) {
          setExercises(data);
        } else if (data && data.error) {
          console.error('API returned error:', data.error);
          setExercises([]);
        } else {
          console.error('Expected array but got:', typeof data, data);
          setExercises([]);
        }
      } else {
        console.error('Failed to fetch custom exercises:', response.status);
        setExercises([]);
      }
    } catch (error) {
      console.error('Error fetching custom exercises:', error);
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };



  const validateYouTubeUrl = (url: string): string | null => {
    if (!url) return null;
    
    // YouTube URL patterns including Shorts
    const patterns = [
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^(https?:\/\/)?(www\.)?(youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      /^(https?:\/\/)?(www\.)?(youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return `https://www.youtube.com/watch?v=${match[4]}`;
      }
    }
    
    return null;
  };

  const handleCreateExercise = async () => {
    if (!formData.name.trim() || !user) {
      setError('Please enter an exercise name');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let validatedVideoUrl = formData.videoUrl;
      
      // Handle YouTube URL validation
      if (formData.videoUrl && videoInputType === 'youtube') {
        const validated = validateYouTubeUrl(formData.videoUrl);
        if (!validated) {
          setError('Please enter a valid YouTube URL');
          setSaving(false);
          return;
        }
        validatedVideoUrl = validated;
      }

      // Handle file upload
      if (selectedFile && videoInputType === 'upload') {
        const formDataToSend = new FormData();
        formDataToSend.append('trainerId', user.id.toString());
        formDataToSend.append('name', formData.name.trim());
        formDataToSend.append('description', formData.description.trim() || '');
        formDataToSend.append('category', formData.category.trim() || '');
        formDataToSend.append('video', selectedFile);

        const response = await fetch('/api/exercises/upload', {
          method: 'POST',
          body: formDataToSend,
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Exercise created with video:', result);
          setShowCreateDialog(false);
          resetForm();
          fetchExercises(user.id);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to create exercise');
        }
      } else {
        // Handle regular exercise creation (no file upload)
        const exerciseData = {
          trainerId: user.id,
          name: formData.name.trim(),
          description: formData.description.trim() || '',
          category: formData.category.trim() || '',
          videoUrl: validatedVideoUrl || '',
        };

        const response = await fetch('/api/exercises', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(exerciseData),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Exercise created:', result);
          setShowCreateDialog(false);
          resetForm();
          fetchExercises(user.id);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to create exercise');
        }
      }
    } catch (error) {
      console.error('Error creating exercise:', error);
      setError('Failed to create exercise');
    } finally {
      setSaving(false);
    }
  };

  const handleEditExercise = async () => {
    if (!editingExercise || !formData.name.trim()) {
      setError('Please enter an exercise name');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const exerciseData = {
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        category: formData.category.trim() || '',
        videoUrl: formData.videoUrl.trim() || '',
      };

      const response = await fetch(`/api/exercises/${editingExercise.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exerciseData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Exercise updated:', result);
        setShowEditDialog(false);
        resetForm();
        fetchExercises(user.id);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update exercise');
      }
    } catch (error) {
      console.error('Error updating exercise:', error);
      setError('Failed to update exercise');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExercise = async (id: number) => {
    try {
      const response = await fetch(`/api/exercises/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('Exercise deleted successfully');
        setConfirmDelete(null);
        setShowDeletedToast(true);
        setTimeout(() => setShowDeletedToast(false), 3000);
        fetchExercises(user.id);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to delete exercise');
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 3000);
      }
    } catch (error) {
      console.error('Error deleting exercise:', error);
      setErrorMessage('Failed to delete exercise');
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    }
  };



  const resetForm = () => {
    setFormData({
      name: '',
      videoUrl: '',
      description: '',
      category: '',
    });
    setSelectedFile(null);
    setError('');
    setVideoInputType('youtube');
  };

  const openEditDialog = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setFormData({
      name: exercise.name,
      videoUrl: exercise.videoUrl || '',
      description: exercise.description || '',
      category: exercise.category || '',
    });
    setShowEditDialog(true);
  };

  const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading exercises...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Exercises</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your custom exercise library
          </p>
        </div>

        {/* Search and Add Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex gap-3 flex-1">
            <div className="relative max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search exercises by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1.5)-1px)] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowCreateDialog(true)} className="px-4">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Exercise
            </Button>
          </div>
        </div>



        {/* Exercises Table */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          {!Array.isArray(filteredExercises) || filteredExercises.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <PlayIcon className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No exercises found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? 'Try adjusting your search.'
                  : 'Create your first exercise to start building workout programs.'
                }
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Exercise
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exercise
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Video
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExercises.map((exercise, index) => (
                    <tr key={exercise.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{exercise.name}</div>
                          {exercise.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {exercise.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {exercise.category ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {exercise.category}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {exercise.videoUrl ? (
                          <div className="flex items-center space-x-2">
                            {(() => {
                              // Handle video URL based on type
                              const getVideoUrl = (videoUrl: string) => {
                                if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                                  return videoUrl; // YouTube URLs are already complete
                                } else if (videoUrl.startsWith('http')) {
                                  return videoUrl; // External URLs are already complete
                                } else {
                                  // Local uploaded video - prefix with backend URL
                                  return `http://localhost:4000${videoUrl}`;
                                }
                              };
                              
                              const processedVideoUrl = getVideoUrl(exercise.videoUrl);
                              const isYouTube = exercise.videoUrl.includes('youtube') || exercise.videoUrl.includes('youtu.be');
                              
                              if (isYouTube) {
                                return (
                                  <button
                                    onClick={() => setVideoModal({ open: true, url: processedVideoUrl })}
                                    className="text-red-600 hover:text-red-800 text-sm flex items-center"
                                  >
                                    <PlayIcon className="w-4 h-4 mr-1" />
                                    YouTube
                                  </button>
                                );
                              } else {
                                return (
                                  <button
                                    onClick={() => setVideoModal({ open: true, url: processedVideoUrl })}
                                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                                  >
                                    <LinkIcon className="w-4 h-4 mr-1" />
                                    View Video
                                  </button>
                                );
                              }
                            })()}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {exercise.createdAt ? new Date(exercise.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditDialog(exercise)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(exercise.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Exercise Dialog */}
        <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)}>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Exercise</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exercise Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Bench Press, Squats"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Strength, Cardio, Flexibility"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video
                </label>
                
                {/* Video Input Type Selector */}
                <div className="flex space-x-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setVideoInputType('youtube')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      videoInputType === 'youtube'
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <PlayIcon className="w-4 h-4" />
                      <span>YouTube Link</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVideoInputType('upload')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      videoInputType === 'upload'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <PhotoIcon className="w-4 h-4" />
                      <span>Upload Video</span>
                    </div>
                  </button>
                </div>

                {videoInputType === 'youtube' ? (
                  <div>
                    <Input
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      placeholder="https://youtube.com/watch?v=... or https://youtu.be/... or https://youtube.com/shorts/..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Paste any YouTube URL format (youtube.com, youtu.be, youtube.com/shorts, etc.)
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="space-y-3">
                      <div>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setSelectedFile(file || null);
                            if (file) {
                              setFormData({ ...formData, videoUrl: file.name });
                            }
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the exercise..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button outline onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateExercise} 
                disabled={!formData.name.trim() || saving}
              >
                {saving ? 'Creating...' : 'Create Exercise'}
              </Button>
            </div>
          </div>
        </Dialog>

        {/* Edit Exercise Dialog */}
        <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)}>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Exercise</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exercise Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Bench Press, Squats"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Strength, Cardio, Flexibility"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video URL
                </label>
                <Input
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the exercise..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button outline onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleEditExercise} 
                disabled={!formData.name.trim() || saving}
              >
                {saving ? 'Updating...' : 'Update Exercise'}
              </Button>
            </div>
          </div>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={confirmDelete !== null} onClose={() => setConfirmDelete(null)}>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delete Exercise</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this exercise? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button outline onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button 
                onClick={() => confirmDelete && handleDeleteExercise(confirmDelete)}
                color="red"
              >
                Delete Exercise
              </Button>
            </div>
          </div>
        </Dialog>

        {/* Success Toast */}
        {showDeletedToast && (
          <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-md p-4 shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Exercise deleted successfully
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {showErrorToast && (
          <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-md p-4 shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Video Modal */}
        <Dialog open={videoModal.open} onClose={() => setVideoModal({ open: false, url: null })}>
          <div className="p-4">
            {videoModal.url && (
              <div>
                {videoModal.url.includes('youtube.com') || videoModal.url.includes('youtu.be') ? (
                  // YouTube video - embed it
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(videoModal.url)}`}
                    title="Exercise Video"
                    className="w-full h-64 rounded"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : videoModal.url.startsWith('http') ? (
                  // External video URL
                  <video src={videoModal.url} controls autoPlay className="w-full rounded" />
                ) : (
                  // Local video file - prefix with backend URL
                  <video src={`http://localhost:4000${videoModal.url}`} controls autoPlay className="w-full rounded" />
                )}
              </div>
            )}
          </div>
        </Dialog>

      </div>
    </div>
  );
}

// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};
 