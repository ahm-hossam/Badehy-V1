"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import { Button } from "@/components/button";
import { Divider } from "@/components/divider";
import { Table } from "@/components/table";
import { getStoredUser } from "@/lib/auth";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Alert } from '@/components/alert';

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clientData, setClientData] = useState<any>(null);
  const [success, setSuccess] = useState(false);

  // Form state (pre-filled)
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [durationValue, setDurationValue] = useState('');
  const [durationUnit, setDurationUnit] = useState('months');
  const [endDate, setEndDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [priceBeforeDisc, setPriceBeforeDisc] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountType, setDiscountType] = useState('fixed');
  const [discountValue, setDiscountValue] = useState('');
  const [priceAfterDisc, setPriceAfterDisc] = useState('');
  // ... (add more state for installments, images, etc.)

  const [packages, setPackages] = useState<{ id: number; name: string }[]>([]);
  const [packageLoading, setPackageLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);

  // Installments state and helpers
  const [installments, setInstallments] = useState<any[]>([]);
  const [deleteInstallmentIds, setDeleteInstallmentIds] = useState<number[]>([]);
  // Pre-fill installments
  useEffect(() => {
    if (!clientData) return;
    const sub = clientData.subscriptions?.[0];
    if (sub && Array.isArray(sub.installments)) {
      setInstallments(sub.installments.map((inst: any) => ({
        id: inst.id,
        paidDate: inst.paidDate ? inst.paidDate.slice(0, 10) : '',
        amount: inst.amount ? String(inst.amount) : '',
        remaining: inst.remaining ? String(inst.remaining) : '',
        nextInstallment: inst.nextInstallment ? inst.nextInstallment.slice(0, 10) : '',
        status: inst.status || 'paid',
        transactionImages: inst.transactionImages || [],
      })));
    }
  }, [clientData]);
  const handleAddInstallment = () => {
    setInstallments(prev => ([...prev, { paidDate: '', amount: '', remaining: '', nextInstallment: '', status: 'paid', transactionImages: [] }]));
  };
  const handleRemoveInstallment = (idx: number) => {
    setInstallments(prev => {
      const inst = prev[idx];
      if (inst.id) setDeleteInstallmentIds(ids => [...ids, inst.id]);
      return prev.filter((_, i) => i !== idx);
    });
  };
  const handleEditInstallment = (idx: number, field: string, value: string) => {
    setInstallments(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  // State for paid subscription images
  const [paidTransactionImages, setPaidTransactionImages] = useState<File[]>([]);
  const [existingPaidImages, setExistingPaidImages] = useState<any[]>([]);
  const [deleteSubscriptionImageIds, setDeleteSubscriptionImageIds] = useState<number[]>([]);
  // Pre-fill paid subscription images
  useEffect(() => {
    if (!clientData) return;
    const sub = clientData.subscriptions?.[0];
    if (sub && Array.isArray(sub.subscriptionTransactionImages)) {
      setExistingPaidImages(sub.subscriptionTransactionImages);
    }
  }, [clientData]);
  const handleRemovePaidImage = (imgId: number) => {
    setDeleteSubscriptionImageIds(ids => [...ids, imgId]);
    setExistingPaidImages(imgs => imgs.filter(img => img.id !== imgId));
  };

  // State for installment images
  const [installmentImages, setInstallmentImages] = useState<{ [key: number]: File[] }>({});
  const [existingInstallmentImages, setExistingInstallmentImages] = useState<{ [key: number]: any[] }>({});
  const [deleteTransactionImageIds, setDeleteTransactionImageIds] = useState<number[]>([]);
  // Pre-fill existing installment images
  useEffect(() => {
    if (!clientData) return;
    const sub = clientData.subscriptions?.[0];
    if (sub && Array.isArray(sub.installments)) {
      const imagesMap: { [key: number]: any[] } = {};
      sub.installments.forEach((inst: any) => {
        imagesMap[inst.id] = inst.transactionImages || [];
      });
      setExistingInstallmentImages(imagesMap);
    }
  }, [clientData]);
  const handleInstallmentImageSelect = (installmentId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setInstallmentImages(prev => ({ ...prev, [installmentId]: [...(prev[installmentId] || []), ...files] }));
  };
  const handleRemoveInstallmentImage = (installmentId: number, imageId: number) => {
    setDeleteTransactionImageIds(ids => [...ids, imageId]);
    setExistingInstallmentImages(prev => ({
      ...prev,
      [installmentId]: prev[installmentId]?.filter(img => img.id !== imageId) || []
    }));
  };

  // Fetch packages and payment methods
  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    setPackageLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/packages?trainerId=${user.id}`)
      .then((res) => res.json())
      .then((data) => setPackages(data))
      .finally(() => setPackageLoading(false));
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/dropdowns`)
      .then((res) => res.json())
      .then((data) => setPaymentMethods(data.paymentMethods || []));
  }, []);

  useEffect(() => {
    async function fetchClient() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/clients/${clientId}`);
        if (!res.ok) throw new Error("Failed to fetch client data");
        const data = await res.json();
        setClientData(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch client data");
      } finally {
        setLoading(false);
      }
    }
    if (clientId) fetchClient();
  }, [clientId]);

  // Pre-fill state when clientData loads
  useEffect(() => {
    if (!clientData) return;
    setFullName(clientData.fullName || '');
    setPhone(clientData.phone || '');
    setEmail(clientData.email || '');
    setGender(clientData.gender || '');
    setAge(clientData.age ? String(clientData.age) : '');
    setSource(clientData.source || '');
    setNotes(clientData.notes || '');
    // Subscription (assume latest)
    const sub = clientData.subscriptions?.[0];
    if (sub) {
      setSelectedPackage(sub.packageId ? String(sub.packageId) : '');
      setStartDate(sub.startDate ? sub.startDate.slice(0, 10) : '');
      setDurationValue(sub.durationValue ? String(sub.durationValue) : '');
      setDurationUnit(sub.durationUnit || 'months');
      setEndDate(sub.endDate ? sub.endDate.slice(0, 10) : '');
      setPaymentStatus(sub.paymentStatus || '');
      setPaymentMethod(sub.paymentMethod || '');
      setPriceBeforeDisc(sub.priceBeforeDisc ? String(sub.priceBeforeDisc) : '');
      setDiscountApplied(!!sub.discountApplied);
      setDiscountType(sub.discountType || 'fixed');
      setDiscountValue(sub.discountValue ? String(sub.discountValue) : '');
      setPriceAfterDisc(sub.priceAfterDisc ? String(sub.priceAfterDisc) : '');
    }
    // TODO: Pre-fill installments, images, etc.
  }, [clientData]);

  // TODO: Implement form submit handler

  if (loading) return <div className="p-8 text-center"><div className="flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><span className="ml-2 text-gray-600">Loading client data...</span></div></div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!clientData) return null;

  // Complete submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Update Client form submitted'); // Debug log
    // Gather updated data
    const client = { fullName, phone, email, gender, age, source, notes };
    const subscription = {
      id: clientData.subscriptions?.[0]?.id,
      packageId: selectedPackage,
      startDate,
      durationValue,
      durationUnit,
      endDate,
      paymentStatus,
      paymentMethod,
      priceBeforeDisc,
      discountApplied,
      discountType,
      discountValue,
      priceAfterDisc,
    };
    // Prepare installments data
    const installmentsData = installments.map(inst => ({
      id: inst.id,
      paidDate: inst.paidDate,
      amount: inst.amount,
      remaining: inst.remaining,
      nextInstallment: inst.nextInstallment,
      status: inst.status,
    }));
    // Send PUT request
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/clients/${clientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client,
        subscription,
        installments: installmentsData,
        deleteInstallmentIds,
        deleteTransactionImageIds,
        deleteSubscriptionImageIds,
      }),
    });
    if (res.ok) {
      // Upload new paid subscription images
      if (paymentStatus === "paid" && paidTransactionImages.length > 0) {
        const result = await res.json();
        const subId = result.subscriptions?.[0]?.id;
        if (subId) {
          const formData = new FormData();
          paidTransactionImages.forEach(img => formData.append('images', img));
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/transaction-images/upload/subscription/${subId}`, {
            method: 'POST',
            body: formData,
          });
        }
      }
      // Upload new installment images
      for (const [key, files] of Object.entries(installmentImages)) {
        if (files.length > 0) {
          const instId = key;
          const formData = new FormData();
          files.forEach(img => formData.append('images', img));
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/transaction-images/${instId}`, {
            method: 'POST',
            body: formData,
          });
        }
      }
      // Show success toast and redirect
      router.push('/clients?updated=1');
    } else {
      setError('Failed to update client.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Edit Client</h1>
      <p className="mb-6 text-zinc-600">Update client and subscription details.</p>
      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-10" action="javascript:void(0)">
        {/* Client Details */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Client Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <Input name="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required />
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
              <Input name="email" value={email} onChange={e => setEmail(e.target.value)} type="email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <Select name="gender" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <Input name="age" value={age} onChange={e => setAge(e.target.value)} type="number" min={0} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Source</label>
              <Select name="source" value={source} onChange={e => setSource(e.target.value)}>
                <option value="">Select source</option>
                {/* TODO: Map sources */}
              </Select>
            </div>
          </div>
        </section>
        {/* Subscription Info */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Subscription Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Subscription Start Date</label>
              <Input name="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Package Name</label>
              <Select
                name="package"
                value={selectedPackage}
                onChange={e => setSelectedPackage(e.target.value)}
                required
              >
                <option value="">Select a package</option>
                {packages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                ))}
              </Select>
            </div>
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
            {/* Payment method, price, discount, and submit button */}
            {["paid", "installments"].includes(paymentStatus) && (
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <Select name="paymentMethod" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="">Select payment method</option>
                  {paymentMethods.map((pm) => (
                    <option key={pm} value={pm}>{pm}</option>
                  ))}
                </Select>
              </div>
            )}
            {["paid", "installments"].includes(paymentStatus) && (
              <div>
                <label className="block text-sm font-medium mb-1">Package Price (before discount)</label>
                <Input name="priceBeforeDisc" type="number" min={0} value={priceBeforeDisc} onChange={e => setPriceBeforeDisc(e.target.value)} />
              </div>
            )}
            {["paid", "installments"].includes(paymentStatus) && (
              <div>
                <label className="block text-sm font-medium mb-1">Discount</label>
                <Select name="discountApplied" value={discountApplied ? "yes" : "no"} onChange={e => setDiscountApplied(e.target.value === "yes")}> 
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </Select>
                {discountApplied && (
                  <div className="flex gap-2 mt-2">
                    <Select value={discountType} onChange={e => setDiscountType(e.target.value)} className="w-1/3">
                      <option value="fixed">Fixed</option>
                      <option value="percentage">Percentage</option>
                    </Select>
                    <Input name="discountValue" type="number" min={0} value={discountValue} onChange={e => setDiscountValue(e.target.value)} className="w-2/3" />
                  </div>
                )}
              </div>
            )}
            {/* Paid subscription images upload/removal */}
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
                {existingPaidImages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {existingPaidImages.map(img => (
                      <div key={img.id} className="flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded">
                        <span className="text-xs">{img.originalName}</span>
                        <Button outline type="button" className="text-red-600 px-1 py-0.5" onClick={() => handleRemovePaidImage(img.id)}>Remove</Button>
                      </div>
                    ))}
                  </div>
                )}
                {paidTransactionImages.length > 0 && (
                  <div className="mt-1 text-xs text-zinc-600">{paidTransactionImages.length} new file(s) selected</div>
                )}
              </div>
            )}
          </div>
        </section>
        {/* Installments section */}
        {paymentStatus === 'installments' && (
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Installments</h2>
            <Table>
              <thead>
                <tr>
                  <th>Paid Date</th>
                  <th>Amount</th>
                  <th>Remaining</th>
                  <th>Next Installment</th>
                  <th>Status</th>
                  <th>Images</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((inst, idx) => (
                  <tr key={inst.id || idx}>
                    <td><Input type="date" value={inst.paidDate} onChange={e => handleEditInstallment(idx, 'paidDate', e.target.value)} /></td>
                    <td><Input type="number" value={inst.amount} onChange={e => handleEditInstallment(idx, 'amount', e.target.value)} /></td>
                    <td><Input type="number" value={inst.remaining} onChange={e => handleEditInstallment(idx, 'remaining', e.target.value)} /></td>
                    <td><Input type="date" value={inst.nextInstallment} onChange={e => handleEditInstallment(idx, 'nextInstallment', e.target.value)} /></td>
                    <td><Select value={inst.status} onChange={e => handleEditInstallment(idx, 'status', e.target.value)}><option value="paid">Paid</option><option value="pending">Pending</option></Select></td>
                    <td>
                      {/* Existing images */}
                      {inst.id && existingInstallmentImages[inst.id]?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {existingInstallmentImages[inst.id].map(img => (
                            <div key={img.id} className="flex items-center gap-1 bg-zinc-100 px-1 py-0.5 rounded">
                              <span className="text-xs">{img.originalName}</span>
                              <Button outline type="button" className="text-red-600 px-1 py-0.5" onClick={() => handleRemoveInstallmentImage(inst.id, img.id)}>Remove</Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* New images */}
                      <input type="file" multiple accept="image/jpeg,image/png" onChange={e => handleInstallmentImageSelect(inst.id || idx, e)} />
                      {installmentImages[inst.id || idx]?.length > 0 && (
                        <div className="mt-1 text-xs text-zinc-600">{installmentImages[inst.id || idx].length} new file(s) selected</div>
                      )}
                    </td>
                    <td><Button outline type="button" onClick={() => handleRemoveInstallment(idx)} className="text-red-600">Remove</Button></td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Button outline type="button" onClick={handleAddInstallment} className="mt-4">Add Installment</Button>
          </section>
        )}
        {/* TODO: Installments, images, and submit button */}
        <div className="flex justify-end gap-2 mt-8">
          <Button outline type="button" onClick={() => router.push('/clients')}>Cancel</Button>
          <Button color="dark/zinc" type="submit">Update Client</Button>
        </div>
      </form>
    </div>
  );
} 