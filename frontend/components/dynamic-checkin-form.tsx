import React, { useState } from "react";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import { Button } from "@/components/button";
import { Textarea } from "@/components/textarea";
import { Switch } from "@/components/switch";

// Supported question types: short, long, single, multi, file, date, time
export function DynamicCheckinForm({
  form,
  onSubmit,
  submitLabel = "Submit",
  filledByTrainer = false,
  loading = false,
  error = null,
}: {
  form: any;
  onSubmit: (answers: any) => void;
  submitLabel?: string;
  filledByTrainer?: boolean;
  loading?: boolean;
  error?: string | null;
}) {
  const [answers, setAnswers] = useState<any>({});
  const [touched, setTouched] = useState<any>({});
  const [formError, setFormError] = useState<string | null>(null);

  if (!form || !Array.isArray(form.questions)) return <div>No form loaded.</div>;

  // --- Conditional logic evaluation ---
  const toArray = (v: any) => (Array.isArray(v) ? v : v == null ? [] : [v]);
  const str = (v: any) => (typeof v === 'string' ? v : v == null ? '' : String(v));
  const num = (v: any) => (v == null || v === '' || isNaN(Number(v)) ? undefined : Number(v));

  const evalCondition = (cond: any): boolean => {
    if (!cond) return true;
    const qid = typeof cond.questionId === 'string' ? Number(cond.questionId) : cond.questionId;
    const left = answers[qid];
    const right = cond.value;
    const op = (cond.operator || 'equals').toLowerCase();

    // Handle arrays for multi-select
    if (Array.isArray(left)) {
      if (op === 'equals') return left.includes(right);
      if (op === 'not_equals') return !left.includes(right);
      if (op === 'contains') return left.some(v => str(v).toLowerCase().includes(str(right).toLowerCase()));
      if (op === 'not_contains') return !left.some(v => str(v).toLowerCase().includes(str(right).toLowerCase()));
      if (op === 'in') return toArray(right).some((rv: any) => left.includes(rv));
      if (op === 'not_in') return !toArray(right).some((rv: any) => left.includes(rv));
      if (op === 'is_empty') return left.length === 0;
      if (op === 'not_empty') return left.length > 0;
      return false;
    }

    // Scalars
    if (op === 'equals') return str(left).toLowerCase() === str(right).toLowerCase();
    if (op === 'not_equals') return str(left).toLowerCase() !== str(right).toLowerCase();
    if (op === 'contains') return str(left).toLowerCase().includes(str(right).toLowerCase());
    if (op === 'not_contains') return !str(left).toLowerCase().includes(str(right).toLowerCase());

    const lnum = num(left);
    const rnum = num(right);
    if (lnum !== undefined && rnum !== undefined) {
      if (op === 'gt') return lnum > rnum;
      if (op === 'gte') return lnum >= rnum;
      if (op === 'lt') return lnum < rnum;
      if (op === 'lte') return lnum <= rnum;
    }

    if (op === 'is_empty') return left === undefined || left === null || left === '' || (Array.isArray(left) && left.length === 0);
    if (op === 'not_empty') return !(left === undefined || left === null || left === '' || (Array.isArray(left) && left.length === 0));

    return false;
  };

  const evalConditionGroup = (group: any): boolean => {
    if (!group) return true;
    // Common shapes: { conditions: [...], logic: 'AND'|'OR' } or direct array
    const conditions = Array.isArray(group)
      ? group
      : Array.isArray(group.conditions)
        ? group.conditions
        : Array.isArray(group.rules)
          ? group.rules
          : [];
    const logic = (group.logic || group.combinator || group.operator || 'AND').toString().toUpperCase();
    if (conditions.length === 0) return true;
    if (logic === 'OR') return conditions.some(c => evalCondition(c));
    // Default AND
    return conditions.every(c => evalCondition(c));
  };

  const isVisible = (q: any) => evalConditionGroup(q?.conditionGroup);

  const handleChange = (qid: number, value: any) => {
    setAnswers((prev: any) => ({ ...prev, [qid]: value }));
    setTouched((prev: any) => ({ ...prev, [qid]: true }));
  };

  const validate = () => {
    for (const q of form.questions) {
      if (!isVisible(q)) continue; // hidden questions are not required
      if (q.required && (answers[q.id] === undefined || answers[q.id] === null || answers[q.id] === "" || (Array.isArray(answers[q.id]) && answers[q.id].length === 0))) {
        setFormError(`Please fill in: ${q.label}`);
        return false;
      }
    }
    setFormError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const submission = { ...answers };
    if (filledByTrainer) submission.filledByTrainer = true;
    onSubmit(submission);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {form.questions.map((q: any) => (
        <div key={q.id} className="mb-4" style={{ display: isVisible(q) ? undefined : 'none' }}>
          <label className="block text-sm font-medium mb-1">
            {q.label} {q.required && <span className="text-red-500">*</span>}
          </label>
          {q.type === "short" && (
            <Input
              value={answers[q.id] || ""}
              onChange={e => handleChange(q.id, e.target.value)}
              placeholder={q.placeholder || ""}
              required={q.required}
            />
          )}
          {q.type === "long" && (
            <Textarea
              value={answers[q.id] || ""}
              onChange={e => handleChange(q.id, e.target.value)}
              placeholder={q.placeholder || ""}
              required={q.required}
            />
          )}
          {q.type === "single" && Array.isArray(q.options) && (
            <Select
              value={answers[q.id] || ""}
              onChange={e => handleChange(q.id, e.target.value)}
              required={q.required}
            >
              <option value="">Select...</option>
              {q.options.map((opt: string, idx: number) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </Select>
          )}
          {q.type === "multi" && Array.isArray(q.options) && (
            <Select
              multiple
              value={answers[q.id] || []}
              onChange={e => {
                const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                handleChange(q.id, selected);
              }}
              required={q.required}
            >
              {q.options.map((opt: string, idx: number) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </Select>
          )}
          {q.type === "date" && (
            <Input
              type="date"
              value={answers[q.id] || ""}
              onChange={e => handleChange(q.id, e.target.value)}
              required={q.required}
            />
          )}
          {q.type === "time" && (
            <Input
              type="time"
              value={answers[q.id] || ""}
              onChange={e => handleChange(q.id, e.target.value)}
              required={q.required}
            />
          )}
          {q.type === "file" && (
            <Input
              type="file"
              onChange={e => handleChange(q.id, e.target.files ? e.target.files[0] : null)}
              required={q.required}
            />
          )}
        </div>
      ))}
      {formError && <div className="text-red-500 text-sm mb-2">{formError}</div>}
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      {filledByTrainer && (
        <div className="mb-2"><span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">Filled by Trainer</span></div>
      )}
      <Button type="submit" disabled={loading}>{loading ? "Submitting..." : submitLabel}</Button>
    </form>
  );
} 