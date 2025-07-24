"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CheckInFormBuilder } from '@/components/checkin-form-builder';

export default function CheckInEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialName, setInitialName] = useState("");
  const [initialQuestions, setInitialQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/checkins/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load check-in form');
        const data = await res.json();
        setInitialName(data.name || "");
        setInitialQuestions(
          (data.questions || []).map((q: any) => ({
            id: q.id?.toString() || Math.random().toString(36).slice(2),
            question: q.label || "",
            customQuestion: q.label && data.staticQuestions && data.staticQuestions.includes(q.label) ? "" : q.label || "",
            answerType: q.type || "",
            required: !!q.required,
            answerOptions: Array.isArray(q.options) ? q.options : [],
            collapsed: false,
            conditionGroup: q.conditionGroup || undefined,
          }))
        );
      })
      .catch((err) => setError(err.message || 'Failed to load check-in form'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (checkinName: string, questions: any[]) => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/checkins/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: checkinName,
          questions,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update form');
      }
      router.push('/check-ins?success=1');
    } catch (err: any) {
      setError(err.message || 'Failed to update form');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto py-8 px-4 text-center text-zinc-500">Loading...</div>;
  }
  if (error) {
    return <div className="max-w-2xl mx-auto py-8 px-4 text-center text-red-500">{error}</div>;
  }

  return (
    <CheckInFormBuilder
      initialName={initialName}
      initialQuestions={initialQuestions}
      onSave={handleSave}
      loading={saving}
      error={error}
      submitLabel="Save & Publish"
      cancelLabel="Cancel"
      onCancel={() => router.push('/check-ins')}
    />
  );
} 