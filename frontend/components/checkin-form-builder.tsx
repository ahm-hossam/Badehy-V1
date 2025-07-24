import { useState, useRef } from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import { Switch } from "@/components/switch";
import { ChevronDownIcon, ChevronUpIcon, TrashIcon, XMarkIcon, PlusIcon, Bars3Icon } from '@heroicons/react/20/solid';
import { DndContext as DndKitContext, closestCenter as dndClosestCenter, PointerSensor as DndPointerSensor, useSensor as useDndSensor, useSensors as useDndSensors } from '@dnd-kit/core';
import { arrayMove as dndArrayMove, SortableContext as DndSortableContext, useSortable as useDndSortable, verticalListSortingStrategy as dndVerticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS as DndCSS } from '@dnd-kit/utilities';

export const STATIC_QUESTIONS = [
  "Full Name",
  "Email",
  "Mobile Number",
  "Gender Source",
  "Source",
  "Level",
  "Goal",
  "Injuries",
  "Workout Place",
];

const ANSWER_TYPES = [
  { value: "short", label: "Short Answer", icon: <Bars3Icon className="w-4 h-4 inline-block mr-1 text-zinc-400" /> },
  { value: "long", label: "Long Answer", icon: <Bars3Icon className="w-4 h-4 inline-block mr-1 text-zinc-400" /> },
  { value: "single", label: "Single Choice", icon: <Bars3Icon className="w-4 h-4 inline-block mr-1 text-zinc-400" /> },
  { value: "multi", label: "Multiple Choices", icon: <Bars3Icon className="w-4 h-4 inline-block mr-1 text-zinc-400" /> },
  { value: "file", label: "File Upload", icon: <Bars3Icon className="w-4 h-4 inline-block mr-1 text-zinc-400" /> },
  { value: "date", label: "Date", icon: <Bars3Icon className="w-4 h-4 inline-block mr-1 text-zinc-400" /> },
  { value: "time", label: "Time", icon: <Bars3Icon className="w-4 h-4 inline-block mr-1 text-zinc-400" /> },
];

function OptionDragHandle() {
  return <Bars3Icon className="w-4 h-4 text-zinc-400 cursor-grab" />;
}

function DragHandle() {
  return (
    <span className="cursor-grab p-1 mr-2 flex items-center" title="Drag to reorder">
      <Bars3Icon className="w-5 h-5 text-zinc-400" />
    </span>
  );
}

