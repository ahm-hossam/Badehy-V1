"use client"

import React, { useState, useEffect } from "react";
import { Select } from "@/components/select";
import { Button } from "@/components/button";
import { useRouter } from "next/navigation";
import { getStoredUser } from '@/lib/auth';
import { Alert } from '@/components/alert';
import { DynamicCheckinForm } from '@/components/dynamic-checkin-form';

export default function CreateClientPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Fetch trainer's check-in forms
  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/checkins?trainerId=${user.id}`)
      .then(res => res.json())
      .then(data => setForms(data || []))
      .catch(() => setError("Failed to load check-in forms."))
      .finally(() => setLoading(false));
  }, []);

  // Set selected form object when selectedFormId changes
  useEffect(() => {
    if (!selectedFormId) setSelectedForm(null);
    else setSelectedForm(forms.find(f => String(f.id) === selectedFormId) || null);
  }, [selectedFormId, forms]);

  const handleSubmit = async (answers: any) => {
    if (!selectedForm) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/checkins/${selectedForm.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, filledByTrainer: true }),
      });
      if (res.ok) {
        router.push("/clients?created=1");
        return;
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create client.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Create Client</h1>
      <p className="mb-6 text-zinc-600">Select a check-in form to fill out and add a new client.</p>
      {error && (
        <Alert open={!!error} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Select Check-in Form</label>
        <Select
          value={selectedFormId}
          onChange={e => setSelectedFormId(e.target.value)}
          className="w-full"
        >
          <option value="">-- Select a form --</option>
          {forms.map((form: any) => (
            <option key={form.id} value={form.id}>{form.name}</option>
          ))}
        </Select>
      </div>
      {selectedForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <DynamicCheckinForm
            form={{
              ...selectedForm,
              questions: selectedForm.questions.map((q: any) => ({
                id: q.id,
                label: q.label,
                type: q.type,
                required: q.required,
                options: q.options || [],
                placeholder: q.placeholder || "",
              })),
            }}
            onSubmit={handleSubmit}
            submitLabel="Create Client"
            filledByTrainer={true}
            loading={loading}
            error={error}
          />
        </div>
      )}
    </div>
  );
} 