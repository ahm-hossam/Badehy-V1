"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import { Select } from '@/components/select';
import { getStoredUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from '@/components/table';
import { Dialog } from '@/components/dialog';
import { Dropdown, DropdownButton, DropdownMenu, DropdownItem } from '@/components/dropdown';
import { Bars3Icon, PencilIcon, PlayIcon } from '@heroicons/react/20/solid';

interface Exercise {
  name: string;
  id: number;
  referenceId?: number;
  videoUrl?: string;
  exerciseType?: 'sets-reps' | 'sets-time' | 'time-only';
  weekStyles?: { [weekId: number]: 'normal' | 'dropset' | 'superset' | 'giantset' | 'rest-pause' | 'pyramid' | 'circuit' };
}
interface Day {
  name: string;
  id: number;
  exercises: Exercise[];
  weeks: Week[];
}
interface Week {
  name: string;
  id: number;
}
type GridData = {
  [dayId: string]: {
    [exerciseId: string]: {
      [weekId: string]: { value: string }
    }
  }
};

export default function ProgramBuilder({ mode, initialData }: { mode: 'create' | 'edit', initialData?: any }) {
  const router = useRouter();
  const [programData, setProgramData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [days, setDays] = useState<Day[]>([{
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
  }]);
  const [gridData, setGridData] = useState<GridData>({});
  const [editingDayId, setEditingDayId] = useState<number | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);

  // Memoized onChange handler to prevent input focus loss
  const handleGridInputChange = useCallback((dayId: string, exerciseId: string, weekId: string, value: string) => {
    setGridData((prev) => {
      const next = { ...prev };
      if (!next[dayId]) next[dayId] = {};
      if (!next[dayId][exerciseId]) next[dayId][exerciseId] = {};
      next[dayId][exerciseId][weekId] = { value };
      return next;
    });
  }, []);

  // Pre-fill state in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      console.log('ProgramBuilder: Processing initialData in edit mode:', initialData);
      console.log('ProgramBuilder: Full initialData structure:', JSON.stringify(initialData, null, 2));
      setProgramData({ name: initialData.name || '', description: initialData.description || '' });
      
      if (initialData.weeks && Array.isArray(initialData.weeks) && initialData.weeks.length > 0) {
        console.log('ProgramBuilder: Processing weeks:', initialData.weeks);
        console.log('ProgramBuilder: Week IDs:', initialData.weeks.map((w: any) => ({ id: w.id, name: w.name })));
        
        // Debug: Show all days from all weeks
        console.log('ProgramBuilder: All days from all weeks:');
        initialData.weeks.forEach((week: any, weekIndex: number) => {
          console.log(`Week ${weekIndex + 1} (${week.id}):`, week.days?.map((d: any) => ({
            id: d.id,
            name: d.name,
            exercisesCount: d.exercises?.length || 0
          })));
        });
        
        // Use the first week's structure as the base to avoid duplication
        const firstWeek = initialData.weeks[0];
        console.log('ProgramBuilder: First week structure:', firstWeek);
        console.log('ProgramBuilder: First week days:', firstWeek.days?.map((d: any) => ({ id: d.id, name: d.name })));
        
        if (firstWeek.days && Array.isArray(firstWeek.days)) {
          // Create unique weeks array - more robust deduplication
          const weekMap = new Map();
          initialData.weeks.forEach((week: any) => {
            if (!weekMap.has(week.id)) {
              weekMap.set(week.id, { id: week.id, name: week.name || '' });
            }
          });
          const uniqueWeeks = Array.from(weekMap.values());
          
          console.log('ProgramBuilder: Unique weeks:', uniqueWeeks);
          
          // Get all exercise data from ALL weeks, not just the first week
          const allExercisesData = new Map();
          initialData.weeks.forEach((week: any, weekIndex: number) => {
            console.log(`Processing week ${weekIndex + 1} (${week.id}):`);
            if (week.days) {
              week.days.forEach((day: any, dayIndex: number) => {
                console.log(`  Day ${dayIndex + 1} (${day.id}): ${day.name}`);
                if (day.exercises) {
                  day.exercises.forEach((ex: any, exIndex: number) => {
                    const key = `${day.id}-${ex.exerciseId}`;
                    allExercisesData.set(key, ex);
                    console.log(`    Exercise ${exIndex + 1} (${ex.id}): ${ex.exercise?.name} - Key: ${key} - Sets: ${ex.sets}, Reps: ${ex.reps}, Duration: ${ex.duration}, Notes: ${ex.notes}`);
                  });
                } else {
                  console.log(`    No exercises found for day ${day.name}`);
                }
              });
            } else {
              console.log(`  No days found for week ${week.name}`);
            }
          });
          
          console.log('ProgramBuilder: All collected exercise data keys:', Array.from(allExercisesData.keys()));
          console.log('ProgramBuilder: All collected exercise data details:', Array.from(allExercisesData.entries()).map(([key, ex]) => ({
            key,
            exerciseName: ex.exercise?.name,
            sets: ex.sets,
            reps: ex.reps,
            duration: ex.duration,
            notes: ex.notes
          })));
          
          // Use first week structure to avoid duplication
          const allDays: Day[] = firstWeek.days.map((day: any) => {
            console.log('Processing day:', day);
            console.log('Day exercises:', day.exercises);
            console.log('Day exercises details:', day.exercises?.map((ex: any) => ({
              id: ex.id,
              exerciseId: ex.exerciseId,
              name: ex.exercise?.name,
              sets: ex.sets,
              reps: ex.reps,
              duration: ex.duration
            })));
            console.log('Day exercises length:', day.exercises?.length || 0);
            
            return {
              name: day.name,
              id: day.id,
              exercises: day.exercises?.map((ex: any) => ({
                name: ex.exercise?.name || '',
                id: ex.id,
                referenceId: ex.exerciseId,
                videoUrl: ex.exercise?.videoUrl,
                exerciseType: ex.notes || 'sets-reps',
                weekStyles: {}
              })) || [],
              weeks: uniqueWeeks
            };
          });
          
          console.log('ProgramBuilder: Processed days:', allDays);
          console.log('ProgramBuilder: Processed days count:', allDays.length);
          console.log('ProgramBuilder: Processed days details:', allDays.map(d => ({ id: d.id, name: d.name, exercisesCount: d.exercises.length })));
          
          setDays(allDays);
          
          // Build grid data from all weeks
          const newGridData: GridData = {};
          
          allDays.forEach((day: any) => {
            if (!newGridData[day.id]) newGridData[day.id] = {};
            
            day.exercises.forEach((exercise: any) => {
              if (!newGridData[day.id][exercise.id]) newGridData[day.id][exercise.id] = {};
              
              day.weeks.forEach((week: any) => {
                // Find the exercise data by matching the actual exercise from backend
                const exerciseData = Array.from(allExercisesData.values()).find(ex => 
                  ex.exercise?.name === exercise.name && 
                  ex.exerciseId === exercise.referenceId
                );
                
                console.log(`Looking for exercise: ${exercise.name} (${exercise.referenceId})`);
                console.log(`Available exercises in allExercisesData:`, Array.from(allExercisesData.values()).map(ex => ({
                  name: ex.exercise?.name,
                  exerciseId: ex.exerciseId,
                  sets: ex.sets,
                  reps: ex.reps,
                  duration: ex.duration,
                  notes: ex.notes
                })));
                console.log(`Found exercise data:`, exerciseData);
                
                let value = '';
                if (exerciseData) {
                  // Build the value string from the exercise data
                  if (exerciseData.sets && exerciseData.reps) {
                    value = `${exerciseData.sets} x ${exerciseData.reps}`;
                  } else if (exerciseData.sets && exerciseData.duration) {
                    value = `${exerciseData.sets} x (${exerciseData.duration}s)`;
                  } else if (exerciseData.duration) {
                    value = `${exerciseData.duration}s`;
                  } else if (exerciseData.notes === 'time-only' && exerciseData.sets && !exerciseData.duration) {
                    // Handle time-only exercises that were saved with sets instead of duration
                    value = `${exerciseData.sets}s`;
                  } else if (exerciseData.notes === 'time-only' && !exerciseData.duration) {
                    // Handle time-only exercises with no duration - show placeholder
                    value = 'Time';
                  } else if (exerciseData.notes === 'sets-time' && exerciseData.sets && !exerciseData.duration) {
                    // Handle sets-time exercises with sets but no duration - show placeholder
                    value = `${exerciseData.sets} x Time`;
                  } else if (exerciseData.notes === 'sets-reps' && exerciseData.sets && exerciseData.reps) {
                    // Handle sets-reps exercises
                    value = `${exerciseData.sets} x ${exerciseData.reps}`;
                  } else if (exerciseData.notes === 'sets-reps' && exerciseData.sets && !exerciseData.reps) {
                    // Handle sets-reps exercises with sets but no reps - show placeholder
                    value = `${exerciseData.sets} x Reps`;
                  }
                  console.log(`Built value: "${value}"`);
                } else {
                  console.log(`No exercise data found for: ${exercise.name}`);
                }
                
                newGridData[day.id][exercise.id][week.id] = { value };
                console.log(`Set grid data [${day.id}][${exercise.id}][${week.id}] = "${value}"`);
              });
            });
          });
          
          console.log('ProgramBuilder: Built grid data:', newGridData);
          setGridData(newGridData);
        }
      }
    }
  }, [mode, initialData]);

  useEffect(() => {
    const fetchAllExercises = async () => {
      try {
        const user = getStoredUser();
        if (!user) {
          setAllExercises([]);
          return;
        }
        const response = await fetch(`/api/exercises?trainerId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setAllExercises(data);
        } else {
          setAllExercises([]);
        }
      } catch {
        setAllExercises([]);
      }
    };
    fetchAllExercises();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProgramData({ ...programData, [e.target.name]: e.target.value });
  };

  // --- 2. When saving (create or edit) ---
  // In handleSave, always send all weeks, even if some are empty
  const handleSave = async () => {
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
      if (!user) throw new Error('No user found');
      
      // Build weeks data - preserve ALL structure, including empty exercises
      const allWeeks = days[0].weeks.map((week, idx) => {
        const weekName = week.name || `Week ${idx + 1}`;
        
        // For each week, include ALL days with ALL exercises (even empty ones)
        const weekDays = days.map((day, dayIndex) => {
          // Include ALL exercises for this day, even if they have no data
          const exercises = day.exercises.map((exercise, exerciseIndex) => {
            const weekData = gridData[day.id]?.[exercise.id]?.[week.id];
            const weekValue = weekData?.value || '';
            
            console.log(`Save: Looking for gridData[${day.id}][${exercise.id}][${week.id}]`);
            console.log(`Save: Found weekData:`, weekData);
            console.log(`Save: Week value: "${weekValue}"`);
            
            // Parse the value to extract sets, reps, duration
            const setsMatch = weekValue.match(/^(\d+)/);
            const repsMatch = weekValue.match(/x\s*(\d+)/);
            const durationMatch = weekValue.match(/\((\d+)s\)/);
            
            const sets = setsMatch ? parseInt(setsMatch[1]) : null;
            const reps = repsMatch ? parseInt(repsMatch[1]) : null;
            const duration = durationMatch ? parseInt(durationMatch[1]) : null;
            
            console.log(`Save: Parsed values - sets: ${sets}, reps: ${reps}, duration: ${duration}`);
            
            // Always include the exercise, even if empty
            return {
              exerciseId: exercise.referenceId || 0,
              order: exerciseIndex + 1,
              sets: sets,
              reps: reps,
              duration: duration,
              restTime: null,
              notes: exercise.exerciseType || 'sets-reps'
            };
          });
          
          // Always include the day, even if it has no exercises with data
          return {
            dayNumber: dayIndex + 1,
            name: day.name,
            exercises
          };
        });
        
        return {
          weekNumber: idx + 1,
          name: weekName,
          days: weekDays
        };
      });
      
      const programDataToSend = {
        trainerId: user.id,
        name: programData.name,
        description: programData.description,
        weeks: allWeeks
      };
      
      console.log('Sending program data:', programDataToSend);
      
      // Validate the data before sending
      const validationErrors = [];
      if (!programDataToSend.name.trim()) {
        validationErrors.push('Program name is required');
      }
      if (!programDataToSend.weeks || programDataToSend.weeks.length === 0) {
        validationErrors.push('At least one week is required');
      }
      
      programDataToSend.weeks.forEach((week, weekIndex) => {
        if (!week.days || week.days.length === 0) {
          validationErrors.push(`Week ${weekIndex + 1} must have at least one day`);
        }
        
        week.days.forEach((day, dayIndex) => {
          if (!day.exercises || day.exercises.length === 0) {
            validationErrors.push(`Day ${dayIndex + 1} in Week ${weekIndex + 1} must have at least one exercise`);
          }
          
          day.exercises.forEach((exercise, exerciseIndex) => {
            if (!exercise.exerciseId || exercise.exerciseId === 0) {
              validationErrors.push(`Exercise ${exerciseIndex + 1} in Day ${dayIndex + 1} of Week ${weekIndex + 1} must have a valid exercise selected`);
            }
          });
        });
      });
      
      if (validationErrors.length > 0) {
        throw new Error(`Validation errors: ${validationErrors.join(', ')}`);
      }
      
      let response;
      if (mode === 'edit' && initialData?.id) {
        response = await fetch(`/api/programs/${initialData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(programDataToSend),
        });
      } else {
        response = await fetch('/api/programs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(programDataToSend),
        });
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save program');
      }
      router.push('/workout-programs?created=1');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save program');
    } finally {
      setSaving(false);
    }
  };

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
        const renumberedWeeks = newWeeks.map((week, index) => ({
          ...week,
          name: `Week ${index + 1}`,
          id: week.id
        }));
        return { ...day, weeks: renumberedWeeks };
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
          }]
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

  // Add DraggableDay and getYouTubeVideoId below the main ProgramBuilder component

