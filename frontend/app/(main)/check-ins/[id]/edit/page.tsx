"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import { Alert } from "@/components/alert";
import { DndContext as DndKitContext, closestCenter as dndClosestCenter, PointerSensor as DndPointerSensor, useSensor as useDndSensor, useSensors as useDndSensors } from '@dnd-kit/core';
import { arrayMove as dndArrayMove, SortableContext as DndSortableContext, useSortable as useDndSortable, verticalListSortingStrategy as dndVerticalListSortingStrategy } from '@dnd-kit/sortable';
import { Select } from '@/components/select';
import { Switch } from '@/components/switch';
import { ChevronDownIcon, ChevronUpIcon, TrashIcon, XMarkIcon, PlusIcon } from '@heroicons/react/20/solid';

const ANSWER_TYPES = [
  { value: "short", label: "Short Answer" },
  { value: "long", label: "Long Answer" },
  { value: "single", label: "Single Choice" },
  { value: "multi", label: "Multiple Choices" },
  { value: "file", label: "File Upload" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
];

export default function EditCheckInPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkinName, setCheckinName] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);

  // Fetch form data
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/checkins/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else {
          setCheckinName(data.name);
          setQuestions(
            (data.questions || []).map((q: any) => ({
              id: q.id,
              question: q.label,
              customQuestion: "",
              answerType: q.type,
              required: q.required,
              answerOptions: q.options || [],
              collapsed: false,
              conditionGroup: q.conditionGroup || undefined,
            }))
          );
        }
      })
      .catch(() => setError("Failed to load form."))
      .finally(() => setLoading(false));
  }, [id]);

  // DnD setup
  const sensors = useDndSensors(useDndSensor(DndPointerSensor));

  const handleAddCard = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        question: "",
        customQuestion: "",
        answerType: "",
        required: false,
        answerOptions: [],
        collapsed: false,
        conditionGroup: undefined,
      },
    ]);
  };

  const handleDelete = (id: string) => {
    setQuestions((prev) => prev.length === 1 ? prev : prev.filter(q => q.id !== id));
  };

  const handleReorder = (oldIndex: number, newIndex: number) => {
    setQuestions(prev => dndArrayMove(prev, oldIndex, newIndex));
  };

  const handleUpdate = (id: string, update: any) => {
    setQuestions((prev) => prev.map(q => q.id === id ? { ...q, ...update } : q));
  };

  const handleSave = async () => {
    setError("");
    if (!checkinName.trim()) {
      setError('Check-in name is required.');
      return;
    }
    const validQuestions = questions.filter(q => (q.question || q.customQuestion) && q.answerType);
    if (validQuestions.length === 0) {
      setError('At least one valid question is required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/checkins/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: checkinName,
          questions: validQuestions,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setSuccess(true);
      setTimeout(() => router.push("/check-ins?success=1"), 1200);
    } catch (err) {
      setError("Failed to update. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-xl mx-auto py-16 text-center text-zinc-500">Loading...</div>;
  if (error) return <div className="max-w-xl mx-auto py-16 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Edit Check-in</h1>
      </div>
      <div className="mb-6 flex flex-col gap-2">
        <label className="block text-sm font-medium mb-1">Check-in Name <span className="text-red-500">*</span></label>
        <Input
          type="text"
          className="w-full"
          placeholder="e.g. July 2024 Progress Check-in"
          value={checkinName}
          onChange={e => setCheckinName(e.target.value)}
          required
        />
        {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
      </div>
      <DndKitContext
        sensors={sensors}
        collisionDetection={dndClosestCenter}
        onDragEnd={({ active, over }) => {
          if (over && active.id !== over.id) {
            const oldIndex = questions.findIndex(q => q.id === active.id);
            const newIndex = questions.findIndex(q => q.id === over.id);
            handleReorder(oldIndex, newIndex);
          }
        }}
      >
        <DndSortableContext items={questions.map(q => q.id)} strategy={dndVerticalListSortingStrategy}>
          {questions.map((q, idx) => (
            <div key={q.id} className="mb-4 border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-base">{q.question || q.customQuestion || "Select a question"}</span>
                <div className="flex items-center gap-2">
                  <Switch checked={q.required} onChange={val => handleUpdate(q.id, { required: val })} />
                  <span className="text-xs">Required</span>
                  <Button plain onClick={() => handleDelete(q.id)} title="Delete"><TrashIcon className="w-5 h-5" /></Button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Input
                  type="text"
                  className="w-56"
                  placeholder="Custom question"
                  value={q.customQuestion}
                  onChange={e => handleUpdate(q.id, { customQuestion: e.target.value })}
                  disabled={!!q.question}
                />
                <span className="text-xs text-zinc-400">or</span>
                <Select
                  value={q.question}
                  onChange={e => handleUpdate(q.id, { question: e.target.value })}
                  className="w-56"
                >
                  <option value="" disabled>Select a question</option>
                  {/* You may want to import and use your STATIC_QUESTIONS here */}
                </Select>
              </div>
              <Select
                value={q.answerType}
                onChange={e => handleUpdate(q.id, { answerType: e.target.value })}
                className="w-40 mb-2"
              >
                <option value="" disabled>Select answer type</option>
                {ANSWER_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </Select>
              {(q.answerType === 'single' || q.answerType === 'multi') && (
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="block text-sm font-semibold">Answer Options</span>
                    <Button plain onClick={() => handleUpdate(q.id, { answerOptions: [...(q.answerOptions || []), ''] })} className="flex items-center gap-1 text-xs">
                      <PlusIcon className="w-4 h-4" /> Add Option
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(q.answerOptions || []).map((opt: string, optIdx: number) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={opt}
                          onChange={e => {
                            const newOpts = [...q.answerOptions];
                            newOpts[optIdx] = e.target.value;
                            handleUpdate(q.id, { answerOptions: newOpts });
                          }}
                          className="flex-1"
                          placeholder="Option"
                        />
                        <Button plain onClick={() => {
                          const newOpts = q.answerOptions.filter((_: any, i: number) => i !== optIdx);
                          handleUpdate(q.id, { answerOptions: newOpts });
                        }}>
                          <TrashIcon className="w-5 h-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Add conditional logic UI here if needed */}
            </div>
          ))}
          {/* Add Question button after last card */}
          <div className="mt-4 mb-2 flex">
            <Button outline className="flex items-center gap-1" onClick={handleAddCard}>
              <PlusIcon className="w-5 h-5" /> Add Question
            </Button>
          </div>
        </DndSortableContext>
      </DndKitContext>
      <div className="flex gap-4 justify-end mt-8">
        <Button
          outline
          type="button"
          onClick={() => router.push('/check-ins')}
          className="px-6"
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          className="px-6"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save & Publish'}
        </Button>
      </div>
      <Alert open={success} onClose={() => setSuccess(false)}>
        Check-in updated!
      </Alert>
    </div>
  );
} 