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
const coreKeys = new Set(CORE_QUESTIONS.map(q => q.key));

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
];

export default function EditClientPage() {
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
        // Initialize selected labels from client data
        if (data?.labels && Array.isArray(data.labels)) {
          setSelectedLabels(data.labels.map((label: any) => label.id));
        }
        console.log('EditClientPage formData:', data);
      })
      .catch(() => setError("Failed to load client data."))
      .finally(() => setLoading(false));
  }, [clientId]);

  // Process check-in questions from submissionForm (new approach)
  useEffect(() => {
    if (!submissionForm) return;
    
    // Process the questions to match the create page logic
    const processedQuestions = (submissionForm.questions || []).map((q: any) => {
      if (!q || !q.label) return null;
      
      // Create a mapping for label variations (same as create page)
      const labelMapping: { [key: string]: string[] } = {
        'Injuries / Health Notes': ['Injuries', 'Injuries / Health Notes'],
        'Weak Areas (Focus)': ['Weak Areas', 'Weak Areas (Focus)'],
        'Food Allergies / Restrictions': ['Food Allergies', 'Food Allergies / Restrictions'],
        'Current Nutrition Plan Followed': ['Current Nutrition Plan', 'Current Nutrition Plan Followed'],
        'Preferred Training Days': ['Training Days', 'Preferred Training Days'],
        'Equipment Availability': ['Equipment', 'Equipment Availability'],
        'Favorite Training Style': ['Training Style', 'Favorite Training Style'],
        'Nutrition Goal': ['Goal', 'Nutrition Goal'],
        'Diet Preference': ['Diet', 'Diet Preference'],
        'Meal Count': ['Meal Frequency', 'Meal Count'],
        'Disliked Ingredients': ['Disliked Foods', 'Disliked Ingredients'],
      };
      
      // Check if this question exists in GROUPS (with label variations)
      let groupField: any = null;
      for (const group of GROUPS) {
        for (const field of group.fields) {
          const fieldVariations = labelMapping[field.label] || [field.label];
          if (fieldVariations.includes(q.label)) {
            groupField = field;
            break;
          }
        }
        if (groupField) break;
      }
      
      if (groupField) {
        // Question is from GROUPS - use form configuration but keep original key
        return {
          ...groupField,
          id: q.id, // Ensure id is set
          type: mapFormTypeToInputType(q.type || groupField.type),
          options: q.options || groupField.options || [],
          required: groupField.required,
          isCustom: false,
        };
      } else {
        // Custom question - use form configuration
        return {
          key: q.id || q.label,
          id: q.id, // Ensure id is set
          label: q.label,
          type: mapFormTypeToInputType(q.type || 'text'),
          required: !!q.required,
          options: q.options || [],
          isCustom: true,
        };
      }
    }).filter(Boolean);
    
    console.log('Edit page - Processed questions from submissionForm:', processedQuestions);
    console.log('Edit page - Questions with types:', processedQuestions.map(q => ({ label: q.label, type: q.type, options: q.options })));
    setCheckinQuestions(processedQuestions);
  }, [submissionForm]);

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

  // Fetch labels and notes for this client
  useEffect(() => {
    if (!user?.id) return;
    
    // Fetch labels
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/labels?trainerId=${user.id}`)
      .then(res => res.json())
      .then(data => setLabels(data || []))
      .catch(() => console.error("Failed to load labels."));
    
    // Fetch notes for this client
    if (clientId) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/notes?clientId=${clientId}`)
        .then(res => res.json())
        .then(data => setNotes(data || []))
        .catch(() => console.error("Failed to load notes."));
    }
  }, [user?.id, clientId]);

  // Helper: map static question labels to field keys (with label variations)
  const staticLabelToKey: Record<string, string> = {};
  const labelMapping: { [key: string]: string[] } = {
    'Injuries / Health Notes': ['Injuries', 'Injuries / Health Notes'],
    'Weak Areas (Focus)': ['Weak Areas', 'Weak Areas (Focus)'],
    'Food Allergies / Restrictions': ['Food Allergies', 'Food Allergies / Restrictions'],
    'Current Nutrition Plan Followed': ['Current Nutrition Plan', 'Current Nutrition Plan Followed'],
    'Preferred Training Days': ['Training Days', 'Preferred Training Days'],
    'Equipment Availability': ['Equipment', 'Equipment Availability'],
    'Favorite Training Style': ['Training Style', 'Favorite Training Style'],
    'Nutrition Goal': ['Goal', 'Nutrition Goal'],
    'Diet Preference': ['Diet', 'Diet Preference'],
    'Meal Count': ['Meal Frequency', 'Meal Count'],
    'Disliked Ingredients': ['Disliked Foods', 'Disliked Ingredients'],
  };
  
  GROUPS.forEach(group => {
    group.fields.forEach(field => {
      // Map the main label
      staticLabelToKey[field.label] = field.key;
      // Map all variations
      const variations = labelMapping[field.label] || [];
      variations.forEach(variation => {
        staticLabelToKey[variation] = field.key;
      });
    });
  });

  // When fetching the latest check-in submission, build a merged answers object
  useEffect(() => {
    if (!submissionForm || !submissionAnswers) return;
    // Map answers by question ID (works for both standard and custom questions)
    const merged: Record<string, any> = { ...submissionAnswers };
    (submissionForm.questions || []).forEach((q: any) => {
      if (submissionAnswers[q.id] !== undefined) {
        merged[q.id] = submissionAnswers[q.id];
      }
    });
    setAnswers((prev: any) => ({ ...merged, ...prev })); // preserve any manual edits
  }, [submissionForm, submissionAnswers]);

  // Fetch the latest check-in submission for this client OR the selected form
  useEffect(() => {
    if (!clientId || !user?.id) return;
    
    // First try to get check-in submission
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/checkins/responses?clientId=${clientId}&trainerId=${user.id}&page=1&pageSize=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.submissions && data.submissions.length > 0) {
          setSubmission(data.submissions[0]);
          setSubmissionForm(data.submissions[0].form);
          setSubmissionAnswers(data.submissions[0].answers || {});
        } else {
          // If no submission, check if client has a selected form
          if (formData.selectedFormId) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/checkins/${formData.selectedFormId}`)
              .then(res => res.json())
              .then(formData => {
                if (formData) {
                  setSubmissionForm(formData);
                  // Set empty answers since there's no submission
                  setSubmissionAnswers({});
                }
              })
              .catch(err => console.error('Error fetching selected form:', err));
          }
        }
      })
      .catch(err => console.error('Error fetching submissions:', err));
  }, [clientId, user?.id, formData.selectedFormId]);

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
  const [registrationDate, setRegistrationDate] = useState<string>("");
  
  // Array fields that need special handling
  const arrayFields = ['injuriesHealthNotes', 'goals', 'preferredTrainingDays', 'equipmentAvailability', 'favoriteTrainingStyle', 'weakAreas', 'foodAllergies'];
  
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
    // Set registration date from client data or submission date
    if (formData.registrationDate) {
      setRegistrationDate(formData.registrationDate.slice(0, 10));
    } else if (submission && submission.createdAt) {
      setRegistrationDate(submission.createdAt.slice(0, 10));
    }
    
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
        discount: latest.discountApplied ? 'yes' : 'no',
        discountType: latest.discountType || 'fixed',
        discountValue: latest.discountValue || '',
        priceBeforeDisc: latest.priceBeforeDisc || '',
        installments: latest.installments || '',
      });
      if (latest.discountType) setDiscountType(latest.discountType);
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
        discount: 'no',
        discountType: 'fixed',
        discountValue: '',
        priceBeforeDisc: '',
        installments: '',
      });
    }
  }, [formData, submission]);
  useEffect(() => {
    if (!subscription) return;
    setShowPaymentMethod(['paid', 'installments'].includes(subscription.paymentStatus));
    setShowDiscountFields(['paid', 'installments'].includes(subscription.paymentStatus));
    setShowDiscountValue(subscription.discount === 'yes');
    setShowPriceFields(subscription.discount === 'yes');
    if (subscription.discountType) setDiscountType(subscription.discountType);
  }, [subscription]);
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

  // Compute check-in fields based on submissionForm
  const checkInFields = React.useMemo(() => {
    if (!submissionForm) return [];
    
    try {
      // Process ALL questions from the form (both from dropdown and custom)
      const allFormQuestions = (submissionForm.questions || []).map((q: any) => {
        if (!q || !q.label) return null;
        
        // Check if this question exists in CORE_QUESTIONS
        let coreField: any = null;
        for (const field of CORE_QUESTIONS) {
          if (field.label === q.label) {
            coreField = field;
            break;
          }
        }
        
        if (coreField) {
          // Question is from CORE_QUESTIONS - use form configuration but keep original key
          return {
            ...coreField,
            type: mapFormTypeToInputType(q.type || coreField.type),
            options: q.options || coreField.options || [],
            required: coreField.required,
            isCustom: false,
          };
        } else {
          // Custom question - use form configuration
          return {
            key: q.id || q.label,
            label: q.label,
            type: mapFormTypeToInputType(q.type || 'text'),
            required: !!q.required,
            options: q.options || [],
            isCustom: true,
          };
        }
      }).filter(Boolean); // Remove null entries
      
      console.log('Check-in fields:', allFormQuestions);
      return allFormQuestions;
    } catch (error) {
      console.error('Error processing check-in fields:', error);
      return [];
    }
  }, [submissionForm]);
  // Core questions that are NOT in the check-in form
  const coreFieldsNotInForm = React.useMemo(() => {
    console.log('Edit page - submissionForm:', submissionForm);
    console.log('Edit page - submissionForm is null/undefined:', !submissionForm);
    console.log('Edit page - formData:', formData);
    
    // If no submissionForm, return all CORE_QUESTIONS
    if (!submissionForm) {
      console.log('Edit page - No submissionForm, returning all CORE_QUESTIONS');
      return CORE_QUESTIONS;
    }
    
    try {
      // Get all question labels from the form
      const formQuestionLabels = (submissionForm.questions || [])
        .filter((q: any) => q && q.label)
        .map((q: any) => q.label);
      
      console.log('Edit page - Form question labels:', formQuestionLabels);
      console.log('Edit page - Core questions:', CORE_QUESTIONS);
      
      // Filter out core questions that are already in the form
      const filteredCoreFields = CORE_QUESTIONS.filter(field => {
        const isInForm = formQuestionLabels.includes(field.label);
        console.log(`Edit page - Core field "${field.label}" in form: ${isInForm}`);
        return !isInForm;
      });
      
      console.log('Edit page - Core fields not in form:', filteredCoreFields);
      return filteredCoreFields;
    } catch (error) {
      console.error('Error processing core fields:', error);
      return CORE_QUESTIONS;
    }
  }, [submissionForm, formData]);

  // Update handleChange to update formData for profile fields and answers for check-in questions
  const handleChange = (key: string, value: any, isCheckInQuestion: boolean = false) => {
    if (isCheckInQuestion) {
      setAnswers((prev: any) => ({ ...prev, [key]: value }));
    } else {
      setFormData((prev: any) => ({ ...prev, [key]: value }));
    }
  };



  // On save, send answers as part of the client update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    const requiredSubFields = ['packageId', 'startDate', 'durationValue', 'durationUnit', 'endDate'];
    for (const field of requiredSubFields) {
      if (!subscription[field] || subscription[field] === '') {
        setError(`Subscription field '${field}' is required.`);
        setLoading(false);
        return;
      }
    }
    // Build a complete subscription object to send
    const subscriptionToSend = {
      id: subscription.id,
      packageId: Number(subscription.packageId),
      startDate: subscription.startDate,
      durationValue: Number(subscription.durationValue),
      durationUnit: subscription.durationUnit,
      endDate: subscription.endDate,
      paymentStatus: subscription.paymentStatus,
      paymentMethod: subscription.paymentMethod,
      priceBeforeDisc: subscription.priceBeforeDisc ? Number(subscription.priceBeforeDisc) : null,
      discountApplied: subscription.discount === 'yes',
      discountType: discountType,
      discountValue: subscription.discountValue ? Number(subscription.discountValue) : null,
      priceAfterDisc: (() => {
        const before = Number(subscription.priceBeforeDisc) || 0;
        const discount = Number(subscription.discountValue) || 0;
        if (discountType === 'fixed') return before - discount;
        if (discountType === 'percentage') return before - (before * discount / 100);
        return before;
      })(),
    };
    // Build installments array with correct fields and types
    const installmentsToSend = installments.map((inst: any, idx: number) => ({
      id: inst.id, // if editing existing
      paidDate: inst.date,
      amount: Number(inst.amount),
      remaining: getInstallmentRemaining(idx),
      nextInstallment: inst.nextDate,
      status: 'paid',
    }));
    try {
      const user = getStoredUser();
      if (!user) throw new Error("Not authenticated");
      const formDataToSend = { ...formData, registrationDate, selectedFormId: formData.selectedFormId };
      arrayFields.forEach(field => {
        if (typeof formDataToSend[field] === 'string') {
          formDataToSend[field] = formDataToSend[field].split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      });
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
      // Collect custom question answers (those with numeric keys)
      const customAnswers: Record<string, any> = {};
      Object.entries(answers).forEach(([key, value]) => {
        if (!isNaN(Number(key))) {
          customAnswers[key] = value;
        }
      });
      console.log('Payload sent to backend:', {
        client: { ...formDataToSend, answers: customAnswers, labels: selectedLabels },
        subscription: subscriptionToSend,
        installments: installmentsToSend,
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          client: { ...formDataToSend, labels: selectedLabels }, 
          subscription: subscriptionToSend, 
          installments: installmentsToSend,
          answers: customAnswers // Move answers to root level
        }),
      });
      if (res.ok) {
        // Fetch updated client data to get new installment IDs
        const updatedClient = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/clients/${clientId}`).then(r => r.json());
        const updatedInstallments = updatedClient.subscriptions?.[0]?.installments || [];
        // For each local installment with an image, upload it
        await Promise.all(
          installments.map(async (inst, idx) => {
            if (inst.image) {
              const match = updatedInstallments.find(
                (u: any) =>
                  u.paidDate?.slice(0, 10) === inst.date &&
                  String(u.amount) === String(inst.amount) &&
                  (u.nextInstallment?.slice(0, 10) || '') === (inst.nextDate || '')
              );
              if (match) {
                const formData = new FormData();
                formData.append('file', inst.image);
                formData.append('installmentId', match.id);
                await fetch('/api/transaction-images/installment', {
                  method: 'POST',
                  body: formData,
                });
              }
            }
          })
        );
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

  // Add after other useState declarations in EditClientPage:
  const [packages, setPackages] = useState<any[]>([]);
  const [newPackageName, setNewPackageName] = useState('');
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [packageError, setPackageError] = useState('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [showDiscountFields, setShowDiscountFields] = useState(false);
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [showTransactionImage, setShowTransactionImage] = useState(false);
  const [showDiscountValue, setShowDiscountValue] = useState(false);
  const [showPriceFields, setShowPriceFields] = useState(false);
  type InstallmentRow = {
    id?: string;
    date: string;
    amount: string;
    image: File | null;
    nextDate: string;
    remaining?: string;
  };
  const [installments, setInstallments] = useState<InstallmentRow[]>([
    { date: '', amount: '', image: null, nextDate: '' }
  ]);

  // 1. Fix handleAddPackage to set packageId and fetch updated packages
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
        setSubscription((prev: any) => ({ ...prev, packageId: pkg.id }));
        setNewPackageName('');
        setShowAddPackage(false);
        // Fetch updated packages list
        fetch(`/api/packages?trainerId=${user.id}`)
          .then(res => res.json())
          .then(data => setPackages(data || []));
      } else {
        const data = await res.json();
        setPackageError(data.error || 'Failed to create package.');
      }
    } catch (err) {
      setPackageError('Network error.');
    }
  };

  // 2. Always fetch packages on edit and append selected if missing
  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    fetch(`/api/packages?trainerId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (subscription.packageId && !data.find((pkg: any) => pkg.id === Number(subscription.packageId))) {
          data.push({ id: Number(subscription.packageId), name: formData.packageName || 'Current Package' });
        }
        setPackages(data || []);
      });
  }, [subscription.packageId]);

  const getInstallmentRemaining = (idx: number) => {
    const total = getTotalPrice();
    let paid = 0;
    for (let i = 0; i <= idx; i++) {
      paid += Number(installments[i]?.amount) || 0;
    }
    return Math.max(total - paid, 0);
  };

  const getTotalPrice = () => {
    const before = Number(subscription.priceBeforeDisc) || 0;
    const discount = Number(subscription.discountValue) || 0;
    if (subscription.discount === 'yes') {
      if (discountType === 'fixed') return before - discount;
      if (discountType === 'percentage') return before - (before * discount / 100);
    }
    return before;
  };

  const handleInstallmentChange = (idx: number, key: string, value: any) => {
    setInstallments(insts => {
      const newInsts = insts.map((inst, i) => i === idx ? { ...inst, [key]: value } : inst);
      // Debug: log installments after change
      setTimeout(() => console.log('installments:', newInsts), 0);
      // If amount changed, recalculate remaining for all rows
      if (key === 'amount') {
        let total = getTotalPrice();
        for (let i = 0; i < newInsts.length; i++) {
          const paid = Number(newInsts[i].amount) || 0;
          newInsts[i].remaining = String(Math.max(total - newInsts.slice(0, i + 1).reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0), 0));
        }
      }
      return newInsts;
    });
  };

  const handleInstallmentImage = (idx: number, file: File | null) => {
    setInstallments(insts => insts.map((inst, i) => i === idx ? { ...inst, image: file } : inst));
  };

  const addInstallment = () => setInstallments(insts => [...insts, { date: '', amount: '', image: null, nextDate: '' }]);
  const removeInstallment = (idx: number) => setInstallments(insts => insts.length > 1 ? insts.filter((_, i) => i !== idx) : insts);

  // Labels handlers
  const handleAddLabel = async () => {
    setLabelError('');
    if (!user?.id) return;
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

  // Notes handlers
  const handleAddNote = async () => {
    if (!newNote.trim() || !clientId) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clientId: Number(clientId),
          content: newNote.trim() 
        }),
      });
      if (res.ok) {
        const note = await res.json();
        setNotes(prev => [note, ...prev]);
        setNewNote('');
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const handleEditNote = async (noteId: number) => {
    if (!editingNoteContent.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingNoteContent.trim() }),
      });
      if (res.ok) {
        const updatedNote = await res.json();
        setNotes(prev => prev.map(note => note.id === noteId ? updatedNote : note));
        setEditingNoteId(null);
        setEditingNoteContent('');
      }
    } catch (err) {
      console.error('Failed to update note:', err);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/notes/${noteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotes(prev => prev.filter(note => note.id !== noteId));
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  // Debug logging
  console.log('Edit page - checkinQuestions:', checkinQuestions);
  console.log('Edit page - checkinQuestions.length:', checkinQuestions.length);
  console.log('Edit page - coreFieldsNotInForm:', coreFieldsNotInForm);
  console.log('Edit page - coreFieldsNotInForm.length:', coreFieldsNotInForm.length);
  console.log('Edit page - submissionForm:', submissionForm);

  // Add after other useEffects, before return
  useEffect(() => {
    // Only run if there is a selected form, no check-in submission, and formData is loaded
    if (submissionForm && !submission && formData && Object.keys(formData).length > 0) {
      // Robust label-to-key mapping
      const labelToKey: Record<string, string> = {
        'Full Name': 'fullName',
        'Email': 'email',
        'Mobile Number': 'phone',
        'Gender': 'gender',
        'Age': 'age',
        'Source': 'source',
        'Goal': 'goal',
        'Level': 'level',
        'Injuries': 'injuriesHealthNotes',
        'Injuries / Health Notes': 'injuriesHealthNotes',
        'Workout Place': 'workoutPlace',
        'Height': 'height',
        'Weight': 'weight',
        'Preferred Training Days': 'preferredTrainingDays',
        'Preferred Training Time': 'preferredTrainingTime',
        'Equipment Availability': 'equipmentAvailability',
        'Favorite Training Style': 'favoriteTrainingStyle',
        'Weak Areas (Focus)': 'weakAreas',
        'Nutrition Goal': 'nutritionGoal',
        'Diet Preference': 'dietPreference',
        'Meal Count': 'mealCount',
        'Food Allergies / Restrictions': 'foodAllergies',
        'Disliked Ingredients': 'dislikedIngredients',
        'Current Nutrition Plan Followed': 'currentNutritionPlan',
      };
      const initialAnswers: Record<string, any> = {};
      (submissionForm.questions || []).forEach((q: any) => {
        const key = labelToKey[q.label] || q.key || q.label;
        if (formData.hasOwnProperty(key)) {
          let value = formData[key];
          // Handle multi-select fields
          if (q.type === 'multi' || q.type === 'multiselect') {
            if (typeof value === 'string') {
              value = value.split(',').map((v: string) => v.trim()).filter(Boolean);
            }
            // If value is not an array, make it an array
            if (!Array.isArray(value)) {
              value = value ? [value] : [];
            }
          }
          // Handle single-select fields (trim whitespace)
          if ((q.type === 'single' || q.type === 'select') && typeof value === 'string') {
            value = value.trim();
          }
          initialAnswers[key] = value;
        }
      });
      setAnswers(initialAnswers);
    }
  }, [submissionForm, formData, submission]);

  // Populate answers from formData when client has selectedFormId but no submission
  useEffect(() => {
    if (submissionForm && !submission && formData && Object.keys(formData).length > 0) {
      console.log('Populating answers from formData for client with selectedFormId');
      const initialAnswers: any = {};
      
      // Map formData values to question IDs using label mapping
      const labelToKey: { [key: string]: string } = {
        'Full Name': 'fullName',
        'Email': 'email',
        'Mobile Number': 'phone',
        'Gender': 'gender',
        'Age': 'age',
        'Source': 'source',
        'Goal': 'goal',
        'Level': 'level',
        'Injuries': 'injuriesHealthNotes',
        'Injuries / Health Notes': 'injuriesHealthNotes',
        'Workout Place': 'workoutPlace',
        'Height': 'height',
        'Weight': 'weight',
        'Preferred Training Days': 'preferredTrainingDays',
        'Preferred Training Time': 'preferredTrainingTime',
        'Equipment Availability': 'equipmentAvailability',
        'Favorite Training Style': 'favoriteTrainingStyle',
        'Weak Areas (Focus)': 'weakAreas',
        'Weak Areas': 'weakAreas',
        'Nutrition Goal': 'nutritionGoal',
        'Diet Preference': 'dietPreference',
        'Meal Count': 'mealCount',
        'Food Allergies / Restrictions': 'foodAllergies',
        'Food Allergies': 'foodAllergies',
        'Disliked Ingredients': 'dislikedIngredients',
        'Current Nutrition Plan Followed': 'currentNutritionPlan',
      };
      
      submissionForm.questions.forEach((q: any) => {
        const formDataKey = labelToKey[q.label];
        let value;
        
        if (formDataKey && formData[formDataKey] !== undefined) {
          // Standard question - get value from formData using mapped key
          value = formData[formDataKey];
        } else if (formData[q.id] !== undefined) {
          // Custom question - get value directly from formData using question ID
          value = formData[q.id];
        } else if (formData[q.label] !== undefined) {
          // Custom question - get value directly from formData using question label
          value = formData[q.label];
        }
        
        if (value !== undefined) {
          // Handle different data types
          if (q.type === 'multi' || q.type === 'multiselect') {
            if (typeof value === 'string') {
              value = value.split(',').map((v: string) => v.trim()).filter(Boolean);
            } else if (!Array.isArray(value)) {
              value = value ? [value] : [];
            }
          } else if (q.type === 'single' || q.type === 'select') {
            if (Array.isArray(value)) {
              value = value.join(', ');
            } else if (value !== null && value !== undefined) {
              value = String(value).trim();
            }
          } else if (q.type === 'number' || q.label === 'Meal Count') {
            // Special handling for Meal Count: allow 0 and handle null properly
            if (value === undefined || value === null) {
              value = '';
            } else if (value === 0) {
              value = '0'; // Keep 0 as string for display
            } else {
              value = String(value);
            }
          }

          initialAnswers[q.id] = value;
        }
      });
      
      console.log('Initial answers populated:', initialAnswers);
      setAnswers(initialAnswers);
    }
  }, [submissionForm, submission, formData]);

  // Set answers from submission if available, otherwise from formData
  useEffect(() => {
    if (!submissionForm) return;
    if (submission && submissionAnswers) {
      // Use answers from submission
      const merged: Record<string, any> = { ...submissionAnswers };
      (submissionForm.questions || []).forEach((q: any) => {
        if (submissionAnswers[q.id] !== undefined) {
          merged[q.id] = submissionAnswers[q.id];
        }
      });
      setAnswers((prev: any) => ({ ...merged, ...prev }));
      console.log('Set answers from submission:', merged);
    } else if (formData && Object.keys(formData).length > 0) {
      // Use answers from formData
      const labelToKey: { [key: string]: string } = {
        'Full Name': 'fullName',
        'Email': 'email',
        'Mobile Number': 'phone',
        'Gender': 'gender',
        'Age': 'age',
        'Source': 'source',
        'Goal': 'goal',
        'Level': 'level',
        'Injuries': 'injuriesHealthNotes',
        'Injuries / Health Notes': 'injuriesHealthNotes',
        'Workout Place': 'workoutPlace',
        'Height': 'height',
        'Weight': 'weight',
        'Preferred Training Days': 'preferredTrainingDays',
        'Preferred Training Time': 'preferredTrainingTime',
        'Equipment Availability': 'equipmentAvailability',
        'Favorite Training Style': 'favoriteTrainingStyle',
        'Weak Areas (Focus)': 'weakAreas',
        'Weak Areas': 'weakAreas',
        'Nutrition Goal': 'nutritionGoal',
        'Diet Preference': 'dietPreference',
        'Meal Count': 'mealCount',
        'Food Allergies / Restrictions': 'foodAllergies',
        'Food Allergies': 'foodAllergies',
        'Disliked Ingredients': 'dislikedIngredients',
        'Current Nutrition Plan Followed': 'currentNutritionPlan',
      };
      const initialAnswers: any = {};
      (submissionForm.questions || []).forEach((q: any) => {
        const formDataKey = labelToKey[q.label];
        let value;
        if (formDataKey && formData[formDataKey] !== undefined) {
          value = formData[formDataKey];
        } else if (formData[q.id] !== undefined) {
          value = formData[q.id];
        } else if (formData[q.label] !== undefined) {
          value = formData[q.label];
        }
        if (value !== undefined) {
          if (q.type === 'multi' || q.type === 'multiselect') {
            if (typeof value === 'string') {
              value = value.split(',').map((v: string) => v.trim()).filter(Boolean);
            } else if (!Array.isArray(value)) {
              value = value ? [value] : [];
            }
          } else if (q.type === 'single' || q.type === 'select') {
            if (Array.isArray(value)) {
              value = value.join(', ');
            } else if (value !== null && value !== undefined) {
              value = String(value).trim();
            }
          } else if (q.type === 'number' || q.label === 'Meal Count') {
            if (value === undefined || value === null) {
              value = '';
            } else if (value === 0) {
              value = '0';
            } else {
              value = String(value);
            }
          }
          initialAnswers[q.id] = value;
        }
      });
      setAnswers(initialAnswers);
      console.log('Set answers from formData:', initialAnswers);
    }
  }, [submissionForm, submission, submissionAnswers, formData]);

  // Add debug logs after formData is loaded
  useEffect(() => {
    console.log('DEBUG: formData loaded:', formData);
  }, [formData]);

  // Add debug logs after coreFieldsNotInForm is computed
  useEffect(() => {
    console.log('DEBUG: coreFieldsNotInForm:', coreFieldsNotInForm);
  }, [coreFieldsNotInForm]);

  // Add debug logs after checkinQuestions is computed
  useEffect(() => {
    console.log('DEBUG: checkinQuestions:', checkinQuestions);
  }, [checkinQuestions]);

  // Add debug logs after submissionForm is loaded
  useEffect(() => {
    console.log('DEBUG: submissionForm:', submissionForm);
  }, [submissionForm]);

  // Add debug logs after answers is computed
  useEffect(() => {
    console.log('DEBUG: answers:', answers);
  }, [answers]);

  // Add debug logs before rendering (log only once on mount to avoid React error)
  useEffect(() => {
    console.log('checkinQuestions:', checkinQuestions);
    console.log('answers:', answers);
    console.log('formData:', formData);
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Edit Client</h1>
      <p className="mb-6 text-zinc-600">Update the client profile. Complete all fields to mark as completed.</p>
      {error && (
        <Alert open={!!error} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {/* Always show the form, but conditionally show check-in data */}
        <form onSubmit={handleSubmit} className="space-y-8">

          
          {/* Check-In Data Section (only if checkinQuestions exist) */}
          {checkinQuestions.length > 0 ? (
            <div className="mb-6 bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Check-In Data</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {checkinQuestions.map((field, fieldIndex) => {
                  // Use a unique key for each field
                  const checkinFieldKey = `${field.key || field.label || `checkin-field-${fieldIndex}`}-checkin`;
                  // Use field.id (question ID) to get the value from answers
                  const value = coreKeys.has(field.key)
                    ? formData[field.key] ?? ''
                    : answers[field.id] ?? '';
                  // Render custom questions
                  if (field.isCustom) {
                    if (field.type === 'select' && field.options.length > 0) {
                      return (
                        <div key={checkinFieldKey} className="flex flex-col">
                          <label className="text-sm font-medium mb-1 flex items-center gap-1">
                            {field.label}
                            {field.required && <span className="text-red-500">*</span>}
                          </label>
                          <Select
                            value={value || ''}
                            onChange={e => handleChange(field.id, e.target.value, true)}
                            required={field.required}
                            className="w-full"
                          >
                            <option value="">Select...</option>
                            {field.options.map((opt: string) => (
                              <option key={`${checkinFieldKey}-${opt}`} value={opt}>{opt}</option>
                            ))}
              </Select>
            </div>
                      );
                    }
                    if (field.type === 'multiselect' && field.options.length > 0) {
                      const currentValues = value ? (Array.isArray(value) ? value : [value]) : [];
                      return (
                        <div key={checkinFieldKey} className="flex flex-col">
                          <label className="text-sm font-medium mb-1 flex items-center gap-1">
                            {field.label}
                            {field.required && <span className="text-red-500">*</span>}
                          </label>
                          <MultiSelect
                            value={currentValues}
                            onChange={(value) => setAnswers(prev => ({ ...prev, [field.id]: value }))}
                            placeholder={`Select ${field.label}...`}
                            className="w-full"
                          >
                            {field.options.map((opt: string) => (
                              <MultiSelectOption key={`${checkinFieldKey}-${opt}`} value={opt}>
                                {opt}
                              </MultiSelectOption>
                            ))}
                          </MultiSelect>
            </div>
                      );
                    }
                    if (field.type === 'textarea') {
                      return (
                        <div key={checkinFieldKey} className="flex flex-col">
                          <label className="text-sm font-medium mb-1 flex items-center gap-1">
                            {field.label}
                            {field.required && <span className="text-red-500">*</span>}
                          </label>
                          <Textarea
                            value={value || ''}
                            onChange={e => handleChange(field.id, e.target.value, true)}
                            placeholder={field.label}
                            required={field.required}
                          />
            </div>
                      );
                    }
                    // Default to text input
                    return (
                      <div key={checkinFieldKey} className="flex flex-col">
                        <label className="text-sm font-medium mb-1 flex items-center gap-1">
                          {field.label}
                          {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <Input
                          type={field.type || 'text'}
                          value={value || ''}
                          onChange={e => handleChange(field.id, e.target.value, true)}
                          placeholder={field.label}
                          required={field.required}
              />
            </div>
                    );
                  }
                  // Render normal fields (GROUPS fields that are in the check-in form)
                  return (
                    <div key={checkinFieldKey} className="flex flex-col">
                      <label className="text-sm font-medium mb-1 flex items-center gap-1">
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === 'select' ? (
                        <Select
                          value={value || ''}
                          onChange={e => handleChange(field.id, e.target.value, true)}
                          required={field.required}
                className="w-full"
                        >
                          <option value="">Select...</option>
                          {field.options && field.options.map((opt: string) => (
                            <option key={`${checkinFieldKey}-${opt}`} value={opt}>{opt}</option>
                          ))}
                        </Select>
                      ) : field.type === 'multiselect' ? (
                        (() => {
                          const currentValues = value ? (Array.isArray(value) ? value : [value]) : [];
                          return (
                            <MultiSelect
                              value={currentValues}
                              onChange={(value) => handleChange(field.id, value, true)}
                              placeholder={`Select ${field.label}...`}
                              className="w-full"
                            >
                              {field.options && field.options.map((opt: string) => (
                                <MultiSelectOption key={`${checkinFieldKey}-${opt}`} value={opt}>
                                  {opt}
                                </MultiSelectOption>
                              ))}
                            </MultiSelect>
                          );
                        })()
                      ) : field.type === 'textarea' ? (
                        <Textarea
                          value={value}
                          onChange={e => {
                            if (field.id === 'injuriesHealthNotes') {
                              // Split textarea value into array on change
                              handleChange(field.id, e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean), true);
                            } else {
                              handleChange(field.id, e.target.value, true);
                            }
                          }}
                          placeholder={field.label}
                          required={field.required}
                        />
                      ) : (
                        <Input
                          type={field.type}
                          value={value || ''}
                          onChange={e => {
                            if (field.id === 'mealCount') {
                              // Convert to number on change
                              const val = e.target.value;
                              handleChange(field.id, val === '' ? null : Number(val), true);
                            } else {
                              handleChange(field.id, e.target.value, true);
                            }
                          }}
                          placeholder={field.label}
                          required={field.required}
                      />
                    )}
            </div>
                  );
                })}
          </div>
            </div>
          ) : (
            // Show message when no check-in data is available
            <div className="mb-6 bg-white rounded-xl shadow p-6">
              <div className="text-center text-zinc-500 py-4">
                <div className="mb-2">No check-in submission data available for this client.</div>
                <div className="text-sm">(This client was not created via a check-in form, or the data is missing.)</div>
          </div>
            </div>
          )}

          {/* Core Questions Section */}
          {coreFieldsNotInForm.length > 0 && (
            <div className="mb-6 bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Core Questions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {coreFieldsNotInForm.map((field: any) => {
                  let value = formData[field.key];
                  // For multi-selects, ensure value is always an array
                  if ((field.type === 'multiselect' || field.type === 'multi') && typeof value === 'string') {
                    value = value.split(',').map((v: string) => v.trim()).filter(Boolean);
                  }
                  if ((field.type === 'multiselect' || field.type === 'multi') && !Array.isArray(value)) {
                    value = value ? [value] : [];
                  }
                  if (value === null || value === undefined) {
                    value = (field.type === 'multiselect' || field.type === 'multi') ? [] : '';
                  }
                  console.log(`DEBUG: Rendering core field: ${field.label} (key: ${field.key}) with value:`, value);
                  return (
                    <div key={field.key} className="flex flex-col">
                      <label className="text-sm font-medium mb-1 flex items-center gap-1">
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === 'select' ? (
                        <Select
                          value={value || ''}
                          onChange={e => handleChange(field.key, e.target.value, false)}
                          required={field.required}
                          className="w-full"
                        >
                          <option value="">Select...</option>
                          {field.options && field.options.map((opt: string) => (
                            <option key={`${field.key}-${opt}`} value={opt}>{opt}</option>
                          ))}
                        </Select>
                      ) : field.type === 'multiselect' ? (
                        (() => {
                          const currentValues = value ? (Array.isArray(value) ? value : [value]) : [];
                          return (
                            <MultiSelect
                              value={currentValues}
                              onChange={(value) => handleChange(field.key, value, false)}
                              placeholder={`Select ${field.label}...`}
                              className="w-full"
                            >
                              {field.options && field.options.map((opt: string) => (
                                <MultiSelectOption key={`${field.key}-${opt}`} value={opt}>
                                  {opt}
                                </MultiSelectOption>
                              ))}
                            </MultiSelect>
                          );
                        })()
                      ) : field.type === 'textarea' ? (
                        <Textarea
                          value={value || ''}
                          onChange={e => handleChange(field.key, e.target.value, false)}
                          placeholder={field.label}
                          required={field.required}
                        />
                      ) : (
                        <Input
                          type={field.type}
                          value={value || ''}
                          onChange={e => handleChange(field.key, e.target.value, false)}
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
              {/* Add package dropdown and inline add new package */}
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
                      <TableRow key={inst.id || `installment-${idx}`}>
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
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </form>
    </div>
  );
} 