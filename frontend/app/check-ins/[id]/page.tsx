"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import { Button } from "@/components/button";
import { Alert } from "@/components/alert";

export default function PublicCheckInFormPage() {
  const { id } = useParams();
  const [form, setForm] = useState<any>(null);
  const [answers, setAnswers] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/checkins/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setForm(data);
      })
      .catch(() => setError("Failed to load form."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (qid: number, value: any) => {
    setAnswers((prev: any) => ({ ...prev, [qid]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/checkins/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setSuccess(true);
    } catch (err) {
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="max-w-xl mx-auto py-16 text-center text-zinc-500">Loading...</div>;
  if (error) return <div className="max-w-xl mx-auto py-16 text-center text-red-500">{error}</div>;
  if (!form) return null;

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4 text-center">{form.name}</h1>
      {success ? (
        <Alert open={true} onClose={() => setSuccess(false)}>
          Thank you! Your check-in has been submitted.
        </Alert>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
          {form.questions.map((q: any, idx: number) => (
            <div key={q.id} className="mb-4">
              <label className="block text-base font-medium mb-1">
                {q.label} {q.required && <span className="text-red-500">*</span>}
              </label>
              {q.type === "short" && (
                <Input type="text" className="w-full" required={q.required} value={answers[q.id] || ''} onChange={e => handleChange(q.id, e.target.value)} />
              )}
              {q.type === "long" && (
                <textarea className="w-full border rounded p-2 min-h-[80px]" required={q.required} value={answers[q.id] || ''} onChange={e => handleChange(q.id, e.target.value)} />
              )}
              {q.type === "single" && (
                <Select className="w-full" required={q.required} value={answers[q.id] || ''} onChange={e => handleChange(q.id, e.target.value)}>
                  <option value="" disabled>Select an option</option>
                  {(q.options || []).map((opt: string, i: number) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </Select>
              )}
              {q.type === "multi" && (
                <div className="flex flex-col gap-2">
                  {(q.options || []).map((opt: string, i: number) => (
                    <label key={i} className="inline-flex items-center gap-2">
                      <input type="checkbox" className="accent-blue-500" checked={Array.isArray(answers[q.id]) && answers[q.id].includes(opt)} onChange={e => {
                        let newVals = Array.isArray(answers[q.id]) ? [...answers[q.id]] : [];
                        if (e.target.checked) newVals.push(opt);
                        else newVals = newVals.filter((v: string) => v !== opt);
                        handleChange(q.id, newVals);
                      }} /> {opt}
                    </label>
                  ))}
                </div>
              )}
              {q.type === "file" && (
                <Input type="file" className="w-full" required={q.required} />
              )}
              {q.type === "date" && (
                <Input type="date" className="w-full" required={q.required} value={answers[q.id] || ''} onChange={e => handleChange(q.id, e.target.value)} />
              )}
              {q.type === "time" && (
                <Input type="time" className="w-full" required={q.required} value={answers[q.id] || ''} onChange={e => handleChange(q.id, e.target.value)} />
              )}
            </div>
          ))}
          <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</Button>
        </form>
      )}
    </div>
  );
} 