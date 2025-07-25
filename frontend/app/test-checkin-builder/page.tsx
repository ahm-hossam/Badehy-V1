'use client';
import { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const STATIC_QUESTIONS = [
  'Full Name',
  'Email',
  'Mobile Number',
  'Gender',
  'Age',
  'Source',
];

const ANSWER_TYPES = [
  { value: 'short', label: 'Short Answer' },
  { value: 'long', label: 'Long Answer' },
  { value: 'single', label: 'Single Choice' },
  { value: 'multi', label: 'Multiple Choices' },
  { value: 'file', label: 'File Upload' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
];

function MiniQuestionCard({ q, onUpdate, allQuestions, idx }: { q: any; onUpdate: (update: any) => void; allQuestions: any[]; idx: number }) {
  // Helper for answer options
  const handleOptionChange = (idx: number, value: string) => {
    const newOptions = [...(q.answerOptions || [])];
    newOptions[idx] = value;
    onUpdate({ answerOptions: newOptions });
  };
  const handleAddOption = () => onUpdate({ answerOptions: [...(q.answerOptions || []), ''] });
  const handleRemoveOption = (idx: number) => onUpdate({ answerOptions: (q.answerOptions || []).filter((_: any, i: number) => i !== idx) });

  // Advanced logic/conditions
  const eligibleQuestions = allQuestions.slice(0, idx).filter((qq: any) => qq.answerType === 'single' || qq.answerType === 'multi');
  const showAdvanced = !!q.showAdvanced;
  const handleAddCondition = () => {
    onUpdate({ showAdvanced: true, condition: { questionId: '', value: '' } });
  };
  const handleRemoveCondition = () => {
    onUpdate({ condition: undefined });
  };
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <select
        value={q.staticQuestion || ''}
        onChange={e => onUpdate({ staticQuestion: e.target.value, customQuestion: '' })}
        style={{ minWidth: 140, padding: 8 }}
      >
        <option value="">Select a question</option>
        {STATIC_QUESTIONS.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <span style={{ color: '#888' }}>or</span>
      <input
        value={q.staticQuestion ? '' : q.customQuestion}
        onChange={e => onUpdate({ customQuestion: e.target.value, staticQuestion: '' })}
        placeholder="Mini custom question"
        style={{ border: '1px solid #d4d4d8', borderRadius: 8, padding: 8, fontSize: 14, flex: 1 }}
        disabled={!!q.staticQuestion}
      />
      <select
        value={q.answerType || ''}
        onChange={e => onUpdate({ answerType: e.target.value })}
        style={{ minWidth: 140, padding: 8 }}
      >
        <option value="">Select answer type</option>
        {ANSWER_TYPES.map(type => (
          <option key={type.value} value={type.value}>{type.label}</option>
        ))}
      </select>
      <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input
          type="checkbox"
          checked={!!q.required}
          onChange={e => onUpdate({ required: e.target.checked })}
        />
        <span style={{ fontSize: 13 }}>Required</span>
      </label>
      {/* Answer options for single/multi */}
      {(q.answerType === 'single' || q.answerType === 'multi') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Answer Options</div>
          {(q.answerOptions || []).map((opt: string, idx: number) => (
            <div key={idx} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input
                value={opt}
                onChange={e => handleOptionChange(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                style={{ border: '1px solid #d4d4d8', borderRadius: 8, padding: 6, fontSize: 14 }}
              />
              <button type="button" onClick={() => handleRemoveOption(idx)} style={{ padding: 4, fontSize: 14 }}>✕</button>
            </div>
          ))}
          <button type="button" onClick={handleAddOption} style={{ padding: 4, fontSize: 14, marginTop: 2 }}>+ Add Option</button>
        </div>
      )}
      {/* Advanced logic/conditions */}
      <div style={{ marginLeft: 8 }}>
        <button type="button" onClick={() => onUpdate({ showAdvanced: !showAdvanced })} style={{ padding: 4, fontSize: 13, border: '1px solid #d4d4d8', borderRadius: 6 }}>
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        </button>
        {showAdvanced && (
          <div style={{ marginTop: 6, background: '#f6f6f6', border: '1px solid #e4e4e7', borderRadius: 8, padding: 8, minWidth: 220 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Show this question if:</div>
            {q.condition ? (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <select
                  value={q.condition.questionId}
                  onChange={e => onUpdate({ condition: { ...q.condition, questionId: e.target.value } })}
                  style={{ minWidth: 120, padding: 6 }}
                >
                  <option value="">Select question</option>
                  {eligibleQuestions.map((qq: any) => (
                    <option key={qq.id} value={qq.id}>{qq.staticQuestion || qq.customQuestion}</option>
                  ))}
                </select>
                <input
                  value={q.condition.value}
                  onChange={e => onUpdate({ condition: { ...q.condition, value: e.target.value } })}
                  placeholder="Value"
                  style={{ border: '1px solid #d4d4d8', borderRadius: 8, padding: 6, fontSize: 14 }}
                />
                <button type="button" onClick={handleRemoveCondition} style={{ padding: 4, fontSize: 14 }}>✕</button>
              </div>
            ) : (
              <button type="button" onClick={handleAddCondition} style={{ padding: 4, fontSize: 14 }}>+ Add Condition</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DragHandle() {
  return <span style={{ cursor: 'grab', marginRight: 8, fontSize: 18 }}>☰</span>;
}

function SortableMiniQuestionCard(props: any) {
  const { q } = props;
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: q.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.7 : 1,
    background: isDragging ? '#f3f4f6' : undefined,
    position: 'relative',
  };
  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ position: 'absolute', left: 0, top: 18, zIndex: 10 }}>
        <span {...attributes} {...listeners}><DragHandle /></span>
      </div>
      <div style={{ paddingLeft: 28 }}>
        <MiniQuestionCard {...props} />
      </div>
    </div>
  );
}

function MiniBuilder() {
  const [questions, setQuestions] = useState([
    { id: '1', customQuestion: '' },
    { id: '2', customQuestion: '' },
  ]);
  const sensors = useSensors(useSensor(PointerSensor));
  return (
    <div>
      <h2>Incremental Check-In Builder Test</h2>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={({ active, over }) => {
          if (over && active.id !== over.id) {
            const oldIndex = questions.findIndex(q => q.id === active.id);
            const newIndex = questions.findIndex(q => q.id === over.id);
            setQuestions(prev => arrayMove(prev, oldIndex, newIndex));
          }
        }}
      >
        <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
          {questions.map((q, idx) => (
            <SortableMiniQuestionCard
              key={q.id}
              q={q}
              allQuestions={questions}
              idx={idx}
              onUpdate={update => setQuestions(prev => prev.map(qq => qq.id === q.id ? { ...qq, ...update } : qq))}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default MiniBuilder; 