"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Select } from "@/components/select";
import { Button } from "@/components/button";
import { Alert } from "@/components/alert";
import { Input } from "@/components/input";
import { Textarea } from "@/components/textarea";
import { getStoredUser } from '@/lib/auth';

// Grouped fields (should match backend and create page)
const GROUPS = [
  {
    label: 'Basic Data',
    fields: [
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phone', label: 'Mobile Number', type: 'text', required: true },
      { key: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'] },
      { key: 'age', label: 'Age', type: 'number', required: true },
      { key: 'source', label: 'Source', type: 'text', required: true },
    ],
  },
  {
    label: 'Client Profile & Preferences',
    fields: [
      { key: 'goal', label: 'Goal', type: 'text', required: false },
      { key: 'level', label: 'Level', type: 'text', required: false },
      { key: 'injuriesHealthNotes', label: 'Injuries / Health Notes', type: 'textarea', required: false },
      { key: 'workoutPlace', label: 'Workout Place', type: 'text', required: false },
      { key: 'height', label: 'Height', type: 'number', required: false },
      { key: 'weight', label: 'Weight', type: 'number', required: false },
    ],
  },
  {
    label: 'Workout Preferences',
    fields: [
      { key: 'preferredTrainingDays', label: 'Preferred Training Days', type: 'text', required: false },
      { key: 'preferredTrainingTime', label: 'Preferred Training Time', type: 'text', required: false },
      { key: 'equipmentAvailability', label: 'Equipment Availability', type: 'text', required: false },
      { key: 'favoriteTrainingStyle', label: 'Favorite Training Style', type: 'text', required: false },
      { key: 'weakAreas', label: 'Weak Areas (Focus)', type: 'text', required: false },
    ],
  },
  {
    label: 'Nutrition Preferences',
    fields: [
      { key: 'nutritionGoal', label: 'Nutrition Goal', type: 'text', required: false },
      { key: 'dietPreference', label: 'Diet Preference', type: 'text', required: false },
      { key: 'mealCount', label: 'Meal Count', type: 'number', required: false },
      { key: 'foodAllergies', label: 'Food Allergies / Restrictions', type: 'text', required: false },
      { key: 'dislikedIngredients', label: 'Disliked Ingredients', type: 'text', required: false },
      { key: 'currentNutritionPlan', label: 'Current Nutrition Plan Followed', type: 'text', required: false },
    ],
  },
];

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params?.id as string;
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/clients/${clientId}`)
      .then(res => res.json())
      .then(data => {
        setFormData(data || {});
      })
      .catch(() => setError("Failed to load client data."))
      .finally(() => setLoading(false));
  }, [clientId]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const user = getStoredUser();
      if (!user) throw new Error("Not authenticated");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client: formData }),
      });
      if (res.ok) {
        setSuccess(true);
        router.push("/clients?updated=1");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update client.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Edit Client</h1>
      <p className="mb-6 text-zinc-600">Update the client profile. Complete all fields to mark as completed.</p>
      {error && (
        <Alert open={!!error} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-8">
        {GROUPS.map(group => (
          <div key={group.label} className="mb-6">
            <h2 className="text-lg font-semibold mb-4">{group.label}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {group.fields.map(field => (
                <div key={field.key} className="flex flex-col">
                  <label className="text-sm font-medium mb-1">{field.label}{field.required && <span className="text-red-500">*</span>}</label>
                  {field.type === 'select' ? (
                    <Select
                      value={formData[field.key] || ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                      required={field.required}
                      className="w-full"
                    >
                      <option value="">Select...</option>
                      {field.options && field.options.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </Select>
                  ) : field.type === 'textarea' ? (
                    <Textarea
                      value={formData[field.key] || ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                      placeholder={field.label}
                      required={field.required}
                    />
                  ) : (
                    <Input
                      type={field.type}
                      value={formData[field.key] || ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                      placeholder={field.label}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex gap-4 justify-end mt-8">
          <Button outline type="button" onClick={() => router.push('/clients')}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </form>
    </div>
  );
} 