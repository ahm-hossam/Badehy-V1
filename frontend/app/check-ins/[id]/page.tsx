"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/button";
import { Alert } from "@/components/alert";
import { DynamicCheckinForm } from "@/components/dynamic-checkin-form";

export default function PublicCheckInFormPage() {
  const { id } = useParams();
  const [form, setForm] = useState<any>(null);
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

  const handleSubmit = async (answers: any) => {
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
        <DynamicCheckinForm form={form} onSubmit={handleSubmit} submitLabel={submitting ? 'Submitting...' : 'Submit'} loading={submitting} />
      )}
    </div>
  );
} 