const DraggableDay = React.memo(function DraggableDay({ day, dayIdx, days, setDays, deleteWeek, deleteExercise, weeks, exercises, gridData, setGridData, editingDayId, setEditingDayId, allExercises, addExerciseToDay, addWeekToDay, handleGridInputChange }: { day: Day; dayIdx: number; days: Day[]; setDays: (days: Day[]) => void; deleteWeek: (dayId: number, weekId: number) => void; deleteExercise: (dayId: number, exerciseId: number) => void; weeks: Week[]; exercises: Exercise[]; gridData: GridData; setGridData: React.Dispatch<React.SetStateAction<GridData>>; editingDayId: number | null; setEditingDayId: (id: number | null) => void; allExercises: Exercise[]; addExerciseToDay: (dayId: number) => void; addWeekToDay: (dayId: number) => void; handleGridInputChange: (dayId: string, exerciseId: string, weekId: string, value: string) => void; }) {
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
                          onChange={e => handleGridInputChange(String(day.id), String(exercise.id), String(week.id), e.target.value)}
                        />
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
      <Dialog open={videoModal.open} onClose={() => setVideoModal({ open: false, url: null })}>
        <div className="p-4">
          {videoModal.url && (
            <div>
              {videoModal.url.includes('youtube.com') || videoModal.url.includes('youtu.be') ? (
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(videoModal.url)}`}
                  title="Exercise Video"
                  className="w-full h-64 rounded"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : videoModal.url.startsWith('http') ? (
                <video src={videoModal.url} controls autoPlay className="w-full rounded" />
              ) : (
                <video src={`http://localhost:4000${videoModal.url}`} controls autoPlay className="w-full rounded" />
              )}
            </div>
          )}
        </div>
      </Dialog>
    </section>
  );
});

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

  // UI identical to create page
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">{mode === 'edit' ? 'Edit Workout Program' : 'Create Workout Program'}</h1>
      <p className="text-zinc-500 mb-8">{mode === 'edit' ? 'Edit your program structure, days, weeks, and exercises. All changes are saved to the backend.' : 'Build a custom program for your clients. Add days, weeks, and exercises as needed.'}</p>
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
              weeks={day.weeks.filter((week, index, self) => 
                index === self.findIndex(w => w.id === week.id)
              )}
              exercises={day.exercises}
              gridData={gridData}
              setGridData={setGridData}
              editingDayId={editingDayId}
              setEditingDayId={setEditingDayId}
              allExercises={allExercises}
              addExerciseToDay={addExerciseToDay}
              addWeekToDay={addWeekToDay}
              handleGridInputChange={handleGridInputChange}
            />
          ))}
        </SortableContext>
      </DndContext>
      <div className="flex justify-start mt-8">
        <Button color="white" onClick={addDay} className="font-semibold border border-zinc-200">
          + Add Day
        </Button>
      </div>
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
          onClick={handleSave}
          disabled={saving}
          className="font-semibold bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Program'}
        </Button>
      </div>
    </div>
  );
} 