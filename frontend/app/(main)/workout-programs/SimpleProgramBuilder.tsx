"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import { Select } from '@/components/select';
import { getStoredUser } from '@/lib/auth';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  };

  function DraggableContainer({ id, render, children, className }: { id: string; render: (handle: { attributes: any; listeners: any }) => React.ReactNode; children?: React.ReactNode; className?: string }) {
    const sortable = useSortable({ id });
    const { setNodeRef, transform, transition, attributes, listeners } = sortable;
    const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
    return (
      <div ref={setNodeRef} style={style} className={className}>
        {render({ attributes, listeners })}
        {children}
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
        id: w.id || Math.floor(Date.now() + Math.random()),
        name: w.name || `Week ${w.weekNumber}`,
        days: (w.days || []).map((d: any) => ({
          id: d.id || Math.floor(Date.now() + Math.random()),
          name: d.name || `Day ${d.dayNumber}`,
          exercises: (d.exercises || []).map((e: any) => ({
            id: e.id || Math.floor(Date.now() + Math.random()),
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
      const newId = Math.floor(Date.now());
      setWeeks([{ id: newId, name: 'Week 1', days: [{ id: newId + 1, name: 'Day 1', exercises: [] }] }]);
      setOpenWeeks(new Set([newId]));
    }
  }, [mode, initialData]);

  const addWeek = () => {
    const id = Math.floor(Date.now() + Math.random()*1000);
    setWeeks(prev => {
      const next = [...prev, { id, name: `Week ${prev.length + 1}`, days: [{ id: id + 1, name: 'Day 1', exercises: [] }] }];
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
      const next = prev.map((w, i) => i === weekIdx ? { ...w, days: [...w.days, { id: Math.floor(Date.now() + Math.random()*1000), name: `Day ${w.days.length + 1}`, exercises: [] }] } : w);
      return next;
    });
  };

  const addExercise = (weekIdx: number, dayIdx: number) => {
    const copy = [...weeks];
    copy[weekIdx].days[dayIdx].exercises.push({ id: Math.floor(Date.now() + Math.random()*1000), key: `${Date.now()}-${Math.random()}`, style: 'sets-reps', groupType: 'none' });
    setWeeks(copy);
  };

  const updateExercise = (weekIdx: number, dayIdx: number, exIdx: number, field: keyof SimpleExercise, value: any) => {
    const copy = [...weeks];
    (copy[weekIdx].days[dayIdx].exercises[exIdx] as any)[field] = value;
    setWeeks(copy);
  };

  const duplicateWeek = (weekIdx: number) => {
    const copy = [...weeks];
    const clone = JSON.parse(JSON.stringify(copy[weekIdx])) as SimpleWeek;
    clone.id = Math.floor(Date.now() + Math.random()*1000);
    clone.name = `${clone.name} (copy)`;
    setWeeks([...copy, clone]);
    setOpenWeeks(prev => new Set([...Array.from(prev), clone.id]));
  };

  const duplicateDay = (weekIdx: number, dayIdx: number) => {
    const copy = [...weeks];
    const clone = JSON.parse(JSON.stringify(copy[weekIdx].days[dayIdx])) as SimpleDay;
    clone.id = Math.floor(Date.now() + Math.random()*1000);
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
              <DraggableContainer key={week.id} id={`w-${week.id}`} className="border border-zinc-200 rounded-xl bg-white" render={({attributes, listeners}) => (
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-zinc-50 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <span title="Drag" className="cursor-grab select-none order-2" {...attributes} {...listeners}>↕</span>
                  {editingWeekId === week.id ? (
                    <Input
                      value={week.name}
                      onChange={(e) => { const c=[...weeks]; c[wi].name=(e.target as HTMLInputElement).value; setWeeks(c); }}
                      onBlur={() => setEditingWeekId(null)}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{week.name}</span>
                      <button type="button" className="px-2 py-1 rounded hover:bg-zinc-100" onClick={() => setEditingWeekId(week.id)}>✏️</button>
                    </div>
                  )}
                  <button type="button" className="px-2 py-1 rounded hover:bg-zinc-100" onClick={() => duplicateWeek(wi)}>Duplicate</button>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="border border-zinc-200 rounded-lg px-3 py-2" onClick={() => addDay(wi)}>+ Add day</button>
                  <button type="button" className="px-2 py-1 rounded hover:bg-zinc-100" onClick={() => { const copy=[...weeks]; copy.splice(wi,1); setWeeks(copy); }}>🗑️</button>
                  <button type="button" className="w-7 h-7 rounded border border-zinc-300 flex items-center justify-center" onClick={() => setOpenWeeks(prev => { const n=new Set(prev); n.has(week.id) ? n.delete(week.id) : n.add(week.id); return n; })}>{openWeeks.has(week.id) ? '▾' : '▸'}</button>
                </div>
                </div>
                )}>

            {/* Days */}
                {openWeeks.has(week.id) ? (
                  <SortableContext items={week.days.map((d) => `d-${week.id}-${d.id}`)} strategy={verticalListSortingStrategy}>
                    <div className="p-4 space-y-5">
                      {week.days.map((day, di) => (
                        <DraggableContainer key={day.id} id={`d-${week.id}-${day.id}`} className="border border-zinc-200 rounded-lg" render={({attributes: dAttrs, listeners: dListeners}) => (
                          <div className="flex items-center justify-between p-3 border-b border-zinc-100">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <span title="Drag" className="cursor-grab select-none order-2" {...dAttrs} {...dListeners}>↕</span>
                                {editingDayKey === `${week.id}:${day.id}` ? (
                                  <Input
                                    value={day.name}
                                    onChange={(e) => { const c=[...weeks]; c[wi].days[di].name=(e.target as HTMLInputElement).value; setWeeks(c); }}
                                    onBlur={() => setEditingDayKey(null)}
                                  />
                                ) : (
                                  <>
                                    <span className="font-medium">{day.name}</span>
                                    <button type="button" className="px-2 py-1 rounded hover:bg-zinc-100" onClick={() => setEditingDayKey(`${week.id}:${day.id}`)}>✏️</button>
                                  </>
                                )}
                              </div>
                              <button type="button" className="px-2 py-1 rounded hover:bg-zinc-100" onClick={() => duplicateDay(wi, di)}>Duplicate</button>
                            </div>
                            <div className="flex items-center gap-2">
                              <button type="button" className="border border-zinc-200 rounded-lg px-3 py-2" onClick={() => addExercise(wi, di)}>+ Add exercise</button>
                              <button type="button" className="px-2 py-1 rounded hover:bg-zinc-100" onClick={() => { const c=[...weeks]; c[wi].days.splice(di,1); setWeeks(c); }}>🗑️</button>
                            </div>
                          </div>
                          )}>

                  {/* Exercises */}
                          <div className="p-3 space-y-3">
                    {day.exercises.length === 0 && (
                      <p className="text-sm text-zinc-500">No exercises yet.</p>
                    )}
                    {day.exercises.map((ex, ei) => (
                      <div key={ex.key || ex.id} className="rounded-md border border-zinc-200 p-3 grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-4">
                          <Select value={ex.exerciseId || 0} onChange={(e) => {
                            const selectedId = Number((e.target as HTMLSelectElement).value);
                            const selected = allExercises.find(x => x.id === selectedId);
                            updateExercise(wi, di, ei, 'exerciseId', selected ? selected.id : 0);
                            updateExercise(wi, di, ei, 'name', selected ? selected.name : '');
                            updateExercise(wi, di, ei, 'videoUrl', selected?.videoUrl || '');
                          }}>
                            <option value={0}>Select exercise…</option>
                            {allExercises.map(opt => (
                              <option key={opt.id} value={opt.id}>{opt.name}</option>
                            ))}
                          </Select>
                        </div>
                        <div className="md:col-span-2">
                          <Select value={ex.style} onChange={(e) => updateExercise(wi, di, ei, 'style', (e.target as HTMLSelectElement).value as any)}>
                            <option value="sets-reps">Sets × Reps</option>
                            <option value="sets-time">Sets × Time</option>
                            <option value="time-only">Time Only</option>
                          </Select>
                        </div>
                        <div className="md:col-span-2">
                          <Input placeholder="Sets" value={ex.sets || ''} onChange={(e) => updateExercise(wi, di, ei, 'sets', (e.target as HTMLInputElement).value)} />
                        </div>
                        <div className="md:col-span-2">
                          <Input placeholder={ex.style === 'time-only' ? 'Time (s)' : 'Reps'} value={ex.reps || (ex.style === 'time-only' ? '' : ex.reps || '')} onChange={(e) => updateExercise(wi, di, ei, ex.style === 'time-only' ? 'duration' : 'reps', (e.target as HTMLInputElement).value)} />
                        </div>
                        <div className="md:col-span-2">
                          <Select value={ex.groupType} onChange={(e) => updateExercise(wi, di, ei, 'groupType', (e.target as HTMLSelectElement).value as GroupType)}>
                            <option value="none">No group</option>
                            <option value="superset">Superset</option>
                            <option value="giant">Giant</option>
                            <option value="triset">Triset</option>
                            <option value="circuit">Circuit</option>
                          </Select>
                        </div>
                        <div className="md:col-span-2">
                          <Input placeholder="Group ID (optional)" value={ex.groupId || ''} onChange={(e) => updateExercise(wi, di, ei, 'groupId', (e.target as HTMLInputElement).value)} />
                        </div>
                        <div className="md:col-span-6">
                          <Input placeholder="Video URL (YouTube/Vimeo/S3)" value={ex.videoUrl || ''} onChange={(e) => updateExercise(wi, di, ei, 'videoUrl', (e.target as HTMLInputElement).value)} />
                        </div>
                        <div className="md:col-span-6">
                          <Input placeholder="Notes (optional)" value={ex.notes || ''} onChange={(e) => updateExercise(wi, di, ei, 'notes', (e.target as HTMLInputElement).value)} />
                        </div>
                      </div>
                    ))}
                          </div>
                        </DraggableContainer>
                      ))}
                    </div>
                  </SortableContext>
                ) : null}
              </DraggableContainer>
            ))}
          </div>
        </SortableContext>
      </DndContext>
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


