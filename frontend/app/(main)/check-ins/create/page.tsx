"use client";
import { useState } from "react";
import { Button } from "@/components/button";
import { Select } from "@/components/select";
import { Switch } from "@/components/switch";
import { ChevronDownIcon, ChevronUpIcon, TrashIcon, XMarkIcon, PlusIcon } from '@heroicons/react/20/solid';
import { Input } from '@/components/input';
import { DndContext as DndKitContext, closestCenter as dndClosestCenter, PointerSensor as DndPointerSensor, useSensor as useDndSensor, useSensors as useDndSensors } from '@dnd-kit/core';
import { arrayMove as dndArrayMove, SortableContext as DndSortableContext, useSortable as useDndSortable, verticalListSortingStrategy as dndVerticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS as DndCSS } from '@dnd-kit/utilities';
import { Bars3Icon } from '@heroicons/react/20/solid';
import { useRef } from 'react';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/20/solid';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth';
import React from 'react';

// Define question configurations with default answer types and options
type QuestionConfig = {
  type: 'short' | 'long' | 'single' | 'multi' | 'file' | 'date' | 'time';
  options: string[];
};

const QUESTION_CONFIGS: Record<string, QuestionConfig> = {
  'Full Name': { type: 'short', options: [] },
  'Email': { type: 'short', options: [] },
  'Mobile Number': { type: 'short', options: [] },
  'Gender': { type: 'single', options: ['Male', 'Female'] },
  'Age': { type: 'short', options: [] },
  'Source': { type: 'single', options: ['Facebook Ads', 'Instagram', 'Website', 'WhatsApp', 'Referral', 'Walk-in', 'Google Ads', 'Other'] },
  'Goal': { type: 'multi', options: ['Fat Loss', 'Muscle Gain', 'Tone & Shape', 'General Fitness', 'Strength', 'Posture Correction', 'Injury Rehab', 'Event Prep', 'Other'] },
  'Level': { type: 'single', options: ['Beginner', 'Intermediate', 'Advanced', 'Athlete'] },
  'Injuries': { type: 'multi', options: ['Knee Pain', 'Shoulder Pain', 'Lower Back Pain', 'Herniated Disc', 'Sciatica', 'Elbow Pain', 'Hip Pain', 'Neck Pain', 'Plantar Fasciitis', 'Post-surgery', 'Arthritis', 'Headaches', 'Other'] },
  'Workout Place': { type: 'single', options: ['Gym', 'Home'] },
  'Height': { type: 'short', options: [] },
  'Weight': { type: 'short', options: [] },
  'Preferred Training Days': { type: 'multi', options: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
  'Preferred Training Time': { type: 'single', options: ['Early Morning (5-8 AM)', 'Morning (8-12 PM)', 'Afternoon (12-5 PM)', 'Evening (5-9 PM)', 'Late Night (9 PM+)'] },
  'Equipment Availability': { type: 'multi', options: ['Gym Access', 'Dumbbells', 'Barbell', 'Resistance Bands', 'Machines', 'TRX', 'Pull-up Bar', 'Stepper', 'Treadmill', 'Stationary Bike', 'Cable Machine', 'Bodyweight Only', 'Other'] },
  'Favorite Training Style': { type: 'multi', options: ['Strength', 'HIIT', 'Cardio', 'Pilates', 'Yoga', 'Functional', 'CrossFit', 'Circuit', 'Mobility', 'Bodybuilding', 'Other'] },
  'Weak Areas (Focus)': { type: 'multi', options: ['Core', 'Lower Back', 'Glutes', 'Hamstrings', 'Shoulders', 'Arms', 'Inner Thigh', 'Calves', 'Neck', 'Grip Strength', 'Other'] },
  'Nutrition Goal': { type: 'single', options: ['Fat Loss', 'Muscle Gain', 'Maintenance', 'Improve Energy', 'Improve Digestion', 'Medical (e.g. PCOS, Diabetes)', 'Other'] },
  'Diet Preference': { type: 'single', options: ['Regular', 'Low Carb', 'Low Fat', 'Keto', 'Intermittent Fasting', 'Vegetarian', 'Vegan', 'Pescatarian', 'Mediterranean', 'Gluten-Free', 'Lactose-Free', 'Other'] },
  'Meal Count': { type: 'single', options: ['2 meals', '3 meals', '4 meals', '5+ meals'] },
  'Food Allergies / Restrictions': { type: 'multi', options: ['Lactose', 'Gluten', 'Eggs', 'Nuts', 'Shellfish', 'Soy', 'Corn', 'Citrus', 'Legumes', 'Artificial Sweeteners', 'Other'] },
  'Disliked Ingredients': { type: 'long', options: [] },
  'Current Nutrition Plan Followed': { type: 'long', options: [] },
};

const STATIC_QUESTION_GROUPS = [
  {
    label: 'Basic Data',
    options: [
      'Full Name',
      'Email',
      'Mobile Number',
      'Gender',
      'Age',
      'Source',
    ],
  },
  {
    label: 'Client Profile & Preferences',
    options: [
      'Goal',
      'Level',
      'Injuries',
      'Workout Place',
      'Height',
      'Weight',
    ],
  },
  {
    label: 'Workout Preferences',
    options: [
      'Preferred Training Days',
      'Preferred Training Time',
      'Equipment Availability',
      'Favorite Training Style',
      'Weak Areas (Focus)',
    ],
  },
  {
    label: 'Nutrition Preferences',
    options: [
      'Nutrition Goal',
      'Diet Preference',
      'Meal Count',
      'Food Allergies / Restrictions',
      'Disliked Ingredients',
      'Current Nutrition Plan Followed',
    ],
  },
];

const ANSWER_TYPES = [
  { value: "short", label: "Short Answer" },
  { value: "long", label: "Long Answer" },
  { value: "single", label: "Single Choice" },
  { value: "multi", label: "Multiple Choices" },
  { value: "file", label: "File Upload" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
];

function OptionDragHandle() {
  return <Bars3Icon className="w-4 h-4 text-zinc-400 cursor-grab" />;
}

type SortableOptionProps = {
  id: string;
  value: string;
  onChange: (val: string) => void;
  onRemove: () => void;
};

function SortableOption({ id, value, onChange, onRemove }: SortableOptionProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useDndSortable({ id });
  const style = {
    transform: DndCSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.7 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-2 bg-white`} {...attributes}>
      <span {...listeners}><OptionDragHandle /></span>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1"
        placeholder="Option"
      />
      <Button plain onClick={onRemove}>
        <TrashIcon className="w-5 h-5" />
      </Button>
    </div>
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

  // Use index as key, but ensure stable order after drag
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
                <SortableOption
                  key={id}
                  id={id}
                  value={opt}
                  onChange={val => handleOptionChange(idx, val)}
                  onRemove={() => handleRemove(idx)}
                />
              );
            })}
          </div>
        </DndSortableContext>
      </DndKitContext>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Button plain onClick={handleCopy} className="ml-2 flex items-center gap-1">
      {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4" />} Copy
    </Button>
  );
}

type QuestionCardProps = {
  question: string;
  setQuestion: (q: string) => void;
  answerType: string;
  setAnswerType: (a: string) => void;
  required: boolean;
  setRequired: (r: boolean) => void;
  onDelete: () => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  customQuestion: string;
  setCustomQuestion: (q: string) => void;
  answerOptions: string[];
  setAnswerOptions: (opts: string[]) => void;
};

function QuestionCard({
  question,
  setQuestion,
  answerType,
  setAnswerType,
  required,
  setRequired,
  onDelete,
  collapsed,
  setCollapsed,
  customQuestion,
  setCustomQuestion,
  answerOptions,
  setAnswerOptions,
  usedStaticQuestions,
  currentId,
  questions,
  conditionGroup,
  setConditionGroup,
  index,
}: Omit<QuestionCardProps, 'description' | 'setDescription'> & { usedStaticQuestions: string[]; currentId: string; questions: QuestionData[]; conditionGroup?: ConditionGroup; setConditionGroup: (c: ConditionGroup | undefined) => void; index: number }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Only allow conditions on previous questions with selectable answers
  const eligibleQuestions = questions.slice(0, index).filter(q => ['yesno', 'single', 'multi'].includes(q.answerType));
  // Helper to update a single condition in the group
  const updateCondition = (condIdx: number, update: Partial<SingleCondition>) => {
    if (!conditionGroup) return;
    const newConds = conditionGroup.conditions.map((c, i) => i === condIdx ? { ...c, ...update } : c);
    setConditionGroup({ conditions: newConds });
  };
  // Helper to add a new condition
  const addCondition = () => {
    if (!conditionGroup) {
      setConditionGroup({ conditions: [{ questionId: '', operator: 'equals', value: '' }] });
    } else {
      setConditionGroup({ conditions: [...conditionGroup.conditions, { questionId: '', operator: 'equals', value: '' }] });
    }
  };
  // Helper to remove a condition
  const removeCondition = (condIdx: number) => {
    if (!conditionGroup) return;
    const newConds = conditionGroup.conditions.filter((_, i) => i !== condIdx);
    if (newConds.length === 0) setConditionGroup(undefined);
    else setConditionGroup({ conditions: newConds });
  };
  return (
    <div className="border rounded-lg p-3 mb-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Button plain onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronUpIcon className="w-5 h-5" />}
          </Button>
          <span className="font-semibold text-base">
            {question ? question : customQuestion || "Select a question"}
            {conditionGroup && conditionGroup.conditions.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Conditional</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={required} onChange={setRequired} />
          <span className="text-xs">Required</span>
          <Button plain onClick={onDelete} title="Delete"><TrashIcon className="w-5 h-5" /></Button>
        </div>
      </div>
      {!collapsed && (
        <div className="space-y-3">
          {/* Main row: static question, or, custom question */}
          <div className="flex items-center gap-2">
            <div className="flex items-center w-56 flex-shrink-0">
              <Select
                value={question}
                onChange={(e) => {
                  const selectedQuestion = e.target.value;
                  setQuestion(selectedQuestion);
                  
                  // Auto-configure answer type and options based on selected question
                  if (selectedQuestion && QUESTION_CONFIGS[selectedQuestion]) {
                    const config = QUESTION_CONFIGS[selectedQuestion];
                    setAnswerType(config.type);
                    setAnswerOptions([...config.options]); // Copy options to allow editing
                  }
                }}
                className="w-full"
              >
                <option value="" disabled>Select a question</option>
                {STATIC_QUESTION_GROUPS.map(group => (
                  <React.Fragment key={group.label}>
                    <option disabled>{group.label}</option>
                    {group.options.map(opt => (
                      <option
                        key={opt}
                        value={opt}
                        disabled={usedStaticQuestions.includes(opt) && opt !== question}
                      >
                        {opt}
                      </option>
                    ))}
                  </React.Fragment>
                ))}
              </Select>
              {question && (
                <button
                  type="button"
                  className="ml-1 p-1 rounded hover:bg-zinc-100"
                  onClick={() => {
                    setQuestion("");
                    setAnswerType("");
                    setAnswerOptions([]);
                    setCustomQuestion("");
                  }}
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
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              disabled={typeof question === 'string' && question.trim() !== ''}
            />
          </div>
          {/* Answer type row */}
          <div className="flex flex-wrap gap-2 items-center">
            <Select
              value={answerType}
              onChange={(e) => setAnswerType(e.target.value)}
              className="w-40"
            >
              <option value="" disabled>Select answer type</option>
              {ANSWER_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Select>
          </div>
          {/* Answer options inline */}
          {(answerType === 'single' || answerType === 'multi') && (
            <div>
              {question && QUESTION_CONFIGS[question] && (
                <div className="mb-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  ✓ Auto-populated with default options for "{question}". You can edit these options.
                </div>
              )}
            <AnswerOptions options={answerOptions} setOptions={setAnswerOptions} />
            </div>
          )}
          {/* Advanced/conditional logic section */}
          <div>
            <div className="flex items-center justify-between mb-1 mt-4">
              <span className="text-sm font-semibold">Advanced Logic</span>
              <Button plain type="button" className="text-xs" onClick={() => setShowAdvanced(v => !v)}>
                {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
              </Button>
            </div>
            {showAdvanced && (
              <div className="mt-2 bg-zinc-50 rounded-lg border border-zinc-200 p-4">
                {conditionGroup && conditionGroup.conditions.length > 0 && (
                  <div className="mb-2 text-sm font-semibold">Show this question if:</div>
                )}
                {conditionGroup && conditionGroup.conditions.map((cond, condIdx) => {
                  const selectedTarget = eligibleQuestions.find(q => q.id === cond.questionId);
                  return (
                    <div key={condIdx} className="flex gap-2 items-center mb-2">
                      {condIdx > 0 && <span className="text-xs font-semibold text-zinc-500">AND</span>}
                      <Select
                        value={cond.questionId || ''}
                        onChange={e => updateCondition(condIdx, { questionId: e.target.value, operator: 'equals', value: '' })}
                        className="w-56"
                      >
                        <option value="">-- Select question --</option>
                        {eligibleQuestions.map(q => (
                          <option key={q.id} value={q.id}>{q.question || q.customQuestion}</option>
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
                              {selectedTarget.answerOptions.map(opt => (
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
                  <Button plain onClick={addCondition} className="flex items-center gap-1 text-xs mt-1">
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

// Restore data model for group logic

type SingleCondition = {
  questionId: string;
  operator: 'equals' | 'includes';
  value: any;
};

type ConditionGroup = {
  conditions: SingleCondition[];
};

type QuestionData = {
  id: string;
  question: string;
  customQuestion: string;
  answerType: string;
  required: boolean;
  answerOptions: string[];
  collapsed: boolean;
  conditionGroup?: ConditionGroup;
};

function DragHandle() {
  return (
    <span className="cursor-grab p-1 mr-2 flex items-center" title="Drag to reorder">
      <Bars3Icon className="w-5 h-5 text-zinc-400" />
    </span>
  );
}

function SortableQuestionCard(props: QuestionCardProps & { id: string; usedStaticQuestions: string[]; currentId: string; questions: QuestionData[]; conditionGroup?: ConditionGroup; setConditionGroup: (c: ConditionGroup | undefined) => void; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useDndSortable({ id: props.id });
  const style = {
    transform: DndCSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative">
      <div {...listeners} className="absolute left-0 top-4 z-10">
        <DragHandle />
      </div>
      <div className="pl-8">
        <QuestionCard {...props} />
      </div>
    </div>
  );
}

function handlePreview(checkinName: string, questions: QuestionData[]) {
  // Save the form state to localStorage for the preview page to read
  window.localStorage.setItem('checkinPreview', JSON.stringify({ checkinName, questions }));
  window.open('/check-ins/preview', '_blank');
}

export default function CheckInCreatePage() {
  const [checkinName, setCheckinName] = useState("");
  const [isMainForm, setIsMainForm] = useState(false);
  const [questions, setQuestions] = useState<QuestionData[]>([
    {
      id: Math.random().toString(36).slice(2),
      question: "",
      customQuestion: "",
      answerType: "",
      required: true,
      answerOptions: [],
      collapsed: false,
      conditionGroup: undefined,
    },
  ]);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mockLink = "https://badehy.com/check-in/123456";

  const router = useRouter();

  const sensors = useDndSensors(useDndSensor(DndPointerSensor));

  const handleAddCard = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        question: "",
        customQuestion: "",
        answerType: "",
        required: true,
        answerOptions: [],
        collapsed: false,
        conditionGroup: undefined,
      },
    ]);
  };

  // Handle deletion of referenced question
  const handleDelete = (id: string) => {
    setQuestions((prev) => {
      // If any question references this one in its conditionGroup, clear it and alert
      const affected = prev.filter(q => q.conditionGroup && q.conditionGroup.conditions.some(c => c.questionId === id));
      if (affected.length > 0) {
        alert('A condition referencing this question was cleared.');
      }
      return prev.length === 1 ? prev : prev.filter(q => q.id !== id).map(q => {
        if (!q.conditionGroup) return q;
        const newConds = q.conditionGroup.conditions.filter(c => c.questionId !== id);
        if (newConds.length === 0) return { ...q, conditionGroup: undefined };
        return { ...q, conditionGroup: { conditions: newConds } };
      });
    });
  };
  // Handle reordering: if a question is moved after a question that references it, clear the condition
  const handleReorder = (oldIndex: number, newIndex: number) => {
    setQuestions(prev => {
      const newArr = dndArrayMove(prev, oldIndex, newIndex);
      // For each question, if any of its conditions reference a question that now comes after it, clear those conditions
      return newArr.map((q, idx) => {
        if (!q.conditionGroup) return q;
        const newConds = q.conditionGroup.conditions.filter(c => {
          const refIdx = newArr.findIndex(qq => qq.id === c.questionId);
          return refIdx !== -1 && refIdx < idx;
        });
        if (newConds.length !== q.conditionGroup.conditions.length) {
          alert('A condition was cleared because the referenced question now comes after this one.');
        }
        if (newConds.length === 0) return { ...q, conditionGroup: undefined };
        return { ...q, conditionGroup: { conditions: newConds } };
      });
    });
  };

  const handleUpdate = (id: string, update: Partial<QuestionData>) => {
    setQuestions((prev) => prev.map(q => q.id === id ? { ...q, ...update } : q));
  };
  // Migrate old single-condition questions to new format
  const migrateCondition = (q: any): QuestionData => {
    if (q.condition && !q.conditionGroup) {
      return { ...q, conditionGroup: { conditions: [{ questionId: q.condition.questionId, operator: q.condition.operator, value: q.condition.value }] }, condition: undefined };
    }
    return q;
  };

  // Save & Publish handler
  const handleSave = async () => {
    setError(null);
    // Basic validation
    if (!checkinName.trim()) {
      setError('Check-in name is required.');
      return;
    }
    const user = getStoredUser();
    if (!user || !user.id) {
      setError('You must be logged in to save a check-in form.');
      return;
    }
    const validQuestions = questions.filter(q => (q.question || q.customQuestion) && q.answerType);
    if (validQuestions.length === 0) {
      setError('At least one valid question is required.');
      return;
    }
    
    // Check if non-main form has phone number question
    if (!isMainForm) {
      const hasPhoneQuestion = validQuestions.some(q => {
        const questionText = (q.question || q.customQuestion || '').toLowerCase();
        return questionText.includes('phone') || questionText.includes('mobile');
      });
      
      if (!hasPhoneQuestion) {
        setError('Non-main forms must include a "Mobile Number" or "Phone Number" question to identify existing clients.');
        return;
      }
    }
    setLoading(true);
    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerId: user.id,
          name: checkinName,
          questions: validQuestions,
          isMainForm: isMainForm,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save form');
      }
      setIsSaved(true);
      setError(null);
      router.push('/check-ins?success=create');
    } catch (err: any) {
      setError(err.message || 'Failed to save form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Create New Check-in</h1>
          <Button outline type="button" onClick={() => handlePreview(checkinName, questions.map(migrateCondition))}>
            Preview
          </Button>
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
        
        {/* Main Form Toggle */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch 
                checked={isMainForm} 
                onChange={setIsMainForm}
                className="data-[state=checked]:bg-blue-600"
              />
              <div>
                <label className="text-sm font-medium text-gray-900">
                  Main Form
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  Main forms create new clients. Other forms link to existing clients by phone number.
                </p>
              </div>
            </div>
            <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
              {isMainForm ? 'Will create new clients' : 'Will link to existing clients'}
            </div>
          </div>
          
          {/* Warning for non-main forms without phone number */}
          {!isMainForm && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="text-yellow-600 mt-0.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Important:</p>
                  <p className="text-xs mt-1">
                    Non-main forms require a "Mobile Number" or "Phone Number" question to identify existing clients. 
                    Make sure to include this question in your form.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
        {isSaved && (
          <div className="mt-3 flex items-center">
            <span className="text-sm text-zinc-700 truncate">{mockLink}</span>
            <CopyButton value={mockLink} />
          </div>
        )}
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
            <SortableQuestionCard
              key={q.id}
              id={q.id}
              question={q.question}
              setQuestion={val => handleUpdate(q.id, { question: val })}
              answerType={q.answerType}
              setAnswerType={val => handleUpdate(q.id, { answerType: val })}
              required={q.required}
              setRequired={val => handleUpdate(q.id, { required: val })}
              onDelete={() => handleDelete(q.id)}
              collapsed={q.collapsed}
              setCollapsed={val => handleUpdate(q.id, { collapsed: val })}
              customQuestion={q.customQuestion}
              setCustomQuestion={val => handleUpdate(q.id, { customQuestion: val })}
              answerOptions={q.answerOptions}
              setAnswerOptions={opts => handleUpdate(q.id, { answerOptions: opts })}
              usedStaticQuestions={questions.filter(qq => qq.id !== q.id && qq.question).map(qq => qq.question)}
              currentId={q.id}
              questions={questions}
              conditionGroup={q.conditionGroup}
              setConditionGroup={cond => handleUpdate(q.id, { conditionGroup: cond })}
              index={idx}
            />
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
          onClick={() => router.push('/check-ins')}
          className="px-6"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          className="px-6"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save & Publish'}
        </Button>
      </div>
    </div>
    </div>
  );
} 