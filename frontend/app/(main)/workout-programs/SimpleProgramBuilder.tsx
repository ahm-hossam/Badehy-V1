'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import { Select } from '@/components/select';
import { getStoredUser } from '@/lib/auth';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bars3Icon, PencilIcon, ChevronDownIcon, ChevronRightIcon, TrashIcon, PlusIcon, EllipsisVerticalIcon, DocumentDuplicateIcon } from '@heroicons/react/20/solid';
import { Dropdown, DropdownButton, DropdownMenu, DropdownItem } from '@/components/dropdown';
import { Dialog } from '@/components/dialog';

type GroupType = 'none' | 'superset' | 'giant' | 'triset' | 'circuit' | 'emom' | 'tabata' | 'rft' | 'amrap';

type SimpleExercise = {
  id: number;
  key: string;
  exerciseId: number;
  name?: string;
  style: 'sets-reps' | 'sets-time' | 'time-only' | 'distance' | 'calories';
  sets: string;
  reps: string;
  duration: string;
  rest: string;
  tempo: string;
  videoUrl: string;
  notes: string;
  groupType: GroupType;
  groupId?: string;
  order: number;
};

type SimpleDay = {
  id: number;
  name: string;
  exercises: SimpleExercise[];
};

type SimpleWeek = {
  id: number;
  name: string;
  days: SimpleDay[];
};

type ExerciseOption = { id: number; name: string; videoUrl?: string };

