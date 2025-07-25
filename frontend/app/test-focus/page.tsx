'use client';
import { useState } from 'react';

function MiniQuestionCard({ q, onUpdate }: { q: any; onUpdate: (update: any) => void }) {
  return (
    <div>
      <input
        value={q.customQuestion}
        onChange={e => onUpdate({ customQuestion: e.target.value })}
        placeholder="Mini custom question"
        style={{ border: '1px solid #d4d4d8', borderRadius: 8, padding: 8, fontSize: 14 }}
      />
    </div>
  );
}

function MiniBuilder() {
  const [questions, setQuestions] = useState([
    { id: '1', customQuestion: '' },
    { id: '2', customQuestion: '' },
  ]);
  return (
    <div>
      <h2>MiniBuilder Test</h2>
      {questions.map(q => (
        <MiniQuestionCard
          key={q.id}
          q={q}
          onUpdate={update => setQuestions(prev => prev.map(qq => qq.id === q.id ? { ...qq, ...update } : qq))}
        />
      ))}
    </div>
  );
}

export default function TestFocus() {
  const [questions, setQuestions] = useState([
    { id: '1', customQuestion: '' },
    { id: '2', customQuestion: '' },
  ]);
  return (
    <div>
      <h2>Test Focus</h2>
      {questions.map(q => (
        <div key={q.id}>
          <input
            value={q.customQuestion}
            onChange={e => setQuestions(prev =>
              prev.map(qq => qq.id === q.id ? { ...qq, customQuestion: e.target.value } : qq)
            )}
            placeholder="Custom question"
            style={{ border: '1px solid #d4d4d8', borderRadius: 8, padding: 8, fontSize: 14 }}
          />
        </div>
      ))}
      <MiniBuilder />
    </div>
  );
} 