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

  const handleChange = (qid: number, value: any) => {
    setAnswers((prev: any) => ({ ...prev, [qid]: value }));
    setTouched((prev: any) => ({ ...prev, [qid]: true }));
  };

  const validate = () => {
    for (const q of form.questions) {
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
        <div key={q.id} className="mb-4">
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