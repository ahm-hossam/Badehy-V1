"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Select } from "@/components/select";
import { Button } from "@/components/button";
import { Alert } from "@/components/alert";
import { Input } from "@/components/input";
import { Textarea } from "@/components/textarea";
import { getStoredUser } from '@/lib/auth';
import dayjs from "dayjs";

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
  // Add state for selectedForm and check-in questions
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [checkinQuestions, setCheckinQuestions] = useState<any[]>([]);
  // Add state for answers
  const [answers, setAnswers] = useState<any>({});
  const [allForms, setAllForms] = useState<any[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [submission, setSubmission] = useState<any>(null);
  const [submissionForm, setSubmissionForm] = useState<any>(null);
  const [submissionAnswers, setSubmissionAnswers] = useState<any>({});
  // Replace direct getStoredUser() call with useState
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  // Fetch the check-in form for this client (assume client data includes checkInFormId or similar)
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

  // Fetch the check-in form for this client (assume client data includes checkInFormId or similar)
  useEffect(() => {
    if (!formData || !formData.checkInFormId) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/checkins/${formData.checkInFormId}`)
      .then(res => res.json())
      .then(data => {
        setSelectedForm(data);
        setCheckinQuestions(data.questions || []);
      });
  }, [formData.checkInFormId]);

  // When client data is loaded, set answers from submissionAnswers (if available)
  useEffect(() => {
    if (submissionAnswers) {
      setAnswers(submissionAnswers);
    }
  }, [submissionAnswers]);

  // Add debug log for formData
  useEffect(() => {
    console.log('EditClientPage formData:', formData);
  }, [formData]);

  // Fetch all check-in forms for fallback UI
  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/checkins?trainerId=${user.id}`)
      .then(res => res.json())
      .then(data => setAllForms(data || []));
  }, []);

  // Helper: map static question labels to field keys
  const staticLabelToKey: Record<string, string> = {};
  GROUPS.forEach(group => {
    group.fields.forEach(field => {
      staticLabelToKey[field.label] = field.key;
    });
  });

  // When fetching the latest check-in submission, build a merged answers object
  useEffect(() => {
    if (!submissionForm || !submissionAnswers) return;
    // Map answers by both question ID and static field key
    const merged: Record<string, any> = { ...submissionAnswers };
    (submissionForm.questions || []).forEach((q: any) => {
      const key = staticLabelToKey[q.label];
      if (key && submissionAnswers[q.id] !== undefined) {
        merged[key] = submissionAnswers[q.id];
      }
    });
    setAnswers((prev: any) => ({ ...merged, ...prev })); // preserve any manual edits
  }, [submissionForm, submissionAnswers]);

  // Fetch the latest check-in submission for this client
  useEffect(() => {
    if (!clientId || !user?.id) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/checkins/responses?clientId=${clientId}&trainerId=${user.id}&page=1&pageSize=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.submissions && data.submissions.length > 0) {
          setSubmission(data.submissions[0]);
          setSubmissionForm(data.submissions[0].form);
          setSubmissionAnswers(data.submissions[0].answers || {});
        }
      });
  }, [clientId, user?.id]);

  // Add debug logs for submission, submissionForm, and submissionAnswers
  useEffect(() => {
    console.log('EditClientPage submission:', submission);
    console.log('EditClientPage submissionForm:', submissionForm);
    console.log('EditClientPage submissionAnswers:', submissionAnswers);
  }, [submission, submissionForm, submissionAnswers]);

  // Add state for subscription
  const [subscription, setSubscription] = useState<any>({
    startDate: "",
    durationValue: "",
    durationUnit: "month",
    endDate: "",
    paymentStatus: "",
    paymentMethod: "",
    discount: "",
    priceBeforeDisc: "",
    installments: "",
  });
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
  // When client data is loaded, set subscription from latest subscription
  useEffect(() => {
    if (formData && formData.subscriptions && formData.subscriptions.length > 0) {
      const latest = formData.subscriptions[0];
      setSubscription({
        id: latest.id || undefined,
        packageId: latest.packageId || '',
        startDate: latest.startDate ? latest.startDate.slice(0, 10) : '',
        durationValue: latest.durationValue || '',
        durationUnit: latest.durationUnit || 'month',
        endDate: latest.endDate ? latest.endDate.slice(0, 10) : '',
        paymentStatus: latest.paymentStatus || '',
        paymentMethod: latest.paymentMethod || '',
        discount: latest.discountValue || '',
        priceBeforeDisc: latest.priceBeforeDisc || '',
        installments: latest.installments || '',
      });
    } else {
      setSubscription({
        id: undefined,
        packageId: '',
        startDate: '',
        durationValue: '',
        durationUnit: 'month',
        endDate: '',
        paymentStatus: '',
        paymentMethod: '',
        discount: '',
        priceBeforeDisc: '',
        installments: '',
      });
    }
  }, [formData]);
  const handleSubscriptionChange = (key: string, value: any) => {
    setSubscription((prev: any) => ({ ...prev, [key]: value }));
  };

  // Handler to assign a check-in form to a client
  const handleAssignForm = async () => {
    if (!selectedFormId) return;
      setLoading(true);
    setError(null);
    try {
      const user = getStoredUser();
      if (!user) throw new Error("Not authenticated");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client: { ...formData, checkInFormId: selectedFormId } }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to assign check-in form.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
  };

  // Compute groupedFields as in create client
  const groupedFields = GROUPS;
  // Compute check-in fields and profile fields based on submissionForm
  const checkInFields = React.useMemo(() => {
    if (!submissionForm) return [];
    const formQuestions = (submissionForm.questions || []).map((q: any) => q.label);
    // All fields from GROUPS that match a form question label
    const matchedFields = groupedFields.flatMap(group =>
      group.fields.filter(field => formQuestions.includes(field.label))
    );
    // Find custom questions (those in the form but not in GROUPS)
    const customQuestions = (submissionForm.questions || []).filter((q: any) => !matchedFields.some(f => f.label === q.label));
    return [...matchedFields, ...customQuestions.map((q: any) => ({
      key: q.id || q.label,
      label: q.label,
      type: q.type || 'text',
      required: !!q.required,
      options: q.options || [],
      isCustom: true,
    }))];
  }, [submissionForm, groupedFields]);
  // Compute profile fields by group (fields not in the form)
  const profileFieldsByGroup = React.useMemo(() => {
    if (!submissionForm) return groupedFields;
    const formQuestions = (submissionForm.questions || []).map((q: any) => q.label);
    return groupedFields.map(group => ({
      ...group,
      fields: group.fields.filter(field => !formQuestions.includes(field.label)),
    })).filter(group => group.fields.length > 0);
  }, [submissionForm, groupedFields]);

  // Update handleChange to update formData for profile fields and answers for check-in questions
  const handleChange = (key: string, value: any, isCheckInQuestion: boolean = false) => {
    if (isCheckInQuestion) {
      setAnswers((prev: any) => ({ ...prev, [key]: value }));
    } else {
      setFormData((prev: any) => ({ ...prev, [key]: value }));
    }
  };

  // On save, send answers as part of the client update
  const arrayFields = ['goals', 'injuriesHealthNotes'];
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    // Frontend validation for subscription fields
    const requiredSubFields = ['packageId', 'startDate', 'durationValue', 'durationUnit', 'endDate'];
    for (const field of requiredSubFields) {
      if (!subscription[field] || subscription[field] === '') {
        setError(`Subscription field '${field}' is required.`);
        setLoading(false);
        return;
      }
    }
    // Log the subscription object for debugging
    console.log('Submitting subscription:', subscription);
    try {
      const user = getStoredUser();
      if (!user) throw new Error("Not authenticated");
      // Convert array fields from comma-separated strings to arrays
      const formDataToSend = { ...formData };
      arrayFields.forEach(field => {
        if (typeof formDataToSend[field] === 'string') {
          formDataToSend[field] = formDataToSend[field].split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      });
      // Build answers object: question ID for check-in questions, field key for profile fields
      let mergedAnswers: Record<string, any> = {};
      if (submissionForm && submissionForm.questions) {
        submissionForm.questions.forEach((q: any) => {
          if (answers[q.id] !== undefined) {
            mergedAnswers[q.id] = answers[q.id];
          } else if (answers[q.label] !== undefined) {
            mergedAnswers[q.id] = answers[q.label];
          }
        });
      }
      Object.keys(answers).forEach(key => {
        if (!Object.values(mergedAnswers).includes(answers[key])) {
          mergedAnswers[key] = answers[key];
        }
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client: { ...formDataToSend, answers: mergedAnswers }, subscription }),
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

  const [transactionImage, setTransactionImage] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Edit Client</h1>
      <p className="mb-6 text-zinc-600">Update the client profile. Complete all fields to mark as completed.</p>
      {error && (
        <Alert open={!!error} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {/* Show message and hide form if no check-in form is associated */}
      {!submissionForm ? (
        <div className="text-center text-zinc-500 py-12">
          <div className="mb-4">This client does not have a check-in submission.<br />
            Editing check-in questions is not available for this client.<br />
            (This client was not created via a check-in form, or the data is missing.)
            </div>
            </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Check-In Data Section (always, if checkInFields exist) */}
          {checkInFields.length > 0 && (
            <div className="mb-6 bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Check-In Data</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {checkInFields.map(field => {
                  // Render custom questions
                  if (field.isCustom) {
                    if (field.type === 'select' && field.options.length > 0) {
                      return (
                        <div key={field.key} className="flex flex-col">
                          <label className="text-sm font-medium mb-1 flex items-center gap-1">
                            {field.label}
                            {field.required && <span className="text-red-500">*</span>}
                          </label>
                          <Select
                            value={answers[field.key] || ''}
                            onChange={e => handleChange(field.key, e.target.value, true)}
                            required={field.required}
                            className="w-full"
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
                            value={answers[field.key] || ''}
                            onChange={e => handleChange(field.key, e.target.value, true)}
                            placeholder={field.label}
                            required={field.required}
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
                          value={answers[field.key] || ''}
                          onChange={e => handleChange(field.key, e.target.value, true)}
                          placeholder={field.label}
                          required={field.required}
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
                  );
                })}
          </div>
            </div>
          )}
          {/* Profile Data Sections (always) */}
          {profileFieldsByGroup.map(group => (
            <div key={group.label} className="mb-6 bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">{group.label}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {group.fields.map(field => (
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
              {subscription.paymentStatus === 'paid' && (
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Transaction Image</label>
                <input
                  type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !subscription.id) return;
                      const formData = new FormData();
                      formData.append('file', file);
                      formData.append('subscriptionId', subscription.id);
                      const res = await fetch('/api/transaction-images/subscription', {
                        method: 'POST',
                        body: formData,
                      });
                      if (res.ok) {
                        const img = await res.json();
                        setTransactionImage(img);
                      } else {
                        alert('Failed to upload transaction image');
                      }
                    }}
                  />
                  {transactionImage && (
                    <div className="mt-2 text-xs text-zinc-600">Uploaded: {transactionImage.originalName}</div>
                )}
              </div>
            )}
          </div>
          </div>
          <div className="flex gap-4 justify-end mt-8">
            <Button outline type="button" onClick={() => router.push('/clients')}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </form>
      )}
    </div>
  );
} 