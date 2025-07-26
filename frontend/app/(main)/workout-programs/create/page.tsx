'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import { Select } from '@/components/select';
import { getStoredUser } from '@/lib/auth';
import { 
  PlusIcon, 
  TrashIcon, 
  DocumentDuplicateIcon,
  CalendarIcon,
  TableCellsIcon,
  FireIcon,
  ClockIcon,
  Squares2X2Icon,
  ArrowsPointingOutIcon
} from '@heroicons/react/20/solid';
import { useRouter } from 'next/navigation';

interface Exercise {
  id: number;
  name: string;
  videoUrl?: string;
  description?: string;
  category?: string;
}

interface ProgramExercise {
  exerciseId: number;
  exerciseName: string;
  order: number;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
  restTime?: number;
  notes?: string;
}

interface ProgramDay {
  dayNumber: number;
  name?: string;
  exercises: ProgramExercise[];
}

interface ProgramWeek {
  weekNumber: number;
  name?: string;
  days: ProgramDay[];
}

type BuilderMode = 'calendar' | 'table';

export default function CreateProgramPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [builderMode, setBuilderMode] = useState<BuilderMode>('calendar');
  
  // Program metadata
  const [programData, setProgramData] = useState({
    name: '',
    description: '',
  });
  
  // Program structure
  const [weeks, setWeeks] = useState<ProgramWeek[]>([]);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      fetchExercises(storedUser.id);
    }
  }, []);

  const fetchExercises = async (trainerId: number) => {
    try {
      const response = await fetch(`/api/exercises?trainerId=${trainerId}`);
      if (response.ok) {
        const data = await response.json();
        setExercises(data);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  // Common functions
  const addWeek = () => {
    const newWeekNumber = weeks.length + 1;
    const newWeek: ProgramWeek = {
      weekNumber: newWeekNumber,
      name: `Week ${newWeekNumber}`,
      days: []
    };
    setWeeks([...weeks, newWeek]);
  };

  const addDay = (weekIndex: number) => {
    const updatedWeeks = [...weeks];
    const week = updatedWeeks[weekIndex];
    const newDayNumber = week.days.length + 1;
    const newDay: ProgramDay = {
      dayNumber: newDayNumber,
      name: `Day ${newDayNumber}`,
      exercises: []
    };
    week.days.push(newDay);
    setWeeks(updatedWeeks);
  };

  const addExercise = (weekIndex: number, dayIndex: number) => {
    const updatedWeeks = [...weeks];
    const day = updatedWeeks[weekIndex].days[dayIndex];
    const newExercise: ProgramExercise = {
      exerciseId: 0,
      exerciseName: '',
      order: day.exercises.length + 1,
      sets: 3,
      reps: 10,
      weight: 0,
      duration: 0,
      restTime: 60,
      notes: ''
    };
    day.exercises.push(newExercise);
    setWeeks(updatedWeeks);
  };

  const updateExercise = (weekIndex: number, dayIndex: number, exerciseIndex: number, field: keyof ProgramExercise, value: any) => {
    const updatedWeeks = [...weeks];
    const exercise = updatedWeeks[weekIndex].days[dayIndex].exercises[exerciseIndex];
    exercise[field] = value;
    
    // Update exercise name when exerciseId changes
    if (field === 'exerciseId' && value > 0) {
      const selectedExercise = exercises.find(ex => ex.id === value);
      if (selectedExercise) {
        exercise.exerciseName = selectedExercise.name;
      }
    }
    
    setWeeks(updatedWeeks);
  };

  const handleSave = async () => {
    if (!programData.name.trim()) {
      alert('Please enter a program name');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainerId: user.id,
          name: programData.name,
          description: programData.description,
          weeks: weeks
        }),
      });

      if (response.ok) {
        router.push('/workout-programs');
      } else {
        alert('Failed to save program');
      }
    } catch (error) {
      console.error('Error saving program:', error);
      alert('Error saving program');
    } finally {
      setSaving(false);
    }
  };

  const getTotalExercises = () => {
    return weeks.reduce((total, week) => {
      return total + week.days.reduce((dayTotal, day) => {
        return dayTotal + day.exercises.length;
      }, 0);
    }, 0);
  };

  const deleteWeek = (weekIndex: number) => {
    const updatedWeeks = weeks.filter((_, index) => index !== weekIndex);
    setWeeks(updatedWeeks);
  };

  const deleteDay = (weekIndex: number, dayIndex: number) => {
    const updatedWeeks = [...weeks];
    updatedWeeks[weekIndex].days.splice(dayIndex, 1);
    setWeeks(updatedWeeks);
  };

  const deleteExercise = (weekIndex: number, dayIndex: number, exerciseIndex: number) => {
    const updatedWeeks = [...weeks];
    updatedWeeks[weekIndex].days[dayIndex].exercises.splice(exerciseIndex, 1);
    setWeeks(updatedWeeks);
  };

  const duplicateWeek = (weekIndex: number) => {
    const weekToDuplicate = weeks[weekIndex];
    const newWeek: ProgramWeek = {
      weekNumber: weeks.length + 1,
      name: `${weekToDuplicate.name} (Copy)`,
      days: weekToDuplicate.days.map(day => ({
        ...day,
        exercises: day.exercises.map(exercise => ({ ...exercise }))
      }))
    };
    setWeeks([...weeks, newWeek]);
  };

  const duplicateDay = (weekIndex: number, dayIndex: number) => {
    const updatedWeeks = [...weeks];
    const dayToDuplicate = updatedWeeks[weekIndex].days[dayIndex];
    const newDay: ProgramDay = {
      dayNumber: updatedWeeks[weekIndex].days.length + 1,
      name: `${dayToDuplicate.name} (Copy)`,
      exercises: dayToDuplicate.exercises.map(exercise => ({ ...exercise }))
    };
    updatedWeeks[weekIndex].days.push(newDay);
    setWeeks(updatedWeeks);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Create Workout Program</h1>
            <p className="mt-1 text-sm text-gray-600">
              Choose your preferred way to build a comprehensive workout program.
            </p>
          </div>
          
          {/* Builder Mode Selector */}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">Mode:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setBuilderMode('calendar')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  builderMode === 'calendar'
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Calendar</span>
                </div>
              </button>

              <button
                onClick={() => setBuilderMode('table')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  builderMode === 'table'
                    ? 'bg-orange-100 text-orange-700 border border-orange-300'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <TableCellsIcon className="w-4 h-4" />
                  <span>Table</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Program Metadata */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4 mb-6">
        <h2 className="text-base font-medium text-gray-900 mb-3">Program Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Program Name *
            </label>
            <Input
              value={programData.name}
              onChange={(e) => setProgramData({ ...programData, name: e.target.value })}
              placeholder="e.g., Beginner Strength Program"
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              value={programData.description}
              onChange={(e) => setProgramData({ ...programData, description: e.target.value })}
              placeholder="Brief description of the program..."
              rows={2}
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Builder Content */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4 mb-6">
        {builderMode === 'calendar' && (
          <CalendarBuilder
            weeks={weeks}
            exercises={exercises}
            onAddWeek={addWeek}
            onAddDay={addDay}
            onAddExercise={addExercise}
            onUpdateExercise={updateExercise}
            onDeleteWeek={deleteWeek}
            onDeleteDay={deleteDay}
            onDeleteExercise={deleteExercise}
            onDuplicateWeek={duplicateWeek}
            onDuplicateDay={duplicateDay}
          />
        )}

        {builderMode === 'table' && (
          <TableBuilder
            weeks={weeks}
            exercises={exercises}
            onAddWeek={addWeek}
            onAddDay={addDay}
            onAddExercise={addExercise}
            onUpdateExercise={updateExercise}
          />
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        <Button outline onClick={() => router.push('/workout-programs')}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={!programData.name.trim() || saving}
        >
          {saving ? 'Saving...' : 'Save Program'}
        </Button>
      </div>
    </div>
  );
}

// Calendar Builder Component
function CalendarBuilder({ weeks, exercises, onAddWeek, onAddDay, onAddExercise, onUpdateExercise, onDeleteWeek, onDeleteDay, onDeleteExercise, onDuplicateWeek, onDuplicateDay }: any) {
  return (
    <div className="py-6">
      {/* Calendar Grid */}
      <div className="space-y-8">
        {weeks.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-50 rounded-lg p-8 border-2 border-dashed border-gray-300">
              <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No weeks yet</h3>
              <p className="text-gray-600 mb-4">Start by adding your first week to see the calendar view.</p>
              <Button onClick={onAddWeek}>
                <PlusIcon className="w-5 h-5 mr-2" />
                Add Week
              </Button>
            </div>
          </div>
        ) : (
          <>
            {weeks.map((week: any, weekIndex: number) => (
              <div key={weekIndex} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Week Header */}
                <div className="bg-purple-50 border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-purple-900">{week.name}</h3>
                    <div className="flex items-center space-x-2">
                      <Button outline onClick={() => onDuplicateWeek(weekIndex)}>
                        <DocumentDuplicateIcon className="w-4 h-4 mr-1" />
                        Duplicate Week
                      </Button>
                      <Button outline onClick={() => onDeleteWeek(weekIndex)} className="text-red-600 hover:text-red-700">
                        <TrashIcon className="w-4 h-4 mr-1" />
                        Delete Week
                      </Button>
                      <Button outline onClick={() => onAddDay(weekIndex)}>
                        <PlusIcon className="w-4 h-4 mr-1" />
                        Add Day
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="p-6">
                  {week.days.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No days added to this week yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-7 gap-4">
                      {/* Day Headers */}
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, index) => (
                        <div key={dayName} className="text-center">
                          <div className="text-sm font-medium text-gray-500 mb-2">{dayName}</div>
                          <div className="h-32 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
                            {week.days[index] ? (
                              <div className="text-center w-full p-2">
                                <div className="text-xs font-medium text-gray-900 mb-1">
                                  {week.days[index].name}
                                </div>
                                <div className="text-xs text-gray-600 mb-2">
                                  {week.days[index].exercises.length} exercises
                                </div>
                                <Button 
                                  outline 
                                  onClick={() => onAddExercise(weekIndex, index)}
                                  className="text-xs px-2 py-1"
                                >
                                  <PlusIcon className="w-3 h-3 mr-1" />
                                  Add
                                </Button>
                              </div>
                            ) : (
                              <div className="text-gray-400 text-xs">Empty</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Exercise Details */}
                  {week.days.some((day: any) => day.exercises.length > 0) && (
                    <div className="mt-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Exercise Details</h4>
                      <div className="space-y-4">
                        {week.days.map((day: any, dayIndex: number) => (
                          day.exercises.length > 0 && (
                            <div key={dayIndex} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-medium text-gray-900">{day.name}</h5>
                                <div className="flex items-center space-x-2">
                                  <Button outline onClick={() => onDuplicateDay(weekIndex, dayIndex)}>
                                    <DocumentDuplicateIcon className="w-4 h-4 mr-1" />
                                    Duplicate Day
                                  </Button>
                                  <Button outline onClick={() => onDeleteDay(weekIndex, dayIndex)} className="text-red-600 hover:text-red-700">
                                    <TrashIcon className="w-4 h-4 mr-1" />
                                    Delete Day
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-3">
                                {day.exercises.map((exercise: any, exerciseIndex: number) => (
                                  <div key={exerciseIndex} className="bg-gray-50 rounded-lg p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Exercise *
                                        </label>
                                        <Select
                                          value={exercise.exerciseId}
                                          onChange={(e) => onUpdateExercise(weekIndex, dayIndex, exerciseIndex, 'exerciseId', Number(e.target.value))}
                                          className="text-sm"
                                        >
                                          <option value={0}>Select Exercise</option>
                                          {exercises.map((ex: any) => (
                                            <option key={ex.id} value={ex.id}>
                                              {ex.name}
                                            </option>
                                          ))}
                                        </Select>
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Sets
                                        </label>
                                        <Input
                                          type="number"
                                          value={exercise.sets || ''}
                                          onChange={(e) => onUpdateExercise(weekIndex, dayIndex, exerciseIndex, 'sets', Number(e.target.value))}
                                          placeholder="3"
                                          className="text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Reps
                                        </label>
                                        <Input
                                          type="number"
                                          value={exercise.reps || ''}
                                          onChange={(e) => onUpdateExercise(weekIndex, dayIndex, exerciseIndex, 'reps', Number(e.target.value))}
                                          placeholder="10"
                                          className="text-sm"
                                        />
                                      </div>

                                    </div>
                                    <div className="flex justify-end mt-3">
                                      <Button outline onClick={() => onDeleteExercise(weekIndex, dayIndex, exerciseIndex)} className="text-red-600 hover:text-red-700">
                                        <TrashIcon className="w-4 h-4 mr-1" />
                                        Remove Exercise
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Add Week Button - After all weeks */}
            <div className="flex justify-center">
              <Button outline onClick={onAddWeek}>
                <PlusIcon className="w-5 h-5 mr-2" />
                Add Another Week
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Table Builder Component
function TableBuilder({ weeks, exercises, onAddWeek, onAddDay, onAddExercise, onUpdateExercise }: any) {
  return (
    <div className="py-6">
      {/* Table Interface */}
      <div className="space-y-6">
        {weeks.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-50 rounded-lg p-8 border-2 border-dashed border-gray-300">
              <TableCellsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No weeks yet</h3>
              <p className="text-gray-600 mb-4">Start by adding your first week to see the table view.</p>
              <Button onClick={onAddWeek}>
                <PlusIcon className="w-5 h-5 mr-2" />
                Add Week
              </Button>
            </div>
          </div>
        ) : (
          <>
            {weeks.map((week: any, weekIndex: number) => (
              <div key={weekIndex} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Week Header */}
                <div className="bg-orange-50 border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-orange-900">{week.name}</h3>
                    <Button outline onClick={() => onAddDay(weekIndex)}>
                      <PlusIcon className="w-4 h-4 mr-1" />
                      Add Day
                    </Button>
                  </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                  {week.days.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No days added to this week yet.
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Day
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Exercise
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sets
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reps
                          </th>

                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {week.days.map((day: any, dayIndex: number) => (
                          <React.Fragment key={dayIndex}>
                            {/* Day Header Row */}
                            <tr className="bg-orange-50">
                              <td colSpan={5} className="px-4 py-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-orange-900">{day.name}</span>
                                  <Button outline onClick={() => onAddExercise(weekIndex, dayIndex)}>
                                    <PlusIcon className="w-4 h-4 mr-1" />
                                    Add Exercise
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Exercise Rows */}
                            {day.exercises.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-4 py-4 text-center text-gray-500 text-sm">
                                  No exercises added to this day yet.
                                </td>
                              </tr>
                            ) : (
                              day.exercises.map((exercise: any, exerciseIndex: number) => (
                                <tr key={exerciseIndex} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {/* Empty for exercise rows */}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Select
                                      value={exercise.exerciseId}
                                      onChange={(e) => onUpdateExercise(weekIndex, dayIndex, exerciseIndex, 'exerciseId', Number(e.target.value))}
                                      className="text-sm"
                                    >
                                      <option value={0}>Select Exercise</option>
                                      {exercises.map((ex: any) => (
                                        <option key={ex.id} value={ex.id}>
                                          {ex.name}
                                        </option>
                                      ))}
                                    </Select>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Input
                                      type="number"
                                      value={exercise.sets || ''}
                                      onChange={(e) => onUpdateExercise(weekIndex, dayIndex, exerciseIndex, 'sets', Number(e.target.value))}
                                      placeholder="3"
                                      className="text-sm w-20"
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <Input
                                      type="number"
                                      value={exercise.reps || ''}
                                      onChange={(e) => onUpdateExercise(weekIndex, dayIndex, exerciseIndex, 'reps', Number(e.target.value))}
                                      placeholder="10"
                                      className="text-sm w-20"
                                    />
                                  </td>

                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                      Row {exerciseIndex + 1}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ))}
            
            {/* Add Week Button - After all weeks */}
            <div className="flex justify-center">
              <Button outline onClick={onAddWeek}>
                <PlusIcon className="w-5 h-5 mr-2" />
                Add Another Week
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 