"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Select } from "@/components/select";
import { Button } from "@/components/button";
import { useRouter } from "next/navigation";
import { getStoredUser } from '@/lib/auth';
import { Alert } from '@/components/alert';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import dayjs from "dayjs";
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/table';
import { TrashIcon, PlusIcon } from '@heroicons/react/20/solid';

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
  const [transactionImage, setTransactionImage] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [showDiscountFields, setShowDiscountFields] = useState(false);
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [showTransactionImage, setShowTransactionImage] = useState(false);
  const [showDiscountValue, setShowDiscountValue] = useState(false);
  const [showPriceFields, setShowPriceFields] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [newPackageName, setNewPackageName] = useState('');
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [packageError, setPackageError] = useState('');
  type InstallmentRow = {
    date: string;
    amount: string;
    remaining: string;
    image: File | null;
    nextDate: string;
  };
  const [installments, setInstallments] = useState<InstallmentRow[]>([
    { date: '', amount: '', remaining: '', image: null, nextDate: '' }
  ]);

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
        const data = await res.json();
        // If a transaction image was selected and payment status is paid, upload it
        if (transactionImage && subscription.paymentStatus === 'paid' && data.subscription && data.subscription.id) {
          const formDataImg = new FormData();
          formDataImg.append('file', transactionImage);
          formDataImg.append('subscriptionId', data.subscription.id);
          await fetch('/api/transaction-images/subscription', {
            method: 'POST',
            body: formDataImg,
          });
        }
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

  // Fetch packages for the trainer
  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    fetch(`/api/packages?trainerId=${user.id}`)
      .then(res => res.json())
      .then(data => setPackages(data || []));
  }, []);

  const handleAddPackage = async () => {
    setPackageError('');
    const user = getStoredUser();
    if (!user) return;
    if (!newPackageName.trim()) {
      setPackageError('Package name is required.');
      return;
    }
    try {
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainerId: user.id, name: newPackageName.trim() }),
      });
      if (res.ok) {
        const pkg = await res.json();
        setPackages((prev: any[]) => [...prev, pkg]);
        setSubscription((prev: any) => ({ ...prev, packageId: pkg.id }));
        setNewPackageName('');
        setShowAddPackage(false);
      } else {
        const data = await res.json();
        setPackageError(data.error || 'Failed to create package.');
      }
    } catch (err) {
      setPackageError('Network error.');
    }
  };

  // Helper to calculate remaining for each row
  const getInstallmentRemaining = (idx: number) => {
    const before = Number(subscription.priceBeforeDisc) || 0;
    const after = subscription.discount === 'yes' ? (() => {
      const discount = Number(subscription.discountValue) || 0;
      if (discountType === 'fixed') return before - discount;
      if (discountType === 'percentage') return before - (before * discount / 100);
      return before;
    })() : before;
    const paid = installments.slice(0, idx).reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
    return Math.max(after - paid, 0);
  };

  // Handler for changing installment fields
  const handleInstallmentChange = (idx: number, key: string, value: any) => {
    setInstallments(insts => insts.map((inst, i) => i === idx ? { ...inst, [key]: value } : inst));
  };

  // Handler for file upload
  const handleInstallmentImage = (idx: number, file: File | null) => {
    setInstallments(insts => insts.map((inst, i) => i === idx ? { ...inst, image: file } : inst));
  };

  // Handler to add/remove installment rows
  const addInstallment = () => setInstallments(insts => [...insts, { date: '', amount: '', remaining: '', image: null, nextDate: '' }]);
  const removeInstallment = (idx: number) => setInstallments(insts => insts.length > 1 ? insts.filter((_, i) => i !== idx) : insts);

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
                <Select
                  value={subscription.paymentStatus}
                  onChange={e => {
                    handleSubscriptionChange('paymentStatus', e.target.value);
                    setShowPaymentMethod(['paid', 'installments'].includes(e.target.value));
                    setShowDiscountFields(['paid', 'installments'].includes(e.target.value));
                    setShowTransactionImage(e.target.value === 'paid');
                  }}
                >
                  <option value="">Select...</option>
                  <option value="paid">Paid</option>
                  <option value="free">Free</option>
                  <option value="free_trial">Free Trial</option>
                  <option value="pending">Pending</option>
                  <option value="installments">Installments</option>
                </Select>
              </div>
              {showPaymentMethod && (
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Payment Method</label>
                  <Select value={subscription.paymentMethod} onChange={e => handleSubscriptionChange('paymentMethod', e.target.value)}>
                    <option value="">Select...</option>
                    <option value="instapay">Instapay</option>
                    <option value="vodafone_cash">Vodafone Cash</option>
                    <option value="fawry">Fawry</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </Select>
                </div>
              )}
              {showDiscountFields && (
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Discount</label>
                  <Select
                    value={subscription.discount}
                    onChange={e => {
                      handleSubscriptionChange('discount', e.target.value);
                      setShowDiscountValue(e.target.value === 'yes');
                      setShowPriceFields(e.target.value === 'yes');
                    }}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </Select>
                </div>
              )}
              {showDiscountValue && (
                <>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">Discount Value</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={subscription.discountValue || ''}
                        onChange={e => handleSubscriptionChange('discountValue', e.target.value)}
                        className="w-1/2"
                      />
                      <Select
                        value={discountType}
                        onChange={e => setDiscountType(e.target.value as 'fixed' | 'percentage')}
                        className="w-1/2"
                      >
                        <option value="fixed">Fixed Amount</option>
                        <option value="percentage">Percentage</option>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">Price Before Discount</label>
                    <Input
                      type="number"
                      value={subscription.priceBeforeDisc || ''}
                      onChange={e => handleSubscriptionChange('priceBeforeDisc', e.target.value)}
                    />
                  </div>
                </>
              )}
              {showPriceFields && (
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Price After Discount</label>
                  <Input
                    type="number"
                    value={(() => {
                      const before = Number(subscription.priceBeforeDisc) || 0;
                      const discount = Number(subscription.discountValue) || 0;
                      if (discountType === 'fixed') return before - discount;
                      if (discountType === 'percentage') return before - (before * discount / 100);
                      return before;
                    })()}
                    readOnly
                    disabled
                    className="bg-zinc-100"
                  />
                </div>
              )}
              {showTransactionImage && (
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Transaction Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      // No subscriptionId yet on create, so just store the file in state for now
                      setTransactionImage(file);
                    }}
                    className="block w-full border border-zinc-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                  {transactionImage && (
                    <div className="mt-2 text-xs text-zinc-600">Selected: {transactionImage.name}</div>
                  )}
                </div>
              )}
            </div>
          </div>

            {/* Installments Management section (separate, full width) */}
            {subscription.paymentStatus === 'installments' && (
              <div className="mb-6 bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Installments Management</h2>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Installment Date</TableHeader>
                        <TableHeader>Amount</TableHeader>
                        <TableHeader>Remaining</TableHeader>
                        <TableHeader>Transaction Image</TableHeader>
                        <TableHeader>Next Installment Date</TableHeader>
                        <TableHeader>Actions</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {installments.map((inst, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Input type="date" value={inst.date} onChange={e => handleInstallmentChange(idx, 'date', e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={inst.amount} onChange={e => handleInstallmentChange(idx, 'amount', e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={getInstallmentRemaining(idx)} readOnly disabled className="bg-zinc-100" />
                          </TableCell>
                          <TableCell>
                            <input type="file" accept="image/*" onChange={e => handleInstallmentImage(idx, e.target.files?.[0] || null)} className="block w-full border border-zinc-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" />
                            {inst.image && <div className="mt-1 text-xs text-zinc-600">{inst.image.name}</div>}
                          </TableCell>
                          <TableCell>
                            <Input type="date" value={inst.nextDate} onChange={e => handleInstallmentChange(idx, 'nextDate', e.target.value)} />
                          </TableCell>
                          <TableCell className="flex gap-2 items-center">
                            <button type="button" onClick={() => removeInstallment(idx)} disabled={installments.length === 1} className="text-red-500 disabled:opacity-50"><TrashIcon className="w-5 h-5" /></button>
                            <button type="button" onClick={addInstallment} className="text-green-600"><PlusIcon className="w-5 h-5" /></button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            <div className="flex gap-4 justify-end mt-8">
              <Button outline type="button" onClick={() => router.push('/clients')}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Create Client'}</Button>
            </div>
          </form>
        )}
    </div>
  );
} 