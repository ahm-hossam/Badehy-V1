"use client"

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import { Button } from "@/components/button";
import { Divider } from "@/components/divider";
import { Table } from "@/components/table";
import { useRouter } from "next/navigation";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Combobox, ComboboxOption } from '@/components/combobox';
import { TrashIcon, PencilIcon, PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { Dialog } from '@/components/dialog';
import { getStoredUser } from '@/lib/auth';
import { Alert } from '@/components/alert';
import CreatableSelect from 'react-select/creatable';


function addDuration(start: string, value: number, unit: string): string {
  if (!start || !value || !unit) return "";
  const date = new Date(start);
  if (unit === "days") date.setDate(date.getDate() + value);
  if (unit === "months") date.setMonth(date.getMonth() + value);
  return date.toISOString().slice(0, 10);
}

type InstallmentRow = {
  paidDate: string;
  amount: string;
  remaining: string;
  nextInstallment: string;
};

export default function CreateClientPage() {
  // State for dropdowns
  const [sources, setSources] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [packages, setPackages] = useState<{ id: number; name: string }[]>([]);
  const [packageSearch, setPackageSearch] = useState("");
  const [packageLoading, setPackageLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [packageInput, setPackageInput] = useState('');
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [newPackageName, setNewPackageName] = useState('');
  const [packageError, setPackageError] = useState('');

  // Form state
  const [paymentStatus, setPaymentStatus] = useState("");
  const [discount, setDiscount] = useState("");
  const [durationValue, setDurationValue] = useState("");
  const [durationUnit, setDurationUnit] = useState("months");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [packagePriceAfter, setPackagePriceAfter] = useState("");
  const [installments, setInstallments] = useState<InstallmentRow[]>([
    { paidDate: '', amount: '', remaining: '', nextInstallment: '' }
  ]);
  const [phone, setPhone] = useState('');
  const [notesList, setNotesList] = useState<{ id: string; content: string; createdAt: string; editing?: boolean }[]>([]);
  const [newNote, setNewNote] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState('fixed');
  const [priceBeforeDisc, setPriceBeforeDisc] = useState('');
  const [installmentImages, setInstallmentImages] = useState<{ [key: number]: File[] }>({});
  const [uploadingInstallmentImages, setUploadingInstallmentImages] = useState<{ [key: number]: boolean }>({});
  const [showToast, setShowToast] = useState(false);
  const [paidTransactionImages, setPaidTransactionImages] = useState<File[]>([]);
  const [level, setLevel] = useState("");

  // Installments UI
  const showInstallments = paymentStatus === "installments";
  const showPaymentMethod = paymentStatus === "paid" || paymentStatus === "installments";
  const showPriceFields = paymentStatus === "paid" || paymentStatus === "installments";
  const showDiscountFields = showPriceFields && discount === "yes";

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const comboboxRef = useRef<any>(null);
  // Combobox bug fix: force re-render on open, reset input on close
  const [comboboxKey, setComboboxKey] = useState(0);

  const GOALS_OPTIONS = [
    { value: 'Fat Loss', label: 'Fat Loss' },
    { value: 'Muscle Gain', label: 'Muscle Gain' },
    { value: 'Body Recomposition', label: 'Body Recomposition' },
    { value: 'Lifestyle / General Fitness', label: 'Lifestyle / General Fitness' },
    { value: 'Postpartum Recovery', label: 'Postpartum Recovery' },
    { value: 'Injury Rehab / Mobility', label: 'Injury Rehab / Mobility' },
    { value: 'Strength & Performance', label: 'Strength & Performance' },
    { value: 'Event Prep (Wedding, Photo Shoot, etc.)', label: 'Event Prep (Wedding, Photo Shoot, etc.)' },
    { value: 'Medical Needs (Thyroid, PCOS, etc.)', label: 'Medical Needs (Thyroid, PCOS, etc.)' },
    { value: 'Other', label: 'Other' },
  ];
  const [goals, setGoals] = useState<string[]>([]);

  // Add state for labels
  const [labels, setLabels] = useState<any[]>([]);
  const [labelOptions, setLabelOptions] = useState<any[]>([]);
  const [labelsLoading, setLabelsLoading] = useState(false);

  // Fetch labels for trainer
  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    setLabelsLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/labels?trainerId=${user.id}`)
      .then(res => res.json())
      .then(data => setLabelOptions(data.map((l: any) => ({ value: l.id, label: l.name }))))
      .finally(() => setLabelsLoading(false));
  }, []);

  // Handle label creation
  const handleCreateLabel = async (inputValue: string) => {
    const user = getStoredUser();
    if (!user) return;
    setLabelsLoading(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/labels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainerId: user.id, name: inputValue })
    });
    if (res.ok) {
      const newLabel = await res.json();
      setLabelOptions((prev: any) => [...prev, { value: newLabel.id, label: newLabel.name }]);
      setLabels((prev: any) => [...prev, { value: newLabel.id, label: newLabel.name }]);
    }
    setLabelsLoading(false);
  };

  // Fetch dropdown data
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/dropdowns`)
      .then((res) => res.json())
      .then((data) => {
        setSources(data.sources || []);
        setPaymentMethods(data.paymentMethods || []);
      });
  }, []);

  // Fetch packages for trainer (account owner)
  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    setPackageLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/packages?trainerId=${user.id}&search=${encodeURIComponent(packageSearch)}`)
      .then((res) => res.json())
      .then((data) => setPackages(data))
      .finally(() => setPackageLoading(false));
  }, [packageSearch]);

  // Handler for creating a new package on the fly
  const handleCreatePackage = async (name: string) => {
    const user = getStoredUser();
    if (!user) return;
    setPackageLoading(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/packages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trainerId: user.id, name }),
    });
    if (res.ok) {
      const pkg = await res.json();
      setPackages((prev) => [...prev, pkg]);
      setSelectedPackage(pkg.id.toString());
      setPackageInput(pkg.name); // Update input value to show newly created package
    }
    setPackageLoading(false);
  };

  // Auto-calculate end date
  useEffect(() => {
    if (startDate && durationValue && durationUnit) {
      setEndDate(addDuration(startDate, Number(durationValue), durationUnit));
    } else {
      setEndDate("");
    }
  }, [startDate, durationValue, durationUnit]);

  // Auto-calculate package price after discount
  useEffect(() => {
    if (showDiscountFields && discount === "yes") {
      const priceBefore = parseFloat(priceBeforeDisc || '0');
      const discountVal = parseFloat(discountValue || '0');
      
      if (priceBefore > 0 && discountVal > 0) {
        let finalPrice = priceBefore;
        
        if (discountType === 'fixed') {
          finalPrice = priceBefore - discountVal;
        } else if (discountType === 'percentage') {
          finalPrice = priceBefore - (priceBefore * discountVal / 100);
        }
        
        setPackagePriceAfter(Math.max(0, finalPrice).toFixed(2));
      } else {
        setPackagePriceAfter(priceBefore.toFixed(2));
      }
    } else if (showPriceFields) {
      const priceBefore = parseFloat(priceBeforeDisc || '0');
      setPackagePriceAfter(priceBefore.toFixed(2));
    } else {
      setPackagePriceAfter('');
    }
  }, [showDiscountFields, discount, discountValue, discountType, showPriceFields, priceBeforeDisc]);

  // Helper to sum paid amounts
  const totalPaid = installments.reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0);
  const remainingTotal = (parseFloat(packagePriceAfter) || 0) - totalPaid;

  // Add new installment row
  const handleAddInstallment = () => {
    setInstallments((prev) => [
      ...prev,
      {
        paidDate: "",
        amount: "",
        remaining: remainingTotal.toString(),
        nextInstallment: "",
      },
    ]);
  };

  // Remove installment row
  const handleRemoveInstallment = (idx: number) => {
    setInstallments((prev) => prev.filter((_, i) => i !== idx));
  };

  // Edit installment row
  const handleEditInstallment = (idx: number, field: string, value: string) => {
    setInstallments((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      // Recalculate remaining for this and subsequent rows
      let paidSum = 0;
      for (let i = 0; i < updated.length; i++) {
        paidSum += parseFloat(updated[i].amount) || 0;
        updated[i].remaining = ((parseFloat(packagePriceAfter) || 0) - paidSum).toString();
      }
      return updated;
    });
  };

  // Add note
  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setNotesList([
      ...notesList,
      {
        id: Math.random().toString(36).slice(2),
        content: newNote,
        createdAt: new Date().toISOString(),
      },
    ]);
    setNewNote('');
  };

  // Edit note
  const handleEditNote = (id: string, content: string) => {
    setNotesList(notesList.map(note => note.id === id ? { ...note, content, editing: false } : note));
  };

  // Start editing
  const startEditNote = (id: string) => {
    setNotesList(notesList.map(note => note.id === id ? { ...note, editing: true } : { ...note, editing: false }));
  };

  // Cancel editing
  const cancelEditNote = (id: string) => {
    setNotesList(notesList.map(note => note.id === id ? { ...note, editing: false } : note));
  };

  // Delete note
  const handleDeleteNote = (id: string) => {
    setNotesList(notesList.filter(note => note.id !== id));
    setDeleteId(null);
  };

  // Format date
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString();
  };

  // Handle installment image selection
  const handleInstallmentImageSelect = (installmentIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => 
      file.type === 'image/jpeg' || file.type === 'image/png'
    );
    setInstallmentImages(prev => ({
      ...prev,
      [installmentIndex]: [...(prev[installmentIndex] || []), ...imageFiles]
    }));
  };

  // Remove installment image
  const handleRemoveInstallmentImage = (installmentIndex: number, imageIndex: number) => {
    setInstallmentImages(prev => ({
      ...prev,
      [installmentIndex]: prev[installmentIndex]?.filter((_, i) => i !== imageIndex) || []
    }));
  };

  // Upload images for a specific installment
  const uploadInstallmentImages = async (installmentId: number, installmentIndex: number) => {
    const images = installmentImages[installmentIndex];
    if (!images || images.length === 0) return;

    setUploadingInstallmentImages(prev => ({ ...prev, [installmentIndex]: true }));
    try {
      const formData = new FormData();
      images.forEach(image => {
        formData.append('images', image);
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/transaction-images/${installmentId}`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        // Clear the images for this installment
        setInstallmentImages(prev => {
          const newState = { ...prev };
          delete newState[installmentIndex];
          return newState;
        });
      } else {
        console.error('Failed to upload installment images');
      }
    } catch (error) {
      console.error('Error uploading installment images:', error);
    } finally {
      setUploadingInstallmentImages(prev => ({ ...prev, [installmentIndex]: false }));
    }
  };

  // Gather form data and submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Form submitted, preventing default behavior");
    setError("");
    setSuccess("");
    setLoading(true);

    // Gather form data (add more fields as needed)
    const client = {
      fullName: (e.target as any).fullName?.value || "",
      phone: phone,
      email: (e.target as any).email?.value || "",
      gender: (e.target as any).gender?.value || "",
      age: (e.target as any).age?.value || "",
      source: (e.target as any).source?.value || "",
      level,
      goals,
      labels: labels.map((l: any) => l.value), // send label IDs
    };
    const subscription = {
      startDate,
      packageId: selectedPackage ? Number(selectedPackage) : undefined,
      packageName: packageSearch && !selectedPackage ? packageSearch : undefined,
      durationValue: durationValue ? Number(durationValue) : undefined,
      durationUnit,
      endDate,
      paymentStatus,
      paymentMethod: showPaymentMethod ? (e.target as any).paymentMethod?.value : undefined,
      priceBeforeDisc: showPriceFields ? (e.target as any).priceBeforeDisc?.value : undefined,
      discountApplied: showDiscountFields ? discount === "yes" : undefined,
      discountType: showDiscountFields ? (e.target as any).discountType?.value : undefined,
      discountValue: showDiscountFields ? (e.target as any).discountValue?.value : undefined,
      priceAfterDisc: showDiscountFields ? packagePriceAfter : undefined,
    };
    // Basic validation
    if (!client.fullName || !client.phone || !subscription.startDate || !selectedPackage || !durationValue || !durationUnit) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }
    // Prepare installments data
    const installmentsData = showInstallments ? installments.filter(inst => 
      inst.paidDate && inst.amount && parseFloat(inst.amount) > 0
    ) : undefined;
    
    // Check for incomplete installments
    if (showInstallments && installments.some(inst => !inst.paidDate || !inst.amount || parseFloat(inst.amount) <= 0)) {
      setError("Please fill in all required fields for installments (Paid Date and Amount).");
      setLoading(false);
      return;
    }
    try {
      const user = getStoredUser();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainerId: user?.id, // Use the logged-in user's ID
          client,
          subscription: {
            ...subscription,
            priceBeforeDisc: priceBeforeDisc ? Number(priceBeforeDisc) : null,
            discountApplied: showDiscountFields ? discount === "yes" : null,
            discountType: showDiscountFields ? discountType : null,
            discountValue: showDiscountFields ? (discountValue ? Number(discountValue) : null) : null,
            priceAfterDisc: showDiscountFields ? (packagePriceAfter ? Number(packagePriceAfter) : null) : null,
          },
          installments: installmentsData,
          notes: notesList.map(n => ({ content: n.content })),
        }),
      });
      if (res.ok) {
        const result = await res.json();
        // Upload transaction images for paid subscriptions
        if (paymentStatus === "paid" && paidTransactionImages.length > 0) {
          const formData = new FormData();
          paidTransactionImages.forEach(img => formData.append('images', img));
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/transaction-images/upload/subscription/${result.subscription.id}`, {
            method: 'POST',
            body: formData,
          });
        }
        // Upload images for each installment
        if (result.installments && Array.isArray(result.installments)) {
          for (let i = 0; i < result.installments.length; i++) {
            const inst = result.installments[i];
            if (installmentImages[i] && installmentImages[i].length > 0) {
              const formData = new FormData();
              installmentImages[i].forEach(img => formData.append('images', img));
              await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/transaction-images/upload/${inst.id}`, {
                method: 'POST',
                body: formData,
              });
            }
          }
        }
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
    return false;
  };

  // Filtered packages for combobox
  const filteredPackages = packageInput
    ? packages.filter(pkg => pkg.name.toLowerCase().includes(packageInput.toLowerCase()))
    : packages;
  const showCreateOption = packageInput && !filteredPackages.some(pkg => pkg.name.toLowerCase() === packageInput.toLowerCase());

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Create Client</h1>
      <p className="mb-6 text-zinc-600">Add a new client and their subscription details.</p>
      {showToast && (
        <Alert open={showToast} onClose={() => setShowToast(false)}>
          Client created successfully!
        </Alert>
      )}
      {!!error && (
        <Alert open={!!error} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-10" action="javascript:void(0)">
        {/* Client Details */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Client Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <Input name="fullName" placeholder="Enter full name" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <PhoneInput
                country={'eg'}
                value={phone}
                onChange={setPhone}
                inputClass="!w-full !h-11 !text-base !rounded-lg !border-zinc-300"
                buttonClass="!border-zinc-300"
                inputProps={{ name: 'phone', required: true }}
                enableSearch
                specialLabel=""
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input name="email" placeholder="Enter email" type="email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <Select name="gender">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <Input name="age" placeholder="Enter age" type="number" min={0} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Source</label>
              <Select name="source">
                <option value="">Select source</option>
                {sources.map((src) => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Level</label>
              <Select name="level" value={level} onChange={e => setLevel(e.target.value)}>
                <option value="">Select level</option>
                <option value="Beginner 1">Beginner 1</option>
                <option value="Beginner 2">Beginner 2</option>
                <option value="Intermediate 1">Intermediate 1</option>
                <option value="Intermediate 2">Intermediate 2</option>
                <option value="Advanced">Advanced</option>
                <option value="Elite">Elite</option>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Goals</label>
              <CreatableSelect
                isMulti
                options={GOALS_OPTIONS}
                value={goals.map((g: string) => ({ value: g, label: g }))}
                onChange={(selected: any) => setGoals(selected.map((opt: any) => opt.value))}
                placeholder="Select or type goals..."
                classNamePrefix="react-select"
                className="w-full"
                styles={{
                  control: (base: any, state: any) => ({
                    ...base,
                    borderRadius: '0.5rem',
                    minHeight: 44,
                    height: 44,
                    fontSize: '1rem',
                    background: 'transparent',
                    border: state.isFocused ? '1.5px solid #2563eb' : '1.5px solid rgba(9,9,11,0.1)', // blue-500 or zinc-950/10
                    boxShadow: 'none',
                    paddingLeft: 0,
                    paddingRight: 0,
                  }),
                  valueContainer: (base: any) => ({ ...base, padding: '0 14px' }), // px-3.5
                  input: (base: any) => ({ ...base, margin: 0, padding: 0 }),
                  multiValue: (base: any) => ({ ...base, background: '#f3f4f6', borderRadius: 6, fontSize: '1rem' }),
                  placeholder: (base: any) => ({ ...base, fontSize: '1rem', color: '#6b7280' }), // zinc-500
                  dropdownIndicator: (base: any) => ({ ...base, padding: 8 }),
                  clearIndicator: (base: any) => ({ ...base, padding: 8 }),
                  menu: (base: any) => ({ ...base, fontSize: '1rem' }),
                }}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Label(s)</label>
              <CreatableSelect
                isMulti
                isClearable
                options={labelOptions}
                value={labels}
                isLoading={labelsLoading}
                onChange={(selected: any) => setLabels(selected || [])}
                onCreateOption={handleCreateLabel}
                placeholder="Select or type labels..."
                classNamePrefix="react-select"
                className="w-full"
                styles={{
                  control: (base: any, state: any) => ({
                    ...base,
                    borderRadius: '0.5rem',
                    minHeight: 44,
                    height: 44,
                    fontSize: '1rem',
                    background: 'transparent',
                    border: state.isFocused ? '1.5px solid #2563eb' : '1.5px solid rgba(9,9,11,0.1)',
                    boxShadow: 'none',
                    paddingLeft: 0,
                    paddingRight: 0,
                  }),
                  valueContainer: (base: any) => ({ ...base, padding: '0 14px' }),
                  input: (base: any) => ({ ...base, margin: 0, padding: 0 }),
                  multiValue: (base: any) => ({ ...base, background: '#f3f4f6', borderRadius: 6, fontSize: '1rem' }),
                  placeholder: (base: any) => ({ ...base, fontSize: '1rem', color: '#6b7280' }),
                  dropdownIndicator: (base: any) => ({ ...base, padding: 8 }),
                  clearIndicator: (base: any) => ({ ...base, padding: 8 }),
                  menu: (base: any) => ({ ...base, fontSize: '1rem' }),
                }}
              />
            </div>
          </div>
        </section>

        {/* Subscription Info */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Subscription Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Subscription Start Date</label>
              <Input name="startDate" type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Package Name</label>
              <div className="flex items-stretch gap-0 w-full max-w-md">
                <div className="flex-1 relative mr-2">
                  <Select
                    name="package"
                    value={selectedPackage}
                    onChange={e => {
                      setSelectedPackage(e.target.value);
                      const pkg = packages.find(pkg => pkg.id.toString() === e.target.value);
                      setPackageInput(pkg ? pkg.name : '');
                    }}
                    required
                    className="rounded-r-none"
                  >
                    <option value="">Select a package</option>
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                    ))}
                  </Select>
                </div>
                <Button
                  outline
                  type="button"
                  className="rounded-l-none border-l border-zinc-300 flex items-center gap-1 text-zinc-700"
                  onClick={() => setShowPackageModal(true)}
                >
                  <PlusIcon className="h-5 w-5 mr-1" /> Add
                </Button>
              </div>
              {/* Modal for adding new package */}
              <Dialog open={showPackageModal} onClose={() => { setShowPackageModal(false); setPackageError(''); }}>
                <div className="bg-white rounded-lg p-6" style={{ boxShadow: 'none', border: 'none' }}>
                  <h3 className="text-lg font-semibold mb-4">Add New Package</h3>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg mb-4"
                    placeholder="Package name"
                    value={newPackageName}
                    onChange={e => setNewPackageName(e.target.value)}
                  />
                  {packageError && <div className="text-red-600 text-sm mb-4">{packageError}</div>}
                  <div className="flex justify-end gap-2">
                    <Button outline type="button" onClick={() => { setShowPackageModal(false); setPackageError(''); }}>Cancel</Button>
                    <Button
                      outline
                      type="button"
                      disabled={!newPackageName.trim() || packageLoading}
                      onClick={async () => {
                        setPackageLoading(true);
                        setPackageError('');
                        try {
                          const user = typeof window !== 'undefined' ? getStoredUser() : null;
                          console.log('DEBUG: Creating package with user:', user);
                          if (!user) {
                            setPackageError('You must be logged in.');
                            setPackageLoading(false);
                            return;
                          }
                          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/packages`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ trainerId: user.id, name: newPackageName }),
                          });
                          if (res.ok) {
                            const pkg = await res.json();
                            setPackages(prev => [...prev, pkg]);
                            setSelectedPackage(pkg.id.toString());
                            setPackageInput(pkg.name);
                            setShowPackageModal(false);
                            setNewPackageName('');
                          } else {
                            const data = await res.json();
                            setPackageError(data.error || 'Failed to create package.');
                            console.error('Package creation error:', data.error, data);
                          }
                        } catch (err) {
                          setPackageError('Network error.');
                          console.error('Package creation network error:', err);
                        } finally {
                          setPackageLoading(false);
                        }
                      }}
                    >
                      {packageLoading ? 'Creating...' : 'Add Package'}
                    </Button>
                  </div>
                </div>
              </Dialog>
              {packageLoading && <div className="text-xs text-blue-500 mt-1">Creating package...</div>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Status</label>
              <Select name="paymentStatus" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
                <option value="">Select payment status</option>
                <option value="free">Free</option>
                <option value="free trial">Free Trial</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="installments">Installments</option>
              </Select>
            </div>
            {paymentStatus === "paid" && (
              <div className="mt-2">
                <label className="block text-sm font-medium mb-1">Transaction Images (optional)</label>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png"
                  onChange={e => setPaidTransactionImages(Array.from(e.target.files || []))}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {paidTransactionImages.length > 0 && (
                  <div className="mt-1 text-xs text-zinc-600">{paidTransactionImages.length} file(s) selected</div>
                )}
              </div>
            )}
            {/* Duration input group */}
            <div>
              <label className="block text-sm font-medium mb-1">Duration</label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  min={1} 
                  placeholder="Enter duration" 
                  value={durationValue} 
                  onChange={e => setDurationValue(e.target.value)} 
                  className="w-4/5"
                />
                <Select value={durationUnit} onChange={e => setDurationUnit(e.target.value)} className="w-1/5">
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subscription End Date</label>
              <Input name="endDate" type="date" disabled value={endDate} />
            </div>
            {showPaymentMethod && (
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <Select name="paymentMethod">
                  <option value="">Select payment method</option>
                  {paymentMethods.map((pm) => (
                    <option key={pm} value={pm}>{pm}</option>
                  ))}
                </Select>
              </div>
            )}
            {showPriceFields && (
              <div>
                <label className="block text-sm font-medium mb-1">Package Price (before discount)</label>
                <Input name="priceBeforeDisc" type="number" min={0} value={priceBeforeDisc} onChange={e => setPriceBeforeDisc(e.target.value)} />
              </div>
            )}
            {showPriceFields && (
              <div>
                <label className="block text-sm font-medium mb-1">Discount</label>
                <Select name="discount" value={discount} onChange={e => setDiscount(e.target.value)}>
                  <option value="">Discount?</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </Select>
              </div>
            )}
            {showDiscountFields && (
              <>
                {/* Discount Value input group */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Discount Value</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={0}
                      value={discountValue}
                      onChange={e => setDiscountValue(e.target.value)}
                      className="w-4/5"
                    />
                    <Select value={discountType} onChange={e => setDiscountType(e.target.value)} className="w-1/5">
                      <option value="fixed">Fixed Amount</option>
                      <option value="percentage">Percentage</option>
                    </Select>
                  </div>
                </div>
              </>
            )}
            {showDiscountFields && (
              <div>
                <label className="block text-sm font-medium mb-1">Package Price (after discount)</label>
                <Input name="priceAfterDisc" type="number" min={0} value={packagePriceAfter} onChange={e => setPackagePriceAfter(e.target.value)} />
              </div>
            )}
          </div>
        </section>

        {/* Installments Table */}
        {showInstallments && (
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Installments</h2>
            <Table>
              <thead>
                <tr>
                  <th className="py-2 px-3 text-left">Paid Date</th>
                  <th className="py-2 px-3 text-left">Amount</th>
                  <th className="py-2 px-3 text-left">Remaining</th>
                  <th className="py-2 px-3 text-left">Next Installment Date</th>
                  <th className="py-2 px-3 text-left">Transaction Images</th>
                  <th className="py-2 px-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((inst, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-2 px-3">
                      <Input
                        type="date"
                        value={inst.paidDate}
                        onChange={e => handleEditInstallment(idx, "paidDate", e.target.value)}
                        className="w-full"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="number"
                        min={0}
                        value={inst.amount}
                        onChange={e => handleEditInstallment(idx, "amount", e.target.value)}
                        className="w-full"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="number"
                        min={0}
                        value={inst.remaining}
                        disabled
                        className="w-full"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <Input
                        type="date"
                        value={inst.nextInstallment}
                        onChange={e => handleEditInstallment(idx, "nextInstallment", e.target.value)}
                        className="w-full"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <div className="space-y-2">
                        {/* File Upload */}
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png"
                          onChange={e => handleInstallmentImageSelect(idx, e)}
                          className="hidden"
                          id={`installment-images-${idx}`}
                        />
                        <label htmlFor={`installment-images-${idx}`} className="cursor-pointer">
                          <div className="text-xs text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-2 py-1 text-center">
                            📷 Upload Images
                          </div>
                        </label>
                        
                        {/* Image Previews */}
                        {installmentImages[idx] && installmentImages[idx].length > 0 && (
                          <div className="space-y-1">
                            <div className="text-xs text-zinc-600">Selected:</div>
                            <div className="grid grid-cols-2 gap-1">
                              {installmentImages[idx].map((image, imageIndex) => (
                                <div key={imageIndex} className="relative group">
                                  <img
                                    src={URL.createObjectURL(image)}
                                    alt={image.name}
                                    className="w-full h-12 object-cover rounded border"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveInstallmentImage(idx, imageIndex)}
                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {installmentImages[idx].length} image(s)
                            </div>
                          </div>
                        )}
                        
                        {uploadingInstallmentImages[idx] && (
                          <div className="text-xs text-blue-600">
                            Uploading...
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 flex gap-2 items-center">
                      {installments.length > 1 && (
                        <Button plain type="button" onClick={() => handleRemoveInstallment(idx)} title="Remove installment">
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                      {idx === installments.length - 1 && (
                        <Button outline type="button" onClick={handleAddInstallment} title="Add installment">
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </section>
        )}

        {/* Sticky Notes Section */}
        {/* 3. Notes: textarea and Add button stacked below title, Add is outline style */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Notes</h2>
          <div className="mb-4">
            <textarea
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[48px] mb-2"
              placeholder="Add a note..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              rows={2}
            />
            <Button
              outline
              type="button"
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              className={newNote.trim() ? 'border-blue-600 text-blue-600' : ''}
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              <span>Add</span>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {notesList.map(note => (
              <div key={note.id} className="relative bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow flex flex-col min-h-[120px] transition-all hover:shadow-lg">
                {note.editing ? (
                  <>
                    <textarea
                      className="w-full h-20 p-2 border border-zinc-300 rounded-lg mb-2"
                      value={note.content}
                      onChange={e => handleEditNote(note.id, e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button outline type="button" onClick={() => cancelEditNote(note.id)}>
                        <XMarkIcon className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                      <Button type="button" onClick={() => handleEditNote(note.id, note.content)}>
                        <CheckIcon className="h-4 w-4 mr-1" /> Save
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1 whitespace-pre-line break-words text-zinc-800 mb-2">{note.content}</div>
                    <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
                      <span>Created: {formatDate(note.createdAt)}</span>
                      <div className="flex gap-2">
                        <button onClick={() => startEditNote(note.id)} className="hover:text-blue-600" title="Edit">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteId(note.id)} className="hover:text-red-600" title="Delete">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
                {/* Delete confirmation dialog */}
                {deleteId === note.id && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 rounded-xl">
                    <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-lg flex flex-col items-center">
                      <p className="mb-3 text-sm">Delete this note?</p>
                      <div className="flex gap-2">
                        <Button outline type="button" onClick={() => setDeleteId(null)}>
                          Cancel
                        </Button>
                        <Button type="button" onClick={() => handleDeleteNote(note.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {notesList.length === 0 && (
              <div className="col-span-full text-center text-zinc-400 py-8">No notes yet. Add your first note!</div>
            )}
          </div>
        </section>

        {/* Save/Cancel Buttons */}
        <div className="flex justify-end gap-4 mt-10">
          <Button outline type="button" onClick={() => router.push("/clients")}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Client"}</Button>
        </div>
      </form>
    </div>
  );
} 