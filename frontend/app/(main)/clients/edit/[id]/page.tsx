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
    console.log('Edit page - submissionForm:', submissionForm);
    console.log('Edit page - submissionForm is null/undefined:', !submissionForm);
    console.log('Edit page - formData:', formData);
    
    // If no submissionForm, return all GROUPS with QUESTION_CONFIGS
    if (!submissionForm) {
      console.log('Edit page - No submissionForm, returning all GROUPS with QUESTION_CONFIGS');
      const result = GROUPS.map(group => ({
        ...group,
        fields: group.fields.map(field => {
          const config = QUESTION_CONFIGS[field.label];
          return {
            ...field,
            type: config ? mapFormTypeToInputType(config.type) : field.type,
            options: config ? config.options : field.options || [],
          };
        }),
      }));
      console.log('Edit page - profileFieldsByGroup result:', result);
      return result;
    }
    
    try {
      // Get all question labels from the form
      const formQuestionLabels = (submissionForm.questions || [])
        .filter((q: any) => q && q.label)
        .map((q: any) => q.label);
      
      console.log('Edit page - Form question labels:', formQuestionLabels);
      console.log('Edit page - Original grouped fields:', GROUPS);
      
      // Create a mapping for label variations
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
      
      // Filter out questions that are in the form, and add pre-filled options for remaining questions
      const filteredGroups = GROUPS.map(group => {
        const filteredFields = group.fields.filter(field => {
          // Check if the field label or any of its variations are in the form
          const fieldVariations = labelMapping[field.label] || [field.label];
          const isInForm = fieldVariations.some(variation => formQuestionLabels.includes(variation));
          console.log(`Edit page - Field "${field.label}" (variations: ${fieldVariations.join(', ')}) in form: ${isInForm}`);
          return !isInForm;
        });
        
        return {
          ...group,
          fields: filteredFields.map(field => {
            // Add pre-filled options from QUESTION_CONFIGS for questions not in the form
            const config = QUESTION_CONFIGS[field.label];
            return {
              ...field,
              type: config ? mapFormTypeToInputType(config.type) : field.type,
              options: config ? config.options : field.options || [],
            };
          }),
        };
      }).filter(group => group.fields.length > 0);
      
      console.log('Edit page - Filtered profile fields:', filteredGroups);
      return filteredGroups;
    } catch (error) {
      console.error('Error processing profile fields:', error);
      return GROUPS;
    }
  }, [submissionForm]);

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
      console.log('Payload sent to backend:', {
        client: { ...formDataToSend, answers: mergedAnswers },
        subscription: subscriptionToSend,
        installments: installmentsToSend,
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client: { ...formDataToSend, answers: mergedAnswers }, subscription: subscriptionToSend, installments: installmentsToSend }),
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

  // Debug logging
  console.log('Edit page - checkinQuestions:', checkinQuestions);
  console.log('Edit page - checkinQuestions.length:', checkinQuestions.length);
  console.log('Edit page - profileFieldsByGroup:', profileFieldsByGroup);
  console.log('Edit page - profileFieldsByGroup.length:', profileFieldsByGroup.length);
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
        if (formDataKey && formData[formDataKey] !== undefined) {
          let value = formData[formDataKey];

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
            // Special handling for Meal Count: allow 0
            value = value === undefined || value === null ? '' : String(value);
          }

          initialAnswers[q.id] = value;
        }
      });
      
      console.log('Initial answers populated:', initialAnswers);
      setAnswers(initialAnswers);
    }
  }, [submissionForm, submission, formData]);

  // Add debug logs after formData is loaded
  useEffect(() => {
    console.log('DEBUG: formData loaded:', formData);
  }, [formData]);

  // Add debug logs after profileFieldsByGroup is computed
  useEffect(() => {
    console.log('DEBUG: profileFieldsByGroup:', profileFieldsByGroup);
  }, [profileFieldsByGroup]);

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
                  const value = answers[field.id] !== undefined ? answers[field.id] : '';
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
                          value={value}
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

          {/* Render GROUPS sections for fields not in the check-in form */}
          {profileFieldsByGroup.map((group: any) => {
            // Use group.label as key (should be unique)
            console.log(`DEBUG: Rendering group: ${group.label} with ${group.fields.length} fields`);
            return (
              <div key={group.label} className="mb-6 bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold mb-4">{group.label}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {group.fields.map((field: any) => {
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
                    // Special handling for injuriesHealthNotes (array) and mealCount (number)
                    if (field.key === 'injuriesHealthNotes') {
                      // Display as comma-separated string in textarea
                      value = Array.isArray(value) ? value.join(', ') : (value || '');
                    }
                    if (field.key === 'mealCount') {
                      // Always display as string for input
                      value = value !== null && value !== undefined ? String(value) : '';
                    }
                    console.log(`DEBUG: Rendering profile field: ${field.label} (key: ${field.key}) with value:`, value);
                    // Use a combination of group and field for uniqueness
                    const fieldKey = `${group.label}-${field.key || field.label}`;
                    return (
                      <div key={fieldKey} className="flex flex-col">
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
                              <option key={`${fieldKey}-${opt}`} value={opt}>{opt}</option>
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
                                  <MultiSelectOption key={`${fieldKey}-${opt}`} value={opt}>
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
                              if (field.key === 'injuriesHealthNotes') {
                                // Split textarea value into array on change
                                handleChange(field.key, e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean), false);
                              } else {
                                handleChange(field.key, e.target.value, false);
                              }
                            }}
                            placeholder={field.label}
                            required={field.required}
                          />
                        ) : (
                          <Input
                            type={field.type}
                            value={value}
                            onChange={e => {
                              if (field.key === 'mealCount') {
                                // Convert to number on change
                                const val = e.target.value;
                                handleChange(field.key, val === '' ? null : Number(val), false);
                              } else {
                                handleChange(field.key, e.target.value, false);
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
            );
          })}

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
          <div className="flex gap-4 justify-end mt-8">
            <Button outline type="button" onClick={() => router.push('/clients')}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </form>
    </div>
  );
} 