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
import { MultiSelect, MultiSelectOption } from '@/components/multiselect';
import { TrashIcon, PlusIcon } from '@heroicons/react/20/solid';

// Import the same QUESTION_CONFIGS from check-in create page
const QUESTION_CONFIGS: Record<string, { type: string; options: string[] }> = {
  'Full Name': { type: 'short', options: [] },
  'Email': { type: 'short', options: [] },
  'Mobile Number': { type: 'short', options: [] },
  'Gender': { type: 'single', options: ['Male', 'Female'] },
  'Age': { type: 'short', options: [] },
  'Source': { type: 'single', options: ['Facebook Ads', 'Instagram', 'Website', 'WhatsApp', 'Referral', 'Walk-in', 'Google Ads', 'Other'] },
  'Goal': { type: 'multi', options: ['Fat Loss', 'Muscle Gain', 'Tone & Shape', 'General Fitness', 'Strength', 'Posture Correction', 'Injury Rehab', 'Event Prep', 'Other'] },
  'Level': { type: 'single', options: ['Beginner', 'Intermediate', 'Advanced', 'Athlete'] },
  'Injuries': { type: 'multi', options: ['Knee Pain', 'Shoulder Pain', 'Lower Back Pain', 'Herniated Disc', 'Sciatica', 'Elbow Pain', 'Hip Pain', 'Neck Pain', 'Plantar Fasciitis', 'Post-surgery', 'Arthritis', 'Headaches', 'Other'] },
  'Workout Place': { type: 'single', options: ['Gym', 'Home'] },
  'Height': { type: 'short', options: [] },
  'Weight': { type: 'short', options: [] },
  'Preferred Training Days': { type: 'multi', options: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
  'Preferred Training Time': { type: 'single', options: ['Early Morning (5-8 AM)', 'Morning (8-12 PM)', 'Afternoon (12-5 PM)', 'Evening (5-9 PM)', 'Late Night (9 PM+)'] },
  'Equipment Availability': { type: 'multi', options: ['Gym Access', 'Dumbbells', 'Barbell', 'Resistance Bands', 'Machines', 'TRX', 'Pull-up Bar', 'Stepper', 'Treadmill', 'Stationary Bike', 'Cable Machine', 'Bodyweight Only', 'Other'] },
  'Favorite Training Style': { type: 'multi', options: ['Strength', 'HIIT', 'Cardio', 'Pilates', 'Yoga', 'Functional', 'CrossFit', 'Circuit', 'Mobility', 'Bodybuilding', 'Other'] },
  'Weak Areas (Focus)': { type: 'multi', options: ['Core', 'Lower Back', 'Glutes', 'Hamstrings', 'Shoulders', 'Arms', 'Inner Thigh', 'Calves', 'Neck', 'Grip Strength', 'Other'] },
  'Nutrition Goal': { type: 'single', options: ['Fat Loss', 'Muscle Gain', 'Maintenance', 'Improve Energy', 'Improve Digestion', 'Medical (e.g. PCOS, Diabetes)', 'Other'] },
  'Diet Preference': { type: 'single', options: ['Regular', 'Low Carb', 'Low Fat', 'Keto', 'Intermittent Fasting', 'Vegetarian', 'Vegan', 'Pescatarian', 'Mediterranean', 'Gluten-Free', 'Lactose-Free', 'Other'] },
  'Meal Count': { type: 'single', options: ['2 meals', '3 meals', '4 meals', '5+ meals'] },
  'Food Allergies / Restrictions': { type: 'multi', options: ['Lactose', 'Gluten', 'Eggs', 'Nuts', 'Shellfish', 'Soy', 'Corn', 'Citrus', 'Legumes', 'Artificial Sweeteners', 'Other'] },
  'Disliked Ingredients': { type: 'long', options: [] },
  'Current Nutrition Plan Followed': { type: 'long', options: [] },
};

// Core business questions only - for all trainer types
const CORE_QUESTIONS = [
  { key: 'fullName', label: 'Full Name', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email', required: true },
  { key: 'phone', label: 'Mobile Number', type: 'text', required: true },
  { key: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'] },
  { key: 'age', label: 'Age', type: 'number', required: true },
  { key: 'source', label: 'Source', type: 'text', required: true },
];

// Legacy GROUPS structure (kept for reference but not used in client creation)
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
];

export default function CreateClientPage() {
  // Helper function to map check-in form types to client form types
  const mapFormTypeToInputType = (formType: string): string => {
    switch (formType) {
      case 'single':
        return 'select';
      case 'multi':
        return 'multiselect';
      case 'long':
        return 'textarea';
      case 'short':
        return 'text';
      case 'date':
        return 'date';
      case 'time':
        return 'time';
      default:
        return formType;
    }
  };

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
  const [registrationDate, setRegistrationDate] = useState<string>("");
  const [transactionImage, setTransactionImage] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [showDiscountFields, setShowDiscountFields] = useState(false);
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  
  // Extras section state
  const [labels, setLabels] = useState<any[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<number[]>([]);
  const [newLabelName, setNewLabelName] = useState('');
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [labelError, setLabelError] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [showTransactionImage, setShowTransactionImage] = useState(false);
  const [showDiscountValue, setShowDiscountValue] = useState(false);
  const [showPriceFields, setShowPriceFields] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [newPackageName, setNewPackageName] = useState('');
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [packageError, setPackageError] = useState('');
  type InstallmentRow = { id?: string; date: string; amount: string; image: File | null; nextDate: string; remaining?: string; };
  const [installments, setInstallments] = useState<InstallmentRow[]>([{ date: '', amount: '', image: null, nextDate: '' }]);

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

  // Fetch trainer's labels
  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/labels?trainerId=${user.id}`)
      .then(res => res.json())
      .then(data => setLabels(data || []))
      .catch(() => console.error("Failed to load labels."));
  }, []);

  // Refresh forms when selected form changes to get latest data
  useEffect(() => {
    if (selectedFormId) {
      const user = getStoredUser();
      if (!user) return;
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/checkins?trainerId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          setForms(data || []);
          // Update selected form with latest data
          const updatedForm = data.find((f: any) => String(f.id) === selectedFormId);
          if (updatedForm) {
            setSelectedForm(updatedForm);
          }
        })
        .catch(() => console.error("Failed to refresh forms."));
    }
  }, [selectedFormId]);

  // Set selected form object when selectedFormId changes
  useEffect(() => {
    console.log('Selected form ID:', selectedFormId);
    console.log('Available forms:', forms);
    if (!selectedFormId) {
      console.log('No form ID selected, setting selectedForm to null');
      setSelectedForm(null);
    } else {
      const foundForm = forms.find(f => String(f.id) === selectedFormId);
      console.log('Found form:', foundForm);
      setSelectedForm(foundForm || null);
    }
  }, [selectedFormId, forms]);

  // Debug: Log selected form data
  useEffect(() => {
    if (selectedForm) {
      console.log('Selected form:', selectedForm);
      console.log('Form questions:', selectedForm.questions);
    }
  }, [selectedForm]);

  // Core questions with form integration for profile completion
  const coreFields = useMemo(() => {
    if (!selectedForm) return CORE_QUESTIONS;
    
    // Map selected form questions by label for quick lookup
    const formQuestions = (selectedForm.questions || []).reduce((acc: any, q: any) => {
      acc[q.label] = q;
      return acc;
    }, {});
    
    // Process core questions and mark if they're present in the form
    return CORE_QUESTIONS.map(field => {
        const q = formQuestions[field.label];
        // Use form question configuration if available, otherwise fall back to QUESTION_CONFIGS
        const config = q ? { type: q.type, options: q.options || [] } : QUESTION_CONFIGS[field.label];
        return {
          ...field,
          presentInForm: !!q,
        type: q ? mapFormTypeToInputType(q.type) : (config ? mapFormTypeToInputType(config.type) : field.type),
          options: q && q.options ? q.options : (config ? config.options : field.options),
        required: field.required, // always required for core questions
        };
    });
  }, [selectedForm]);

  // Profile completion calculation
  const { completedCount, totalRequired, isComplete, missingFields } = useMemo(() => {
    let completed = 0;
    let total = 0;
    let missing: string[] = [];
    
    // Check core fields
    coreFields.forEach(field => {
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
    
    return {
      completedCount: completed,
      totalRequired: total,
      isComplete: completed === total,
      missingFields: missing,
    };
  }, [formData, coreFields]);

  // Compute check-in fields based on selected form
  const checkInFields = useMemo(() => {
    console.log('checkInFields useMemo called, selectedForm:', selectedForm, 'selectedFormId:', selectedFormId);
    if (!selectedForm || !selectedFormId) {
      console.log('No selectedForm or selectedFormId, returning empty array');
      return [];
    }
    
    try {
      // Process ALL questions from the form as custom questions
      const allFormQuestions = (selectedForm.questions || []).map((q: any) => {
        if (!q || !q.label) return null;
        
        // Treat ALL form questions as custom questions with question IDs as keys
        return {
          key: q.id, // Use question ID as key (111, 112, etc.)
          label: q.label,
          type: mapFormTypeToInputType(q.type || 'text'),
          required: !!q.required,
          options: q.options || [],
          isCustom: true, // Always treat as custom
        };
      }).filter(Boolean); // Remove null entries
      
      console.log('Selected form questions:', selectedForm.questions);
      console.log('Check-in fields:', allFormQuestions);
      console.log('Check-in fields count:', allFormQuestions.length);
      return allFormQuestions;
    } catch (error) {
      console.error('Error processing check-in fields:', error);
      return [];
    }
  }, [selectedForm, coreFields, selectedFormId]);

  // Core questions that are NOT in the check-in form
  const coreFieldsNotInForm = useMemo(() => {
    if (!selectedForm) return coreFields;
    
    try {
      // Get all question labels from the form
      const formQuestionLabels = (selectedForm.questions || [])
        .filter((q: any) => q && q.label)
        .map((q: any) => q.label);
      
      console.log('Form question labels:', formQuestionLabels);
      console.log('Core fields:', coreFields);
      
      // Filter out core questions that are already in the form
      const filteredCoreFields = coreFields.filter(field => {
        const isInForm = formQuestionLabels.includes(field.label);
        console.log(`Core field "${field.label}" in form: ${isInForm}`);
          return !isInForm;
        });
        
      console.log('Core fields not in form:', filteredCoreFields);
      return filteredCoreFields;
    } catch (error) {
      console.error('Error processing core fields:', error);
      return coreFields;
    }
  }, [selectedForm, coreFields]);

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
    console.log(`handleChange called - key: ${key}, value:`, value, 'type:', typeof value);
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleMultiSelectChange = (key: string, value: string, checked: boolean) => {
    const currentValues = formData[key] ? (Array.isArray(formData[key]) ? formData[key] : [formData[key]]) : [];
    const updatedValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    setFormData(prev => ({ ...prev, [key]: updatedValues }));
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
      // Before sending, ensure correct types for injuriesHealthNotes and mealCount
      const formDataToSend = { ...formData };
      console.log('Original formData before processing:', formData);
      console.log('formDataToSend before processing:', formDataToSend);
      if (typeof formDataToSend.injuriesHealthNotes === 'string' && formDataToSend.injuriesHealthNotes.trim() !== '') {
        formDataToSend.injuriesHealthNotes = formDataToSend.injuriesHealthNotes.split(',').map((s: string) => s.trim()).filter(Boolean);
      } else if (!Array.isArray(formDataToSend.injuriesHealthNotes)) {
        formDataToSend.injuriesHealthNotes = [];
      }
      // Map numeric keys (question IDs) to client field names
      const idToField = {
        65: 'injuriesHealthNotes',
        76: 'mealCount',
        // Add other mappings as needed
      };
      Object.entries(formDataToSend).forEach(([key, value]) => {
        if (!isNaN(Number(key)) && idToField[key]) {
          // Special handling for mealCount - treat as single select and parse number
          if (idToField[key] === 'mealCount') {
            let mealCountValue = null;
            if (Array.isArray(value) && value.length > 0) {
              mealCountValue = value[0]; // Take first element (e.g., "3 meals")
            } else if (typeof value === 'string' && value.trim() !== '') {
              mealCountValue = value; // Keep as string (e.g., "3 meals")
            }

            if (mealCountValue !== null) {
              if (typeof mealCountValue === 'string' && mealCountValue.includes('+')) {
                formDataToSend[idToField[key]] = 5; // For "5+ meals", save as 5
              } else if (typeof mealCountValue === 'string') {
                // Extract number from string (e.g., "3 meals" -> 3)
                const parsedNumber = parseInt(mealCountValue.replace(/\D/g, ''), 10);
                formDataToSend[idToField[key]] = isNaN(parsedNumber) ? null : parsedNumber;
              } else {
                formDataToSend[idToField[key]] = null; // Fallback if not string/array
              }
            } else {
              formDataToSend[idToField[key]] = null;
            }
          } else {
            formDataToSend[idToField[key]] = value;
          }
          delete formDataToSend[key];
        }
      });
      // Ensure mealCount is a valid number or null
      if (Array.isArray(formDataToSend.mealCount)) {
        formDataToSend.mealCount = formDataToSend.mealCount[0];
      }
      if (
        formDataToSend.mealCount === '' ||
        formDataToSend.mealCount === undefined ||
        isNaN(Number(formDataToSend.mealCount))
      ) {
        formDataToSend.mealCount = null;
      } else {
        formDataToSend.mealCount = Number(formDataToSend.mealCount);
      }
      console.log('CreateClientPage formDataToSend:', formDataToSend);
      // Collect custom question answers from form questions
      const customAnswers: Record<string, any> = {};
      console.log('formData keys:', Object.keys(formData));
      console.log('formData values:', Object.values(formData));
      
      // Get the selected form questions to map answers
      if (selectedForm && selectedForm.questions) {
        selectedForm.questions.forEach((question: any) => {
          const questionId = question.id;
          
          // Look for the answer in formData using the question ID as key
          const answer = formData[questionId];
          if (answer !== undefined && answer !== null && answer !== '') {
            customAnswers[questionId] = answer;
            console.log(`Adding custom answer for question ${questionId}: ${answer}`);
          }
        });
      }
      
      console.log('Final customAnswers:', customAnswers);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          trainerId: user.id, 
          client: { ...formDataToSend, registrationDate, selectedFormId, labels: selectedLabels }, 
          subscription,
          installments: installments.filter(inst => inst.date && inst.amount).map(inst => ({
            paidDate: inst.date,
            amount: inst.amount,
            nextInstallment: inst.nextDate,
            remaining: inst.remaining || 0,
            status: 'paid'
          })), // Only send installments with valid data
          notes: notes.map(note => ({ content: note.content })),
          answers: customAnswers // <-- send answers
        }),
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
    const discount = Number(subscription.discountValue) || 0;
    let total = before;
    if (subscription.discount === 'yes') {
      if (discountType === 'fixed') total = before - discount;
      if (discountType === 'percentage') total = before - (before * discount / 100);
    }
    let paid = 0;
    for (let i = 0; i <= idx; i++) {
      paid += Number(installments[i]?.amount) || 0;
    }
    return Math.max(total - paid, 0);
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
  const addInstallment = () => setInstallments(insts => [...insts, { date: '', amount: '', image: null, nextDate: '' }]);
  const removeInstallment = (idx: number) => setInstallments(insts => insts.length > 1 ? insts.filter((_, i) => i !== idx) : insts);

  // Labels handlers
  const handleAddLabel = async () => {
    setLabelError('');
    const user = getStoredUser();
    if (!user) return;
    if (!newLabelName.trim()) {
      setLabelError('Label name is required.');
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainerId: user.id, name: newLabelName.trim() }),
      });
      if (res.ok) {
        const label = await res.json();
        setLabels(prev => [...prev, label]);
        setSelectedLabels(prev => [...prev, label.id]);
        setNewLabelName('');
        setShowAddLabel(false);
      } else {
        const data = await res.json();
        setLabelError(data.error || 'Failed to create label.');
      }
    } catch (err) {
      setLabelError('Network error.');
    }
  };

  const handleLabelToggle = (labelId: number) => {
    setSelectedLabels(prev => 
      prev.includes(labelId) 
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  // Notes handlers (for Create Client - store locally until client is created)
  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    // Create a temporary note object with a temporary ID
    const tempNote = {
      id: Date.now(), // Temporary ID for local management
      content: newNote.trim(),
      createdAt: new Date().toISOString(),
      isTemp: true // Flag to identify temporary notes
    };
    
    setNotes(prev => [tempNote, ...prev]);
    setNewNote('');
  };

  const handleEditNote = (noteId: number) => {
    if (!editingNoteContent.trim()) return;
    
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, content: editingNoteContent.trim() }
        : note
    ));
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const handleDeleteNote = (noteId: number) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
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
      {!selectedForm ? (
        <div className="text-center text-zinc-500 py-12">
          <div className="mb-4">Please select a check-in form to continue.<br />
            The form will determine the field types and options for client creation.
          </div>
        </div>
      ) : (
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
                      if (field.type === 'select' && field.options && field.options.length > 0) {
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
                      if (field.type === 'multiselect' && field.options && field.options.length > 0) {
                        const currentValues = formData[field.key] ? (Array.isArray(formData[field.key]) ? formData[field.key] : [formData[field.key]]) : [];
                        return (
                          <div key={field.key} className="flex flex-col">
                            <label className="text-sm font-medium mb-1 flex items-center gap-1">
                              {field.label}
                              {field.required && <span className="text-red-500">*</span>}
                            </label>
                            <MultiSelect
                              value={currentValues}
                              onChange={(value) => setFormData(prev => ({ ...prev, [field.key]: value }))}
                              placeholder={`Select ${field.label}...`}
                              className={`w-full ${isMissing ? 'border-yellow-400' : ''}`}
                            >
                              {field.options.map((opt: string) => (
                                <MultiSelectOption key={opt} value={opt}>
                                  {opt}
                                </MultiSelectOption>
                              ))}
                            </MultiSelect>
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
                        {field.type === 'select' && field.options && field.options.length > 0 ? (
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
                        ) : field.type === 'multiselect' && field.options && field.options.length > 0 ? (
                          (() => {
                            const currentValues = formData[field.key] ? (Array.isArray(formData[field.key]) ? formData[field.key] : [formData[field.key]]) : [];
                            return (
                              <MultiSelect
                                value={currentValues}
                                onChange={(value) => setFormData(prev => ({ ...prev, [field.key]: value }))}
                                placeholder={`Select ${field.label}...`}
                                className={`w-full ${isMissing ? 'border-yellow-400' : ''}`}
                              >
                                {field.options.map((opt: string) => (
                                  <MultiSelectOption key={opt} value={opt}>
                                    {opt}
                                  </MultiSelectOption>
                                ))}
                              </MultiSelect>
                            );
                          })()
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
          {/* Core Questions Section */}
          {coreFieldsNotInForm.length > 0 && (
            <div className="mb-6 bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Core Questions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {coreFieldsNotInForm.map(field => {
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
                      ) : field.type === 'multiselect' ? (
                        (() => {
                          const currentValues = formData[field.key] ? (Array.isArray(formData[field.key]) ? formData[field.key] : [formData[field.key]]) : [];
                          return (
                            <div className={`border rounded-lg p-3 ${isMissing ? 'border-yellow-400' : 'border-zinc-950/10'}`}>
                              {field.options && field.options.map((opt: string) => (
                                <label key={opt} className="flex items-center gap-2 mb-2 last:mb-0">
                                  <input
                                    type="checkbox"
                                    checked={currentValues.includes(opt)}
                                    onChange={e => handleMultiSelectChange(field.key, opt, e.target.checked)}
                                    className="rounded border-zinc-950/20"
                                  />
                                  <span className="text-sm">{opt}</span>
                                </label>
                              ))}
                            </div>
                          );
                        })()
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
          {/* Subscription Details Section */}
          <div className="mb-6 bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Subscription Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Registration Date</label>
                <Input type="date" value={registrationDate} onChange={e => setRegistrationDate(e.target.value)} />
              </div>
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
              {['paid', 'installments'].includes(subscription.paymentStatus) && (
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Price Before Discount</label>
                  <Input
                    type="number"
                    value={subscription.priceBeforeDisc || ''}
                    onChange={e => handleSubscriptionChange('priceBeforeDisc', e.target.value)}
                  />
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
                </>
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
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Package</label>
                <div className="flex gap-2 items-center">
                  <Select
                    value={subscription.packageId || ''}
                    onChange={e => handleSubscriptionChange('packageId', e.target.value)}
                    className="w-full"
                  >
                    <option value="">Select package...</option>
                    {packages.map((pkg: any) => (
                      <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                    ))}
                  </Select>
                  <Button
                    type="button"
                    outline
                    className="min-w-[110px] text-xs"
                    onClick={() => setShowAddPackage(v => !v)}
                  >
                    Add New
                  </Button>
                </div>
                {showAddPackage && (
                  <div className="mt-2 flex gap-2 items-center rounded p-2 bg-zinc-50">
                    <Input
                      type="text"
                      value={newPackageName}
                      onChange={e => setNewPackageName(e.target.value)}
                      placeholder="Package Name"
                      className="w-1/2"
                    />
                    <Button
                      type="button"
                      onClick={handleAddPackage}
                      className="px-3"
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      outline
                      onClick={() => {
                        setShowAddPackage(false);
                        setNewPackageName('');
                        setPackageError('');
                      }}
                      className="px-3"
                    >
                      Cancel
                    </Button>
                    {packageError && <span className="text-red-500 text-xs ml-2">{packageError}</span>}
                  </div>
                )}
              </div>
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
                        <TableRow key={inst.id || idx}>
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

            {/* Extras Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Extras</h3>
              
              {/* Labels/Tags Section */}
              <div className="mb-8">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Labels/Tags</h4>
                <div className="space-y-3">
                  {/* Add New Label Input */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddLabel()}
                      placeholder="Type and press Enter to add a label..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                                    <button
                  type="button"
                  onClick={handleAddLabel}
                  disabled={!newLabelName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
                  </div>
                  {labelError && (
                    <p className="text-red-500 text-sm">{labelError}</p>
                  )}
                  
                  {/* Available Labels */}
                  <div className="flex flex-wrap gap-2">
                    {labels.map((label) => (
                                        <button
                    key={label.id}
                    type="button"
                    onClick={() => handleLabelToggle(label.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedLabels.includes(label.id)
                        ? 'bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                        {label.name}
                        {selectedLabels.includes(label.id) && (
                          <span className="ml-1.5 text-blue-600">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {/* Selected Labels Display */}
                  {selectedLabels.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">Selected labels:</p>
                      <div className="flex flex-wrap gap-2">
                        {labels
                          .filter((label) => selectedLabels.includes(label.id))
                          .map((label) => (
                            <span
                              key={label.id}
                              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                            >
                              {label.name}
                              <button
                                type="button"
                                onClick={() => handleLabelToggle(label.id)}
                                className="ml-1.5 text-blue-600 hover:text-blue-800 focus:outline-none"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Notes</h4>
                <div className="space-y-4">
                  {/* Add New Note */}
                  <div className="flex space-x-2">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note about this client..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                                    <button
                  type="button"
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-start"
                >
                  Add
                </button>
                  </div>

                  {/* Notes List */}
                  {notes.length > 0 && (
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                        >
                          {editingNoteId === note.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingNoteContent}
                                onChange={(e) => setEditingNoteContent(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                              />
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditNote(note.id)}
                                  disabled={!editingNoteContent.trim()}
                                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingNoteId(null);
                                    setEditingNoteContent('');
                                  }}
                                  className="px-3 py-1.5 bg-gray-500 text-white text-xs font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-start justify-between">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                                <div className="flex space-x-1 ml-3">
                                  <button
                                    onClick={() => {
                                      setEditingNoteId(note.id);
                                      setEditingNoteContent(note.content);
                                    }}
                                    className="p-1 text-gray-400 hover:text-blue-600 focus:outline-none transition-colors"
                                    title="Edit note"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="p-1 text-gray-400 hover:text-red-600 focus:outline-none transition-colors"
                                    title="Delete note"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center mt-2 text-xs text-gray-500">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {new Date(note.createdAt).toLocaleString()}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-end mt-8">
              <Button outline type="button" onClick={() => router.push('/clients')}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Create Client'}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 