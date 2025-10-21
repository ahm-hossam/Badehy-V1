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
];

// Legacy GROUPS structure (kept for reference but not used in client creation)
const GROUPS = [
  {
    label: 'Basic Data',
    fields: [
      { key: 'fullName', label: 'Full Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phone', label: 'Mobile Number', type: 'text', required: true },
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
  
  // Basic client info for step 1
  const [basicInfo, setBasicInfo] = useState({
    fullName: '',
    email: '',
    phone: ''
  });
  
  // Additional state variables needed for the new flow
  const [packages, setPackages] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<number[]>([]);
  const [newLabelName, setNewLabelName] = useState('');
  const [labelError, setLabelError] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
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
  const [showAddLabel, setShowAddLabel] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [showTransactionImage, setShowTransactionImage] = useState(false);
  const [showDiscountValue, setShowDiscountValue] = useState(false);
  const [showPriceFields, setShowPriceFields] = useState(false);
  const [newPackageName, setNewPackageName] = useState('');
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [packageError, setPackageError] = useState('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<(number | string)[]>([]);
  const [user, setUser] = useState<any>(null);
  
  // New state for package-based visibility
  const [packageSelected, setPackageSelected] = useState(false);
  const [showSubscriptionFields, setShowSubscriptionFields] = useState(false);
  
  type InstallmentRow = { id?: string; date: string; amount: string; image: File | null; nextDate: string; remaining?: string; };
  const [installments, setInstallments] = useState<InstallmentRow[]>([{ date: '', amount: '', image: null, nextDate: '' }]);

  // Initialize user
  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
  }, []);

  // Fetch trainer's check-in forms
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/checkins?trainerId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setForms(data || []);
        // Set the main form as default if available
        const mainForm = data?.find((form: any) => form.isMainForm);
        if (mainForm) {
          setSelectedFormId(String(mainForm.id));
          setSelectedForm(mainForm);
        }
      })
      .catch(() => setError("Failed to load check-in forms."))
      .finally(() => setLoading(false));
  }, [user]);

  // Fetch trainer's labels
  useEffect(() => {
    if (!user) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/labels?trainerId=${user.id}`)
      .then(res => res.json())
      .then(data => setLabels(data || []))
      .catch(() => console.error("Failed to load labels."));
  }, [user]);

  // Fetch trainer's team members
  useEffect(() => {
    if (!user) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/team-members?trainerId=${user.id}`)
      .then(res => res.json())
      .then(data => setTeamMembers(data || []))
      .catch(() => console.error("Failed to load team members."));
  }, [user]);

  // Refresh forms when selected form changes to get latest data
  useEffect(() => {
    if (selectedFormId && user) {
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
  }, [selectedFormId, user]);

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
        if (!q || !q.label) {
          console.log('Skipping question due to missing q or q.label:', q);
          return null;
        }
        
        // Treat ALL form questions as custom questions with question IDs as keys
        const field = {
          key: q.id, // Use question ID as key (111, 112, etc.)
          label: q.label,
          type: mapFormTypeToInputType(q.type || 'text'),
          required: !!q.required,
          options: q.options || [],
          isCustom: true, // Always treat as custom
        };
        
        console.log('Created field for question:', q.label, 'with key:', q.id, 'type:', field.type);
        return field;
      }).filter(Boolean); // Remove null entries
      
      console.log('Selected form questions:', selectedForm.questions);
      console.log('Check-in fields:', allFormQuestions);
      console.log('Check-in fields count:', allFormQuestions.length);
      return allFormQuestions;
    } catch (error) {
      console.error('Error processing check-in fields:', error);
      console.error('Error stack:', (error as Error).stack);
      return [];
    }
  }, [selectedForm, selectedFormId]);

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

  const handleBasicInfoChange = (key: string, value: any) => {
    setBasicInfo((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleAddLabel = async () => {
    if (!newLabelName.trim()) return;
    
    try {
      const user = getStoredUser();
      if (!user) return;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerId: user.id,
          name: newLabelName.trim()
        })
      });
      
      if (response.ok) {
        const newLabel = await response.json();
        setLabels(prev => [...prev, newLabel]);
        setNewLabelName('');
        setLabelError('');
      } else {
        setLabelError('Failed to create label');
      }
    } catch (error) {
      setLabelError('Failed to create label');
    }
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
    
    // Handle package selection
    if (key === 'packageId' && value) {
      const selectedPackage = packages.find((pkg: any) => pkg.id === Number(value));
      if (selectedPackage) {
        // Calculate end date based on start date and package duration
        let endDate = '';
        if (subscription.startDate && selectedPackage.durationValue) {
          const startDate = new Date(subscription.startDate);
          const durationValue = selectedPackage.durationValue;
          const durationUnit = selectedPackage.durationUnit || 'month';
          
          const endDateObj = new Date(startDate);
          if (durationUnit === 'month') {
            endDateObj.setMonth(endDateObj.getMonth() + durationValue);
          } else if (durationUnit === 'week') {
            endDateObj.setDate(endDateObj.getDate() + (durationValue * 7));
          } else if (durationUnit === 'day') {
            endDateObj.setDate(endDateObj.getDate() + durationValue);
          }
          endDate = endDateObj.toISOString().split('T')[0];
        }
        
        setSubscription((prev: any) => ({
          ...prev,
          durationValue: selectedPackage.durationValue?.toString() || '',
          durationUnit: selectedPackage.durationUnit || 'month',
          priceBeforeDisc: selectedPackage.priceBeforeDisc?.toString() || '',
          discountApplied: selectedPackage.discountApplied || false,
          discountType: selectedPackage.discountType || 'fixed',
          discountValue: selectedPackage.discountValue?.toString() || '',
          priceAfterDisc: selectedPackage.priceAfterDisc?.toString() || '',
          endDate: endDate,
        }));
        
        // Set discount field correctly (form uses 'yes'/'no' values)
        setSubscription((prev: any) => ({
          ...prev,
          discount: selectedPackage.discountApplied ? 'yes' : 'no',
        }));
        
        // Set discount type in local state
        setDiscountType(selectedPackage.discountType || 'fixed');
        
        // Show all subscription fields after package selection
        setPackageSelected(true);
        setShowSubscriptionFields(true);
        setShowPaymentMethod(['paid', 'installments'].includes(selectedPackage.paymentStatus || ''));
        setShowDiscountFields(selectedPackage.discountApplied || false);
        setShowTransactionImage(selectedPackage.paymentStatus === 'paid');
        setShowDiscountValue(selectedPackage.discountApplied || false);
        setShowPriceFields(selectedPackage.discountApplied || false);
      }
    }
    
    // Handle start date change to recalculate end date if package is selected
    if (key === 'startDate' && value && packageSelected) {
      const selectedPackage = packages.find((pkg: any) => pkg.id === Number(subscription.packageId));
      if (selectedPackage && selectedPackage.durationValue) {
        const startDate = new Date(value);
        const durationValue = selectedPackage.durationValue;
        const durationUnit = selectedPackage.durationUnit || 'month';
        
        const endDateObj = new Date(startDate);
        if (durationUnit === 'month') {
          endDateObj.setMonth(endDateObj.getMonth() + durationValue);
        } else if (durationUnit === 'week') {
          endDateObj.setDate(endDateObj.getDate() + (durationValue * 7));
        } else if (durationUnit === 'day') {
          endDateObj.setDate(endDateObj.getDate() + durationValue);
        }
        const endDate = endDateObj.toISOString().split('T')[0];
        
        setSubscription((prev: any) => ({
          ...prev,
          endDate: endDate,
        }));
      }
    }
  };

  const handleBasicInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Validate basic info
    if (!basicInfo.fullName || !basicInfo.email || !basicInfo.phone) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }
    
    if (!selectedFormId) {
      setError("Please select a check-in form.");
      setLoading(false);
      return;
    }
    
    // Validate subscription if package is selected
    if (subscription.packageId && !subscription.startDate) {
      setError("Please select a subscription start date.");
      setLoading(false);
      return;
    }
    
    try {
      const user = getStoredUser();
      if (!user) throw new Error("Not authenticated");
      
      // Create client with ALL form data (basic info + subscription + labels + notes)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          trainerId: user.id, 
          client: { 
            ...basicInfo, 
            registrationDate, 
            selectedFormId, 
            labels: selectedLabels 
          }, 
          subscription,
          installments: installments.filter(inst => inst.date && inst.amount).map(inst => ({
            paidDate: inst.date,
            amount: inst.amount,
            nextInstallment: inst.nextDate,
            remaining: inst.remaining || 0,
            status: 'paid'
          })),
          notes: notes.map(note => ({ content: note.content })),
          createClientAuth: true // Flag to create client auth account
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        // Redirect to clients list with success message
        router.push('/clients?success=Client created successfully!');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
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
          
          // Create team member assignments if any are selected
          if (selectedTeamMembers.length > 0) {
            console.log('Creating team assignments for:', selectedTeamMembers);
            for (const teamMemberId of selectedTeamMembers) {
              // Handle 'me' case by sending trainer's ID instead
              const actualTeamMemberId = teamMemberId === 'me' ? user.id : teamMemberId;
              console.log('Creating assignment with teamMemberId:', actualTeamMemberId, 'for client:', data.client.id);
              
              const assignmentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/client-assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  clientId: data.client.id,
                  teamMemberId: actualTeamMemberId,
                  assignedBy: user.id,
                }),
              });
              
              if (assignmentResponse.ok) {
                const assignmentData = await assignmentResponse.json();
                console.log('Assignment created successfully:', assignmentData);
              } else {
                const errorData = await assignmentResponse.json();
                console.error('Failed to create assignment:', errorData);
              }
            }
          }
          
          // If a transaction image was selected and payment status is paid, upload it
          if (transactionImage && subscription.paymentStatus === 'paid' && data.subscription && data.subscription.id) {
            const formDataImg = new FormData();
            formDataImg.append('file', transactionImage);
            formDataImg.append('subscriptionId', data.subscription.id);
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/transaction-images/subscription`, {
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
    if (!user) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/packages?trainerId=${user.id}`)
      .then(res => res.json())
      .then(data => setPackages(data || []));
  }, [user]);

  const handleAddPackage = async () => {
    setPackageError('');
    if (!user) return;
    if (!newPackageName.trim()) {
      setPackageError('Package name is required.');
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/packages`, {
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Create Client</h1>
        

        <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Client Information</h2>
              <p className="text-sm text-gray-600 mb-6">
                Enter the client's information, subscription details, and preferences. They will complete the detailed check-in form themselves in the mobile app.
              </p>
              
              <form onSubmit={handleBasicInfoSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {CORE_QUESTIONS.map(field => (
                    <div key={field.key} className="flex flex-col">
                      <label className="text-sm font-medium mb-1 flex items-center gap-1">
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === 'select' ? (
                        <Select
                          value={basicInfo[field.key] || ''}
                          onChange={e => handleBasicInfoChange(field.key, e.target.value)}
                          required={field.required}
                          className="w-full"
                        >
                          <option value="">Select {field.label}</option>
                          {field.options?.map((option: string) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          type={field.type}
                          value={basicInfo[field.key] || ''}
                          onChange={e => handleBasicInfoChange(field.key, e.target.value)}
                          required={field.required}
                          className="w-full"
                          placeholder={`Enter ${field.label}`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Form Selection */}
                <div className="mt-6">
                  <label className="block text-sm font-medium mb-2">Check-in Form</label>
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
                  <p className="text-xs text-gray-500 mt-1">
                    The client will complete this form in the mobile app after login.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </form>
            </div>

            {/* Subscription Details */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Subscription Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Package</label>
                  <Select
                    value={subscription.packageId || ''}
                    onChange={e => {
                      handleSubscriptionChange('packageId', e.target.value);
                      setShowSubscriptionFields(!!e.target.value);
                    }}
                    className="w-full"
                  >
                    <option value="">Select package...</option>
                    {packages.map((pkg: any) => (
                      <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                    ))}
                  </Select>
                </div>
                
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Registration Date</label>
                  <Input type="date" value={registrationDate} onChange={e => setRegistrationDate(e.target.value)} />
                </div>
                
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Subscription Start Date</label>
                  <Input type="date" value={subscription.startDate} onChange={e => handleSubscriptionChange('startDate', e.target.value)} />
                </div>
                
                {/* Show subscription fields only after package is selected */}
                {showSubscriptionFields && (
                  <>
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
                        <label className="text-sm font-medium mb-1">Price Before Discount (EGP)</label>
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
                          <label className="text-sm font-medium mb-1">Price After Discount (EGP)</label>
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
                            setTransactionImage(file);
                          }}
                          className="block w-full border border-zinc-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                        {transactionImage && (
                          <div className="mt-2 text-xs text-zinc-600">Selected: {transactionImage.name}</div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Installments Management section */}
            {subscription.paymentStatus === 'installments' && (
              <div className="bg-white rounded-xl shadow p-6">
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

            {/* Labels */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Labels</h2>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {labels.map((label: any) => (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => {
                        if (selectedLabels.includes(label.id)) {
                          setSelectedLabels(prev => prev.filter(id => id !== label.id));
                        } else {
                          setSelectedLabels(prev => [...prev, label.id]);
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedLabels.includes(label.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label.name}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Input
                    value={newLabelName}
                    onChange={e => setNewLabelName(e.target.value)}
                    placeholder="Add new label"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddLabel}
                    disabled={!newLabelName.trim()}
                    className="px-4 py-2"
                  >
                    Add
                  </Button>
                </div>
                {labelError && (
                  <p className="text-sm text-red-600">{labelError}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Notes</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Input
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Add a note about this client"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="px-4 py-2"
                  >
                    Add
                  </Button>
                </div>

                {notes.length > 0 && (
                  <div className="space-y-2">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                      >
                        <p className="text-sm text-gray-700">{note.content}</p>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-xs text-red-600 hover:text-red-800 mt-1"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Button at the end of the page */}
            <div className="flex justify-end mt-8">
              <Button
                onClick={handleBasicInfoSubmit}
                disabled={loading}
                className="px-6 py-2"
              >
                {loading ? 'Creating Client...' : 'Create Client Account'}
              </Button>
            </div>
          </div>
      </div>
    </div>
  );
} 