"use client";

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

type GroupType = 'none' | 'superset' | 'giant' | 'triset' | 'circuit';

type SimpleExercise = {
  id: number;
  key?: string;
  exerciseId?: number;
  name?: string;
  style: 'sets-reps' | 'sets-time' | 'time-only';
  sets?: string;
  reps?: string;
  duration?: string;
  groupType: GroupType;
  notes?: string;
  videoUrl?: string;
};

type SimpleDay = { id: number; key?: string; name: string; exercises: SimpleExercise[] };

type SimpleWeek = { id: number; key?: string; name: string; days: SimpleDay[] };

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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: `ex-${weekIndex}-${dayIndex}-${exercise.id}` 
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="px-4 py-3 hover:bg-zinc-50 transition-colors">
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
                        className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded text-xs text-red-600 hover:bg-red-100 transition-colors"
                        title="Watch on YouTube"
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
                        className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-600 hover:bg-blue-100 transition-colors"
                        title="Watch uploaded video"
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
                        className="flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Watch video"
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
              className="p-1.5 rounded hover:bg-zinc-100 transition-colors cursor-grab"
              aria-label="Drag to reorder exercise"
              {...attributes}
              {...listeners}
            >
              <Bars3Icon className="w-4 h-4 text-zinc-400" />
            </button>
            <button
              onClick={() => onEdit({ 
                ...exercise, 
                exerciseId: exercise.exerciseId || 0,
                videoSource: exercise.videoUrl ? 'youtube' : 'youtube'
              })}
              className="p-1.5 rounded hover:bg-zinc-100 transition-colors"
              aria-label="Edit exercise"
            >
              <PencilIcon className="w-4 h-4 text-zinc-500" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded hover:bg-red-50 transition-colors"
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

