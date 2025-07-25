"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Select } from "@/components/select";
import { Button } from "@/components/button";
import { useRouter } from "next/navigation";
import { getStoredUser } from '@/lib/auth';
import { Alert } from '@/components/alert';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import dayjs from "dayjs";

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

export default function CreateClientPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>({
    startDate: "",
    durationValue: "",
    durationUnit: "month",
    endDate: "",
    paymentStatus: "",
    paymentMethod: "",
    discount: "",
    priceBeforeDisc: "",
  });

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

  // Merge selected form questions with all grouped fields for profile completion
  const groupedFields = useMemo(() => {
    if (!selectedForm) return GROUPS;
    // Map selected form questions by label for quick lookup
    const formQuestions = (selectedForm.questions || []).reduce((acc: any, q: any) => {
      acc[q.label] = q;
      return acc;
    }, {});
    // For each group, mark fields as presentInForm and get type/options from form if available
    return GROUPS.map(group => ({
      ...group,
      fields: group.fields.map(field => {
        const q = formQuestions[field.label];
        return {
          ...field,
          presentInForm: !!q,
          type: q ? q.type : field.type,
          options: q && q.options ? q.options : field.options,
          required: field.required, // always required if in GROUPS
        };
      })
    }));
  }, [selectedForm]);

  // Profile completion calculation
  const { completedCount, totalRequired, isComplete, missingFields } = useMemo(() => {
    let completed = 0;
    let total = 0;
    let missing: string[] = [];
    groupedFields.forEach(group => {
      group.fields.forEach(field => {
        if (field.required) {
          total++;
          const value = formData[field.key];
          if (value !== undefined && value !== null && String(value).trim() !== "") {
            completed++;
          } else {
            missing.push(field.label);
          }
        }
      });
    });
    return {
      completedCount: completed,
      totalRequired: total,
      isComplete: completed === total,
      missingFields: missing,
    };
  }, [formData, groupedFields]);

  // Compute check-in fields and profile fields based on selected form
  const checkInFields = useMemo(() => {
    if (!selectedForm) return [];
    const formQuestions = (selectedForm.questions || []).map((q: any) => q.label);
    // All fields from GROUPS that match a form question label
    const matchedFields = groupedFields.flatMap(group =>
      group.fields.filter(field => formQuestions.includes(field.label))
    );
    // Find custom questions (those in the form but not in GROUPS)
    const customQuestions = (selectedForm.questions || []).filter((q: any) => !matchedFields.some(f => f.label === q.label));
    return [...matchedFields, ...customQuestions.map((q: any) => ({
      key: q.id || q.label,
      label: q.label,
      type: q.type || 'text',
      required: !!q.required,
      options: q.options || [],
      isCustom: true,
    }))];
  }, [selectedForm, groupedFields]);

  const profileFieldsByGroup = useMemo(() => {
    if (!selectedForm) return groupedFields;
    const formQuestions = (selectedForm.questions || []).map((q: any) => q.label);
    return groupedFields.map(group => ({
      ...group,
      fields: group.fields.filter(field => !formQuestions.includes(field.label)),
    })).filter(group => group.fields.length > 0);
  }, [selectedForm, groupedFields]);

  // Auto-calculate end date
  useEffect(() => {
    if (subscription.startDate && subscription.durationValue && subscription.durationUnit) {
      const start = dayjs(subscription.startDate);
      let end = start;
      if (subscription.durationUnit === "month") {
        end = start.add(Number(subscription.durationValue), "month");
      } else if (subscription.durationUnit === "week") {
        end = start.add(Number(subscription.durationValue), "week");
      } else if (subscription.durationUnit === "day") {
        end = start.add(Number(subscription.durationValue), "day");
      }
      setSubscription((prev: any) => ({ ...prev, endDate: end.format("YYYY-MM-DD") }));
    }
  }, [subscription.startDate, subscription.durationValue, subscription.durationUnit]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSubscriptionChange = (key: string, value: any) => {
    setSubscription((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = getStoredUser();
      if (!user) throw new Error("Not authenticated");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainerId: user.id, client: formData, subscription }),
      });
      if (res.ok) {
        router.push("/clients?created=1");
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
      <p className="mb-6 text-zinc-600">Select a check-in form to fill out and add a new client. You can complete any missing profile fields after selecting a form.</p>
      {/* Select Check-in Form */}
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
      {/* Only show the grouped questions after a form is selected */}
      {selectedForm && (
        <>
          <div className="mb-6 flex items-center justify-end">
            <span className={`text-xs font-semibold px-2 py-1 rounded ${isComplete ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{isComplete ? 'Completed' : 'Not Completed'}</span>
          </div>
          {error && (
            <Alert open={!!error} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Check-In Data Section */}
            {checkInFields.length > 0 && (
              <div className="mb-6 bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Check-In Data</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {checkInFields.map(field => {
                    const isMissing = missingFields.includes(field.label);
                    // Render custom questions
                    if (field.isCustom) {
                      // Render based on type
                      if (field.type === 'select' && field.options.length > 0) {
                        return (
                          <div key={field.key} className="flex flex-col">
                            <label className="text-sm font-medium mb-1 flex items-center gap-1">
                              {field.label}
                              {field.required && <span className="text-red-500">*</span>}
                            </label>
                            <Select
                              value={formData[field.key] || ''}
                              onChange={e => handleChange(field.key, e.target.value)}
                              required={field.required}
                              className={`w-full ${isMissing ? 'border-yellow-400' : ''}`}
                            >
                              <option value="">Select...</option>
                              {field.options.map((opt: string) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </Select>
                          </div>
                        );
                      }
                      if (field.type === 'textarea') {
                        return (
                          <div key={field.key} className="flex flex-col">
                            <label className="text-sm font-medium mb-1 flex items-center gap-1">
                              {field.label}
                              {field.required && <span className="text-red-500">*</span>}
                            </label>
                            <Textarea
                              value={formData[field.key] || ''}
                              onChange={e => handleChange(field.key, e.target.value)}
                              placeholder={field.label}
                              required={field.required}
                              className={isMissing ? 'border-yellow-400' : ''}
                            />
                          </div>
                        );
                      }
                      // Default to text input
                      return (
                        <div key={field.key} className="flex flex-col">
                          <label className="text-sm font-medium mb-1 flex items-center gap-1">
                            {field.label}
                            {field.required && <span className="text-red-500">*</span>}
                          </label>
                          <Input
                            type={field.type || 'text'}
                            value={formData[field.key] || ''}
                            onChange={e => handleChange(field.key, e.target.value)}
                            placeholder={field.label}
                            required={field.required}
                            className={isMissing ? 'border-yellow-400' : ''}
                          />
                        </div>
                      );
                    }
                    // Render normal fields
                    return (
                      <div key={field.key} className="flex flex-col">
                        <label className="text-sm font-medium mb-1 flex items-center gap-1">
                          {field.label}
                          {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.type === 'select' ? (
                          <Select
                            value={formData[field.key] || ''}
                            onChange={e => handleChange(field.key, e.target.value)}
                            required={field.required}
                            className={`w-full ${isMissing ? 'border-yellow-400' : ''}`}
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
                            className={isMissing ? 'border-yellow-400' : ''}
                          />
                        ) : (
                          <Input
                            type={field.type}
                            value={formData[field.key] || ''}
                            onChange={e => handleChange(field.key, e.target.value)}
                            placeholder={field.label}
                            required={field.required}
                            className={isMissing ? 'border-yellow-400' : ''}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Profile Data Sections */}
            {profileFieldsByGroup.map(group => (
              <div key={group.label} className="mb-6 bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold mb-4">{group.label}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {group.fields.map(field => {
                    const isMissing = missingFields.includes(field.label);
                    return (
                      <div key={field.key} className="flex flex-col">
                        <label className="text-sm font-medium mb-1 flex items-center gap-1">
                          {field.label}
                          {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.type === 'select' ? (
                          <Select
                            value={formData[field.key] || ''}
                            onChange={e => handleChange(field.key, e.target.value)}
                            required={field.required}
                            className={`w-full ${isMissing ? 'border-yellow-400' : ''}`}
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
                            className={isMissing ? 'border-yellow-400' : ''}
                          />
                        ) : (
                          <Input
                            type={field.type}
                            value={formData[field.key] || ''}
                            onChange={e => handleChange(field.key, e.target.value)}
                            placeholder={field.label}
                            required={field.required}
                            className={isMissing ? 'border-yellow-400' : ''}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {/* Subscription Details Section */}
            <div className="mb-6 bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Subscription Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Subscription Start Date</label>
                  <Input type="date" value={subscription.startDate} onChange={e => handleSubscriptionChange('startDate', e.target.value)} />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Subscription Duration</label>
                  <div className="flex gap-2">
                    <Input type="number" min="1" value={subscription.durationValue} onChange={e => handleSubscriptionChange('durationValue', e.target.value)} className="w-1/2" />
                    <Select value={subscription.durationUnit} onChange={e => handleSubscriptionChange('durationUnit', e.target.value)} className="w-1/2">
                      <option value="month">Month(s)</option>
                      <option value="week">Week(s)</option>
                      <option value="day">Day(s)</option>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Subscription End Date (Auto)</label>
                  <Input type="date" value={subscription.endDate} readOnly disabled className="bg-zinc-100" />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Payment Status</label>
                  <Select value={subscription.paymentStatus} onChange={e => handleSubscriptionChange('paymentStatus', e.target.value)}>
                    <option value="">Select...</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="unpaid">Unpaid</option>
                  </Select>
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Payment Method</label>
                  <Input type="text" value={subscription.paymentMethod} onChange={e => handleSubscriptionChange('paymentMethod', e.target.value)} />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Discount</label>
                  <Input type="number" value={subscription.discount} onChange={e => handleSubscriptionChange('discount', e.target.value)} />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Price Before Discount</label>
                  <Input type="number" value={subscription.priceBeforeDisc} onChange={e => handleSubscriptionChange('priceBeforeDisc', e.target.value)} />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Installment Data (if any)</label>
                  <Input type="text" value={subscription.installments || ''} onChange={e => handleSubscriptionChange('installments', e.target.value)} placeholder="(To be implemented)" />
                </div>
              </div>
            </div>
            <div className="flex gap-4 justify-end mt-8">
              <Button outline type="button" onClick={() => router.push('/clients')}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Create Client'}</Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
} 