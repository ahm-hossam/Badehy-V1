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
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<number[]>([]);
  const [clientAssignments, setClientAssignments] = useState<any[]>([]);
  
  // Subscription state
  const [subscription, setSubscription] = useState<any>({
    startDate: '',
    durationValue: '',
    durationUnit: 'month',
    endDate: '',
    paymentStatus: '',
    paymentMethod: '',
    packageId: '',
    discount: 'no',
    priceBeforeDisc: '',
    discountValue: '',
    discountType: 'fixed',
    priceAfterDisc: '',
  });
  
  // Discount and payment related state
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [showDiscountFields, setShowDiscountFields] = useState(false);
  const [showDiscountValue, setShowDiscountValue] = useState(false);
  const [showPriceFields, setShowPriceFields] = useState(false);
  const [showTransactionImage, setShowTransactionImage] = useState(false);
  const [transactionImage, setTransactionImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Package state
  const [packages, setPackages] = useState<any[]>([]);
  const [newPackageName, setNewPackageName] = useState('');
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [packageError, setPackageError] = useState('');
  
  // Installments state
  const [installments, setInstallments] = useState<any[]>([]);
  
  // Registration date
  const [registrationDate, setRegistrationDate] = useState('');

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
        console.log('EditClientPage - Received client data:', data);
        console.log('EditClientPage - fullName from API:', data?.fullName);
        console.log('EditClientPage - submissions:', data?.submissions);
        console.log('EditClientPage - latestSubmission:', data?.latestSubmission);
        console.log('EditClientPage - latestSubmission answers:', data?.latestSubmission?.answers);
        setFormData(data || {});
        // Initialize selected labels from client data
        if (data?.labels && Array.isArray(data.labels)) {
          setSelectedLabels(data.labels.map((label: any) => label.id));
        }
        // Load subscription data
        if (data?.subscriptions && data.subscriptions.length > 0) {
          const latestSubscription = data.subscriptions[0];
          console.log('Loading subscription data:', latestSubscription);
          
          // Format dates properly for input fields
          const formattedSubscription = {
            ...latestSubscription,
            startDate: latestSubscription.startDate ? new Date(latestSubscription.startDate).toISOString().split('T')[0] : '',
            endDate: latestSubscription.endDate ? new Date(latestSubscription.endDate).toISOString().split('T')[0] : '',
            durationValue: String(latestSubscription.durationValue || ''),
            durationUnit: latestSubscription.durationUnit || 'month',
            priceBeforeDisc: String(latestSubscription.priceBeforeDisc || ''),
            discountValue: String(latestSubscription.discountValue || ''),
            priceAfterDisc: String(latestSubscription.priceAfterDisc || ''),
            discount: latestSubscription.discountApplied ? 'yes' : 'no',
            discountType: latestSubscription.discountType || 'fixed',
          };
          
          setSubscription(formattedSubscription);
          
          // Set registration date from client data
          if (data.registrationDate) {
            setRegistrationDate(new Date(data.registrationDate).toISOString().split('T')[0]);
          }
          
          // Calculate end date if start date and duration are available
          if (formattedSubscription.startDate && formattedSubscription.durationValue && formattedSubscription.durationUnit) {
            const startDate = dayjs(formattedSubscription.startDate);
            const duration = parseInt(formattedSubscription.durationValue);
            const unit = formattedSubscription.durationUnit;
            
            let endDate;
            if (unit === 'month') {
              endDate = startDate.add(duration, 'month');
            } else if (unit === 'week') {
              endDate = startDate.add(duration, 'week');
            } else if (unit === 'day') {
              endDate = startDate.add(duration, 'day');
            } else {
              endDate = startDate.add(duration, 'month'); // Default to months
            }
            
            setSubscription(prev => ({
              ...prev,
              endDate: endDate.format('YYYY-MM-DD')
            }));
          }
          
          // Load installments
          if (latestSubscription.installments && latestSubscription.installments.length > 0) {
            const installmentRows = latestSubscription.installments.map((inst: any) => ({
              id: inst.id,
              date: inst.paidDate ? new Date(inst.paidDate).toISOString().split('T')[0] : '',
              amount: String(inst.amount || ''),
              image: null,
              nextDate: inst.nextInstallment ? new Date(inst.nextInstallment).toISOString().split('T')[0] : '',
              remaining: String(inst.remaining || ''),
            }));
            setInstallments(installmentRows);
          }
        } else {
          console.log('No subscription data found in client data');
        }
        console.log('EditClientPage formData:', data);
        
        // Try to extract real name from submissions if fullName is "Unknown Client"
        if (data?.fullName === "Unknown Client" && data?.latestSubmission?.answers) {
          const answers = data.latestSubmission.answers;
          console.log('EditClientPage - Looking for name in answers:', answers);
          
          // Look for name-related fields or any field that might contain a name
          const nameFields = Object.keys(answers).filter(key => 
            key.toLowerCase().includes('name') || 
            key.toLowerCase().includes('full') ||
            answers[key]?.toLowerCase().includes('name') ||
            // Check if the value looks like a name (not a phone number, not empty, etc.)
            (answers[key] && 
             answers[key].length > 1 && 
             answers[key].length < 50 && 
             !answers[key].match(/^\d+$/) && // Not just numbers
             !answers[key].match(/^[0-9\s\-\(\)]+$/)) // Not a phone number
          );
          console.log('EditClientPage - Name-related fields found:', nameFields);
          
          if (nameFields.length > 0) {
            const realName = answers[nameFields[0]];
            console.log('EditClientPage - Found real name:', realName);
            
            // Update the formData with the real name
            data.fullName = realName;
            console.log('EditClientPage - Updated fullName to:', data.fullName);
          }
        }
      })
      .catch(() => setError("Failed to load client data."))
      .finally(() => setLoading(false));
  }, [clientId]);

  // Fetch client's team assignments
  useEffect(() => {
    if (!user?.id || !clientId) return;
    console.log('Fetching team assignments for client:', clientId);
    fetch(`/api/client-assignments?trainerId=${user.id}&clientId=${clientId}`)
      .then(res => {
        console.log('Team assignments response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Team assignments data:', data);
        setClientAssignments(data || []);
        const teamMemberIds = data.map((assignment: any) => assignment.teamMember.id);
        console.log('Setting selected team members:', teamMemberIds);
        setSelectedTeamMembers(teamMemberIds);
      })
      .catch((error) => {
        console.error("Failed to load client assignments:", error);
      });
  }, [user?.id, clientId]);

  // Fetch packages for the trainer
  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    fetch(`/api/packages?trainerId=${user.id}`)
      .then(res => res.json())
      .then(data => setPackages(data || []));
  }, []);

  // Fetch team members for the trainer
  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    fetch(`/api/team-members?trainerId=${user.id}`)
      .then(res => res.json())
      .then(data => setTeamMembers(data || []));
  }, []);

  // Fetch labels for the trainer
  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/labels?trainerId=${user.id}`)
      .then(res => res.json())
      .then(data => setLabels(data || []))
      .catch(() => console.error("Failed to load labels."));
  }, []);

  // Fetch notes for this client
  useEffect(() => {
    if (!clientId) return;
    const user = getStoredUser();
    if (!user) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/notes?trainerId=${user.id}&clientId=${clientId}`)
      .then(res => res.json())
      .then(data => setNotes(data || []))
      .catch(() => console.error("Failed to load notes."));
  }, [clientId]);

  // Handle package selection and auto-populate subscription fields
  useEffect(() => {
    if (subscription.packageId && packages.length > 0) {
      const selectedPackage = packages.find((pkg: any) => pkg.id === parseInt(subscription.packageId));
      if (selectedPackage) {
        console.log('Auto-populating subscription fields from package:', selectedPackage);
        setSubscription((prev: any) => ({
          ...prev,
          priceBeforeDisc: selectedPackage.priceBeforeDisc || '',
          discount: selectedPackage.discount || 'no',
          discountValue: selectedPackage.discountValue || '',
          discountType: selectedPackage.discountType || 'fixed',
          priceAfterDisc: selectedPackage.priceAfterDisc || '',
        }));
        setDiscountType(selectedPackage.discountType || 'fixed');
      }
    }
  }, [subscription.packageId, packages]);

  // Handle payment status changes and show/hide related fields
  useEffect(() => {
    setShowPaymentMethod(['paid', 'installments'].includes(subscription.paymentStatus));
    setShowDiscountFields(['paid', 'installments'].includes(subscription.paymentStatus));
    setShowDiscountValue(subscription.discount === 'yes');
    setShowPriceFields(['paid', 'installments'].includes(subscription.paymentStatus));
    setShowTransactionImage(subscription.paymentStatus === 'paid');
  }, [subscription.paymentStatus, subscription.discount]);

  // Calculate end date when subscription fields change
  useEffect(() => {
    if (subscription.startDate && subscription.durationValue && subscription.durationUnit) {
      const startDate = dayjs(subscription.startDate);
      const duration = parseInt(subscription.durationValue);
      const unit = subscription.durationUnit;
      
      let endDate;
      if (unit === 'month') {
        endDate = startDate.add(duration, 'month');
      } else if (unit === 'week') {
        endDate = startDate.add(duration, 'week');
      } else if (unit === 'day') {
        endDate = startDate.add(duration, 'day');
      } else {
        endDate = startDate.add(duration, 'month'); // Default to months
      }
      
      setSubscription((prev: any) => ({
        ...prev,
        endDate: endDate.format('YYYY-MM-DD')
      }));
    }
  }, [subscription.startDate, subscription.durationValue, subscription.durationUnit]);

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

  // Notes handlers
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const user = getStoredUser();
      if (!user) throw new Error("Not authenticated");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerId: user.id,
          clientId: parseInt(clientId),
          content: newNote.trim(),
        }),
      });
      if (res.ok) {
        const note = await res.json();
        setNotes(prev => [note, ...prev]);
        setNewNote('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create note.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditNote = async (noteId: number) => {
    if (!editingNoteContent.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const user = getStoredUser();
      if (!user) throw new Error("Not authenticated");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editingNoteContent.trim(),
        }),
      });
      if (res.ok) {
        const updatedNote = await res.json();
        setNotes(prev => prev.map(note => note.id === noteId ? updatedNote : note));
        setEditingNoteId(null);
        setEditingNoteContent('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update note.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    setLoading(true);
    setError(null);
    try {
      const user = getStoredUser();
      if (!user) throw new Error("Not authenticated");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/notes/${noteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotes(prev => prev.filter(note => note.id !== noteId));
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete note.');
      }
    } catch (err) {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  // Package handlers
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

  // Subscription handlers
  const handleSubscriptionChange = (key: string, value: any) => {
    setSubscription((prev: any) => ({ ...prev, [key]: value }));
  };

  // Form handlers
  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleMultiSelectChange = (key: string, value: string, checked: boolean) => {
    setFormData((prev: any) => {
      const currentValues = prev[key] || [];
      if (checked) {
        return { ...prev, [key]: [...currentValues, value] };
      } else {
        return { ...prev, [key]: currentValues.filter((v: string) => v !== value) };
      }
    });
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = getStoredUser();
      if (!user) throw new Error("Not authenticated");
      
      // Prepare subscription data
      const subscriptionToSend = {
        ...subscription,
        priceAfterDisc: (() => {
          const before = Number(subscription.priceBeforeDisc) || 0;
          const discount = Number(subscription.discountValue) || 0;
          if (subscription.discount === 'yes') {
            if (discountType === 'fixed') return before - discount;
            if (discountType === 'percentage') return before - (before * discount / 100);
          }
          return before;
        })(),
      };

      // Prepare installments data
      const installmentsToSend = installments
        .filter(inst => inst.date && inst.amount)
        .map(inst => ({
          paidDate: inst.date,
          amount: inst.amount,
          nextInstallment: inst.nextDate,
          remaining: inst.remaining || 0,
          status: 'paid'
        }));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          client: { ...formData, labels: selectedLabels }, 
          subscription: subscriptionToSend, 
          installments: installmentsToSend,
        }),
      });
      
      if (res.ok) {
        // Handle team member assignments
        if (user) {
          // Remove existing assignments
          for (const assignment of clientAssignments) {
            await fetch(`/api/client-assignments/${clientId}/${assignment.teamMember.id}?trainerId=${user.id}`, {
              method: 'DELETE',
            });
          }
          
          // Add new assignments
          for (const teamMemberId of selectedTeamMembers) {
            await fetch('/api/client-assignments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientId: parseInt(clientId),
                teamMemberId: teamMemberId,
                assignedBy: user.id,
              }),
            });
          }
        }
        
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading client data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <Alert variant="destructive" className="mb-4">
            {error}
          </Alert>
          <Button onClick={() => router.push("/clients")} className="w-full">
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Client</h1>
          <Button onClick={() => router.push("/clients")} variant="outline">
            Back to Clients
          </Button>
        </div>

        {success && (
          <Alert className="mb-6">
            Client updated successfully! Redirecting...
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Only show core fields that are NOT in the check-in form */}
              {(!formData.latestSubmission?.answers || !formData.latestSubmission.answers['Full Name']) && (
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Full Name *</label>
                  <Input
                    type="text"
                    value={formData.fullName || ''}
                    onChange={e => handleChange('fullName', e.target.value)}
                    required
                  />
                </div>
              )}
              {(!formData.latestSubmission?.answers || !formData.latestSubmission.answers['Email']) && (
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Email *</label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={e => handleChange('email', e.target.value)}
                    required
                  />
                </div>
              )}
              {(!formData.latestSubmission?.answers || !formData.latestSubmission.answers['Mobile Number']) && (
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Mobile Number *</label>
                  <Input
                    type="text"
                    value={formData.phone || ''}
                    onChange={e => handleChange('phone', e.target.value)}
                    required
                  />
                </div>
              )}
              {(!formData.latestSubmission?.answers || !formData.latestSubmission.answers['Gender']) && (
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Gender *</label>
                  <Select
                    value={formData.gender || ''}
                    onChange={e => handleChange('gender', e.target.value)}
                    required
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Select>
                </div>
              )}
              {(!formData.latestSubmission?.answers || !formData.latestSubmission.answers['Age']) && (
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Age *</label>
                  <Input
                    type="number"
                    value={formData.age || ''}
                    onChange={e => handleChange('age', e.target.value)}
                    required
                  />
                </div>
              )}
              {(!formData.latestSubmission?.answers || !formData.latestSubmission.answers['Source']) && (
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Source *</label>
                  <Input
                    type="text"
                    value={formData.source || ''}
                    onChange={e => handleChange('source', e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* Subscription Details */}
          <div className="bg-white rounded-xl shadow p-6">
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
                  onChange={e => handleSubscriptionChange('paymentStatus', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="paid">Paid</option>
                  <option value="free">Free</option>
                  <option value="free_trial">Free Trial</option>
                  <option value="pending">Pending</option>
                  <option value="installments">Installments</option>
                </Select>
              </div>
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
                    onChange={e => handleSubscriptionChange('discount', e.target.value)}
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

          {/* Check-In Data Section */}
          {formData.latestSubmission && formData.latestSubmission.answers && (
            <div className="mb-6 bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Check-In Data</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(formData.latestSubmission.answers).map(([key, value]) => {
                  // Skip if value is empty or null
                  if (!value || value === '') return null;
                  
                  // Get the question config for this field
                  const questionConfig = QUESTION_CONFIGS[key];
                  const fieldType = questionConfig ? mapFormTypeToInputType(questionConfig.type) : 'text';
                  
                  return (
                    <div key={key} className="flex flex-col">
                      <label className="text-sm font-medium mb-1">{key}</label>
                      {fieldType === 'select' && questionConfig?.options ? (
                        <Select
                          value={Array.isArray(value) ? value[0] : value}
                          onChange={e => handleChange(key, e.target.value)}
                          className="w-full"
                        >
                          <option value="">Select...</option>
                          {questionConfig.options.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </Select>
                      ) : fieldType === 'multiselect' && questionConfig?.options ? (
                        <MultiSelect
                          value={Array.isArray(value) ? value : [value]}
                          onChange={(selectedValues) => handleChange(key, selectedValues)}
                          placeholder={`Select ${key}...`}
                          className="w-full"
                        >
                          {questionConfig.options.map((opt: string) => (
                            <MultiSelectOption key={opt} value={opt}>
                              {opt}
                            </MultiSelectOption>
                          ))}
                        </MultiSelect>
                      ) : fieldType === 'textarea' ? (
                        <Textarea
                          value={value}
                          onChange={e => handleChange(key, e.target.value)}
                          placeholder={key}
                          className="w-full"
                        />
                      ) : (
                        <Input
                          type="text"
                          value={value}
                          onChange={e => handleChange(key, e.target.value)}
                          placeholder={key}
                          className="w-full"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Team Members Assignment Section */}
          <div className="mb-6 bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Assign Team Members</h2>
            <div className="border rounded-lg p-3 border-zinc-950/10">
              {teamMembers.length === 0 ? (
                <p className="text-sm text-gray-500">No team members available. Create team members first.</p>
              ) : (
                teamMembers.map((member) => (
                  <label key={member.id} className="flex items-center gap-2 mb-2 last:mb-0">
                    <input
                      type="checkbox"
                      checked={selectedTeamMembers.includes(member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTeamMembers(prev => [...prev, member.id]);
                        } else {
                          setSelectedTeamMembers(prev => prev.filter(id => id !== member.id));
                        }
                      }}
                      className="rounded border-zinc-950/20"
                    />
                    <span className="text-sm">{member.fullName} ({member.role})</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Extras Section */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-6">Extras</h2>
            
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

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.push("/clients")}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Client"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 