// Exercise Row Component
const ExerciseRow = ({ 
  exercise, 
  exerciseIndex, 
  weekIndex, 
  dayIndex, 
  exerciseName, 
  styleText, 
  restText, 
  groupText, 
  allExercises, 
  onEdit, 
  onDelete 
}: {
  exercise: SimpleExercise;
  exerciseIndex: number;
  weekIndex: number;
  dayIndex: number;
  exerciseName: string;
  styleText: string;
  restText: string;
  groupText: string;
  allExercises: ExerciseOption[];
  onEdit: (form: any) => void;
  onDelete: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `ex-${weekIndex}-${dayIndex}-${exercise.id}` });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="px-4 py-3 hover:bg-zinc-50">
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-900 truncate">{exerciseName}</span>
            {(exercise.videoUrl || allExercises.find(x => x.id === exercise.exerciseId)?.videoUrl) && (
              <div className="flex items-center gap-1">
                {(() => {
                  const videoUrl = exercise.videoUrl || allExercises.find(x => x.id === exercise.exerciseId)?.videoUrl;
                  const isYouTube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be');
                  const isUpload = videoUrl?.startsWith('/uploads/') || videoUrl?.includes('/api/exercises/upload');
                  
                  if (isYouTube) {
                    return (
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                        YouTube
                      </a>
                    );
                  } else if (isUpload) {
                    return (
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        Video
                      </a>
                    );
                  } else {
                    return (
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        Video
                      </a>
                    );
                  }
                })()}
              </div>
            )}
          </div>
          {exercise.notes && (
            <p className="text-xs text-zinc-500 mt-1 truncate">{exercise.notes}</p>
          )}
        </div>
        <div className="col-span-2 text-sm text-zinc-700">{styleText}</div>
        <div className="col-span-2 text-sm text-zinc-700">{restText}</div>
        <div className="col-span-2 text-sm text-zinc-700">{groupText}</div>
        <div className="col-span-2">
          <div className="flex items-center gap-1">
            <button
              className="p-1 rounded hover:bg-zinc-100 cursor-grab active:cursor-grabbing"
              aria-label="Drag to reorder exercise"
              {...attributes}
              {...listeners}
            >
              <Bars3Icon className="w-4 h-4 text-zinc-400" />
            </button>
            <button
              onClick={() => onEdit({ 
                exerciseId: exercise.exerciseId, 
                style: exercise.style, 
                sets: exercise.sets, 
                reps: exercise.reps, 
                duration: exercise.duration, 
                rest: exercise.rest, 
                tempo: exercise.tempo, 
                videoUrl: exercise.videoUrl, 
                notes: exercise.notes 
              })}
              className="p-1 rounded hover:bg-zinc-100"
              aria-label="Edit exercise"
            >
              <PencilIcon className="w-4 h-4 text-zinc-500" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 rounded hover:bg-red-50"
              aria-label="Delete exercise"
            >
              <TrashIcon className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SimpleProgramBuilder({ mode = 'create', initialData }: { mode?: 'create' | 'edit'; initialData?: any }) {
  const [weeks, setWeeks] = React.useState<SimpleWeek[]>([]);
  const [programName, setProgramName] = React.useState('');
  const [programDescription, setProgramDescription] = React.useState('');
  const [allExercises, setAllExercises] = React.useState<ExerciseOption[]>([]);
  const [openWeeks, setOpenWeeks] = React.useState<Set<number>>(new Set());
  const [editingWeekId, setEditingWeekId] = React.useState<number | null>(null);
  const [editingDayKey, setEditingDayKey] = React.useState<string | null>(null);
  const [newExerciseModal, setNewExerciseModal] = React.useState<{
    open: boolean;
    wi: number;
    di: number;
    editIndex?: number;
    exerciseGroups: any[];
  } | null>(null);

  // Generate stable IDs - moved outside to avoid recreation
  const generateId = React.useMemo(() => {
    return () => Math.floor(Date.now() * 1000 + Math.random() * 1000);
  }, []);

  // Separate state for editing inputs
  const [editingWeekName, setEditingWeekName] = React.useState('');
  const [editingDayName, setEditingDayName] = React.useState('');

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const router = useRouter();

  // Load exercises
  React.useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    fetch(`/api/exercises?trainerId=${user.id}`).then(async r => {
      const j = await r.json().catch(() => []);
      if (Array.isArray(j)) setAllExercises(j);
    });
  }, []);

  // Hydrate edit or set default
  React.useEffect(() => {
    if (mode === 'edit' && initialData) {
      setProgramName(initialData.name || '');
      setProgramDescription(initialData.description || '');
      if (initialData.weeks) {
        setWeeks(initialData.weeks);
      }
    } else if (mode === 'create' && weeks.length === 0) {
      // Set default week with 1 day for create mode
      const defaultWeekId = generateId();
      setWeeks([{
        id: defaultWeekId,
        name: 'Week 1',
        days: [{
          id: generateId(),
          name: 'Day 1',
          exercises: []
        }]
      }]);
      // Open the default week by default
      setOpenWeeks(new Set([defaultWeekId]));
    }
  }, [mode, initialData, weeks.length, generateId]);

  // dnd setup
  const sensors = useSensors(useSensor(PointerSensor));
  const onDragEnd = (evt: any) => {
    const { active, over } = evt;
    if (!over || active.id === over.id) return;
    
    const aid = String(active.id);
    const oid = String(over.id);
    
    // weeks
    if (aid.startsWith('w-') && oid.startsWith('w-')) {
      const a = weeks.findIndex(w => `w-${w.id}` === aid);
      const o = weeks.findIndex(w => `w-${w.id}` === oid);
      if (a >= 0 && o >= 0) setWeeks(arrayMove(weeks, a, o));
      return;
    }
    // days within same week
    if (aid.startsWith('d-') && oid.startsWith('d-')) {
      const [ , aw, ad ] = aid.split('-');
      const [ , ow, od ] = oid.split('-');
      if (aw !== ow) return; // only reorder within same week
      const wi = weeks.findIndex(w => String(w.id) === aw);
      if (wi < 0) return;
      const a = weeks[wi].days.findIndex(d => `d-${weeks[wi].id}-${d.id}` === aid);
      const o = weeks[wi].days.findIndex(d => `d-${weeks[wi].id}-${d.id}` === oid);
      if (a >= 0 && o >= 0) {
        const newWeeks = [...weeks];
        newWeeks[wi].days = arrayMove(newWeeks[wi].days, a, o);
        setWeeks(newWeeks);
      }
    }
    // exercises within same day
    if (aid.startsWith('ex-') && oid.startsWith('ex-')) {
      const [ , aw, ad, ae ] = aid.split('-');
      const [ , ow, od, oe ] = oid.split('-');
      if (aw !== ow || ad !== od) return; // only reorder within same day
      
      const wi = parseInt(aw);
      const di = parseInt(ad);
      if (wi < 0 || di < 0) return;
      const a = weeks[wi].days[di].exercises.findIndex(e => `ex-${wi}-${di}-${e.id}` === aid);
      const o = weeks[wi].days[di].exercises.findIndex(e => `ex-${wi}-${di}-${e.id}` === oid);
      if (a >= 0 && o >= 0) {
        const newWeeks = [...weeks];
        newWeeks[wi].days[di].exercises = arrayMove(newWeeks[wi].days[di].exercises, a, o);
        setWeeks(newWeeks);
      }
    }
  };

  function DraggableContainer({ id, render, children, className }: { id: string; render: (handle: { attributes: any; listeners: any }) => React.ReactNode; children?: React.ReactNode; className?: string }) {
    const sortable = useSortable({ id });
    const { setNodeRef, transform, transition, attributes, listeners } = sortable;
    const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
    return (
      <div ref={setNodeRef} style={style}>
        <div className={className || ''}>{render({ attributes, listeners })}{children}</div>
      </div>
    );
  }

  const addWeek = useCallback(() => {
    setWeeks(prev => [...prev, { id: generateId(), name: `Week ${prev.length + 1}`, days: [] }]);
  }, [generateId]);

  const addDay = useCallback((wi: number) => {
    setWeeks(prev => prev.map((w, i) => i === wi ? { ...w, days: [...w.days, { id: generateId(), name: `Day ${w.days.length + 1}`, exercises: [] }] } : w));
  }, [generateId]);

  const duplicateWeek = useCallback((wi: number) => {
    setWeeks(prev => {
      const week = prev[wi];
      const newWeek = {
        ...week,
        id: generateId(),
        name: `${week.name} (Copy)`,
        days: week.days.map(day => ({
          ...day,
          id: generateId(),
          name: `${day.name} (Copy)`,
          exercises: day.exercises.map(ex => ({
            ...ex,
            id: generateId(),
            key: `ex-${generateId()}`
          }))
        }))
      };
      const newWeeks = [...prev];
      newWeeks.splice(wi + 1, 0, newWeek);
      return newWeeks;
    });
  }, [generateId]);

  const duplicateDay = useCallback((wi: number, di: number) => {
    setWeeks(prev => prev.map((w, i) => i === wi ? {
      ...w,
      days: w.days.map((d, j) => j === di ? d : d).concat({
        ...w.days[di],
        id: generateId(),
        name: `${w.days[di].name} (Copy)`,
        exercises: w.days[di].exercises.map(ex => ({
          ...ex,
          id: generateId(),
          key: `ex-${generateId()}`
        }))
      })
    } : w));
  }, [generateId]);

  const handleWeekNameChange = useCallback((wi: number, newName: string) => {
    setWeeks(prev => prev.map((w, i) => i === wi ? { ...w, name: newName } : w));
    setEditingWeekId(null);
    setEditingWeekName('');
  }, []);

  const handleDayNameChange = useCallback((wi: number, di: number, newName: string) => {
    setWeeks(prev => prev.map((w, i) => i === wi ? {
      ...w,
      days: w.days.map((d, j) => j === di ? { ...d, name: newName } : d)
    } : w));
    setEditingDayKey(null);
    setEditingDayName('');
  }, []);

  const addExercise = useCallback((wi: number, di: number) => {
    setNewExerciseModal({
      open: true,
      wi,
      di,
      exerciseGroups: [{
        id: generateId(),
        groupType: 'none',
        exercises: [{
          id: generateId(),
          exerciseId: 0,
          style: 'sets-reps',
          sets: '',
          reps: '',
          duration: '',
          rest: '',
          tempo: '',
          videoUrl: '',
          notes: ''
        }]
      }]
    });
  }, [generateId]);

  const deleteExercise = useCallback((wi: number, di: number, ei: number) => {
    setWeeks(prev => prev.map((w, i) => i === wi ? {
      ...w,
      days: w.days.map((d, j) => j === di ? {
        ...d,
        exercises: d.exercises.filter((_, k) => k !== ei)
      } : d)
    } : w));
  }, []);

  const handleSaveExercise = useCallback(() => {
    if (!newExerciseModal) return;
    
    const { wi, di, editIndex, exerciseGroups } = newExerciseModal;
    
    // Flatten all exercises from all groups
    const allExercises = exerciseGroups.flatMap(group => 
      group.exercises.map((exercise: any) => ({
        id: exercise.id,
        key: `ex-${exercise.id}`,
        exerciseId: exercise.exerciseId,
        style: exercise.style,
        sets: exercise.sets,
        reps: exercise.reps,
        duration: exercise.duration,
        rest: exercise.rest,
        tempo: exercise.tempo,
        videoUrl: exercise.videoUrl,
        notes: exercise.notes,
        groupType: group.groupType,
        order: 0
      }))
    );

    setWeeks(prev => prev.map((w, i) => i === wi ? {
      ...w,
      days: w.days.map((d, j) => j === di ? {
        ...d,
        exercises: editIndex !== undefined 
          ? d.exercises.map((ex, k) => k === editIndex ? allExercises[0] : ex)
          : [...d.exercises, ...allExercises]
      } : d)
    } : w));

    setNewExerciseModal(null);
  }, [newExerciseModal]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const user = getStoredUser();
      if (!user) throw new Error('Not authenticated');

      const payload = {
        name: programName,
        description: programDescription,
        trainerId: user.id,
        weeks: weeks.map(week => ({
          name: week.name,
          days: week.days.map(day => ({
            name: day.name,
            exercises: day.exercises.map(ex => ({
              exerciseId: ex.exerciseId,
              style: ex.style,
              sets: ex.sets,
              reps: ex.reps,
              duration: ex.duration,
              rest: ex.rest,
              tempo: ex.tempo,
              videoUrl: ex.videoUrl,
              notes: ex.notes,
              groupType: ex.groupType,
              groupId: ex.groupId,
              order: ex.order
            }))
          }))
        }))
      };

      const res = await fetch(mode === 'edit' && initialData?.id ? `/api/programs/${initialData.id}` : '/api/programs', {
        method: mode === 'edit' && initialData?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save');
      }
      router.push('/workout-programs?created=1');
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">{mode === 'edit' ? 'Edit Workout Program' : 'Create Workout Program'}</h1>
      <p className="text-zinc-500 mb-6">Define weeks, add days, then add exercises with sets×reps or time. Clean and simple.</p>

      <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Program name</label>
            <Input value={programName} onChange={(e) => setProgramName((e.target as HTMLInputElement).value)} placeholder="e.g. 4-Week Hypertrophy" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
            <Textarea value={programDescription} onChange={(e) => setProgramDescription((e.target as HTMLTextAreaElement).value)} placeholder="Optional" />
          </div>
        </div>
      </div>

      {/* Weeks */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={weeks.map(w => `w-${w.id}`)} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {weeks.map((week, wi) => (
              <DraggableContainer key={week.id} id={`w-${week.id}`} className="border-2 border-dotted border-black rounded-xl bg-white" render={({attributes, listeners}) => (
                <div className="bg-zinc-50">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-1 rounded hover:bg-zinc-200 cursor-grab active:cursor-grabbing"
                        {...attributes}
                        {...listeners}
                      >
                        <Bars3Icon className="w-4 h-4 text-zinc-500" />
                      </button>
                      {editingWeekId === week.id ? (
                        <Input
                          value={editingWeekName}
                          onChange={(e) => setEditingWeekName(e.target.value)}
                          onBlur={() => {
                            handleWeekNameChange(wi, editingWeekName);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleWeekNameChange(wi, editingWeekName);
                            }
                            if (e.key === 'Escape') {
                              setEditingWeekId(null);
                              setEditingWeekName('');
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{week.name}</span>
                          <button type="button" className="p-1 rounded hover:bg-zinc-100" onClick={() => {
                            setEditingWeekName(week.name);
                            setEditingWeekId(week.id);
                          }} aria-label="Edit week name">
                            <PencilIcon className="w-4 h-4 text-zinc-500" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" className="w-7 h-7 rounded border border-zinc-300 flex items-center justify-center" onClick={() => setOpenWeeks(prev => { const n=new Set(prev); n.has(week.id) ? n.delete(week.id) : n.add(week.id); return n; })} aria-label="Toggle week">
                        {openWeeks.has(week.id) ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                      </button>
                      <Dropdown>
                        <DropdownButton as="button" className="w-7 h-7 rounded border border-zinc-300 flex items-center justify-center" aria-label="Week actions">
                          <EllipsisVerticalIcon className="w-4 h-4" />
                        </DropdownButton>
                        <DropdownMenu>
                          <DropdownItem onClick={() => addDay(wi)}>Add day</DropdownItem>
                          <DropdownItem onClick={() => duplicateWeek(wi)}>Duplicate Week</DropdownItem>
                          <DropdownItem onClick={() => { const copy=[...weeks]; copy.splice(wi,1); setWeeks(copy); }}>Remove week</DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </div>
                  <div className="h-px bg-zinc-200"></div>
                </div>
              )}>
                {/* Days */}
                {openWeeks.has(week.id) && (
                  <div className="p-4 space-y-5">
                    {week.days.map((day, di) => (
                      <DraggableContainer key={day.id} id={`d-${week.id}-${day.id}`} className="border border-zinc-200 rounded-lg" render={({attributes: dAttrs, listeners: dListeners}) => (
                        <div className="flex items-center justify-between p-3 border-b border-zinc-100">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {editingDayKey === `${week.id}:${day.id}` ? (
                                <Input
                                  value={editingDayName}
                                  onChange={(e) => setEditingDayName(e.target.value)}
                                  onBlur={() => {
                                    handleDayNameChange(wi, di, editingDayName);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleDayNameChange(wi, di, editingDayName);
                                    }
                                    if (e.key === 'Escape') {
                                      setEditingDayKey(null);
                                      setEditingDayName('');
                                    }
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <>
                                  <span className="font-medium">{day.name}</span>
                                  <button type="button" className="p-1 rounded hover:bg-zinc-100" onClick={() => {
                                    setEditingDayName(day.name);
                                    setEditingDayKey(`${week.id}:${day.id}`);
                                  }} aria-label="Edit day name">
                                    <PencilIcon className="w-4 h-4 text-zinc-500" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="w-7 h-7 rounded border border-zinc-300 flex items-center justify-center cursor-grab"
                              aria-label="Drag to reorder day"
                              {...dAttrs}
                              {...dListeners}
                            >
                              <Bars3Icon className="w-4 h-4" />
                            </button>
                            <Dropdown>
                              <DropdownButton as="button" className="w-7 h-7 rounded border border-zinc-300 flex items-center justify-center" aria-label="Day actions">
                                <EllipsisVerticalIcon className="w-4 h-4" />
                              </DropdownButton>
                              <DropdownMenu>
                                <DropdownItem onClick={() => addExercise(wi, di)}>
                                  <PlusIcon className="w-4 h-4" />
                                  Add exercise
                                </DropdownItem>
                                <DropdownItem onClick={() => duplicateDay(wi, di)}>
                                  <DocumentDuplicateIcon className="w-4 h-4" />
                                  Duplicate Day
                                </DropdownItem>
                                <DropdownItem onClick={() => { const c=[...weeks]; c[wi].days.splice(di,1); setWeeks(c); }}>
                                  <TrashIcon className="w-4 h-4" />
                                  Remove Day
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                        </div>
                      )}>

                  {/* Exercises */}
                  <div className="p-3">
                    {day.exercises.length === 0 ? (
                      <div className="text-center py-8 text-zinc-500">
                        <p className="text-sm">No exercises yet.</p>
                        <p className="text-xs mt-1">Click "Add exercise" to get started</p>
                      </div>
                    ) : (
                      <div className="overflow-hidden border border-zinc-200 rounded-lg">
                        {/* Table Header */}
                        <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-2">
                          <div className="grid grid-cols-12 gap-4 text-xs font-medium text-zinc-600 uppercase tracking-wide">
                            <div className="col-span-4">Exercise</div>
                            <div className="col-span-2">Sets × Reps</div>
                            <div className="col-span-2">Rest</div>
                            <div className="col-span-2">Group</div>
                            <div className="col-span-2">Actions</div>
                          </div>
                        </div>
                        {/* Table Body */}
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                          <SortableContext items={day.exercises.map(ex => `ex-${week.id}-${day.id}-${ex.id}`)} strategy={verticalListSortingStrategy}>
                            <div className="divide-y divide-zinc-200">
                          {day.exercises.map((ex, ei) => {
                            const exerciseName = allExercises.find(x => x.id === ex.exerciseId)?.name || ex.name || 'Unknown Exercise';
                            const styleText = ex.style === 'sets-reps' 
                              ? `${ex.sets || '?'} × ${ex.reps || '?'}`
                              : ex.style === 'sets-time' 
                              ? `${ex.sets || '?'} × ${ex.duration || '?'}s`
                              : `${ex.duration || '?'}s`;
                            const restText = ex.rest ? `${ex.rest}s` : '-';
                            const groupText = ex.groupType !== 'none' ? ex.groupType.charAt(0).toUpperCase() + ex.groupType.slice(1) : '-';
                            
                            return (
                              <ExerciseRow 
                                key={ex.key || ex.id}
                                exercise={ex}
                                exerciseIndex={ei}
                                weekIndex={wi}
                                dayIndex={di}
                                exerciseName={exerciseName}
                                styleText={styleText}
                                restText={restText}
                                groupText={groupText}
                                allExercises={allExercises}
                                onEdit={(form) => {
                                  setNewExerciseModal({
                                    open: true,
                                    wi,
                                    di,
                                    editIndex: ei,
                                    exerciseGroups: [{
                                      id: generateId(),
                                      groupType: 'none',
                                      exercises: [{
                                        id: ex.id,
                                        exerciseId: ex.exerciseId,
                                        style: ex.style,
                                        sets: ex.sets,
                                        reps: ex.reps,
                                        duration: ex.duration,
                                        rest: ex.rest,
                                        tempo: ex.tempo,
                                        videoUrl: ex.videoUrl,
                                        notes: ex.notes
                                      }]
                                    }]
                                  });
                                }}
                                onDelete={() => deleteExercise(wi, di, ei)}
                              />
                            );
                          })}
                            </div>
                          </SortableContext>
                        </DndContext>
                      </div>
                    )}
                  </div>
                      </DraggableContainer>
                    ))}
                  </div>
                )}
              </DraggableContainer>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Week Button */}
      <div className="mt-6 flex justify-start">
        <Button onClick={addWeek} className="px-6">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Week
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="px-8">
          {saving ? 'Saving...' : 'Save Program'}
        </Button>
      </div>

      {/* Exercise Side Panel */}
      {newExerciseModal?.open && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setNewExerciseModal(null)}
          />
          
          {/* Side Panel */}
          <div className="fixed right-0 top-0 h-full w-[800px] bg-white shadow-xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
              <h3 className="text-lg font-semibold text-zinc-900">
                {newExerciseModal.editIndex !== undefined ? 'Edit Exercise' : 'Add Exercise'}
              </h3>
              <button
                onClick={() => setNewExerciseModal(null)}
                className="p-2 rounded-lg hover:bg-zinc-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {newExerciseModal.exerciseGroups.map((group, groupIndex) => (
                <div key={group.id}>
                  {groupIndex > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-zinc-200"></div>
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Separator</span>
                        <div className="flex-1 h-px bg-zinc-200"></div>
                      </div>
                    </div>
                  )}
                  <div className="mb-6">
                  {/* Group Header */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center text-xs font-medium text-zinc-600">
                          {groupIndex + 1}
                        </span>
                        <div className="flex flex-col">
                          <h5 className="text-sm font-semibold text-zinc-900">Workout Type</h5>
                          <span className="text-sm text-zinc-500">
                            {group.groupType === 'none' ? 'Single exercise' : 
                             group.groupType === 'superset' ? '2 exercises, no rest between' :
                             group.groupType === 'giant' ? '3+ exercises, no rest between' :
                             group.groupType === 'triset' ? '3 exercises, no rest between' :
                             group.groupType === 'circuit' ? 'Multiple exercises in sequence' :
                             group.groupType === 'emom' ? 'Every minute on the minute' :
                             group.groupType === 'tabata' ? '20 seconds work, 10 seconds rest' :
                             group.groupType === 'rft' ? 'Rounds for time' :
                             group.groupType === 'amrap' ? 'As many rounds as possible' :
                             'Multiple exercises in sequence'}
                          </span>
                        </div>
                      </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={group.groupType}
                        onChange={(e) => {
                          const newGroups = [...newExerciseModal.exerciseGroups];
                          newGroups[groupIndex].groupType = e.target.value;
                          setNewExerciseModal({ ...newExerciseModal, exerciseGroups: newGroups });
                        }}
                        className="w-32"
                      >
                        <option value="none">Single</option>
                        <option value="superset">Superset</option>
                        <option value="giant">Giant</option>
                        <option value="triset">Triset</option>
                        <option value="circuit">Circuit</option>
                        <option value="emom">EMOM</option>
                        <option value="tabata">TABATA</option>
                        <option value="rft">RFT</option>
                        <option value="amrap">AMRAP</option>
                      </Select>
                      {group.groupType !== 'none' && (
                        <button
                          onClick={() => {
                            const newGroups = [...newExerciseModal.exerciseGroups];
                            newGroups[groupIndex].exercises.push({
                              id: generateId(),
                              exerciseId: 0,
                              style: 'sets-reps',
                              sets: '',
                              reps: '',
                              duration: '',
                              rest: '',
                              tempo: '',
                              videoUrl: '',
                              notes: ''
                            });
                            setNewExerciseModal({ ...newExerciseModal, exerciseGroups: newGroups });
                          }}
                          className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 whitespace-nowrap"
                        >
                          + Add linked exercise
                        </button>
                      )}
                      {newExerciseModal.exerciseGroups.length > 1 && (
                        <button
                          onClick={() => {
                            const newGroups = [...newExerciseModal.exerciseGroups];
                            newGroups.splice(groupIndex, 1);
                            setNewExerciseModal({ ...newExerciseModal, exerciseGroups: newGroups });
                          }}
                          className="p-1 rounded hover:bg-red-100"
                          title="Remove exercise group"
                        >
                          <TrashIcon className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                      </div>
                    </div>
                  </div>

                  {/* Exercises in Group */}
                  <div className="space-y-4">
                    {group.exercises.map((exercise: any, exerciseIndex: number) => (
                      <div key={exercise.id} className="border border-zinc-200 rounded-lg bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700">
                            {exerciseIndex + 1}
                          </span>
                          <span className="text-sm font-semibold text-zinc-800">Exercise {exerciseIndex + 1}</span>
                          {group.exercises.length > 1 && (
                            <button
                              onClick={() => {
                                const newGroups = [...newExerciseModal.exerciseGroups];
                                newGroups[groupIndex].exercises.splice(exerciseIndex, 1);
                                setNewExerciseModal({ ...newExerciseModal, exerciseGroups: newGroups });
                              }}
                              className="ml-auto p-1 rounded hover:bg-red-100"
                              title="Remove exercise"
                            >
                              <TrashIcon className="w-4 h-4 text-red-500" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Exercise</label>
                            <div className="relative">
                              <Select
                                value={exercise.exerciseId}
                                onChange={(e) => {
                                  const newGroups = [...newExerciseModal.exerciseGroups];
                                  newGroups[groupIndex].exercises[exerciseIndex].exerciseId = parseInt(e.target.value);
                                  const selectedExercise = allExercises.find(ex => ex.id === parseInt(e.target.value));
                                  if (selectedExercise?.videoUrl) {
                                    newGroups[groupIndex].exercises[exerciseIndex].videoUrl = selectedExercise.videoUrl;
                                  }
                                  setNewExerciseModal({ ...newExerciseModal, exerciseGroups: newGroups });
                                }}
                              >
                                <option value={0}>Select exercise</option>
                                {allExercises.map(ex => (
                                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                                ))}
                              </Select>
                              {(exercise.videoUrl || allExercises.find(ex => ex.id === exercise.exerciseId)?.videoUrl) && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                  {(() => {
                                    const videoUrl = exercise.videoUrl || allExercises.find(ex => ex.id === exercise.exerciseId)?.videoUrl;
                                    const isYouTube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be');
                                    
                                    if (isYouTube) {
                                      return (
                                        <a
                                          href={videoUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors cursor-pointer"
                                        >
                                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                          </svg>
                                          YouTube
                                        </a>
                                      );
                                    } else {
                                      return (
                                        <a
                                          href={videoUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer"
                                        >
                                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M8 5v14l11-7z"/>
                                          </svg>
                                          Video
                                        </a>
                                      );
                                    }
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Style</label>
                            <Select
                              value={exercise.style}
                              onChange={(e) => {
                                const newGroups = [...newExerciseModal.exerciseGroups];
                                newGroups[groupIndex].exercises[exerciseIndex].style = e.target.value;
                                setNewExerciseModal({ ...newExerciseModal, exerciseGroups: newGroups });
                              }}
                            >
                              <option value="sets-reps">Sets × Reps</option>
                              <option value="sets-time">Sets × Time</option>
                              <option value="time-only">Time Only</option>
                              <option value="distance">Distance</option>
                              <option value="calories">Calories</option>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Sets</label>
                            <Input
                              value={exercise.sets}
                              onChange={(e) => {
                                const newGroups = [...newExerciseModal.exerciseGroups];
                                newGroups[groupIndex].exercises[exerciseIndex].sets = e.target.value;
                                setNewExerciseModal({ ...newExerciseModal, exerciseGroups: newGroups });
                              }}
                              placeholder="3"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">
                              {exercise.style === 'sets-reps' ? 'Reps' : 
                               exercise.style === 'sets-time' ? 'Time (s)' : 
                               exercise.style === 'time-only' ? 'Duration (s)' :
                               exercise.style === 'distance' ? 'Distance' :
                               exercise.style === 'calories' ? 'Calories' : 'Duration (s)'}
                            </label>
                            <Input
                              value={exercise.style === 'sets-reps' ? exercise.reps : exercise.duration}
                              onChange={(e) => {
                                const newGroups = [...newExerciseModal.exerciseGroups];
                                if (exercise.style === 'sets-reps') {
                                  newGroups[groupIndex].exercises[exerciseIndex].reps = e.target.value;
                                } else {
                                  newGroups[groupIndex].exercises[exerciseIndex].duration = e.target.value;
                                }
                                setNewExerciseModal({ ...newExerciseModal, exerciseGroups: newGroups });
                              }}
                              placeholder={exercise.style === 'sets-reps' ? '12' : 
                                         exercise.style === 'distance' ? '5km' :
                                         exercise.style === 'calories' ? '300' : '30'}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Rest between sets (S)</label>
                            <Input
                              value={exercise.rest}
                              onChange={(e) => {
                                const newGroups = [...newExerciseModal.exerciseGroups];
                                newGroups[groupIndex].exercises[exerciseIndex].rest = e.target.value;
                                setNewExerciseModal({ ...newExerciseModal, exerciseGroups: newGroups });
                              }}
                              placeholder="60"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Tempo</label>
                            <Input
                              value={exercise.tempo}
                              onChange={(e) => {
                                const newGroups = [...newExerciseModal.exerciseGroups];
                                newGroups[groupIndex].exercises[exerciseIndex].tempo = e.target.value;
                                setNewExerciseModal({ ...newExerciseModal, exerciseGroups: newGroups });
                              }}
                              placeholder="e.g. 2-1-2"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-1">Notes</label>
                          <Textarea
                            value={exercise.notes}
                            onChange={(e) => {
                              const newGroups = [...newExerciseModal.exerciseGroups];
                              newGroups[groupIndex].exercises[exerciseIndex].notes = e.target.value;
                              setNewExerciseModal({ ...newExerciseModal, exerciseGroups: newGroups });
                            }}
                            placeholder="Optional notes..."
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  </div>
                </div>
              ))}

              {/* Add Another Group Button */}
              <button
                onClick={() => {
                  const newGroups = [...newExerciseModal.exerciseGroups];
                  newGroups.push({
                    id: generateId(),
                    groupType: 'none',
                    exercises: [{
                      id: generateId(),
                      exerciseId: 0,
                      style: 'sets-reps',
                      sets: '',
                      reps: '',
                      duration: '',
                      rest: '',
                      tempo: '',
                      videoUrl: '',
                      notes: ''
                    }]
                  });
                  setNewExerciseModal({ ...newExerciseModal, exerciseGroups: newGroups });
                }}
                className="w-full py-3 border-2 border-dashed border-zinc-300 rounded-lg text-zinc-600 hover:border-zinc-400 hover:text-zinc-700 transition-colors"
              >
                + Add another exercise group
              </button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-zinc-200">
              <button
                onClick={() => setNewExerciseModal(null)}
                className="px-3 py-1.5 text-sm font-medium bg-white text-zinc-900 border border-zinc-300 rounded-md hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <Button onClick={handleSaveExercise}>
                {newExerciseModal.editIndex !== undefined ? 'Update Exercise' : 'Add Exercise'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}