function AnswerOptions({ options, setOptions }: { options: string[]; setOptions: (opts: string[]) => void }) {
  const sensors = useDndSensors(useDndSensor(DndPointerSensor));
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleOptionChange = (idx: number, value: string) => {
    const newOptions = [...options];
    newOptions[idx] = value;
    setOptions(newOptions);
  };
  const handleAdd = () => setOptions([...options, '']);
  const handleRemove = (idx: number) => setOptions(options.filter((_, i) => i !== idx));

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="block text-sm font-semibold">Answer Options</span>
        <Button plain onClick={handleAdd} className="flex items-center gap-1 text-xs">
          <PlusIcon className="w-4 h-4" /> Add Option
        </Button>
      </div>
      <DndKitContext
        sensors={sensors}
        collisionDetection={dndClosestCenter}
        onDragStart={({ active }) => setActiveId(active.id as string)}
        onDragEnd={({ active, over }) => {
          setActiveId(null);
          if (over && active.id !== over.id) {
            const oldIndex = parseInt((active.id + '').replace('option-', ''), 10);
            const newIndex = parseInt((over.id + '').replace('option-', ''), 10);
            setOptions(dndArrayMove(options, oldIndex, newIndex));
          }
        }}
        onDragCancel={() => setActiveId(null)}
      >
        <DndSortableContext items={options.map((_, i) => `option-${i}`)} strategy={dndVerticalListSortingStrategy}>
          <div className="space-y-2">
            {options.map((opt, idx) => {
              const id = `option-${idx}`;
              return (
                <div key={id} className="flex items-center gap-2 bg-white">
                  <span {...useDndSortable({ id }).listeners}><OptionDragHandle /></span>
                  <Input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1"
                    placeholder="Option"
                  />
                  <Button plain onClick={() => handleRemove(idx)}>
                    <TrashIcon className="w-5 h-5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </DndSortableContext>
      </DndKitContext>
    </div>
  );
}

export function CheckInFormBuilder({
  initialName,
  initialQuestions,
  onSave,
  loading,
  error,
  submitLabel = "Save & Publish",
  cancelLabel = "Cancel",
  onCancel,
}: {
  initialName: string;
  initialQuestions: any[];
  onSave: (name: string, questions: any[]) => void;
  loading?: boolean;
  error?: string | null;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
}) {
  const [checkinName, setCheckinName] = useState(initialName || "");
  // Add a 'showAdvanced' property to each question for stable visibility
  const [questions, setQuestions] = useState<any[]>(
    initialQuestions && initialQuestions.length > 0
      ? initialQuestions.map(q => ({ ...q, collapsed: false, showAdvanced: false }))
      : [
          {
            id: Math.random().toString(36).slice(2),
            question: "",
            customQuestion: "",
            answerType: "",
            required: false,
            answerOptions: [],
            collapsed: false,
            conditionGroup: undefined,
            showAdvanced: false,
          },
        ]
  );
  const [formError, setFormError] = useState<string | null>(null);
  const sensors = useDndSensors(useDndSensor(DndPointerSensor));

  // Add, delete, reorder, update, validation, etc.
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
        showAdvanced: false,
      },
    ]);
  };

  const handleDelete = (id: string) => {
    setQuestions((prev) => prev.length === 1 ? prev : prev.filter(q => q.id !== id));
  };

  const handleReorder = (oldIndex: number, newIndex: number) => {
    setQuestions(prev => {
      const newArr = dndArrayMove(prev, oldIndex, newIndex);
      // For each question, if any of its conditions reference a question that now comes after it, clear those conditions
      return newArr.map((q: any, idx: number) => {
        if (!q.conditionGroup) return q;
        const newConds = q.conditionGroup.conditions.filter((c: any) => {
          const refIdx = newArr.findIndex((qq: any) => qq.id === c.questionId);
          return refIdx !== -1 && refIdx < idx;
        });
        if (newConds.length === 0) return { ...q, conditionGroup: undefined };
        return { ...q, conditionGroup: { conditions: newConds } };
      });
    });
  };

  const handleUpdate = (id: string, update: any) => {
    setQuestions((prev) => prev.map(q => q.id === id ? { ...q, ...update } : q));
  };

  // Toggle showAdvanced for a question
  const handleToggleAdvanced = (id: string) => {
    setQuestions((prev) => prev.map(q => q.id === id ? { ...q, showAdvanced: !q.showAdvanced } : q));
  };

  // Save handler
  const handleSave = () => {
    setFormError(null);
    if (!checkinName.trim()) {
      setFormError('Check-in name is required.');
      return;
    }
    const validQuestions = questions.filter(q => (q.question || q.customQuestion) && q.answerType);
    if (validQuestions.length === 0) {
      setFormError('At least one valid question is required.');
      return;
    }
    onSave(checkinName, questions);
  };

  // QuestionCard component
  function QuestionCard({
    q,
    idx,
    usedStaticQuestions,
    questions,
    onUpdate,
    onDelete,
    onReorder,
  }: { q: any; idx: number; usedStaticQuestions: string[]; questions: any[]; onUpdate: (id: string, update: any) => void; onDelete: (id: string) => void; onReorder: (oldIndex: number, newIndex: number) => void; }) {
    // Remove local showAdvanced state, use q.showAdvanced instead
    // Only allow conditions on previous questions with selectable answers
    const eligibleQuestions = questions.slice(0, idx).filter((q: any) => ['yesno', 'single', 'multi'].includes(q.answerType));
    // Helper to update a single condition in the group
    const updateCondition = (condIdx: number, update: any) => {
      if (!q.conditionGroup) return;
      const newConds = q.conditionGroup.conditions.map((c: any, i: number) => i === condIdx ? { ...c, ...update } : c);
      onUpdate(q.id, { conditionGroup: { conditions: newConds } });
    };
    // Helper to add a new condition
    const addCondition = () => {
      if (!q.conditionGroup) {
        onUpdate(q.id, { conditionGroup: { conditions: [{ questionId: '', operator: 'equals', value: '' }] } });
      } else {
        onUpdate(q.id, { conditionGroup: { conditions: [...q.conditionGroup.conditions, { questionId: '', operator: 'equals', value: '' }] } });
      }
    };
    // Helper to remove a condition
    const removeCondition = (condIdx: number) => {
      if (!q.conditionGroup) return;
      const newConds = q.conditionGroup.conditions.filter((_: any, i: number) => i !== condIdx);
      if (newConds.length === 0) onUpdate(q.id, { conditionGroup: undefined });
      else onUpdate(q.id, { conditionGroup: { conditions: newConds } });
    };
    // Static or custom question logic
    const isStatic = q.question && STATIC_QUESTIONS.includes(q.question);
    return (
      <div className="border rounded-lg p-3 mb-4 bg-white shadow-sm relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Button plain onClick={() => onUpdate(q.id, { collapsed: !q.collapsed })} title={q.collapsed ? 'Expand' : 'Collapse'}>
              {q.collapsed ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronUpIcon className="w-5 h-5" />}
            </Button>
            <span className="font-semibold text-base">
              {q.question ? q.question : q.customQuestion || "Select a question"}
              {q.conditionGroup && q.conditionGroup.conditions.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Conditional</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={q.required} onChange={val => onUpdate(q.id, { required: val })} />
            <span className="text-xs">Required</span>
            <Button plain onClick={() => onDelete(q.id)} title="Delete"><TrashIcon className="w-5 h-5" /></Button>
          </div>
        </div>
        {!q.collapsed && (
          <div className="space-y-3">
            {/* Main row: static question, or, custom question */}
            <div className="flex items-center gap-2">
              <div className="flex items-center w-56 flex-shrink-0">
                <Select
                  value={isStatic ? q.question : ''}
                  onChange={e => onUpdate(q.id, { question: e.target.value, customQuestion: '' })}
                  className="w-full"
                >
                  <option value="" disabled>Select a question</option>
                  {STATIC_QUESTIONS.map((sq: string) => (
                    <option
                      key={sq}
                      value={sq}
                      disabled={usedStaticQuestions.includes(sq) && sq !== q.question}
                    >
                      {sq}
                    </option>
                  ))}
                </Select>
                {isStatic && (
                  <button
                    type="button"
                    className="ml-1 p-1 rounded hover:bg-zinc-100"
                    onClick={() => onUpdate(q.id, { question: '' })}
                    tabIndex={-1}
                    aria-label="Clear selected question"
                  >
                    <XMarkIcon className="w-4 h-4 text-zinc-400" />
                  </button>
                )}
              </div>
              <span className="text-xs text-zinc-400">or</span>
              <Input
                type="text"
                className="flex-1 min-w-0"
                placeholder="Custom question"
                value={isStatic ? '' : q.customQuestion}
                onChange={e => onUpdate(q.id, { customQuestion: e.target.value, question: '' })}
                disabled={!!isStatic}
              />
            </div>
            {/* Answer type row */}
            <div className="flex flex-wrap gap-2 items-center">
              <Select
                value={q.answerType}
                onChange={e => onUpdate(q.id, { answerType: e.target.value })}
                className="w-40"
              >
                <option value="" disabled>Select answer type</option>
                {ANSWER_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </Select>
            </div>
            {/* Answer options inline */}
            {(q.answerType === 'single' || q.answerType === 'multi') && (
              <AnswerOptions options={q.answerOptions} setOptions={opts => onUpdate(q.id, { answerOptions: opts })} />
            )}
            {/* Advanced/conditional logic section */}
            <div>
              <div className="flex items-center justify-between mb-1 mt-4">
                <span className="text-sm font-semibold">Advanced Logic</span>
                <Button plain type="button" className="text-xs" onClick={() => handleToggleAdvanced(q.id)}>
                  {q.showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
                </Button>
              </div>
              {q.showAdvanced && (
                <div className="mt-2 bg-zinc-50 rounded-lg border border-zinc-200 p-4">
                  {q.conditionGroup && q.conditionGroup.conditions.length > 0 && (
                    <div className="mb-2 text-sm font-semibold">Show this question if:</div>
                  )}
                  {q.conditionGroup && q.conditionGroup.conditions.map((cond: any, condIdx: number) => {
                    const selectedTarget = eligibleQuestions.find((qq: any) => qq.id === cond.questionId);
                    return (
                      <div key={condIdx} className="flex gap-2 items-center mb-2">
                        {condIdx > 0 && <span className="text-xs font-semibold text-zinc-500">AND</span>}
                        <Select
                          value={cond.questionId || ''}
                          onChange={e => updateCondition(condIdx, { questionId: e.target.value, operator: 'equals', value: '' })}
                          className="w-56"
                        >
                          <option value="">-- Select question --</option>
                          {eligibleQuestions.map((qq: any) => (
                            <option key={qq.id} value={qq.id}>{qq.question || qq.customQuestion}</option>
                          ))}
                        </Select>
                        {selectedTarget && (
                          <>
                            <span>is</span>
                            {selectedTarget.answerType === 'yesno' && (
                              <Select
                                value={cond.value || ''}
                                onChange={e => updateCondition(condIdx, { value: e.target.value })}
                                className="w-32"
                              >
                                <option value="">Select</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                              </Select>
                            )}
                            {(selectedTarget.answerType === 'single' || selectedTarget.answerType === 'multi') && (
                              <Select
                                value={cond.value || ''}
                                onChange={e => updateCondition(condIdx, { value: e.target.value })}
                                className="w-32"
                              >
                                <option value="">Select</option>
                                {selectedTarget.answerOptions.map((opt: string) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </Select>
                            )}
                          </>
                        )}
                        <Button plain onClick={() => removeCondition(condIdx)}><XMarkIcon className="w-4 h-4 text-zinc-400" /></Button>
                      </div>
                    );
                  })}
                  <div className="flex justify-end">
                    <Button plain onClick={() => {
                      // Add condition and keep advanced open
                      if (!q.conditionGroup) {
                        onUpdate(q.id, { conditionGroup: { conditions: [{ questionId: '', operator: 'equals', value: '' }] }, showAdvanced: true });
                      } else {
                        onUpdate(q.id, { conditionGroup: { conditions: [...q.conditionGroup.conditions, { questionId: '', operator: 'equals', value: '' }] }, showAdvanced: true });
                      }
                    }} className="flex items-center gap-1 text-xs mt-1">
                      <PlusIcon className="w-4 h-4" /> Add Condition
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">{initialName ? 'Edit Check-in' : 'Create New Check-in'}</h1>
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
        {(formError || error) && <div className="text-red-500 text-sm mt-1">{formError || error}</div>}
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
            <div key={q.id} className="relative">
              <div className="absolute left-0 top-4 z-10">
                <DragHandle />
              </div>
              <div className="pl-8">
                <QuestionCard
                  q={q}
                  idx={idx}
                  usedStaticQuestions={questions.filter(qq => qq.id !== q.id && qq.question).map(qq => qq.question)}
                  questions={questions}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onReorder={handleReorder}
                />
              </div>
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
      {/* Save & Publish and Cancel buttons */}
      <div className="flex gap-4 justify-end mt-8">
        <Button
          outline
          type="button"
          onClick={onCancel}
          className="px-6"
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          className="px-6"
          disabled={loading}
        >
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </div>
  );
} 