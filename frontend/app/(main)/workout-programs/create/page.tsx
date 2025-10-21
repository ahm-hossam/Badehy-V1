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
  FireIcon,
  ClockIcon,
  Squares2X2Icon,
  ArrowsPointingOutIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  Bars3Icon,
  PencilIcon,
  PlayIcon,
  ChevronDownIcon
} from '@heroicons/react/20/solid';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableCell
} from '@/components/table';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Dialog } from '@/components/dialog';
import { Dropdown, DropdownButton, DropdownMenu, DropdownItem } from '@/components/dropdown';
import ProgramBuilder from '../ProgramBuilder';

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

interface PDFTemplate {
  id: string;
  name: string;
  category: string;
  fileUrl: string;
  uploadedAt: string;
}

type BuilderMode = 'calendar' | 'spreadsheet';

// Remove legacy builder modes and toggles
// Only render the new WeekGridBuilder
function WeekGridBuilderWithMeta() {
  console.log('WeekGridBuilderWithMeta mounted');
  const router = useRouter();
  const [programData, setProgramData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showCreatedToast, setShowCreatedToast] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProgramData({ ...programData, [e.target.name]: e.target.value });
  };

  // Save program function
  const handleSaveProgram = async () => {
    console.log('Save Program clicked');
    if (!programData.name.trim()) {
      setSaveError('Program name is required');
      return;
    }

    if (days.length === 0) {
      setSaveError('At least one day is required');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const user = getStoredUser();
      if (!user) {
        throw new Error('No user found');
      }

      // Transform frontend data structure to backend format
      const transformedWeeks = days.map((day, dayIndex) => ({
        weekNumber: dayIndex + 1,
        name: `Week ${dayIndex + 1}`,
        days: [{
          dayNumber: 1,
          name: day.name,
          exercises: day.exercises.map((exercise, exerciseIndex) => {
            // Extract week data from gridData for this specific week
            const weekData = gridData[day.id]?.[exercise.id];
            const weekValue = weekData?.[dayIndex + 1]?.value || '';
            
            // Parse the value string to extract sets, reps, duration
            const setsMatch = weekValue.match(/^(\d+)/);
            const repsMatch = weekValue.match(/x\s*(\d+)/);
            const durationMatch = weekValue.match(/\((\d+)s\)/);
            
            return {
              exerciseId: exercise.referenceId || 0,
              order: exerciseIndex + 1,
              sets: setsMatch ? parseInt(setsMatch[1]) : null,
              reps: repsMatch ? parseInt(repsMatch[1]) : null,
              duration: durationMatch ? parseInt(durationMatch[1]) : null,
              restTime: null,
              notes: exercise.exerciseType || 'sets-reps'
            };
          })
        }]
      }));

      const programDataToSend = {
        trainerId: user.id,
        name: programData.name,
        description: programData.description,
        weeks: transformedWeeks
      };

      const response = await fetch('/api/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(programDataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save program');
      }
      // Remove alert and local toast, just redirect with query param
      router.push('/workout-programs?created=1');
      
    } catch (error) {
      console.error('Error saving program:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save program');
    } finally {
      setSaving(false);
    }
  };
  
  // State for days and grid data
  const [days, setDays] = React.useState<Day[]>([
    { 
      name: 'Day 1', 
      id: 1, 
      exercises: [{
        name: '',
        id: Date.now() + Math.random(),
        referenceId: 0,
        videoUrl: undefined,
        exerciseType: 'sets-reps'
      }],
      weeks: [
        { name: 'Week 1', id: 1 },
        { name: 'Week 2', id: 2 },
        { name: 'Week 3', id: 3 },
        { name: 'Week 4', id: 4 },
      ]
    },
  ]);
  const [gridData, setGridData] = React.useState<GridData>({});
  const [editingDayId, setEditingDayId] = React.useState<number | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);

  // Fetch all exercises on mount (if not already done)
  useEffect(() => {
    const fetchAllExercises = async () => {
      try {
        const user = getStoredUser();
        if (!user) {
          console.error('No user found');
          setAllExercises([]);
          return;
        }

        const response = await fetch(`/api/exercises?trainerId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setAllExercises(data);
        } else {
          console.error('Failed to fetch exercises:', response.status);
          setAllExercises([]);
        }
      } catch (error) {
        console.error('Error fetching exercises:', error);
        setAllExercises([]);
      }
    };
    fetchAllExercises();
  }, []);

  // Add Day handler
  const addDay = () => {
    setDays([...days, { 
      name: `Day ${days.length + 1}`, 
      id: Date.now(), 
      exercises: [{
        name: '',
        id: Date.now() + Math.random(),
        referenceId: 0,
        videoUrl: undefined,
        exerciseType: 'sets-reps'
      }],
      weeks: [
        { name: 'Week 1', id: Date.now() + 1 },
        { name: 'Week 2', id: Date.now() + 2 },
        { name: 'Week 3', id: Date.now() + 3 },
        { name: 'Week 4', id: Date.now() + 4 },
      ]
    }]);
  };
  
  // Delete week from a specific day and renumber remaining weeks
  const deleteWeek = (dayId: number, weekId: number) => {
    setDays(days.map(day => {
      if (day.id === dayId) {
        const newWeeks = day.weeks.filter(w => w.id !== weekId);
        // Renumber the remaining weeks
        const renumberedWeeks = newWeeks.map((week, index) => ({
          ...week,
          name: `Week ${index + 1}`,
          id: week.id
        }));
        return {
          ...day,
          weeks: renumberedWeeks
        };
      }
      return day;
    }));
  };
  
  // Add week to a specific day
  const addWeekToDay = (dayId: number) => {
    setDays(days.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          weeks: [...day.weeks, { 
            name: `Week ${day.weeks.length + 1}`, 
            id: Date.now() + Math.random() 
          }]
        };
      }
      return day;
    }));
  };
  
  // Delete exercise from a specific day
  const deleteExercise = (dayId: number, exerciseId: number) => {
    setDays(days.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          exercises: day.exercises.filter(e => e.id !== exerciseId)
        };
      }
      return day;
    }));
  };
  
  // Add exercise to a specific day
  const addExerciseToDay = (dayId: number) => {
    setDays(days.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          exercises: [...day.exercises, { 
            name: '', 
            id: Date.now() + Math.random(),
            referenceId: 0,
            videoUrl: undefined,
            exerciseType: 'sets-reps'
          }] // Ensure unique ID
        };
      }
      return day;
    }));
  };

  // DnD setup
  const sensors = useSensors(useSensor(PointerSensor));
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = days.findIndex(d => d.id === active.id);
      const newIndex = days.findIndex(d => d.id === over.id);
      setDays(arrayMove(days, oldIndex, newIndex));
    }
  };
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">Create Workout Program</h1>
      <p className="text-zinc-500 mb-8">Build a custom program for your clients. Add days, weeks, and exercises as needed.</p>
      <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">Program Details</h2>
        <div className="mb-4">
          <label htmlFor="program-name" className="block text-sm font-medium text-zinc-700 mb-1">Program Name</label>
          <Input
            id="program-name"
            name="name"
            placeholder="Program Name"
            value={programData.name}
            onChange={handleChange}
            className="text-base"
          />
        </div>
        <div>
          <label htmlFor="program-description" className="block text-sm font-medium text-zinc-700 mb-1">Program Description</label>
          <Textarea
            id="program-description"
            name="description"
            placeholder="Program Description"
            value={programData.description}
            onChange={handleChange}
            className="text-base"
          />
        </div>
      </div>
      <h2 className="text-lg font-semibold text-zinc-900 mb-3">Program Structure</h2>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={days.map(d => d.id)} strategy={verticalListSortingStrategy}>
          {days.map((day, dayIdx) => (
            <DraggableDay
              key={day.id}
              day={day}
              dayIdx={dayIdx}
              days={days}
              setDays={setDays}
              deleteWeek={deleteWeek}
              deleteExercise={deleteExercise}
              weeks={day.weeks}
              exercises={day.exercises}
              gridData={gridData}
              setGridData={setGridData}
              editingDayId={editingDayId}
              setEditingDayId={setEditingDayId}
              allExercises={allExercises}
              addExerciseToDay={addExerciseToDay}
              addWeekToDay={addWeekToDay}
            />
          ))}
        </SortableContext>
      </DndContext>
      
      {/* Add Day button below all day boxes */}
      <div className="flex justify-start mt-8">
        <Button color="white" onClick={addDay} className="font-semibold border border-zinc-200">
          + Add Day
        </Button>
      </div>
      
      {/* Error Display */}
      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error saving program</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{saveError}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex gap-3 justify-end mt-10">
        <Button color="white" className="font-semibold border border-zinc-200" onClick={() => router.push('/workout-programs')}>Cancel</Button>
        <Button 
          onClick={handleSaveProgram}
          disabled={saving}
          className="font-semibold bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Program'}
        </Button>
      </div>
      {showCreatedToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Program created successfully!
          </div>
        </div>
      )}
    </div>
  );
}

import SimpleProgramBuilder from '../SimpleProgramBuilder';

export default function CreateProgramPage() {
  return <SimpleProgramBuilder mode="create" />;
}

// Calendar Builder Component
function CalendarBuilder({ weeks, exercises, onAddWeek, onAddDay, onAddExercise, onUpdateExercise, onDeleteWeek, onDeleteDay, onDeleteExercise, onDuplicateWeek, onDuplicateDay }: any) {
  return (
    <div className="py-6">
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
        <div className="space-y-6">
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
                    {Array.from({ length: 7 }, (_, index) => (
                      <div key={index} className="text-center">
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
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-3">
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
                                      <Input
                                        type="number"
                                        value={exercise.sets || ''}
                                        onChange={(e) => onUpdateExercise(weekIndex, dayIndex, exerciseIndex, 'sets', Number(e.target.value))}
                                        placeholder="Sets"
                                        className="text-sm w-16"
                                      />
                                      <Input
                                        type="number"
                                        value={exercise.reps || ''}
                                        onChange={(e) => onUpdateExercise(weekIndex, dayIndex, exerciseIndex, 'reps', Number(e.target.value))}
                                        placeholder="Reps"
                                        className="text-sm w-16"
                                      />
                                    </div>
                                    <Button outline onClick={() => onDeleteExercise(weekIndex, dayIndex, exerciseIndex)} className="text-red-600 hover:text-red-700">
                                      <TrashIcon className="w-4 h-4" />
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
        </div>
      )}
    </div>
  );
}



// Spreadsheet Builder Component
function SpreadsheetBuilder({ weeks, exercises, onAddWeek, onAddDay, onAddExercise, onUpdateExercise, onDeleteWeek, onDeleteDay, onDeleteExercise, onDuplicateWeek, onDuplicateDay }: any) {
  const [editingCell, setEditingCell] = useState<{weekIndex: number, dayIndex: number, exerciseIndex: number, field: string} | null>(null);
  const [hoveredRow, setHoveredRow] = useState<{weekIndex: number, dayIndex: number, exerciseIndex: number} | null>(null);

  const handleCellEdit = (weekIndex: number, dayIndex: number, exerciseIndex: number, field: string, value: any) => {
    onUpdateExercise(weekIndex, dayIndex, exerciseIndex, field, value);
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, weekIndex: number, dayIndex: number, exerciseIndex: number, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const target = e.target as HTMLInputElement;
      handleCellEdit(weekIndex, dayIndex, exerciseIndex, field, target.value);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const getExerciseName = (exerciseId: number) => {
    const exercise = exercises.find((ex: any) => ex.id === exerciseId);
    return exercise ? exercise.name : 'Select Exercise';
  };

  return (
    <div className="py-6">
      {/* Quick Stats Summary */}
      {weeks.length > 0 && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{weeks.length}</div>
                <div className="text-sm text-gray-600">Weeks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {weeks.reduce((total: number, week: any) => total + week.days.length, 0)}
                </div>
                <div className="text-sm text-gray-600">Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {weeks.reduce((total: number, week: any) => 
                    total + week.days.reduce((dayTotal: number, day: any) => dayTotal + day.exercises.length, 0), 0
                  )}
                </div>
                <div className="text-sm text-gray-600">Exercises</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">💡 Quick Tips</div>
              <div className="text-xs text-gray-400 space-y-1">
                <div>• Click any cell to edit • Press Enter to save • Press Esc to cancel</div>
                <div>• Use Tab to navigate • Hover for actions</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {weeks.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border-2 border-dashed border-green-300 shadow-sm">
            <Squares2X2Icon className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-900 mb-2">Ready to Build Your Program?</h3>
            <p className="text-green-700 mb-6 max-w-md mx-auto">Start by adding your first week to create a comprehensive workout program in our spreadsheet view.</p>
            <Button onClick={onAddWeek} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3">
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Your First Week
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {weeks.map((week: any, weekIndex: number) => (
            <div key={weekIndex} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Enhanced Week Header */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">{weekIndex + 1}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-green-900">{week.name}</h3>
                    <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      {week.days.length} day{week.days.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button outline onClick={() => onDuplicateWeek(weekIndex)} className="text-green-700 border-green-300 hover:bg-green-50">
                      <DocumentDuplicateIcon className="w-4 h-4 mr-1" />
                      Duplicate
                    </Button>
                    <Button outline onClick={() => onDeleteWeek(weekIndex)} className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50">
                      <TrashIcon className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                    <Button outline onClick={() => onAddDay(weekIndex)} className="bg-green-600 text-white border-green-600 hover:bg-green-700">
                      <PlusIcon className="w-4 h-4 mr-1" />
                      Add Day
                    </Button>
                  </div>
                </div>
              </div>

              {/* Enhanced Spreadsheet Grid */}
              <div className="overflow-x-auto">
                {week.days.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
                      <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No days added yet</h4>
                      <p className="text-gray-600 mb-4">Add your first day to start building your workout program.</p>
                      <Button outline onClick={() => onAddDay(weekIndex)} className="border-green-300 text-green-700 hover:bg-green-50">
                        <PlusIcon className="w-4 h-4 mr-1" />
                        Add Day
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-gray-50">
                            Day
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-gray-50">
                            Exercise
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-gray-50">
                            Sets
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-gray-50">
                            Reps
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-gray-50">
                            Rest (sec)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 bg-gray-50">
                            Notes
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {week.days.map((day: any, dayIndex: number) => (
                          <React.Fragment key={dayIndex}>
                            {/* Enhanced Day Header Row */}
                            <tr className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                              <td colSpan={7} className="px-4 py-3 border-r border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                                      <span className="text-white font-semibold text-xs">{dayIndex + 1}</span>
                                    </div>
                                    <span className="font-semibold text-green-900">{day.name}</span>
                                    <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                      {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button outline onClick={() => onDuplicateDay(weekIndex, dayIndex)} className="text-green-700 border-green-300 hover:bg-green-50 text-xs">
                                      <DocumentDuplicateIcon className="w-3 h-3 mr-1" />
                                      Duplicate
                                    </Button>
                                    <Button outline onClick={() => onDeleteDay(weekIndex, dayIndex)} className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50 text-xs">
                                      <TrashIcon className="w-3 h-3 mr-1" />
                                      Delete
                                    </Button>
                                    <Button outline onClick={() => onAddExercise(weekIndex, dayIndex)} className="bg-green-600 text-white border-green-600 hover:bg-green-700 text-xs">
                                      <PlusIcon className="w-3 h-3 mr-1" />
                                      Add Exercise
                                    </Button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Exercise Rows */}
                            {day.exercises.length === 0 ? (
                              <tr className="hover:bg-gray-50">
                                <td colSpan={7} className="px-4 py-6 text-center">
                                  <div className="flex flex-col items-center space-y-2">
                                    <FireIcon className="w-8 h-8 text-gray-400" />
                                    <span className="text-gray-500 text-sm">No exercises added to this day yet.</span>
                                    <Button outline onClick={() => onAddExercise(weekIndex, dayIndex)} className="text-green-700 border-green-300 hover:bg-green-50 text-xs">
                                      <PlusIcon className="w-3 h-3 mr-1" />
                                      Add Your First Exercise
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              day.exercises.map((exercise: any, exerciseIndex: number) => (
                                <tr 
                                  key={exerciseIndex} 
                                  className={`hover:bg-green-50 transition-colors ${
                                    hoveredRow?.weekIndex === weekIndex && 
                                    hoveredRow?.dayIndex === dayIndex && 
                                    hoveredRow?.exerciseIndex === exerciseIndex 
                                      ? 'bg-green-50' : ''
                                  }`}
                                  onMouseEnter={() => setHoveredRow({weekIndex, dayIndex, exerciseIndex})}
                                  onMouseLeave={() => setHoveredRow(null)}
                                >
                                  <td className="px-4 py-3 text-sm text-gray-500 border-r border-gray-200">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                        #{exerciseIndex + 1}
                                      </span>
                                    </div>
                                  </td>
                                  
                                  <td className="px-4 py-3 border-r border-gray-200">
                                    {editingCell?.weekIndex === weekIndex && 
                                     editingCell?.dayIndex === dayIndex && 
                                     editingCell?.exerciseIndex === exerciseIndex && 
                                     editingCell?.field === 'exerciseId' ? (
                                      <Select
                                        value={exercise.exerciseId}
                                        onChange={(e) => handleCellEdit(weekIndex, dayIndex, exerciseIndex, 'exerciseId', Number(e.target.value))}
                                        onBlur={() => setEditingCell(null)}
                                        onKeyDown={(e) => handleKeyDown(e, weekIndex, dayIndex, exerciseIndex, 'exerciseId')}
                                        className="text-sm w-full"
                                        autoFocus
                                      >
                                        <option value={0}>Select Exercise</option>
                                        {exercises.map((ex: any) => (
                                          <option key={ex.id} value={ex.id}>
                                            {ex.name}
                                          </option>
                                        ))}
                                      </Select>
                                    ) : (
                                      <div 
                                        className="text-sm text-gray-900 cursor-pointer hover:bg-white hover:border hover:border-green-300 rounded px-2 py-1 transition-all"
                                        onClick={() => setEditingCell({weekIndex, dayIndex, exerciseIndex, field: 'exerciseId'})}
                                      >
                                        {getExerciseName(exercise.exerciseId)}
                                      </div>
                                    )}
                                  </td>
                                  
                                  <td className="px-4 py-3 border-r border-gray-200">
                                    {editingCell?.weekIndex === weekIndex && 
                                     editingCell?.dayIndex === dayIndex && 
                                     editingCell?.exerciseIndex === exerciseIndex && 
                                     editingCell?.field === 'sets' ? (
                                      <Input
                                        type="number"
                                        value={exercise.sets || ''}
                                        onChange={(e) => onUpdateExercise(weekIndex, dayIndex, exerciseIndex, 'sets', Number(e.target.value))}
                                        onBlur={() => setEditingCell(null)}
                                        onKeyDown={(e) => handleKeyDown(e, weekIndex, dayIndex, exerciseIndex, 'sets')}
                                        placeholder="3"
                                        className="text-sm w-16 text-center"
                                        autoFocus
                                      />
                                    ) : (
                                      <div 
                                        className="text-sm text-gray-900 cursor-pointer hover:bg-white hover:border hover:border-green-300 rounded px-2 py-1 transition-all text-center"
                                        onClick={() => setEditingCell({weekIndex, dayIndex, exerciseIndex, field: 'sets'})}
                                      >
                                        {exercise.sets || '-'}
                                      </div>
                                    )}
                                  </td>
                                  
                                  <td className="px-4 py-3 border-r border-gray-200">
                                    {editingCell?.weekIndex === weekIndex && 
                                     editingCell?.dayIndex === dayIndex && 
                                     editingCell?.exerciseIndex === exerciseIndex && 
                                     editingCell?.field === 'reps' ? (
                                      <Input
                                        type="number"
                                        value={exercise.reps || ''}
                                        onChange={(e) => onUpdateExercise(weekIndex, dayIndex, exerciseIndex, 'reps', Number(e.target.value))}
                                        onBlur={() => setEditingCell(null)}
                                        onKeyDown={(e) => handleKeyDown(e, weekIndex, dayIndex, exerciseIndex, 'reps')}
                                        placeholder="10"
                                        className="text-sm w-16 text-center"
                                        autoFocus
                                      />
                                    ) : (
                                      <div 
                                        className="text-sm text-gray-900 cursor-pointer hover:bg-white hover:border hover:border-green-300 rounded px-2 py-1 transition-all text-center"
                                        onClick={() => setEditingCell({weekIndex, dayIndex, exerciseIndex, field: 'reps'})}
                                      >
                                        {exercise.reps || '-'}
                                      </div>
                                    )}
                                  </td>
                                  
                                  <td className="px-4 py-3 border-r border-gray-200">
                                    {editingCell?.weekIndex === weekIndex && 
                                     editingCell?.dayIndex === dayIndex && 
                                     editingCell?.exerciseIndex === exerciseIndex && 
                                     editingCell?.field === 'restTime' ? (
                                      <Input
                                        type="number"
                                        value={exercise.restTime || ''}
                                        onChange={(e) => onUpdateExercise(weekIndex, dayIndex, exerciseIndex, 'restTime', Number(e.target.value))}
                                        onBlur={() => setEditingCell(null)}
                                        onKeyDown={(e) => handleKeyDown(e, weekIndex, dayIndex, exerciseIndex, 'restTime')}
                                        placeholder="60"
                                        className="text-sm w-16 text-center"
                                        autoFocus
                                      />
                                    ) : (
                                      <div 
                                        className="text-sm text-gray-900 cursor-pointer hover:bg-white hover:border hover:border-green-300 rounded px-2 py-1 transition-all text-center"
                                        onClick={() => setEditingCell({weekIndex, dayIndex, exerciseIndex, field: 'restTime'})}
                                      >
                                        {exercise.restTime || '-'}
                                      </div>
                                    )}
                                  </td>
                                  
                                  <td className="px-4 py-3 border-r border-gray-200">
                                    {editingCell?.weekIndex === weekIndex && 
                                     editingCell?.dayIndex === dayIndex && 
                                     editingCell?.exerciseIndex === exerciseIndex && 
                                     editingCell?.field === 'notes' ? (
                                      <Input
                                        type="text"
                                        value={exercise.notes || ''}
                                        onChange={(e) => onUpdateExercise(weekIndex, dayIndex, exerciseIndex, 'notes', e.target.value)}
                                        onBlur={() => setEditingCell(null)}
                                        onKeyDown={(e) => handleKeyDown(e, weekIndex, dayIndex, exerciseIndex, 'notes')}
                                        placeholder="Optional notes..."
                                        className="text-sm w-full"
                                        autoFocus
                                      />
                                    ) : (
                                      <div 
                                        className="text-sm text-gray-600 cursor-pointer hover:bg-white hover:border hover:border-green-300 rounded px-2 py-1 transition-all truncate max-w-32"
                                        onClick={() => setEditingCell({weekIndex, dayIndex, exerciseIndex, field: 'notes'})}
                                        title={exercise.notes || 'Add notes...'}
                                      >
                                        {exercise.notes || 'Add notes...'}
                                      </div>
                                    )}
                                  </td>
                                  
                                  <td className="px-4 py-3">
                                    <div className="flex items-center space-x-1">
                                      <button
                                        onClick={() => onDeleteExercise(weekIndex, dayIndex, exerciseIndex)}
                                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                        title="Delete exercise"
                                      >
                                        <TrashIcon className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => onAddExercise(weekIndex, dayIndex)}
                                        className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                                        title="Add exercise after this one"
                                      >
                                        <PlusIcon className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Enhanced Add Week Button */}
          <div className="flex justify-center pt-4">
            <Button 
              outline 
              onClick={onAddWeek}
              className="border-green-300 text-green-700 hover:bg-green-50 px-6 py-3"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Another Week
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 

// Move WeekGridBuilder to top level
interface Day { 
  name: string; 
  id: number; 
  exercises: Exercise[]; // Each day has its own exercises
  weeks: Week[]; // Each day has its own weeks
}

interface Week { 
  name: string; 
  id: number; 
}

interface Exercise { 
  name: string; 
  id: number; // This will be the unique instance ID
  referenceId?: number; // This will be the exercise type ID from allExercises
  videoUrl?: string;
  exerciseType?: 'sets-reps' | 'sets-time' | 'time-only';
  weekStyles?: { [weekId: number]: 'normal' | 'dropset' | 'superset' | 'giantset' | 'rest-pause' | 'pyramid' | 'circuit' };
}

// gridData[dayId][exerciseId][weekId] = { value: string }
type GridData = {
  [dayId: string]: {
    [exerciseId: string]: {
      [weekId: string]: { value: string }
    }
  }
};
function DraggableDay({ day, dayIdx, days, setDays, deleteWeek, deleteExercise, weeks, exercises, gridData, setGridData, editingDayId, setEditingDayId, allExercises, addExerciseToDay, addWeekToDay }: { day: Day; dayIdx: number; days: Day[]; setDays: (days: Day[]) => void; deleteWeek: (dayId: number, weekId: number) => void; deleteExercise: (dayId: number, exerciseId: number) => void; weeks: Week[]; exercises: Exercise[]; gridData: GridData; setGridData: React.Dispatch<React.SetStateAction<GridData>>; editingDayId: number | null; setEditingDayId: (id: number | null) => void; allExercises: Exercise[]; addExerciseToDay: (dayId: number) => void; addWeekToDay: (dayId: number) => void; }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: day.id });
  const [tempName, setTempName] = React.useState(day.name);
  React.useEffect(() => { if (editingDayId !== day.id) setTempName(day.name); }, [editingDayId, day.name, day.id]);
  const handleEdit = () => setEditingDayId(day.id);
  const handleBlur = () => {
    const newDays = [...days];
    newDays[dayIdx].name = tempName.trim() || day.name;
    setDays(newDays);
    setEditingDayId(null);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleBlur();
    if (e.key === 'Escape') setEditingDayId(null);
  };
  const [videoModal, setVideoModal] = React.useState<{ open: boolean; url: string | null }>({ open: false, url: null });
  
  // Update exercise in the current day
  const updateExerciseInDay = (exerciseIndex: number, field: string, value: any) => {
    const newDays = [...days];
    newDays[dayIdx].exercises[exerciseIndex] = {
      ...newDays[dayIdx].exercises[exerciseIndex],
      [field]: value
    };
    setDays(newDays);
  };
  
  // Get style color and icon
  const getStyleInfo = (style: string | undefined) => {
    switch (style) {
      case 'dropset':
        return { color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: '⬇️', label: 'Drop' };
      case 'superset':
        return { color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: '⚡', label: 'Super' };
      case 'giantset':
        return { color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', icon: '🔥', label: 'Giant' };
      case 'rest-pause':
        return { color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', icon: '⏸️', label: 'Rest-Pause' };
      case 'pyramid':
        return { color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', icon: '🔺', label: 'Pyramid' };
      case 'circuit':
        return { color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', icon: '🔄', label: 'Circuit' };
      default:
        return { color: 'text-zinc-600', bgColor: 'bg-zinc-50', borderColor: 'border-zinc-200', icon: '💪', label: 'Normal' };
    }
  };

  // Update exercise style for a specific week
  const updateExerciseWeekStyle = (exerciseIndex: number, weekId: number, style: string) => {
    const newDays = [...days];
    if (!newDays[dayIdx].exercises[exerciseIndex].weekStyles) {
      newDays[dayIdx].exercises[exerciseIndex].weekStyles = {};
    }
    newDays[dayIdx].exercises[exerciseIndex].weekStyles![weekId] = style as any;
    setDays(newDays);
  };
  
  return (
    <section
      ref={setNodeRef}
      style={{
        transform: transform ? `translateY(${transform.y}px)` : undefined,
        transition,
        opacity: isDragging ? 0.7 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      className="mb-10 bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6 border border-zinc-200 dark:border-zinc-800"
      {...attributes}
    >
      <div className="flex items-center mb-4 justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span {...listeners} className="cursor-grab p-1 flex items-center" title="Drag to reorder">
            <Bars3Icon className="w-5 h-5 text-zinc-400" />
          </span>
          {editingDayId === day.id ? (
            <Input
              className="text-lg font-semibold flex-1 text-zinc-900 dark:text-white bg-transparent border-none focus:ring-0 focus:outline-none px-0"
              value={tempName}
              autoFocus
              onChange={e => setTempName(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <span className="text-lg font-semibold text-zinc-900 dark:text-white cursor-pointer truncate" onClick={handleEdit}>{day.name}</span>
              <button type="button" onClick={handleEdit} className="p-1 rounded hover:bg-zinc-100">
                <PencilIcon className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          )}
        </div>
        <Button plain onClick={() => setDays(days.filter((d) => d.id !== day.id))} className="ml-2" aria-label="Delete day">🗑️</Button>
      </div>
      <div className="flex justify-end mb-4">
        <Button color="white" className="font-semibold border border-zinc-200" onClick={() => addExerciseToDay(day.id)}>Add Exercise</Button>
        <Button color="white" className="font-semibold border border-zinc-200 ml-2" onClick={() => addWeekToDay(day.id)}>Add Week</Button>
      </div>
      <Table grid striped className="rounded-lg overflow-hidden">
        <TableHead>
          <TableRow>
            <TableHeader className="bg-zinc-100 dark:bg-zinc-800 text-center font-semibold py-2 min-w-[240px]">Exercise</TableHeader>
            {weeks.map((week) => (
              <TableHeader key={week.id} className="bg-zinc-100 dark:bg-zinc-800 text-center font-semibold py-2 min-w-[160px]">
                <div className="flex items-center gap-2 justify-center">
                  <span>{week.name}</span>
                  <Button plain onClick={() => deleteWeek(day.id, week.id)} aria-label="Delete week">🗑️</Button>
                </div>
              </TableHeader>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {exercises.map((exercise: Exercise, exIdx: number) => {
            // Find the selected exercise object from allExercises using referenceId or id
            const selectedExercise = allExercises.find(e => e.id === (exercise.referenceId || exercise.id));
            return (
              <TableRow key={exercise.id}>
                <TableCell className="flex items-center gap-2 min-w-[240px]">
                  <div className="flex-1 min-w-[180px]">
                    <Select value={exercise.referenceId || 0} onChange={(e) => {
                      const selectedId = Number((e.target as HTMLSelectElement).value);
                      const selected = allExercises.find(ex => ex.id === selectedId);
                      updateExerciseInDay(exIdx, 'referenceId', selected ? selected.id : 0);
                      updateExerciseInDay(exIdx, 'name', selected ? selected.name : '');
                      updateExerciseInDay(exIdx, 'videoUrl', selected ? selected.videoUrl : undefined);
                    }}>
                      <option value={0}>Select exercise</option>
                      {allExercises.map((ex: Exercise) => (
                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                      ))}
                    </Select>
                  </div>
                  
                  {/* Exercise Type Selector */}
                  <Dropdown>
                    <DropdownButton as="button" className="w-8 h-8 flex items-center justify-center hover:bg-zinc-50 text-zinc-700">
                      <span className="text-sm">
                        {exercise.exerciseType === 'sets-time' ? '⏱️' :
                         exercise.exerciseType === 'time-only' ? '⏰' :
                         '🔢'}
                      </span>
                    </DropdownButton>
                    <DropdownMenu>
                      <DropdownItem onClick={() => updateExerciseInDay(exIdx, 'exerciseType', 'sets-reps')}>
                        🔢 Sets x Reps
                      </DropdownItem>
                      <DropdownItem onClick={() => updateExerciseInDay(exIdx, 'exerciseType', 'sets-time')}>
                        ⏱️ Sets x Time
                      </DropdownItem>
                      <DropdownItem onClick={() => updateExerciseInDay(exIdx, 'exerciseType', 'time-only')}>
                        ⏰ Time Only
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                  
                  {/* Show play icon if videoUrl exists */}
                  {exercise.videoUrl && (
                    <button type="button" onClick={() => setVideoModal({ open: true, url: exercise.videoUrl || null })} className="p-1 rounded hover:bg-zinc-100" aria-label="Play video">
                      <PlayIcon className="w-5 h-5 text-zinc-500" />
                    </button>
                  )}
                  <Button plain onClick={() => deleteExercise(day.id, exercise.id)} aria-label="Delete exercise">🗑️</Button>
                </TableCell>
                {weeks.map((week) => {
                  const weekStyle = exercise.weekStyles?.[week.id] || 'normal';
                  const styleInfo = getStyleInfo(weekStyle);
                  return (
                    <TableCell key={week.id} className={`${styleInfo.bgColor} ${styleInfo.borderColor} border-l-4`}>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder={
                            exercise.exerciseType === 'sets-time' ? 'Sets x Time' :
                            exercise.exerciseType === 'time-only' ? 'Time' :
                            'Sets x Reps'
                          }
                          value={
                            (gridData?.[String(day.id)]?.[String(exercise.id)]?.[String(week.id)]?.value) || ''
                          }
                          onChange={e => {
                            setGridData((prev) => {
                              const next = { ...prev };
                              if (!next[String(day.id)]) next[String(day.id)] = {};
                              if (!next[String(day.id)][String(exercise.id)]) next[String(day.id)][String(exercise.id)] = {};
                              next[String(day.id)][String(exercise.id)][String(week.id)] = { value: e.target.value };
                              return next;
                            });
                          }}
                        />
                        
                        {/* Exercise Style Selector for this week */}
                        <Dropdown>
                          <DropdownButton as="button" className="w-8 h-8 flex items-center justify-center hover:bg-zinc-50 text-zinc-700">
                            <span className="text-sm">{styleInfo.icon}</span>
                          </DropdownButton>
                          <DropdownMenu>
                            <DropdownItem onClick={() => updateExerciseWeekStyle(exIdx, week.id, 'normal')}>
                              💪 Normal
                            </DropdownItem>
                            <DropdownItem onClick={() => updateExerciseWeekStyle(exIdx, week.id, 'dropset')}>
                              ⬇️ Dropset
                            </DropdownItem>
                            <DropdownItem onClick={() => updateExerciseWeekStyle(exIdx, week.id, 'superset')}>
                              ⚡ Superset
                            </DropdownItem>
                            <DropdownItem onClick={() => updateExerciseWeekStyle(exIdx, week.id, 'giantset')}>
                              🔥 Giantset
                            </DropdownItem>
                            <DropdownItem onClick={() => updateExerciseWeekStyle(exIdx, week.id, 'rest-pause')}>
                              ⏸️ Rest-Pause
                            </DropdownItem>
                            <DropdownItem onClick={() => updateExerciseWeekStyle(exIdx, week.id, 'pyramid')}>
                              🔺 Pyramid
                            </DropdownItem>
                            <DropdownItem onClick={() => updateExerciseWeekStyle(exIdx, week.id, 'circuit')}>
                              🔄 Circuit
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {/* Video Modal */}
      <Dialog open={videoModal.open} onClose={() => setVideoModal({ open: false, url: null })}>
        <div className="p-4">
          {videoModal.url && (
            <div>
              {(() => {
                if (videoModal.url.includes('youtube.com') || videoModal.url.includes('youtu.be')) {
                  const videoId = getYouTubeVideoId(videoModal.url);
                  const isShorts = videoModal.url.includes('/shorts/');
                  
                  if (isShorts) {
                    // For YouTube Shorts, convert to embed format but keep mobile dimensions
                    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
                    return (
                      <iframe
                        src={embedUrl}
                        title="Exercise Video"
                        className="w-full h-[600px] rounded"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ aspectRatio: '9/16' }}
                      />
                    );
                  } else {
                    // For regular YouTube videos, use embed URL
                    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
                    return (
                      <iframe
                        src={embedUrl}
                        title="Exercise Video"
                        className="w-full h-64 rounded"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    );
                  }
                } else if (videoModal.url.startsWith('http')) {
                  return (
                    <video src={videoModal.url} controls autoPlay className="w-full rounded" />
                  );
                } else {
                  return (
                    <video src={`http://localhost:4000${videoModal.url}`} controls autoPlay className="w-full rounded" />
                  );
                }
              })()}
            </div>
          )}
        </div>
      </Dialog>
    </section>
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