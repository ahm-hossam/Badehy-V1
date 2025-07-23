"use client";
import { useState } from "react";
import { Button } from "@/components/button";
import { Select } from "@/components/select";
import { Switch } from "@/components/switch";
import { ChevronDownIcon, ChevronUpIcon, TrashIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { Input } from '@/components/input';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bars3Icon } from '@heroicons/react/20/solid';

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

function AnswerOptions({ options, setOptions }: { options: string[]; setOptions: (opts: string[]) => void }) {
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
      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input
              type="text"
              value={opt}
              onChange={e => handleOptionChange(idx, e.target.value)}
              className="flex-1"
              placeholder={`Option ${idx + 1}`}
            />
            <Button plain onClick={() => handleRemove(idx)}>
              <TrashIcon className="w-5 h-5" />
            </Button>
          </div>
        ))}
        <Button plain onClick={handleAdd} className="mt-1 text-xs">
          Add Option
        </Button>
      </div>
    </div>
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
}: QuestionCardProps) {
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
                    <option key={q} value={q}>
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

function SortableQuestionCard(props: QuestionCardProps & { id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.id });
  const style = {
    transform: CSS.Transform.toString(transform),
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

export default function CheckInCreatePage() {
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

  const sensors = useSensors(useSensor(PointerSensor));

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
      <h1 className="text-2xl font-bold mb-2">Create New Check-in</h1>
      <p className="mb-6 text-zinc-600">This is a test card for the check-in form builder. You will be able to create and customize your check-in forms here.</p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={({ active, over }) => {
          if (over && active.id !== over.id) {
            const oldIndex = questions.findIndex(q => q.id === active.id);
            const newIndex = questions.findIndex(q => q.id === over.id);
            setQuestions(arrayMove(questions, oldIndex, newIndex));
          }
        }}
      >
        <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
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
            />
          ))}
        </SortableContext>
      </DndContext>
      <Button className="mt-4 w-full" onClick={handleAddCard}>Add Question</Button>
    </div>
  );
} 