export default function SimpleProgramBuilder({ mode, initialData }: { mode: 'create' | 'edit'; initialData?: any }) {
  const router = useRouter();
  const [programName, setProgramName] = React.useState('');
  const [programDescription, setProgramDescription] = React.useState('');
  const [weeks, setWeeks] = React.useState<SimpleWeek[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [allExercises, setAllExercises] = React.useState<ExerciseOption[]>([]);
  const [openWeeks, setOpenWeeks] = React.useState<Set<number>>(new Set());
  const [editingWeekId, setEditingWeekId] = React.useState<number | null>(null);
  const [editingDayKey, setEditingDayKey] = React.useState<string | null>(null);

  // Generate stable IDs - moved outside to avoid recreation
  const generateId = React.useMemo(() => {
    return () => Math.floor(Date.now() * 1000 + Math.random() * 1000);
  }, []);

  // Separate state for editing inputs
  const [editingWeekName, setEditingWeekName] = React.useState('');
  const [editingDayName, setEditingDayName] = React.useState('');

  const handleWeekNameChange = useCallback((weekIndex: number, value: string) => {
    setWeeks(prev => {
      const c = [...prev];
      c[weekIndex] = { ...c[weekIndex], name: value };
      return c;
    });
  }, []);

  const handleDayNameChange = useCallback((weekIndex: number, dayIndex: number, value: string) => {
    setWeeks(prev => {
      const c = [...prev];
      c[weekIndex] = { ...c[weekIndex] };
      c[weekIndex].days = [...c[weekIndex].days];
      c[weekIndex].days[dayIndex] = { ...c[weekIndex].days[dayIndex], name: value };
      return c;
    });
  }, []);

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
      const b = weeks.findIndex(w => `w-${w.id}` === oid);
      if (a >= 0 && b >= 0) setWeeks(arrayMove(weeks, a, b));
      return;
    }
    // days within same week
    if (aid.startsWith('d-') && oid.startsWith('d-')) {
      const [ , aw, ad ] = aid.split('-');
      const [ , ow, od ] = oid.split('-');
      if (aw !== ow) return; // only reorder within same week
      const wi = weeks.findIndex(w => String(w.id) === aw);
      if (wi < 0) return;
      const a = weeks[wi].days.findIndex(d => String(d.id) === ad);
      const b = weeks[wi].days.findIndex(d => String(d.id) === od);
      if (a >= 0 && b >= 0) {
        const copy = [...weeks];
        copy[wi].days = arrayMove(copy[wi].days, a, b);
        setWeeks(copy);
      }
    }
    // exercises within same day
    if (aid.startsWith('ex-') && oid.startsWith('ex-')) {
      const [ , aw, ad, ae ] = aid.split('-');
      const [ , ow, od, oe ] = oid.split('-');
      if (aw !== ow || ad !== od) return; // only reorder within same day
      
      const wi = parseInt(aw);
      const di = parseInt(ad);
      
      if (wi < 0 || wi >= weeks.length) return;
      if (di < 0 || di >= weeks[wi].days.length) return;
      
      const exerciseA = weeks[wi].days[di].exercises.find(ex => String(ex.id) === ae);
      const exerciseB = weeks[wi].days[di].exercises.find(ex => String(ex.id) === oe);
      
      if (!exerciseA || !exerciseB) return;
      
      const a = weeks[wi].days[di].exercises.findIndex(ex => ex.id === exerciseA.id);
      const b = weeks[wi].days[di].exercises.findIndex(ex => ex.id === exerciseB.id);
      
      if (a >= 0 && b >= 0 && a !== b) {
        const copy = [...weeks];
        copy[wi].days[di].exercises = arrayMove(copy[wi].days[di].exercises, a, b);
        setWeeks(copy);
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

  React.useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    fetch(`/api/exercises?trainerId=${user.id}`).then(async r => {
      const j = await r.json().catch(() => []);
      if (Array.isArray(j)) setAllExercises(j);
    });
  }, []);

  // Hydrate edit
  React.useEffect(() => {
    if (mode === 'edit' && initialData) {
      setProgramName(initialData.name || '');
      setProgramDescription(initialData.description || '');
      const mapped: SimpleWeek[] = (initialData.weeks || []).map((w: any) => ({
        id: w.id || Math.floor(Date.now() * 1000 + Math.random() * 1000),
        name: w.name || `Week ${w.weekNumber}`,
        days: (w.days || []).map((d: any) => ({
          id: d.id || Math.floor(Date.now() * 1000 + Math.random() * 1000),
          name: d.name || `Day ${d.dayNumber}`,
          exercises: (d.exercises || []).map((e: any) => ({
            id: e.id || Math.floor(Date.now() * 1000 + Math.random() * 1000),
            exerciseId: e.exerciseId,
            name: e.exercise?.name,
            style: 'sets-reps',
            sets: e.sets ? String(e.sets) : undefined,
            reps: e.reps ? String(e.reps) : undefined,
            duration: e.duration ? String(e.duration) : undefined,
            groupType: (e.groupType as GroupType) || 'none',
            notes: e.notes || '',
            videoUrl: e.videoUrl || '',
          })),
        })),
      }));
      setWeeks(mapped);
      setOpenWeeks(new Set(mapped.map(w => w.id)));
    } else if (mode === 'create' && weeks.length === 0) {
      const newId = Math.floor(Date.now() * 1000 + Math.random() * 1000);
      setWeeks([{ id: newId, name: 'Week 1', days: [{ id: Math.floor(Date.now() * 1000 + Math.random() * 1000), name: 'Day 1', exercises: [] }] }]);
      setOpenWeeks(new Set([newId]));
    }
  }, [mode, initialData]);

  const addWeek = () => {
    const id = generateId();
    setWeeks(prev => {
      const next = [...prev, { id, name: `Week ${prev.length + 1}`, days: [{ id: generateId(), name: 'Day 1', exercises: [] }] }];
      return next;
    });
    setOpenWeeks(prev => {
      const n = new Set(prev);
      n.add(id);
      return n;
    });
  };

  const addDay = (weekIdx: number) => {
    setWeeks(prev => {
      const next = prev.map((w, i) => i === weekIdx ? { ...w, days: [...w.days, { id: generateId(), name: `Day ${w.days.length + 1}`, exercises: [] }] } : w);
      return next;
    });
  };

  const [newExerciseModal, setNewExerciseModal] = React.useState<{ open: boolean; wi: number; di: number; editIndex?: number; form: any } | null>(null);
  const addExercise = (weekIdx: number, dayIdx: number) => {
    setNewExerciseModal({ open: true, wi: weekIdx, di: dayIdx, form: { exerciseId: 0, style: 'sets-reps', sets: '', reps: '', duration: '', groupType: 'none', rest: '', videoSource: 'youtube', videoUrl: '', notes: '' } });
  };

  const deleteExercise = (weekIdx: number, dayIdx: number, exerciseIdx: number) => {
    setWeeks(prev => {
      const newWeeks = [...prev];
      const newDays = [...newWeeks[weekIdx].days];
      const newExercises = [...newDays[dayIdx].exercises];
      newExercises.splice(exerciseIdx, 1);
      newDays[dayIdx] = { ...newDays[dayIdx], exercises: newExercises };
      newWeeks[weekIdx] = { ...newWeeks[weekIdx], days: newDays };
      return newWeeks;
    });
  };

  const updateExercise = (weekIdx: number, dayIdx: number, exIdx: number, field: keyof SimpleExercise, value: any) => {
    const copy = [...weeks];
    (copy[weekIdx].days[dayIdx].exercises[exIdx] as any)[field] = value;
    setWeeks(copy);
  };

  const duplicateWeek = (weekIdx: number) => {
    const copy = [...weeks];
    const clone = JSON.parse(JSON.stringify(copy[weekIdx])) as SimpleWeek;
    clone.id = generateId();
    clone.name = `${clone.name} (copy)`;
    setWeeks([...copy, clone]);
    setOpenWeeks(prev => new Set([...Array.from(prev), clone.id]));
  };

  const duplicateDay = (weekIdx: number, dayIdx: number) => {
    const copy = [...weeks];
    const clone = JSON.parse(JSON.stringify(copy[weekIdx].days[dayIdx])) as SimpleDay;
    clone.id = generateId();
    clone.name = `${clone.name} (copy)`;
    copy[weekIdx].days.splice(dayIdx + 1, 0, clone);
    setWeeks(copy);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      const user = getStoredUser();
      if (!user) throw new Error('Not authenticated');
      if (!programName.trim()) throw new Error('Program name is required');

      const payload = {
        trainerId: user.id,
        name: programName.trim(),
        description: programDescription || '',
        weeks: weeks.map((w, wi) => ({
          weekNumber: wi + 1,
          name: w.name,
          days: w.days.map((d, di) => ({
            dayNumber: di + 1,
            name: d.name,
            exercises: d.exercises.map((e, ei) => ({
              exerciseId: Number(e.exerciseId || 0),
              order: ei + 1,
              sets: e.sets ? Number(e.sets) : null,
              reps: e.reps ? Number(e.reps) : null,
              duration: e.duration ? Number(e.duration) : null,
              restTime: null,
              notes: e.notes || '',
              groupType: e.groupType || 'none',
              groupId: e.groupId || null,
              setSchema: null,
              videoUrl: e.videoUrl || null,
            }))
          }))
        }))
      };

      const res = await fetch(mode === 'edit' && initialData?.id ? `/api/programs/${initialData.id}` : '/api/programs', {
        method: mode === 'edit' && initialData?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
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
                    <div className="flex items-center gap-3">
                      {editingWeekId === week.id ? (
                        <Input
                          value={editingWeekName}
                          onChange={(e) => setEditingWeekName(e.target.value)}
                          onBlur={() => {
                            handleWeekNameChange(wi, editingWeekName);
                            setEditingWeekId(null);
                            setEditingWeekName('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleWeekNameChange(wi, editingWeekName);
                              setEditingWeekId(null);
                              setEditingWeekName('');
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
                      <button
                        className="w-7 h-7 rounded border border-zinc-300 flex items-center justify-center cursor-grab"
                        aria-label="Drag to reorder week"
                        {...attributes}
                        {...listeners}
                      >
                        <Bars3Icon className="w-4 h-4" />
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
                {openWeeks.has(week.id) ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext items={week.days.map((d) => `d-${week.id}-${d.id}`)} strategy={verticalListSortingStrategy}>
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
                                      setEditingDayKey(null);
                                      setEditingDayName('');
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleDayNameChange(wi, di, editingDayName);
                                        setEditingDayKey(null);
                                        setEditingDayName('');
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
                                onEdit={(form) => setNewExerciseModal({ open: true, wi, di, editIndex: ei, form })}
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
                    </SortableContext>
                  </DndContext>
                ) : null}
              </DraggableContainer>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {newExerciseModal?.open && (
        <Dialog open onClose={() => setNewExerciseModal(null)}>
          <div className="p-4 w-[680px] max-w-full">
            <h3 className="text-lg font-semibold mb-3">{newExerciseModal.editIndex !== undefined ? 'Edit exercise' : 'Add exercise'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Row 1: Exercise + Style */}
              <div className="md:col-span-8">
                <Select value={newExerciseModal.form.exerciseId} onChange={(e) => {
                  const selectedId = Number((e.target as HTMLSelectElement).value);
                  const selectedExercise = allExercises.find(x => x.id === selectedId);
                  setNewExerciseModal(m => m && { 
                    ...m, 
                    form: { 
                      ...m.form, 
                      exerciseId: selectedId,
                      videoUrl: selectedExercise?.videoUrl || m.form.videoUrl
                    } 
                  });
                }}>
                  <option value={0}>Select exercise…</option>
                  {allExercises.map(opt => (<option key={opt.id} value={opt.id}>{opt.name}</option>))}
                </Select>
              </div>
              <div className="md:col-span-4">
                <Select value={newExerciseModal.form.style} onChange={(e) => setNewExerciseModal(m => m && { ...m, form: { ...m.form, style: (e.target as HTMLSelectElement).value } })}>
                  <option value="sets-reps">Sets × Reps</option>
                  <option value="sets-time">Sets × Time</option>
                  <option value="time-only">Time Only</option>
                </Select>
              </div>
              {/* Row 2: Sets/Reps(or Time) + Rest */}
              <div className="md:col-span-3">
                <Input placeholder="Sets" value={newExerciseModal.form.sets} onChange={(e) => setNewExerciseModal(m => m && { ...m, form: { ...m.form, sets: (e.target as HTMLInputElement).value } })} />
              </div>
              <div className="md:col-span-3">
                <Input placeholder={newExerciseModal.form.style === 'time-only' ? 'Time (s)' : 'Reps'} value={newExerciseModal.form.style === 'time-only' ? newExerciseModal.form.duration : newExerciseModal.form.reps} onChange={(e) => setNewExerciseModal(m => m && { ...m, form: { ...m.form, [m.form.style === 'time-only' ? 'duration' : 'reps']: (e.target as HTMLInputElement).value } })} />
              </div>
              <div className="md:col-span-3">
                <Input placeholder="Rest between sets (s)" value={newExerciseModal.form.rest} onChange={(e) => setNewExerciseModal(m => m && { ...m, form: { ...m.form, rest: (e.target as HTMLInputElement).value } })} />
              </div>
              {/* Row 3: Workout style/group */}
              <div className="md:col-span-3">
                <Select value={newExerciseModal.form.groupType} onChange={(e) => setNewExerciseModal(m => m && { ...m, form: { ...m.form, groupType: (e.target as HTMLSelectElement).value } })}>
                  <option value="none">No group</option>
                  <option value="superset">Superset</option>
                  <option value="giant">Giant</option>
                  <option value="triset">Triset</option>
                  <option value="circuit">Circuit</option>
                </Select>
              </div>
              <div className="md:col-span-12">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                  <div className="md:col-span-3">
                    <Select value={newExerciseModal.form.videoSource || 'youtube'} onChange={(e) => setNewExerciseModal(m => m && { ...m, form: { ...m.form, videoSource: (e.target as HTMLSelectElement).value } })}>
                      <option value="youtube">YouTube/Vimeo URL</option>
                      <option value="upload">Upload video</option>
                    </Select>
                  </div>
                  {newExerciseModal.form.videoSource !== 'upload' ? (
                    <div className="md:col-span-9">
                      <Input placeholder="Video URL (YouTube/Vimeo/S3)" value={newExerciseModal.form.videoUrl} onChange={(e) => setNewExerciseModal(m => m && { ...m, form: { ...m.form, videoUrl: (e.target as HTMLInputElement).value } })} />
                    </div>
                  ) : (
                    <div className="md:col-span-9">
                      <div className="flex gap-2">
                        <Input placeholder="No file chosen" value={newExerciseModal.form.videoFileName || ''} readOnly />
                        <button type="button" className="border border-zinc-200 rounded-lg px-3 py-2" onClick={async () => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'video/*';
                          input.onchange = async () => {
                            if (!input.files || input.files.length === 0) return;
                            const file = input.files[0];
                            setNewExerciseModal(m => m && { ...m, form: { ...m.form, videoFileName: file.name } });
                            const form = new FormData();
                            const user = getStoredUser();
                            form.append('video', file);
                            form.append('trainerId', String(user?.id || ''));
                            form.append('name', 'Exercise video');
                            const res = await fetch('/api/exercises/upload', { method: 'POST', body: form });
                            const data = await res.json().catch(() => ({}));
                            if (res.ok && data?.videoUrl) setNewExerciseModal(m => m && { ...m, form: { ...m.form, videoUrl: data.videoUrl } });
                          };
                          input.click();
                        }}>Choose file</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-12">
                <Input placeholder="Notes (optional)" value={newExerciseModal.form.notes} onChange={(e) => setNewExerciseModal(m => m && { ...m, form: { ...m.form, notes: (e.target as HTMLInputElement).value } })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="border border-zinc-200 rounded-lg px-3 py-2" onClick={() => setNewExerciseModal(null)}>Cancel</button>
              <button className="bg-zinc-900 text-white rounded-lg px-3 py-2" onClick={() => {
                if (!newExerciseModal) return;
                const { wi, di, editIndex, form } = newExerciseModal;
                const exerciseData = { 
                  id: editIndex !== undefined ? weeks[wi].days[di].exercises[editIndex].id : generateId(), 
                  key: editIndex !== undefined ? weeks[wi].days[di].exercises[editIndex].key : `${Date.now()}-${Math.random()}`, 
                  exerciseId: Number(form.exerciseId||0), 
                  style: form.style, 
                  sets: form.sets, 
                  reps: form.style==='time-only'?'':form.reps, 
                  duration: form.style==='time-only'? form.duration : '', 
                  rest: form.rest, 
                  groupType: form.groupType, 
                  videoUrl: form.videoUrl, 
                  notes: form.notes 
                };
                
                if (editIndex !== undefined) {
                  // Edit existing exercise
                  setWeeks(prev => prev.map((w, i) => i === wi ? { 
                    ...w, 
                    days: w.days.map((d, j) => j === di ? { 
                      ...d, 
                      exercises: d.exercises.map((ex, k) => k === editIndex ? exerciseData : ex)
                    } : d) 
                  } : w));
                } else {
                  // Add new exercise
                  setWeeks(prev => prev.map((w, i) => i === wi ? { 
                    ...w, 
                    days: w.days.map((d, j) => j === di ? { 
                      ...d, 
                      exercises: [...d.exercises, exerciseData]
                    } : d) 
                  } : w));
                }
                setNewExerciseModal(null);
              }}>Save</button>
            </div>
          </div>
        </Dialog>
      )}
      <div className="flex justify-start mt-4">
        <Button className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={addWeek}>+ Add week</Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6 text-red-700">{error}</div>
      )}
      <div className="flex justify-end gap-3 mt-8">
        <Button color="white" className="border border-zinc-200" onClick={() => router.push('/workout-programs')}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving} className="bg-zinc-900 text-white hover:bg-zinc-800">{saving ? 'Saving…' : 'Save Program'}</Button>
      </div>
    </div>
  );
}


