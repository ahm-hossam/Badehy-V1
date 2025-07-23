"use client";
import { useState } from "react";
import { Button } from "@/components/button";
import { Select } from "@/components/select";
import { Switch } from "@/components/switch";
import { ChevronDownIcon, ChevronUpIcon, TrashIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { Input } from '@/components/input';
import { DndContext as DndKitContext, closestCenter as dndClosestCenter, PointerSensor as DndPointerSensor, useSensor as useDndSensor, useSensors as useDndSensors } from '@dnd-kit/core';
import { arrayMove as dndArrayMove, SortableContext as DndSortableContext, useSortable as useDndSortable, verticalListSortingStrategy as dndVerticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS as DndCSS } from '@dnd-kit/utilities';
import { Bars3Icon } from '@heroicons/react/20/solid';
import { useRef } from 'react';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/20/solid';

const STATIC_QUESTIONS = [
  "Full Name",
  "Email",
  "Mobile Number",
  "Gender (Male / Female)",
  "Age",
  "Source (Facebook Ads, Referral, Instagram, WhatsApp, Walk-in, etc.)",
  "Registration Date",
  "Height (cm)",
  "Weight (kg)",
  "Level (Beginner 1 / Beginner 2 / Intermediate 1 / Intermediate 2 / Advanced / Elite)",
  "Goal (Fat Loss, Muscle Gain, Body Recomposition, Posture Correction, etc.)",
  "Injuries (dropdown with multiple selections, and you can use the same which we add in the create client form)",
  "Workout Place (Gym / Home)",
  "Subscription Start Date",
  "Subscription Duration (Days / Months)",
  "Subscription End Date (Auto-calculated)",
  "Subscription Status (Active / On Hold / Cancelled / Ended)",
  "Package Name",
  "Payment Status (Free / Free Trial / Paid / Pending / Installments)",
  "Price Before Discount",
  "Discount Applied (Yes / No)",
  "Discount Value or %",
  "Final Price (after discount)",
  "Payment Method (Bank Transfer / Vodafone Cash / Credit Card / Cash / Others)",
  "Installments Table (If applicable):",
  "Installment Date",
  "Installment Amount",
  "Paid / Remaining",
  "Upload Proof (Transfer Screenshot)",
  "Total Amount Paid (Auto-calculated if full or from installments)",
];

const ANSWER_TYPES = [
  { value: "short", label: "Short Answer" },
  { value: "long", label: "Long Answer" },
  { value: "single", label: "Single Choice" },
  { value: "multi", label: "Multiple Choices" },
  { value: "file", label: "File Upload" },
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

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Answer Options</label>
      <DndKitContext
        sensors={sensors}
        collisionDetection={dndClosestCenter}
        onDragStart={({ active }) => setActiveId(active.id as string)}
        onDragEnd={({ active, over }) => {
          setActiveId(null);
          if (over && active.id !== over.id) {
            const oldIndex = options.findIndex((_, i) => `option-${i}` === active.id);
            const newIndex = options.findIndex((_, i) => `option-${i}` === over.id);
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
      <Button plain onClick={handleAdd} className="mt-1 text-xs">
        Add Option
      </Button>
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
  description: string;
  setDescription: (d: string) => void;
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
  description,
  setDescription,
  usedStaticQuestions,
  currentId,
}: QuestionCardProps & { usedStaticQuestions: string[]; currentId: string }) {
  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button plain onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? (
              <ChevronDownIcon className="w-5 h-5" />
            ) : (
              <ChevronUpIcon className="w-5 h-5" />
            )}
          </Button>
          <span className="font-semibold text-lg">
            {question ? question : customQuestion || "Select a question"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={required} onChange={setRequired} />
          <span className="text-sm">Required</span>
          <Button plain onClick={onDelete}>
            <TrashIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>
      {!collapsed && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Question</label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full"
                >
                  <option value="" disabled>
                    Select a question
                  </option>
                  {STATIC_QUESTIONS.map((q) => (
                    <option
                      key={q}
                      value={q}
                      disabled={usedStaticQuestions.includes(q) && q !== question}
                    >
                      {q}
                    </option>
                  ))}
                </Select>
              </div>
              {question && (
                <button
                  type="button"
                  className="p-1 rounded hover:bg-zinc-100"
                  onClick={() => setQuestion("")}
                  tabIndex={-1}
                  aria-label="Clear selected question"
                >
                  <XMarkIcon className="w-4 h-4 text-zinc-400" />
                </button>
              )}
            </div>
            <div className="flex items-center my-3">
              <div className="flex-1 h-px bg-zinc-200" />
              <span className="mx-2 text-xs text-zinc-400">OR</span>
              <div className="flex-1 h-px bg-zinc-200" />
            </div>
            <Input
              type="text"
              className="w-full"
              placeholder="Enter your custom question"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              disabled={!!question}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description / Help Text</label>
            <Input
              type="text"
              className="w-full"
              placeholder="Add a description or help text (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Answer Type</label>
            <Select
              value={answerType}
              onChange={(e) => setAnswerType(e.target.value)}
              className="w-full"
            >
              <option value="" disabled>
                Select answer type
              </option>
              {ANSWER_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>
          {(answerType === 'single' || answerType === 'multi') && (
            <AnswerOptions options={answerOptions} setOptions={setAnswerOptions} />
          )}
        </div>
      )}
    </div>
  );
}

type QuestionData = {
  id: string;
  question: string;
  customQuestion: string;
  answerType: string;
  required: boolean;
  answerOptions: string[];
  description: string;
  collapsed: boolean;
};

function DragHandle() {
  return (
    <span className="cursor-grab p-1 mr-2 flex items-center" title="Drag to reorder">
      <Bars3Icon className="w-5 h-5 text-zinc-400" />
    </span>
  );
}

function SortableQuestionCard(props: QuestionCardProps & { id: string; usedStaticQuestions: string[]; currentId: string }) {
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
  const [questions, setQuestions] = useState<QuestionData[]>([
    {
      id: Math.random().toString(36).slice(2),
      question: "",
      customQuestion: "",
      answerType: "",
      required: false,
      answerOptions: [],
      description: "",
      collapsed: false,
    },
  ]);
  // Simulate saved state and link for now
  const [isSaved, setIsSaved] = useState(false);
  const mockLink = "https://badehy.com/check-in/123456";

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
        description: "",
        collapsed: false,
      },
    ]);
  };

  const handleDelete = (id: string) => {
    setQuestions((prev) => prev.length === 1 ? prev : prev.filter(q => q.id !== id));
  };

  const handleUpdate = (id: string, update: Partial<QuestionData>) => {
    setQuestions((prev) => prev.map(q => q.id === id ? { ...q, ...update } : q));
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Create New Check-in</h1>
        <Button outline type="button" onClick={() => handlePreview(checkinName, questions)}>
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
            setQuestions(dndArrayMove(questions, oldIndex, newIndex));
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
              description={q.description}
              setDescription={val => handleUpdate(q.id, { description: val })}
              usedStaticQuestions={questions.filter(qq => qq.id !== q.id && qq.question).map(qq => qq.question)}
              currentId={q.id}
            />
          ))}
        </DndSortableContext>
      </DndKitContext>
      <Button className="mt-4 w-full" onClick={handleAddCard}>Add Question</Button>
    </div>
  );
} 