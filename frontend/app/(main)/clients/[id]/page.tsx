"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import { Select } from '@/components/select';
import { Dialog } from '@/components/dialog';
import { Toast } from '@/components/toast';
import { getStoredUser } from '@/lib/auth';
import { 
  UserIcon, 
  CreditCardIcon, 
  ClipboardDocumentListIcon, 
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  PencilIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  FireIcon,
  HeartIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon as ClockIconSolid,
  StarIcon,
  ArrowLeftIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserGroupIcon,
  PlusIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';

interface Client {
  id: number;
  trainerId: number;
  fullName: string;
  phone: string;
  email: string;
  gender: string;
  age: number;
  source: string;
  level: string;
  registrationDate: string;
  goal: string;
  workoutPlace: string;
  height: number;
  weight: number;
  preferredTrainingDays: string;
  preferredTrainingTime: string;
  equipmentAvailability: string;
  favoriteTrainingStyle: string;
  weakAreas: string;
  nutritionGoal: string;
  dietPreference: string;
  mealCount: number;
  foodAllergies: string;
  dislikedIngredients: string;
  currentNutritionPlan: string;
  injuriesHealthNotes: string[];
  goals: string[];
  profileCompletion: string;
  subscriptions: Array<{
    id: number;
    paymentStatus: string;
    priceAfterDisc: number;
    startDate: string;
    endDate: string;
    durationValue: number;
    durationUnit: string;
    paymentMethod: string;
    priceBeforeDisc: number;
    discountApplied: boolean;
    discountType: string;
    discountValue: number;
    isOnHold?: boolean;
    holdStartDate?: string;
    holdEndDate?: string;
    holdDuration?: number;
    holdDurationUnit?: string;
    isCanceled?: boolean;
    canceledAt?: string;
    cancelReason?: string;
    refundAmount?: number;
    refundType?: string;
    renewalHistory?: any[];
    installments: Array<{
      id: number;
      amount: number;
      status: string;
      paidDate: string;
      remaining: number;
      nextInstallment: string | null;
      transactionImages: Array<{
        id: number;
        filename: string;
        originalName: string;
        uploadedAt: string;
      }>;
    }>;
  }>;
  selectedFormId: string | null;
  answers: { [key: string]: any };
  submissions: Array<{
    id: number;
    formId: number;
    answers: { [key: string]: any };
    submittedAt: string;
    form?: {
      id: number;
      name: string;
      questions: Array<{
        id: string;
        label: string;
        type: string;
        required: boolean;
        options?: string[];
      }>;
    };
  }>;
  latestSubmission?: {
    id: number;
    formId: number;
    answers: { [key: string]: any };
    submittedAt: string;
    form?: {
      id: number;
      name: string;
      questions: Array<{
        id: string;
        label: string;
        type: string;
        required: boolean;
        options?: string[];
      }>;
    };
  };
  notes: Array<{
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  }>;
  labels: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  teamAssignments?: Array<{
    id: number;
    teamMember: {
      id: number;
      fullName: string;
      role: string;
    };
  }>;
}

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Check for tab query parameter on mount
  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab && ['overview', 'profile', 'subscriptions', 'workout-programs', 'nutrition-programs', 'checkins', 'services', 'notes'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [clientDataVersion, setClientDataVersion] = useState(0);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdDuration, setHoldDuration] = useState('');
  const [holdDurationUnit, setHoldDurationUnit] = useState('days');

  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelDate, setCancelDate] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [refundType, setRefundType] = useState('none');
  const [refundAmount, setRefundAmount] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', type: 'success' as 'success' | 'error' });

  // Renewal modal state
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewalData, setRenewalData] = useState<any>({
    startDate: '',
    durationValue: '',
    durationUnit: 'month',
    endDate: '',
    paymentStatus: 'paid',
    paymentMethod: 'instapay',
    priceBeforeDisc: '',
    discount: 'no',
    discountValue: '',
    discountType: 'fixed',
    packageId: '',
    installments: []
  });
  const [packages, setPackages] = useState<any[]>([]);
  const [showPaymentMethod, setShowPaymentMethod] = useState(true);
  const [showDiscountFields, setShowDiscountFields] = useState(true);
  const [showDiscountValue, setShowDiscountValue] = useState(false);
  const [showTransactionImage, setShowTransactionImage] = useState(false);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [transactionImage, setTransactionImage] = useState<File | null>(null);
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [installments, setInstallments] = useState<Array<{ date: string; amount: string; image: File | null; nextDate: string }>>([
    { date: '', amount: '', image: null, nextDate: '' }
  ]);

  // New state for package-based visibility in renewal
  const [packageSelected, setPackageSelected] = useState(false);
  const [showRenewalFields, setShowRenewalFields] = useState(false);

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ open: true, message, type });
    setTimeout(() => setToast({ open: false, message: '', type: 'success' }), 3000);
  };

  // Auto-calculate refund amount based on subscription details
  const calculateRefundAmount = (subscription: any) => {
    if (!subscription) return 0;

    console.log('=== calculateRefundAmount DEBUG ===');
    console.log('Subscription:', subscription);
    console.log('Payment status:', subscription.paymentStatus);
    console.log('Discount applied:', subscription.discountApplied);
    console.log('Price before discount:', subscription.priceBeforeDisc);
    console.log('Price after discount:', subscription.priceAfterDisc);
    console.log('Renewal history:', subscription.renewalHistory);

    const paymentStatus = subscription.paymentStatus?.toUpperCase();
    let totalAmount = 0;
    
    if (paymentStatus === 'PAID') {
      // Calculate original subscription amount
      if (subscription.discountApplied && subscription.priceAfterDisc) {
        totalAmount = subscription.priceAfterDisc; // Use discounted amount
        console.log('Using price after discount:', totalAmount);
      } else {
        totalAmount = subscription.priceBeforeDisc || 0; // Use original amount
        console.log('Using price before discount:', totalAmount);
      }
    } else if (paymentStatus === 'INSTALLMENTS') {
      // Sum all paid installments
      if (subscription.installments && subscription.installments.length > 0) {
        totalAmount = subscription.installments.reduce((sum: number, installment: any) => {
          return sum + (installment.amount || 0);
        }, 0);
        console.log('Using installments total:', totalAmount);
      } else {
        totalAmount = 0;
        console.log('No installments found');
      }
    } else if (paymentStatus === 'FREE') {
      totalAmount = 0;
      console.log('Free subscription, no refund');
    } else {
      totalAmount = 0;
      console.log('Unknown payment status, no refund');
    }

    // Add renewal amounts if any
    if (subscription.renewalHistory && Array.isArray(subscription.renewalHistory)) {
      console.log('Processing renewal history...');
      subscription.renewalHistory.forEach((renewal: any, index: number) => {
        console.log(`Renewal ${index + 1}:`, renewal);
        
        if (renewal.paymentStatus?.toUpperCase() === 'PAID') {
          let renewalAmount = 0;
          
          if (renewal.priceAfterDisc !== null && renewal.priceAfterDisc !== undefined) {
            renewalAmount = renewal.priceAfterDisc;
            console.log(`Renewal ${index + 1} using price after discount:`, renewalAmount);
          } else if (renewal.discountApplied && renewal.priceBeforeDisc && renewal.discountValue && renewal.discountType) {
            if (renewal.discountType === 'percentage') {
              renewalAmount = renewal.priceBeforeDisc - (renewal.priceBeforeDisc * renewal.discountValue / 100);
            } else {
              renewalAmount = renewal.priceBeforeDisc - renewal.discountValue;
            }
            console.log(`Renewal ${index + 1} calculated amount:`, renewalAmount);
          } else {
            renewalAmount = renewal.priceBeforeDisc || 0;
            console.log(`Renewal ${index + 1} using price before discount:`, renewalAmount);
          }
          
          totalAmount += renewalAmount;
          console.log(`Total amount after renewal ${index + 1}:`, totalAmount);
        } else {
          console.log(`Renewal ${index + 1} not paid, skipping`);
        }
      });
    }

    console.log('Final refund amount:', totalAmount);
    return totalAmount;
  };

  // Helper function to get display name
  const getDisplayName = (client: Client) => {
    // If fullName is not "Unknown Client", use it
    if (client.fullName && client.fullName !== "Unknown Client") {
      return client.fullName;
    }
    
    // Otherwise, try to get name from form answers
    if (client.latestSubmission?.answers) {
      const answers = client.latestSubmission.answers;
      
      // Prioritize name-related fields
      const nameFields = ['fullName', 'name', 'firstName', 'first_name', 'full_name'];
      for (const field of nameFields) {
        for (const key in answers) {
          if (key.toLowerCase().includes(field.toLowerCase()) && 
              answers[key] && 
              answers[key] !== 'undefined' &&
              answers[key] !== '') {
            return answers[key];
          }
        }
      }
      
      // If no name fields found, look for any field that might contain a name
      const nameKeys = Object.keys(answers).filter(key => 
        key !== 'filledByTrainer' && 
        answers[key] && 
        answers[key] !== 'undefined' &&
        answers[key] !== '' &&
        !['gender', 'age', 'email', 'phone', 'source'].some(excludeField => 
          key.toLowerCase().includes(excludeField.toLowerCase())
        )
      );
      
      if (nameKeys.length > 0) {
        return answers[nameKeys[0]];
      }
    }
    
    return "Unknown Client";
  };

  useEffect(() => {
    loadClientDetails();
  }, [clientId]);



  const loadClientDetails = React.useCallback(async () => {
    try {
      setLoading(true);
      // Use the proxy API route to avoid CORS issues
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Frontend received client data:', data);
        console.log('Frontend - submissions:', data.submissions);
        console.log('Frontend - submissions length:', data.submissions?.length);
        if (data.error) {
          console.error('Backend returned error:', data.error);
          setError(data.error);
        } else {
          setClient(data);
          setClientDataVersion(prev => prev + 1);
        }
      } else {
        console.error('Failed to load client details');
        setError('Failed to load client details');
      }
    } catch (error) {
      console.error('Error loading client details:', error);
      setError('Failed to load client details');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const handleSaveProfile = async () => {
    setSaving(true);
    // TODO: Implement save functionality
    setTimeout(() => {
      setSaving(false);
      setEditing(false);
    }, 1000);
  };

  const getProfileCompletionColor = (completion: string) => {
    switch (completion) {
      case 'Completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Not Completed':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'OVERDUE':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getProfileCompletionPercentage = () => {
    if (!client) return 0;
    
    const fields = [
      client.fullName, client.email, client.phone, client.gender, client.age,
      client.goal, client.workoutPlace, client.height, client.weight,
      client.preferredTrainingDays, client.preferredTrainingTime,
      client.equipmentAvailability, client.favoriteTrainingStyle,
      client.weakAreas, client.nutritionGoal, client.dietPreference,
      client.mealCount, client.foodAllergies, client.currentNutritionPlan
    ];
    
    const filledFields = fields.filter(field => field && field !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const getSubscriptionStatus = () => {
    if (!client || !client.subscriptions || client.subscriptions.length === 0) {
      return { status: 'No Subscription', color: 'bg-gray-100 text-gray-700 border-gray-200', isActive: false };
    }

    // Find the most recent subscription
    const latestSubscription = client.subscriptions.reduce((latest, current) => {
      return current.id > latest.id ? current : latest;
    });

    console.log('Latest subscription:', latestSubscription);
    console.log('Payment status:', latestSubscription.paymentStatus);
    console.log('End date:', latestSubscription.endDate);
    console.log('Renewal history:', latestSubscription.renewalHistory);

    // Normalize payment status to uppercase for comparison
    const paymentStatus = latestSubscription.paymentStatus?.toUpperCase();

    // Check if subscription is canceled first
    if (latestSubscription.isCanceled && latestSubscription.canceledAt) {
      // If there's renewal history, treat it as active (renewed subscription)
      if (latestSubscription.renewalHistory && Array.isArray(latestSubscription.renewalHistory) && latestSubscription.renewalHistory.length > 0) {
        // Subscription has been renewed, so it's active
        if (paymentStatus === 'PAID') {
          return { status: 'Active', color: 'bg-green-100 text-green-700 border-green-200', isActive: true };
        } else if (paymentStatus === 'PENDING') {
          return { status: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', isActive: true };
        } else if (paymentStatus === 'FREE') {
          return { status: 'Free', color: 'bg-blue-100 text-blue-700 border-blue-200', isActive: true };
        } else {
          return { status: paymentStatus || 'Active', color: 'bg-green-100 text-green-700 border-green-200', isActive: true };
        }
      }
      
      // No renewal history, so it's truly canceled
      const cancelDate = new Date(latestSubscription.canceledAt);
      const currentDate = new Date();
      
      if (currentDate >= cancelDate) {
        return { status: 'Canceled', color: 'bg-gray-100 text-gray-700 border-gray-200', isActive: false };
      } else {
        return { status: 'Canceled (Active until ' + cancelDate.toLocaleDateString() + ')', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', isActive: true };
      }
    }

    // Check if subscription is on hold
    if (latestSubscription.isOnHold) {
      return { status: 'On Hold', color: 'bg-orange-100 text-orange-700 border-orange-200', isActive: true };
    }

    // Check if subscription is canceled by payment status
    if (paymentStatus === 'CANCELED') {
      return { status: 'Canceled', color: 'bg-gray-100 text-gray-700 border-gray-200', isActive: false };
    }

    // Check if subscription is pending
    if (paymentStatus === 'PENDING') {
      return { status: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', isActive: true };
    }

    // For active/expired status, check the end date
    if (latestSubscription.endDate) {
      const endDate = new Date(latestSubscription.endDate);
      const currentDate = new Date();
      
      // Check if the date is valid
      if (isNaN(endDate.getTime())) {
        console.log('Invalid end date:', latestSubscription.endDate);
        return { status: 'Expired', color: 'bg-red-100 text-red-700 border-red-200', isActive: false };
      }
      
      const isActive = currentDate < endDate;
      
      console.log('End date object:', endDate);
      console.log('Current date object:', currentDate);
      console.log('Is active:', isActive);
      
      if (isActive) {
        return { status: 'Active', color: 'bg-green-100 text-green-700 border-green-200', isActive: true };
      } else {
        return { status: 'Expired', color: 'bg-red-100 text-red-700 border-red-200', isActive: false };
      }
    } else if (paymentStatus === 'OVERDUE') {
      return { status: 'Expired', color: 'bg-red-100 text-red-700 border-red-200', isActive: false };
    } else if (paymentStatus === 'PAID' || paymentStatus === 'FREE') {
      // If paid/free but no end date, assume active
      return { status: 'Active', color: 'bg-green-100 text-green-700 border-green-200', isActive: true };
    } else {
      // For any other payment status, check if we have an end date to determine status
      if (latestSubscription.endDate) {
        const endDate = new Date(latestSubscription.endDate);
        const currentDate = new Date();
        
        if (!isNaN(endDate.getTime())) {
          const isActive = currentDate < endDate;
          return isActive 
            ? { status: 'Active', color: 'bg-green-100 text-green-700 border-green-200', isActive: true }
            : { status: 'Expired', color: 'bg-red-100 text-red-700 border-red-200', isActive: false };
        }
      }
      
      // If we can't determine status from end date, use payment status as fallback
      console.log('Using payment status as fallback:', paymentStatus);
      return { status: 'Active', color: 'bg-green-100 text-green-700 border-green-200', isActive: true };
    }
  };

  const isSubscriptionActionDisabled = () => {
    const status = getSubscriptionStatus();
    return !status.isActive;
  };

  const handleHoldSubscription = () => {
    if (!client) return;
    
    // Get the latest subscription
    const latestSubscription = client.subscriptions && client.subscriptions.length > 0 
      ? client.subscriptions[0] 
      : null;
    
    if (latestSubscription) {
      setSelectedSubscription(latestSubscription);

      setShowHoldModal(true);
    setDropdownOpen(false);
    }
  };

  const handleConfirmHold = async () => {
    if (!selectedSubscription || !holdDuration) return;
    
    try {
      const response = await fetch(`/api/subscriptions/${selectedSubscription.id}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          holdDuration: parseInt(holdDuration), 
          holdDurationUnit
        }),
      });
      
      if (response.ok) {
        // Refresh client data to show updated subscription
        loadClientDetails();
        setShowHoldModal(false);
        setHoldDuration('');
        setHoldDurationUnit('days');

        setSelectedSubscription(null);
        
        // Show success toast
        showToast('Subscription held successfully!');
      } else {
        console.error('Failed to hold subscription');
        showToast('Failed to hold subscription. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error holding subscription:', error);
      showToast('Error holding subscription. Please try again.', 'error');
    }
  };

  const calculateNewEndDate = () => {
    if (!selectedSubscription || !holdDuration) return null;
    
    // Use the current end date of the subscription as the base
    const currentEndDate = new Date(selectedSubscription.endDate);
    const duration = parseInt(holdDuration);
    
    switch (holdDurationUnit) {
      case 'days':
        return new Date(currentEndDate.getTime() + (duration * 24 * 60 * 60 * 1000));
      case 'weeks':
        return new Date(currentEndDate.getTime() + (duration * 7 * 24 * 60 * 60 * 1000));
      case 'months':
        return new Date(currentEndDate.getTime() + (duration * 30 * 24 * 60 * 60 * 1000));
      default:
        return currentEndDate;
    }
  };

  const handleCancelSubscription = () => {
    if (!client) return;
    
    // Get the latest subscription
    const latestSubscription = client.subscriptions && client.subscriptions.length > 0 
      ? client.subscriptions[0] 
      : null;
    
    if (latestSubscription) {
      setSelectedSubscription(latestSubscription);
      // Set default cancel date to today
      setCancelDate(new Date().toISOString().split('T')[0]);
      // Reset refund fields
      setRefundType('none');
      setRefundAmount('');
      setShowCancelModal(true);
      setDropdownOpen(false);
    }
  };

  const handleRefundTypeChange = (type: string) => {
    setRefundType(type);
    
    if (type === 'full' && selectedSubscription) {
      // Auto-calculate full refund amount
      console.log('=== handleRefundTypeChange DEBUG ===');
      console.log('Selected subscription:', selectedSubscription);
      const calculatedAmount = calculateRefundAmount(selectedSubscription);
      console.log('Calculated refund amount:', calculatedAmount);
      setRefundAmount(calculatedAmount.toString());
    } else if (type === 'partial') {
      // Clear amount for partial refund (user will enter manually)
      setRefundAmount('');
    } else {
      // Clear amount for no refund
      setRefundAmount('');
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedSubscription || !cancelDate || !cancelReason) return;
    
    try {
      const response = await fetch(`/api/subscriptions/${selectedSubscription.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cancelDate,
          cancelReason,
          refundType,
          refundAmount: refundAmount ? parseFloat(refundAmount) : null
        }),
      });
      
      if (response.ok) {
        // Refresh client data to show updated subscription
        loadClientDetails();
        setShowCancelModal(false);
        setCancelDate('');
        setCancelReason('');
        setRefundType('none');
        setRefundAmount('');
        setSelectedSubscription(null);
        
        // Show success toast
        showToast('Subscription canceled successfully!');
      } else {
        console.error('Failed to cancel subscription');
        showToast('Failed to cancel subscription. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      showToast('Error canceling subscription. Please try again.', 'error');
    }
  };

  const handleAddRenew = () => {
    // Get the latest subscription to pre-populate data
    const latestSubscription = client?.subscriptions?.[0];
    if (latestSubscription) {
      // Calculate default end date based on today's date and duration
      const today = new Date();
      const durationValue = latestSubscription.durationValue || 1;
      const durationUnit = latestSubscription.durationUnit || 'month';
      const startDateStr = today.toISOString().split('T')[0];
      
      const endDateObj = new Date(today);
      if (durationUnit === 'month') {
        endDateObj.setMonth(endDateObj.getMonth() + durationValue);
      } else if (durationUnit === 'week') {
        endDateObj.setDate(endDateObj.getDate() + (durationValue * 7));
      } else if (durationUnit === 'day') {
        endDateObj.setDate(endDateObj.getDate() + durationValue);
      }
      const endDateStr = endDateObj.toISOString().split('T')[0];
      
      // Pre-populate with current subscription data as defaults
      setRenewalData({
        startDate: startDateStr, // Today's date
        durationValue: latestSubscription.durationValue?.toString() || '1',
        durationUnit: latestSubscription.durationUnit || 'month',
        endDate: endDateStr, // Automatically calculated
        paymentStatus: latestSubscription.paymentStatus || 'paid',
        paymentMethod: latestSubscription.paymentMethod || 'instapay',
        priceBeforeDisc: latestSubscription.priceBeforeDisc?.toString() || '',
        discount: latestSubscription.discountApplied ? 'yes' : 'no',
        discountValue: latestSubscription.discountValue?.toString() || '',
        discountType: latestSubscription.discountType || 'fixed',
        packageId: (latestSubscription as any).packageId?.toString() || '',
        installments: []
      });
      
      // Set UI states based on payment status
      setShowPaymentMethod(['paid', 'installments'].includes(latestSubscription.paymentStatus || 'paid'));
      setShowDiscountFields(['paid', 'installments'].includes(latestSubscription.paymentStatus || 'paid'));
      setShowTransactionImage(latestSubscription.paymentStatus === 'paid');
      setShowDiscountValue(latestSubscription.discountApplied || false);
    }
    
    // Load packages
    loadPackages();
    setShowRenewModal(true);
    setDropdownOpen(false);
  };

  const loadPackages = async () => {
    try {
      // Get trainerId from the client data
      const trainerId = client?.trainerId;
      if (!trainerId) {
        console.error('No trainer ID found');
        return;
      }
      
      const response = await fetch(`/api/packages?trainerId=${trainerId}`);
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      }
    } catch (error) {
      console.error('Error loading packages:', error);
    }
  };

  const handleRenewalDataChange = (key: string, value: any) => {
    setRenewalData((prev: any) => {
      const updated = { ...prev, [key]: value };
      
      // Calculate end date whenever startDate, durationValue, or durationUnit changes
      if (updated.startDate && updated.durationValue && updated.durationUnit) {
        const startDate = new Date(updated.startDate);
        const durationValue = parseInt(updated.durationValue);
        const durationUnit = updated.durationUnit;
        
        const endDateObj = new Date(startDate);
        if (durationUnit === 'month') {
          endDateObj.setMonth(endDateObj.getMonth() + durationValue);
        } else if (durationUnit === 'week') {
          endDateObj.setDate(endDateObj.getDate() + (durationValue * 7));
        } else if (durationUnit === 'day') {
          endDateObj.setDate(endDateObj.getDate() + durationValue);
        }
        updated.endDate = endDateObj.toISOString().split('T')[0];
      }
      
      return updated;
    });
    
    // Handle package selection
    if (key === 'packageId' && value) {
      const selectedPackage = packages.find((pkg: any) => pkg.id === Number(value));
      if (selectedPackage) {
        setRenewalData((prev: any) => ({
          ...prev,
          durationValue: selectedPackage.durationValue?.toString() || '',
          durationUnit: selectedPackage.durationUnit || 'month',
          priceBeforeDisc: selectedPackage.priceBeforeDisc?.toString() || '',
          discount: selectedPackage.discountApplied ? 'yes' : 'no',
          discountType: selectedPackage.discountType || 'fixed',
          discountValue: selectedPackage.discountValue?.toString() || '',
          priceAfterDisc: selectedPackage.priceAfterDisc?.toString() || '',
        }));
        
        // Set discount type in local state
        setDiscountType(selectedPackage.discountType || 'fixed');
        
        // Show all renewal fields after package selection
        setPackageSelected(true);
        setShowRenewalFields(true);
        setShowPaymentMethod(['paid', 'installments'].includes(selectedPackage.paymentStatus || ''));
        setShowDiscountFields(selectedPackage.discountApplied || false);
        setShowTransactionImage(selectedPackage.paymentStatus === 'paid');
        setShowDiscountValue(selectedPackage.discountApplied || false);
      }
    }
    
    // Handle special cases
    if (key === 'paymentStatus') {
      setShowPaymentMethod(['paid', 'installments'].includes(value));
      setShowDiscountFields(['paid', 'installments'].includes(value));
      setShowTransactionImage(value === 'paid');
    }
    
    if (key === 'discount') {
      setShowDiscountValue(value === 'yes');
    }
  };

  const handleInstallmentChange = (idx: number, key: string, value: any) => {
    setInstallments(prev => prev.map((inst, i) => i === idx ? { ...inst, [key]: value } : inst));
  };

  const handleInstallmentImage = (idx: number, file: File | null) => {
    setInstallments(prev => prev.map((inst, i) => i === idx ? { ...inst, image: file } : inst));
  };

  const addInstallment = () => {
    setInstallments(prev => [...prev, { date: '', amount: '', image: null, nextDate: '' }]);
  };

  const removeInstallment = (idx: number) => {
    setInstallments(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  };

  const handleRenewalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRenewalLoading(true);
    
    try {
      // Calculate end date based on start date and duration
      const startDate = new Date(renewalData.startDate);
      let endDate = new Date(startDate);
      
      switch (renewalData.durationUnit) {
        case 'days':
          endDate.setDate(endDate.getDate() + parseInt(renewalData.durationValue));
          break;
        case 'weeks':
          endDate.setDate(endDate.getDate() + (parseInt(renewalData.durationValue) * 7));
          break;
        case 'months':
          endDate.setMonth(endDate.getMonth() + parseInt(renewalData.durationValue));
          break;
        default:
          endDate.setMonth(endDate.getMonth() + parseInt(renewalData.durationValue));
      }
      
      // Get the latest subscription to renew
      const latestSubscription = client?.subscriptions?.[0]; // Assuming subscriptions are ordered by creation date

      // Transform installments into backend shape when paymentStatus is 'installments'
      const installmentsPayload = renewalData.paymentStatus === 'installments'
        ? installments
            .filter((inst: any) => inst && String(inst.amount || '').trim() !== '')
            .map((inst: any) => ({
              paidDate: inst.date || undefined,
              amount: Number(inst.amount),
              nextInstallment: inst.nextDate || undefined,
              paymentMethod: undefined,
            }))
        : undefined

      const subscriptionData = {
        ...renewalData,
        endDate: endDate.toISOString().split('T')[0],
        clientId: clientId,
        discountApplied: renewalData.discount === 'yes',
        priceAfterDisc: renewalData.discount === 'yes' ? 
          (renewalData.discountType === 'fixed' ? 
            parseFloat(renewalData.priceBeforeDisc) - parseFloat(renewalData.discountValue) :
            parseFloat(renewalData.priceBeforeDisc) - (parseFloat(renewalData.priceBeforeDisc) * parseFloat(renewalData.discountValue) / 100)
          ) : null,
        isRenewal: true,
        originalSubscriptionId: latestSubscription?.id,
        // Include installments when applicable
        ...(installmentsPayload ? { installments: installmentsPayload } : {}),
      };
      
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });
      
      if (response.ok) {
        showToast('Subscription renewed successfully!', 'success');
        setShowRenewModal(false);
        // Reload client data to show the new subscription
        loadClientDetails();
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Failed to renew subscription', 'error');
      }
    } catch (error) {
      console.error('Error renewing subscription:', error);
      showToast('Failed to renew subscription', 'error');
    } finally {
      setRenewalLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen) {
        // Check if the click is outside the dropdown
        const target = event.target as Element;
        const dropdownElement = document.querySelector('[data-dropdown="subscription-actions"]');
        
        if (dropdownElement && !dropdownElement.contains(target)) {
        setDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  if (loading) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <XCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Client Not Found</h2>
            <p className="text-gray-600 mb-6">The client you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/clients')}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon, count: null },
    { id: 'profile', name: 'Profile', icon: UserIcon, count: null },
    { id: 'subscriptions', name: 'Subscriptions', icon: CreditCardIcon, count: null },
    { id: 'workout-programs', name: 'Workout', icon: FireIcon, count: null },
    { id: 'nutrition-programs', name: 'Nutrition', icon: HeartIcon, count: null },
    { id: 'checkins', name: 'Check-ins', icon: ClipboardDocumentListIcon, count: client.submissions?.length || 0 },
    { id: 'services', name: 'Services', icon: CurrencyDollarIcon, count: null },
    { id: 'notes', name: 'Notes', icon: ChatBubbleLeftRightIcon, count: client.notes?.length || 0 },
  ];

  return (
    <>
      {/* Client Details Sub-Sidebar - Fixed position next to main sidebar */}
      <div className="fixed inset-y-0 left-64 w-48 bg-white border-r border-gray-200 overflow-y-auto z-20">
        <div className="p-4">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full py-3 px-4 rounded-lg font-medium text-sm flex items-center transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                <span className="flex-1 text-left">{tab.name}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-[185px] overflow-auto px-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button outline onClick={() => router.push('/clients')} className="flex items-center">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {getDisplayName(client)} <span className="text-sm font-normal text-gray-600">#{client.id}</span>
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{client.email}</span>
                  <span>•</span>
                  <span>{client.phone}</span>
                </div>
                {client.labels && client.labels.length > 0 && (
                  <div className="flex items-center space-x-2 mt-2">
                    {client.labels.map((label) => (
                      <span
                        key={label.id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getSubscriptionStatus().color}`}>
                {getSubscriptionStatus().status}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Subscription Actions Dropdown */}
            <div className="relative" data-dropdown="subscription-actions">
              <Button 
                outline 
                className="flex items-center"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <CreditCardIcon className="h-4 w-4 mr-2" />
                Subscription Actions
                <svg 
                  className={`w-4 h-4 ml-2 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-1">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleHoldSubscription();
                      }}
                      disabled={isSubscriptionActionDisabled()}
                      className={`flex items-center w-full px-4 py-2 text-sm transition-colors duration-150 ${
                        isSubscriptionActionDisabled() 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <ClockIcon className="h-4 w-4 mr-3" />
                      Hold Subscription
                    </button>
                    <button
                      onClick={handleCancelSubscription}
                      disabled={isSubscriptionActionDisabled()}
                      className={`flex items-center w-full px-4 py-2 text-sm transition-colors duration-150 ${
                        isSubscriptionActionDisabled() 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <XCircleIcon className="h-4 w-4 mr-3" />
                      Cancel Subscription
                    </button>
                    <button
                      onClick={handleAddRenew}
                      className="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors duration-150"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-3" />
                      Add Renew
                    </button>
                  </div>
                </div>
              )}
            </div>
            <Button onClick={() => router.push(`/clients/edit/${client.id}`)}>
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Client
            </Button>
          </div>
        </div>

        {/* Profile Completion Badge */}
        <div className="mb-6">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getProfileCompletionColor(client.profileCompletion)}`}>
            {client.profileCompletion === 'Completed' ? (
              <ShieldCheckIcon className="h-4 w-4 mr-1" />
            ) : (
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            )}
            {client.profileCompletion}
          </span>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && <OverviewTab client={client} onHoldSubscription={handleHoldSubscription} onCancelSubscription={handleCancelSubscription} onAddRenew={handleAddRenew} getDisplayName={getDisplayName} />}
          {activeTab === 'profile' && <ProfileTab key={`profile-${client.id}-${clientDataVersion}`} client={client} editing={editing} onSave={handleSaveProfile} saving={saving} />}
          {activeTab === 'subscriptions' && <SubscriptionsTab client={client} getPaymentStatusColor={getPaymentStatusColor} />}
          {activeTab === 'workout-programs' && <WorkoutProgramsTab client={client} />}
          {activeTab === 'nutrition-programs' && <NutritionProgramsTab client={client} />}
          {activeTab === 'checkins' && <CheckinsTab client={client} />}
          {activeTab === 'services' && <ServicesTab client={client} />}
          {activeTab === 'notes' && <NotesTab client={client} onNotesChange={() => setClientDataVersion(prev => prev + 1)} />}
        </div>
      </div>

      {/* Hold Subscription Modal */}
      <Dialog open={showHoldModal} onClose={() => setShowHoldModal(false)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Hold Subscription</h2>
              <p className="text-gray-600 mt-1">
                Extend the subscription end date by putting it on hold
              </p>
            </div>
            <button
              onClick={() => setShowHoldModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {selectedSubscription && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current End Date
                </label>
                <p className="text-gray-900 font-medium text-lg">
                  {new Date(selectedSubscription.endDate).toLocaleDateString()}
                </p>
              </div>
              

              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hold Duration
                  </label>
                  <input
                    type="number"
                    value={holdDuration}
                    onChange={(e) => setHoldDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter duration"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <select
                    value={holdDurationUnit}
                    onChange={(e) => setHoldDurationUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
              
              {holdDuration && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    New End Date
                  </label>
                  <p className="text-green-800 font-semibold text-lg">
                    {calculateNewEndDate()?.toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end gap-3 mt-8">
            <Button outline onClick={() => setShowHoldModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmHold}
              disabled={!holdDuration}
            >
              Hold Subscription
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Cancel Subscription Modal */}
      <Dialog open={showCancelModal} onClose={() => setShowCancelModal(false)}>
        <div className="p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cancel Subscription</h2>
              <p className="text-gray-600 text-sm">
                Are you sure you want to cancel this subscription?
              </p>
            </div>
            <button
              onClick={() => setShowCancelModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {selectedSubscription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current End Date
                  </label>
                  <p className="text-gray-900 font-medium">
                    {new Date(selectedSubscription.endDate).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cancel Date
                  </label>
                  <input
                    type="date"
                    value={cancelDate}
                    onChange={(e) => setCancelDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cancel Reason
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Select a reason</option>
                  <option value="Client request">Client request</option>
                  <option value="Payment issues">Payment issues</option>
                  <option value="Service not needed">Service not needed</option>
                  <option value="Dissatisfied with service">Dissatisfied with service</option>
                  <option value="Moving/relocation">Moving/relocation</option>
                  <option value="Health issues">Health issues</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Options
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="refundType"
                      value="none"
                      checked={refundType === 'none'}
                      onChange={(e) => handleRefundTypeChange(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">No refund</span>
                  </label>
                  <label className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="refundType"
                      value="partial"
                      checked={refundType === 'partial'}
                      onChange={(e) => handleRefundTypeChange(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Partial refund</span>
                  </label>
                  <label className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="refundType"
                      value="full"
                      checked={refundType === 'full'}
                      onChange={(e) => handleRefundTypeChange(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Full refund</span>
                  </label>
                </div>
              </div>
              
              {(refundType === 'partial' || refundType === 'full') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Refund Amount
                  </label>
                  {refundType === 'full' ? (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700 font-medium">Auto-calculated refund</span>
                        <span className="text-green-800 font-semibold text-lg">
                          EGP {parseFloat(refundAmount || '0').toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                              placeholder="Enter refund amount in EGP"
                      min="0"
                      step="0.01"
                    />
                  )}
                </div>
              )}
              
              {cancelDate && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <label className="block text-sm font-medium text-red-700 mb-1">
                    Subscription will be canceled on
                  </label>
                  <p className="text-red-800 font-semibold">
                    {new Date(cancelDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end gap-3 mt-6">
            <Button outline onClick={() => setShowCancelModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmCancel}
              disabled={!cancelDate || !cancelReason}
              color="red"
            >
              Cancel Subscription
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Renew Subscription Modal */}
      <Dialog open={showRenewModal} onClose={() => setShowRenewModal(false)} size="5xl" className="!max-w-6xl !w-[90vw]">
        <div className="p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Renew Subscription</h2>
              <p className="text-gray-600 text-sm">
                Create a new subscription for this client
              </p>
            </div>
            <button
              onClick={() => setShowRenewModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleRenewalSubmit} className="space-y-6">
            {/* Subscription Details Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Subscription Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Subscription Start Date</label>
                  <Input 
                    type="date" 
                    value={renewalData.startDate} 
                    onChange={e => handleRenewalDataChange('startDate', e.target.value)} 
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Package</label>
                  <Select
                    value={renewalData.packageId}
                    onChange={e => handleRenewalDataChange('packageId', e.target.value)}
                    required
                  >
                    <option value="">Select package...</option>
                    {packages.map((pkg: any) => (
                      <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                    ))}
                  </Select>
                </div>
                
                    <div className="flex flex-col">
                      <label className="text-sm font-medium mb-1">Subscription Duration</label>
                      <div className="flex gap-2">
                        <Input 
                          type="number" 
                          min="1" 
                          value={renewalData.durationValue} 
                          onChange={e => handleRenewalDataChange('durationValue', e.target.value)} 
                          className="w-1/2" 
                          required
                        />
                        <Select 
                          value={renewalData.durationUnit} 
                          onChange={e => handleRenewalDataChange('durationUnit', e.target.value)} 
                          className="w-1/2"
                        >
                          <option value="month">Month(s)</option>
                          <option value="week">Week(s)</option>
                          <option value="day">Day(s)</option>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium mb-1">Subscription End Date (Auto)</label>
                      <Input 
                        type="date" 
                        value={renewalData.endDate} 
                        readOnly 
                        disabled 
                        className="bg-zinc-100" 
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium mb-1">Payment Status</label>
                      <Select
                        value={renewalData.paymentStatus}
                        onChange={e => handleRenewalDataChange('paymentStatus', e.target.value)}
                        required
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
                        <Select 
                          value={renewalData.paymentMethod} 
                          onChange={e => handleRenewalDataChange('paymentMethod', e.target.value)}
                          required
                        >
                          <option value="">Select...</option>
                          <option value="instapay">Instapay</option>
                          <option value="vodafone_cash">Vodafone Cash</option>
                          <option value="fawry">Fawry</option>
                          <option value="bank_transfer">Bank Transfer</option>
                        </Select>
                      </div>
                    )}
                    {['paid', 'installments'].includes(renewalData.paymentStatus) && (
                      <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">Price Before Discount (EGP)</label>
                        <Input
                          type="number"
                          value={renewalData.priceBeforeDisc}
                          onChange={e => handleRenewalDataChange('priceBeforeDisc', e.target.value)}
                          required
                        />
                      </div>
                    )}
                    {showDiscountFields && (
                      <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">Discount</label>
                        <Select
                          value={renewalData.discount}
                          onChange={e => handleRenewalDataChange('discount', e.target.value)}
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
                              value={renewalData.discountValue}
                              onChange={e => handleRenewalDataChange('discountValue', e.target.value)}
                              className="w-1/2"
                              required
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
                              const before = Number(renewalData.priceBeforeDisc) || 0;
                              const discount = Number(renewalData.discountValue) || 0;
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
                          onChange={async (e) => {
                            const file = e.target.files?.[0] || null;
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

            {/* Installments Management section */}
            {renewalData.paymentStatus === 'installments' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Installments Management</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Installment Date</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Amount</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Transaction Image</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Next Installment Date</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installments.map((inst, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-2 px-3">
                            <Input 
                              type="date" 
                              value={inst.date} 
                              onChange={e => handleInstallmentChange(idx, 'date', e.target.value)} 
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input 
                              type="number" 
                              value={inst.amount} 
                              onChange={e => handleInstallmentChange(idx, 'amount', e.target.value)} 
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={e => handleInstallmentImage(idx, e.target.files?.[0] || null)} 
                              className="block w-full border border-zinc-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" 
                            />
                            {inst.image && (
                              <div className="mt-1 text-xs text-zinc-600">{inst.image.name}</div>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <Input 
                              type="date" 
                              value={inst.nextDate} 
                              onChange={e => handleInstallmentChange(idx, 'nextDate', e.target.value)} 
                            />
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex gap-2 items-center">
                              <button 
                                type="button" 
                                onClick={() => removeInstallment(idx)} 
                                disabled={installments.length === 1} 
                                className="text-red-500 disabled:opacity-50"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                              <button 
                                type="button" 
                                onClick={addInstallment} 
                                className="text-green-600"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button outline onClick={() => setShowRenewModal(false)}>
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={renewalLoading}
              >
                {renewalLoading ? 'Creating...' : 'Create Subscription'}
              </Button>
            </div>
          </form>
        </div>
      </Dialog>

      {/* Toast Notification */}
      <Toast 
        open={toast.open} 
        message={toast.message} 
        type={toast.type}
        onClose={() => setToast({ open: false, message: '', type: 'success' })}
      />
    </>
  );
}

// Overview Tab Component
function OverviewTab({ client, onHoldSubscription, onCancelSubscription, onAddRenew, getDisplayName }: { 
  client: Client; 
  onHoldSubscription: () => void;
  onCancelSubscription: () => void;
  onAddRenew: () => void;
  getDisplayName: (client: Client) => string;
}) {
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [serviceAssignments, setServiceAssignments] = useState<any[]>([]);
  const [servicesPaidTotal, setServicesPaidTotal] = useState(0);

  // Fetch the selected form data
  useEffect(() => {
    const fetchFormData = async () => {
      if (client.selectedFormId) {
        try {
          const response = await fetch(`/api/checkins/${client.selectedFormId}`);
          if (response.ok) {
            const form = await response.json();
            setSelectedForm(form);
          }
        } catch (error) {
          console.error('Error fetching form data:', error);
        }
      }
    };

    fetchFormData();
  }, [client.selectedFormId]);

  // Load service assignments to include in Financial card
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const user = getStoredUser();
        if (!user?.id) return;
        const res = await fetch(`/api/services/assignments?trainerId=${user.id}&clientId=${client.id}`);
        const data = await res.json().catch(() => ([]));
        const list = Array.isArray(data) ? data.filter((a: any) => a.isActive !== false) : [];
        setServiceAssignments(list);
        const paid = list
          .filter((a: any) => (a.paymentStatus || '').toLowerCase() === 'paid')
          .reduce((sum: number, a: any) => sum + (Number(a.priceEGP) || 0), 0);
        setServicesPaidTotal(paid);
      } catch (e) {
        setServiceAssignments([]);
        setServicesPaidTotal(0);
      }
    };
    loadAssignments();
  }, [client.id]);

  const calculateTotalPayments = () => {
    if (!client.subscriptions || client.subscriptions.length === 0) {
      return 0;
    }

    console.log('=== calculateTotalPayments DEBUG ===');
    console.log('Client subscriptions:', client.subscriptions);

    return client.subscriptions.reduce((total, subscription) => {
      let subscriptionAmount = 0;

      // Normalize payment status to uppercase for comparison
      const paymentStatus = subscription.paymentStatus?.toUpperCase();
      
      console.log('Processing subscription:', subscription.id, 'with status:', paymentStatus);
      console.log('Renewal history:', subscription.renewalHistory);
      


      if (paymentStatus === 'PAID') {
        // If paid and has discount, calculate price after discount, otherwise use price before discount
        
        if (subscription.discountApplied && subscription.priceBeforeDisc && subscription.discountValue && subscription.discountType) {
          const priceBefore = subscription.priceBeforeDisc;
          const discountValue = subscription.discountValue;
          const discountType = subscription.discountType;
          
          console.log('Discount calculation:', {
            priceBefore,
            discountValue,
            discountType,
            discountApplied: subscription.discountApplied
          });
          
          if (discountType === 'percentage') {
            subscriptionAmount = priceBefore - (priceBefore * discountValue / 100);
            console.log('Percentage discount calculation:', priceBefore, '-', (priceBefore * discountValue / 100), '=', subscriptionAmount);
          } else if (discountType === 'fixed') {
            subscriptionAmount = priceBefore - discountValue;
            console.log('Fixed discount calculation:', priceBefore, '-', discountValue, '=', subscriptionAmount);
          } else {
            subscriptionAmount = priceBefore;
            console.log('No discount type, using original price:', priceBefore);
          }
          
          // Ensure price doesn't go below 0
          if (subscriptionAmount < 0) subscriptionAmount = 0;
          console.log('Final amount after discount:', subscriptionAmount);
        } else {
          subscriptionAmount = subscription.priceBeforeDisc || 0;
          console.log('No discount applied, using original price:', subscriptionAmount);
        }
      } else if (paymentStatus === 'FREE') {
        // For free subscriptions, show 0 amount
        subscriptionAmount = 0;
      } else if (paymentStatus === 'INSTALLMENTS') {
        // If installments, sum all installment amounts
        if (subscription.installments && subscription.installments.length > 0) {
          subscriptionAmount = subscription.installments.reduce((sum, installment) => {
            return sum + (installment.amount || 0);
          }, 0);
        } else {
          // If no installments found but payment status is installments, 
          // fall back to discount calculation or original price
          if (subscription.discountApplied && subscription.priceBeforeDisc && subscription.discountValue) {
            const priceBefore = subscription.priceBeforeDisc;
            const discountValue = subscription.discountValue;
            const discountType = subscription.discountType || 'percentage';
            
            if (discountType === 'percentage') {
              subscriptionAmount = priceBefore - (priceBefore * discountValue / 100);
            } else if (discountType === 'fixed') {
              subscriptionAmount = priceBefore - discountValue;
            } else {
              subscriptionAmount = priceBefore;
            }
            
            if (subscriptionAmount < 0) subscriptionAmount = 0;
          } else {
            subscriptionAmount = subscription.priceBeforeDisc || 0;
          }
        }
      } else if (paymentStatus === 'FREE') {
        // For free subscriptions, amount is always 0
        subscriptionAmount = 0;
      } else {
        // For other statuses, use price after discount as fallback
        subscriptionAmount = subscription.priceAfterDisc || 0;
      }

      // Add renewal amounts (check each renewal's payment status individually)
      if (subscription.renewalHistory && Array.isArray(subscription.renewalHistory)) {
        subscription.renewalHistory.forEach((renewal: any) => {
          // Only include renewals that are paid (not free)
          if (renewal.paymentStatus?.toUpperCase() === 'PAID') {
            let renewalAmount = 0;
            if (renewal.priceAfterDisc !== null && renewal.priceAfterDisc !== undefined) {
              renewalAmount = renewal.priceAfterDisc;
            } else if (renewal.discountApplied && renewal.priceBeforeDisc && renewal.discountValue && renewal.discountType) {
              if (renewal.discountType === 'percentage') {
                renewalAmount = renewal.priceBeforeDisc - (renewal.priceBeforeDisc * renewal.discountValue / 100);
              } else {
                renewalAmount = renewal.priceBeforeDisc - renewal.discountValue;
              }
            } else {
              renewalAmount = renewal.priceBeforeDisc || 0;
            }
            console.log('Adding renewal amount:', renewalAmount, 'for renewal with status:', renewal.paymentStatus);
            subscriptionAmount += renewalAmount;
          }
        });
      }

      // Subtract refund amount if subscription was canceled and refund was given
      if (subscription.isCanceled && subscription.refundAmount && subscription.refundAmount > 0) {
        console.log('Subtracting refund amount:', subscription.refundAmount);
        subscriptionAmount -= subscription.refundAmount;
        // Ensure total doesn't go below 0
        if (subscriptionAmount < 0) subscriptionAmount = 0;
        console.log('Amount after refund deduction:', subscriptionAmount);
      }

      return total + subscriptionAmount;
    }, 0);
  };

  const getActiveSubscription = () => {
    if (!client.subscriptions || client.subscriptions.length === 0) {
      return null;
    }

    console.log('=== getActiveSubscription DEBUG ===');
    console.log('All subscriptions:', client.subscriptions);

    // Sort subscriptions by end date (latest first) and filter out canceled ones
    const sortedSubscriptions = client.subscriptions
      .filter(sub => !sub.isCanceled)
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

    console.log('Sorted non-canceled subscriptions:', sortedSubscriptions);

    // If no non-canceled subscriptions, get the latest one (even if canceled)
    if (sortedSubscriptions.length === 0) {
      const allSorted = client.subscriptions.sort((a, b) => 
        new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
      );
      console.log('No non-canceled subscriptions, using latest (even if canceled):', allSorted[0]);
      return allSorted[0];
    }

    const activeSub = sortedSubscriptions[0];
    console.log('Selected active subscription:', activeSub);
    console.log('Is it the same as first subscription?', activeSub?.id === client.subscriptions[0]?.id);
    return activeSub;
  };

  const getEffectiveEndDate = (subscription: any) => {
    if (!subscription) return null;
    
    // If subscription is canceled, use the canceledAt date as the effective end date
    // Otherwise, use the endDate (which already accounts for hold duration)
    let effectiveEndDate;
    
    if (subscription.isCanceled && subscription.canceledAt) {
      // Check if there's renewal history - if yes, use the current endDate (renewed subscription)
      if (subscription.renewalHistory && Array.isArray(subscription.renewalHistory) && subscription.renewalHistory.length > 0) {
        effectiveEndDate = new Date(subscription.endDate);
        console.log('=== Canceled but Renewed Subscription ===');
        console.log('Using endDate (renewed):', subscription.endDate);
      } else {
        effectiveEndDate = new Date(subscription.canceledAt);
        console.log('=== Subscription Canceled ===');
        console.log('Using canceledAt date:', subscription.canceledAt);
      }
    } else {
      effectiveEndDate = new Date(subscription.endDate);
      console.log('=== Active Subscription ===');
      console.log('Using endDate:', subscription.endDate);
    }
    
    console.log('Is on hold:', subscription.isOnHold);
    console.log('Is canceled:', subscription.isCanceled);
    console.log('Renewal history:', subscription.renewalHistory);
    console.log('Effective end date:', effectiveEndDate.toISOString());
    
    return effectiveEndDate;
  };

  const getActiveSubscriptionsCount = () => {
    if (!client.subscriptions || client.subscriptions.length === 0) {
      return 0;
    }

    return client.subscriptions.filter(subscription => {
      // Normalize payment status to uppercase for comparison
      const paymentStatus = subscription.paymentStatus?.toUpperCase();
      

      
      // Check if subscription is active based on end date
      if ((paymentStatus === 'PAID' || paymentStatus === 'FREE' || paymentStatus === 'INSTALLMENTS') && subscription.endDate) {
        const endDate = new Date(subscription.endDate);
        const currentDate = new Date();
        const isActive = currentDate < endDate;
        

        
        return isActive;
      }
      return false;
    }).length;
  };

  const totalPayments = calculateTotalPayments() + servicesPaidTotal;
  const activeSubscriptions = getActiveSubscriptionsCount();
  const daysSinceRegistration = Math.floor((Date.now() - new Date(client.registrationDate).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div>
      <h3 className="text-lg font-semibold mb-6">Client Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Contact Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-start">
            <div className="p-2 bg-green-500 rounded-lg flex-shrink-0">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-green-900 mb-1">Contact</p>
              <p className="text-lg font-semibold text-green-700 break-words">
                {getDisplayName(client)}
              </p>
              <p className="text-sm text-green-600">{client.gender}, {client.age} years</p>
            </div>
          </div>
        </div>

        {/* Financial Card */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-500 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-purple-900">Financial</p>
              <p className="text-lg font-semibold text-purple-700">EGP {totalPayments.toFixed(2)}</p>
              <p className="text-sm text-purple-600">{activeSubscriptions} active subscription{activeSubscriptions !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Subscription Start Card */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-500 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-orange-900">Subscription Start</p>
              <p className="text-lg font-semibold text-orange-700">
                {(() => {
                  const activeSub = getActiveSubscription();
                  const displayDate = activeSub 
                    ? new Date(activeSub.startDate).toLocaleDateString()
                    : 'No subscription';
                  
                  console.log('=== Subscription Start Card DEBUG ===');
                  console.log('Active subscription:', activeSub);
                  console.log('All subscriptions:', client.subscriptions);
                  console.log('Selected start date:', activeSub?.startDate);
                  console.log('Display date:', displayDate);
                  
                  return displayDate;
                })()}
              </p>
            </div>
          </div>
        </div>

        {/* Remaining Days Card */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-500 rounded-lg">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-red-900">Remaining Days</p>
              <p className="text-lg font-semibold text-red-700">
                {(() => {
                  const activeSub = getActiveSubscription();
                  if (!activeSub) return 'No active subscription';
                  
                  const effectiveEndDate = getEffectiveEndDate(activeSub);
                  const currentDate = new Date();
                  const remainingDays = Math.floor((effectiveEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
                  
                  console.log('=== Remaining Days Calculation ===');
                  console.log('Active subscription:', activeSub);
                  console.log('Original end date:', activeSub.endDate);
                  console.log('Effective end date:', effectiveEndDate.toISOString());
                  console.log('Current date:', currentDate.toISOString());
                  console.log('Remaining days:', remainingDays);
                  
                  return remainingDays > 0 ? `${remainingDays} days` : 'Subscription ended';
                })()}
              </p>
              <p className="text-sm text-red-600">
                {(() => {
                  const activeSub = getActiveSubscription();
                  if (!activeSub || !activeSub.endDate) return 'no active plan';
                  
                  const effectiveEndDate = getEffectiveEndDate(activeSub);
                  const currentDate = new Date();
                  const remainingDays = Math.floor((effectiveEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
                  return remainingDays > 0 ? 'until expiration' : 'subscription ended';
                })()}
              </p>
            </div>
          </div>
        </div>

        {/* Assigned To Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-blue-900">Assigned To</p>
              <p className="text-lg font-semibold text-blue-700">
                {(() => {
                  if (!client.teamAssignments || client.teamAssignments.length === 0) {
                    return 'Not assigned';
                  }
                  
                  const assignedMembers = client.teamAssignments.map(assignment => 
                    `${assignment.teamMember.fullName} (${assignment.teamMember.role})`
                  );
                  
                  return assignedMembers.join(', ');
                })()}
              </p>
              <p className="text-sm text-blue-600">
                {client.teamAssignments && client.teamAssignments.length > 0 
                  ? `${client.teamAssignments.length} team member${client.teamAssignments.length !== 1 ? 's' : ''}`
                  : 'No team members assigned'
                }
              </p>
            </div>
          </div>
        </div>
      </div>




    </div>
  );
}

// Profile Tab Component
function ProfileTab({ client, editing, onSave, saving }: { 
  client: Client; 
  editing: boolean; 
  onSave: () => void;
  saving: boolean;
}) {
  const [loading, setLoading] = useState(false);

  // Get all unique form submissions to show data from all forms
  const getAllFormData = () => {
    if (!client.submissions || client.submissions.length === 0) {
      return [];
    }

    // Group submissions by form to avoid duplicates
    const formGroups = new Map();
    
    client.submissions.forEach(submission => {
      if (submission.form && submission.answers) {
        const formId = submission.form.id;
        if (!formGroups.has(formId)) {
          formGroups.set(formId, {
            form: submission.form,
            submission: submission,
            answers: submission.answers
          });
        }
      }
    });

    return Array.from(formGroups.values());
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Client Form Responses</h3>
        {editing && (
          <div className="flex items-center space-x-3">
            <Button outline disabled={saving}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>
      
      <div className="space-y-6">
        {/* Loading State */}
        {loading && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading form data...</p>
            </div>
          </div>
        )}

        {/* Combined Client Information */}
        {!loading && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-blue-500" />
              Client Information
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Core client fields - these come from the client object directly */}
              {[
                { label: 'Full Name', value: client.fullName || '', key: 'fullName' },
                { label: 'Mobile Number', value: client.phone || '', key: 'phone' },
                { label: 'Email', value: client.email || '', key: 'email' },
                { label: 'Gender', value: client.gender || '', key: 'gender' },
                { label: 'Registration Date', value: client.registrationDate ? new Date(client.registrationDate).toLocaleDateString() : '', key: 'registrationDate' },
              ].map((field) => {
                const hasValue = field.value && field.value !== '' && field.value !== null && field.value !== 'undefined';
                
                return (
                  <div key={field.key} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className={`w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${hasValue ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">{field.label}</p>
                        <p className={`${hasValue ? 'text-gray-600' : 'text-red-500 italic'}`}>
                          {hasValue ? field.value : 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Form Responses from All Forms */}
        {!loading && getAllFormData().map((formData, formIndex) => (
          <div key={formData.form.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-500" />
              {formData.form.name} Responses
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {formData.form.questions?.map((question: any) => {
                // Skip core questions that are already displayed above
                const coreQuestionLabels = ['Full Name', 'Email', 'Mobile Number', 'Gender'];
                if (coreQuestionLabels.includes(question.label)) {
                  return null; // Skip this question as it's already shown in core fields
                }
                
                const answer = formData.answers?.[String(question.id)];
                const hasAnswer = answer && answer !== 'Not specified' && answer !== '' && answer !== 'undefined';
                
                return (
                  <div key={question.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className={`w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${hasAnswer ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">{question.label}</p>
                        <p className={`${hasAnswer ? 'text-gray-600' : 'text-red-500 italic'}`}>
                          {hasAnswer ? (Array.isArray(answer) ? answer.join(', ') : answer) : 'Answer not provided'}
                        </p>
                        {!hasAnswer && (
                          <p className="text-xs text-gray-500 mt-1">
                            This answer was not provided in {formData.form.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* No Form Data Message */}
        {!loading && getAllFormData().length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center py-8">
              <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Form Data Available</h3>
              <p className="text-gray-500">
                This client hasn't filled out any forms yet, or the form data is not available.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Subscriptions Tab Component
function SubscriptionsTab({ client, getPaymentStatusColor }: { 
  client: Client; 
  getPaymentStatusColor: (status: string) => string;
}) {
  const [serviceAssignments, setServiceAssignments] = useState<any[]>([])

  useEffect(() => {
    const loadServiceAssignments = async () => {
      try {
        const user = getStoredUser();
        if (!user?.id) return;
        const response = await fetch(`/api/services/assignments?trainerId=${user.id}&clientId=${client.id}`)
        const data = await response.json().catch(() => ([]))
        setServiceAssignments(Array.isArray(data) ? data.filter((a: any) => a.isActive !== false) : [])
      } catch (e) {
        setServiceAssignments([])
      }
    }
    loadServiceAssignments()
  }, [client.id])
  // Helper functions for payment calculations
  const calculateTotalPaidAmount = (subscription: any) => {
    let totalAmount = 0;
    
    // Calculate original subscription amount
    if (subscription.paymentStatus?.toLowerCase() === 'paid') {
      // For paid subscriptions, return the final amount (with discount if applied)
      let amount = 0;
      if (subscription.discountApplied && subscription.priceBeforeDisc) {
        // Calculate the discounted amount
        if (subscription.discountType === 'percentage') {
          amount = subscription.priceBeforeDisc - (subscription.priceBeforeDisc * subscription.discountValue / 100);
        } else {
          amount = subscription.priceBeforeDisc - subscription.discountValue;
        }
      } else {
        amount = subscription.priceBeforeDisc || 0;
      }
      totalAmount += amount;
    } else if (subscription.installments && subscription.installments.length > 0) {
      // For installment subscriptions, sum all paid installments
      const amount = subscription.installments
        .filter((inst: any) => inst.status?.toLowerCase() === 'paid')
        .reduce((sum: number, inst: any) => sum + (inst.amount || 0), 0);
      totalAmount += amount;
    }
    // For free subscriptions, amount is always 0
    
    // Add renewal amounts
    if (subscription.renewalHistory && Array.isArray(subscription.renewalHistory)) {
      subscription.renewalHistory.forEach((renewal: any) => {
        if (renewal.paymentStatus?.toLowerCase() === 'paid') {
          let renewalAmount = 0;
          if (renewal.discountApplied && renewal.priceBeforeDisc) {
            if (renewal.discountType === 'percentage') {
              renewalAmount = renewal.priceBeforeDisc - (renewal.priceBeforeDisc * renewal.discountValue / 100);
            } else {
              renewalAmount = renewal.priceBeforeDisc - renewal.discountValue;
            }
          } else {
            renewalAmount = renewal.priceBeforeDisc || 0;
          }
          totalAmount += renewalAmount;
        }
      });
    }

    // Subtract refund amount if subscription was canceled and refund was given
    if (subscription.isCanceled && subscription.refundAmount && subscription.refundAmount > 0) {
      totalAmount -= subscription.refundAmount;
      // Ensure total doesn't go below 0
      if (totalAmount < 0) totalAmount = 0;
    }
    
    return totalAmount;
  };

  const getFinalAmount = (subscription: any) => {
    // Always calculate the discount properly, don't rely on priceAfterDisc from database
    let amount = 0;
    
    if (subscription.discountApplied && subscription.priceBeforeDisc) {
      // Calculate the discounted amount
      if (subscription.discountType === 'percentage') {
        amount = subscription.priceBeforeDisc - (subscription.priceBeforeDisc * subscription.discountValue / 100);
      } else {
        amount = subscription.priceBeforeDisc - subscription.discountValue;
      }
    } else {
      amount = subscription.priceBeforeDisc || 0;
    }
    
    return amount;
  };

  const calculateTotalInstallmentsPaid = (subscription: any) => {
    if (!subscription.installments) return 0;
    return subscription.installments.filter((inst: any) => inst.status?.toLowerCase() === 'paid').length;
  };

  const calculateRemainingInstallments = (subscription: any) => {
    if (!subscription.installments) return 0;
    return subscription.installments.filter((inst: any) => inst.status?.toLowerCase() !== 'paid').length;
  };

  const getPaymentTimeline = (subscription: any, additionalServiceAssignments: any[] = []) => {
    const timeline = [];
    
    // Add subscription creation - use startDate instead of current date
    timeline.push({
      id: `sub-${subscription.id}`,
      type: 'subscription',
      date: subscription.startDate || new Date().toISOString(),
      amount: getFinalAmount(subscription),
      status: subscription.paymentStatus,
      description: `Subscription #${subscription.id} created`,
      isPaid: subscription.paymentStatus?.toLowerCase() === 'paid'
    });

    // Add renewal history
    if (subscription.renewalHistory && Array.isArray(subscription.renewalHistory)) {
      subscription.renewalHistory.forEach((renewal: any) => {
        timeline.push({
          id: `renewal-${renewal.id}`,
          type: 'renewal',
          date: renewal.renewedAt || new Date().toISOString(),
          amount: renewal.priceAfterDisc || renewal.priceBeforeDisc || 0,
          status: renewal.paymentStatus,
          description: `Subscription renewed`,
          isPaid: renewal.paymentStatus?.toLowerCase() === 'paid',
          renewalData: renewal
        });
      });
    }

    // Add installments only for non-free subscriptions
    if (subscription.paymentStatus?.toLowerCase() !== 'free' && subscription.installments) {
      subscription.installments.forEach((inst: any) => {
        timeline.push({
          id: `inst-${inst.id}`,
          type: 'installment',
          date: inst.paidDate || new Date().toISOString(),
          amount: inst.amount || 0,
          status: inst.status,
          description: `Installment payment`,
          isPaid: inst.status?.toLowerCase() === 'paid',
          installmentId: inst.id
        } as any);
      });
    }

    // Add refund record if subscription was canceled and refund was given
    if (subscription.isCanceled && subscription.refundAmount && subscription.refundAmount > 0) {
      timeline.push({
        id: `refund-${subscription.id}`,
        type: 'refund',
        date: subscription.canceledAt || new Date().toISOString(),
        amount: -(subscription.refundAmount), // Negative amount to show as refund
        status: 'refunded',
        description: `Refund (${subscription.refundType || 'partial'})`,
        isPaid: false,
        refundType: subscription.refundType,
        cancelReason: subscription.cancelReason
      });
    }

    // Add service assignments (additional services)
    if (Array.isArray(additionalServiceAssignments)) {
      additionalServiceAssignments.forEach((a) => {
        timeline.push({
          id: `service-${a.id}`,
          type: 'service',
          date: a.assignedAt || a.createdAt || new Date().toISOString(),
          amount: Number(a.priceEGP) || 0,
          status: a.paymentStatus,
          description: `Service: ${a.serviceName}`,
          isPaid: (a.paymentStatus || '').toLowerCase() === 'paid',
        } as any)
      })
    }

    // Sort by date (newest first)
    const sortedTimeline = timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return sortedTimeline;
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-6">Subscriptions & Payments</h3>
      
      {client.subscriptions.length === 0 ? (
        <div className="text-center py-12">
          <CreditCardIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Subscriptions</h3>
          <p className="text-gray-500">This client hasn't subscribed to any packages yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {client.subscriptions.map((subscription, index) => {
            const totalPaidSubscriptions = calculateTotalPaidAmount(subscription);
            const servicesPaidTotal = serviceAssignments
              .filter((a) => (a.paymentStatus || '').toLowerCase() === 'paid')
              .reduce((sum, a) => sum + (Number(a.priceEGP) || 0), 0);
            const combinedTotalPaid = totalPaidSubscriptions + servicesPaidTotal;
            const totalInstallmentsPaid = calculateTotalInstallmentsPaid(subscription);
            const remainingInstallments = calculateRemainingInstallments(subscription);
            const paymentTimeline = getPaymentTimeline(subscription, index === 0 ? serviceAssignments : []);

            return (
              <div key={subscription.id} className="border border-gray-200 rounded-lg p-6 shadow-sm">
                {/* Subscription Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <CreditCardIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Subscription #{subscription.id}</h4>
                      <p className="text-sm text-gray-600">
                        Created on {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPaymentStatusColor(subscription.paymentStatus)}`}>
                    {subscription.paymentStatus}
                  </span>
                </div>
                
                {/* Summary Cards */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-1">Total Paid Amount</p>
                    <p className="text-xl font-bold text-blue-700">
                      EGP {combinedTotalPaid.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-900 mb-1">Additional Services Paid</p>
                    <p className="text-xl font-bold text-green-700">
                      EGP {servicesPaidTotal.toFixed(2)}
                    </p>
                  </div>
                  
                  {/* <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-900 mb-1">Subscription Amount</p>
                    <p className="text-xl font-bold text-green-700">
                      EGP {getFinalAmount(subscription).toFixed(2)}
                    </p>
                  </div> */}
                  
                  {/* <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-purple-900 mb-1">Payment Method</p>
                    <p className="text-xl font-bold text-purple-700">
                      {subscription.paymentMethod || 'Not specified'}
                    </p>
                  </div> */}
                </div>

                {/* Subscription Details */}
                {/* <div className="mt-6 mb-6">
                  <h5 className="font-medium text-gray-900 mb-4">Subscription Details</h5>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Start Date</p>
                        <p className="text-sm text-gray-900">
                          {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">End Date</p>
                        <p className="text-sm text-gray-900">
                          {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Duration</p>
                        <p className="text-sm text-gray-900">
                          {subscription.durationValue} {subscription.durationUnit}(s)
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Original Price</p>
                        <p className="text-sm text-gray-900">
                          EGP {subscription.priceBeforeDisc?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      {subscription.discountApplied && (
                        <>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Discount</p>
                            <p className="text-sm text-gray-900">
                              {subscription.discountType === 'percentage' ? `${subscription.discountValue}%` : `EGP ${subscription.discountValue}`}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Final Price</p>
                            <p className="text-sm text-gray-900">
                              EGP {getFinalAmount(subscription).toFixed(2)}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div> */}

                {/* Payment Timeline */}
                <div className="mt-6">
                  <h5 className="font-medium text-gray-900 mb-4">Payment History Timeline</h5>
                  <div className="space-y-3">
                    {paymentTimeline.length > 0 ? (
                      paymentTimeline.map((payment, idx) => (
                        <div key={payment.id} className={`flex items-center space-x-4 p-4 rounded-lg ${
                          payment.type === 'refund' ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                        }`}>
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            payment.type === 'refund' ? 'bg-red-500' : 
                            payment.isPaid ? 'bg-green-500' : 'bg-yellow-500'
                          }`}></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`font-medium ${
                                  payment.type === 'refund' ? 'text-red-900' : 'text-gray-900'
                                }`}>
                                  {payment.description}
                                  {payment.type === 'refund' && payment.cancelReason && (
                                    <span className="text-sm text-red-700 ml-2">({payment.cancelReason})</span>
                                  )}
                                </p>
                                <p className={`text-sm ${
                                  payment.type === 'refund' ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {new Date(payment.date).toLocaleDateString()} at {new Date(payment.date).toLocaleTimeString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={`font-semibold ${
                                  payment.type === 'refund' ? 'text-red-900' : 'text-gray-900'
                                }`}>
                                  {payment.type === 'refund' ? '-' : ''}EGP {Math.abs(payment.amount).toFixed(2)}
                                </p>
                                <p className={`text-sm font-medium ${
                                  payment.type === 'refund' ? 'text-red-600' : 
                                  payment.isPaid ? 'text-green-600' : 'text-yellow-600'
                                }`}>
                                  {payment.status}
                                </p>
                              </div>
                            </div>
                            {payment.type === 'installment' && (
                              <div className="mt-2 text-xs text-gray-500">
                                Installment payment
                              </div>
                            )}
                            {payment.type === 'refund' && (
                              <div className="mt-2 text-xs text-red-600">
                                Refund processed
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CreditCardIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p>No payment history available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detailed Installments Table */}
                {subscription.paymentStatus?.toLowerCase() !== 'free' && subscription.installments && subscription.installments.length > 0 && (
                  <div className="mt-6">
                    <h5 className="font-medium text-gray-900 mb-4">Installment Details</h5>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Installment
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Paid Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Remaining
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Images
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {subscription.installments.map((installment, idx) => (
                            <tr key={installment.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                #{installment.id}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                EGP {(installment.amount || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  installment.status === 'PAID' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {installment.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {installment.paidDate 
                                  ? new Date(installment.paidDate).toLocaleDateString()
                                  : 'Not paid yet'
                                }
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                EGP {(installment.remaining || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {installment.transactionImages?.length || 0} images
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Check-ins Tab Component
function CheckinsTab({ client }: { client: Client }) {
  const [expandedForms, setExpandedForms] = useState<Set<number>>(new Set());

  const toggleForm = (formId: number) => {
    const newExpanded = new Set(expandedForms);
    if (newExpanded.has(formId)) {
      newExpanded.delete(formId);
    } else {
      newExpanded.add(formId);
    }
    setExpandedForms(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getFilledByText = (submission: any) => {
    return submission.answers?.filledByTrainer ? 'Trainer' : 'Client';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Check-in Forms</h3>
        <p className="text-sm text-gray-600 mt-1">
          All forms submitted by or for this client
        </p>
      </div>
      
      {client.submissions && client.submissions.length > 0 ? (
        <div className="space-y-4">
          {client.submissions.map((submission, index) => {
            const isExpanded = expandedForms.has(submission.id);
            const { date, time } = formatDate(submission.submittedAt);
            const filledBy = getFilledByText(submission);
            
            return (
              <div key={submission.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                {/* Form Header - Always Visible */}
                <div 
                  className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => toggleForm(submission.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {submission.form?.name || `Form #${submission.formId}`}
                        </h4>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {date} at {time}
                          </span>
                          <span className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            Filled by {filledBy}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                      {isExpanded ? (
                        <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Form Content - Collapsible */}
                {isExpanded && submission.form?.questions && submission.answers && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    <div className="p-6">
                      <h5 className="font-medium text-gray-900 mb-4">Form Responses</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {submission.form.questions.map((question) => {
                          const answer = submission.answers[String(question.id)];
                          const hasAnswer = answer && answer !== 'Not specified' && answer !== '' && answer !== 'undefined';
                          
                          return (
                            <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start">
                                <div className={`w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${hasAnswer ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 mb-1">{question.label}</p>
                                  <p className={`${hasAnswer ? 'text-gray-600' : 'text-gray-400 italic'}`}>
                                    {hasAnswer ? (Array.isArray(answer) ? answer.join(', ') : answer) : 'No response'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <ClipboardDocumentListIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Check-in Forms</h3>
          <p className="text-gray-500">This client hasn't submitted any check-in forms yet.</p>
        </div>
      )}
    </div>
  );
}

// Services Tab Component
function ServicesTab({ client }: { client: Client }) {
  const [assignments, setAssignments] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showAssign, setShowAssign] = React.useState(false)
  const [services, setServices] = React.useState<any[]>([])
  const [form, setForm] = React.useState({ serviceId: '', priceOverrideEGP: '', startDate: '', endDate: '', notes: '', paymentStatus: 'paid', paymentMethod: '' })
  const [confirmDelete, setConfirmDelete] = React.useState<any | null>(null)
  const [showToast, setShowToast] = React.useState<string>('')

  const user = getStoredUser()

  const loadAssignments = async () => {
    try {
      const res = await fetch(`/api/services/assignments?trainerId=${user?.id}&clientId=${client.id}`)
      const data = await res.json()
      setAssignments(Array.isArray(data) ? data.filter(a => a.isActive !== false) : [])
    } catch (e) {
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  const loadServices = async () => {
    try {
      const res = await fetch(`/api/services?trainerId=${user?.id}&status=active&page=1&pageSize=100`)
      const data = await res.json()
      setServices(data.items || [])
    } catch (e) {
      setServices([])
    }
  }

  React.useEffect(() => { loadAssignments(); loadServices(); }, [client.id, user?.id])

  const assignService = async () => {
    if (!form.serviceId) return
    try {
      const body = {
        trainerId: user?.id,
        clientId: client.id,
        priceOverrideEGP: form.priceOverrideEGP ? Number(form.priceOverrideEGP) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        notes: form.notes || undefined,
        paymentStatus: form.paymentStatus,
        paymentMethod: form.paymentMethod || undefined,
      }
      const res = await fetch(`/api/services/${form.serviceId}/assign`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to assign service')
      setShowAssign(false)
      setForm({ serviceId: '', priceOverrideEGP: '', startDate: '', endDate: '', notes: '', paymentStatus: 'paid', paymentMethod: '' })
      await loadAssignments()
      setShowToast('Service assigned successfully!')
      setTimeout(() => setShowToast(''), 2000)
    } catch (e: any) {
      alert(e.message || 'Failed to assign service')
    }
  }

  const unassignService = async (assignmentId: number) => {
    try {
      const res = await fetch(`/api/services/assignments/${assignmentId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to unassign service')
      setConfirmDelete(null)
      await loadAssignments()
      setShowToast('Service removed successfully!')
      setTimeout(() => setShowToast(''), 2000)
    } catch (e: any) {
      alert(e.message || 'Failed to unassign service')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Services</h3>
          <p className="text-sm text-gray-600 mt-1">Assigned services for this client</p>
        </div>
        <Button onClick={() => setShowAssign(true)}>Assign Service</Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-zinc-400">Loading…</div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12">
          <CurrencyDollarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services assigned</h3>
          <p className="text-gray-500">Click Assign Service to add one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{a.serviceName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">EGP {Number(a.priceEGP).toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${a.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : a.paymentStatus === 'refunded' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {a.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                    <Button outline className="text-red-600 hover:text-red-700" onClick={() => setConfirmDelete(a)}>Remove</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAssign && (
        <Dialog open={showAssign} onClose={() => setShowAssign(false)}>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Assign Service</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Service</label>
                <select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })} className="w-full border rounded px-2 py-2">
                  <option value="">Select a service</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — EGP {Number(s.priceEGP).toFixed(2)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Price Override (optional)</label>
                  <Input type="number" min="0" step="0.01" value={form.priceOverrideEGP} onChange={(e) => setForm({ ...form, priceOverrideEGP: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Status</label>
                  <Select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                    <option value="paid">paid</option>
                    <option value="pending">pending</option>
                    <option value="refunded">refunded</option>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method (optional)</label>
                <Input value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} placeholder="e.g., cash, card, bank" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes about this assignment" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button outline type="button" onClick={() => setShowAssign(false)}>Cancel</Button>
              <Button type="button" onClick={assignService} disabled={!form.serviceId}>Assign</Button>
            </div>
          </div>
        </Dialog>
      )}

      {confirmDelete && (
        <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
          <div className="p-6 z-[9999]">
            <h2 className="text-lg font-semibold mb-4">Confirm Remove</h2>
            <p>Remove <span className="font-bold">{confirmDelete.serviceName}</span> from this client?</p>
            <div className="flex justify-end gap-2 mt-6">
              <Button outline type="button" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button color="red" type="button" onClick={() => unassignService(confirmDelete.id)}>Remove</Button>
            </div>
          </div>
        </Dialog>
      )}

      {showToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {showToast}
          </div>
        </div>
      )}
    </div>
  )
}

// Notes Tab Component
function NotesTab({ client, onNotesChange }: { client: Client; onNotesChange: () => void }) {
  const [showAddNote, setShowAddNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    const newNote = {
      id: Date.now().toString(),
      content: newNoteContent.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/clients/${client.id}/notes`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ content: newNoteContent.trim() })
      // });

      // Update the client's notes directly
      client.notes = [newNote, ...(client.notes || [])];
      setNewNoteContent('');
      setShowAddNote(false);
      onNotesChange(); // Trigger counter update
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleEditNote = async (noteId: string) => {
    if (!editingNoteContent.trim()) return;

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/clients/${client.id}/notes/${noteId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ content: editingNoteContent.trim() })
      // });

      // Update the client's notes directly
      if (client.notes) {
        client.notes = client.notes.map(note => 
        note.id === noteId 
          ? { ...note, content: editingNoteContent.trim(), updatedAt: new Date().toISOString() }
          : note
        );
      }
      setEditingNoteId(null);
      setEditingNoteContent('');
      onNotesChange(); // Trigger counter update
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/clients/${client.id}/notes/${noteId}`, {
      //   method: 'DELETE'
      // });

      // Update the client's notes directly
      if (client.notes) {
        client.notes = client.notes.filter(note => note.id !== noteId);
      }
      setShowDeleteConfirm(null);
      onNotesChange(); // Trigger counter update
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const startEditing = (note: any) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Notes & Communication</h3>
        <Button outline onClick={() => setShowAddNote(true)}>
          <PencilIcon className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      {/* Add Note Modal */}
      <Dialog open={showAddNote} onClose={() => setShowAddNote(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Add Note to "{client.fullName}"</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Note Content</label>
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Enter your note here..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button outline onClick={() => setShowAddNote(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote}>
              Add Note
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
          <p className="text-gray-700 mb-6">
            Are you sure you want to delete this note? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button outline onClick={() => setShowDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button 
              color="red"
              onClick={() => handleDeleteNote(showDeleteConfirm!)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
      
      {client.notes && client.notes.length > 0 ? (
        <div className="space-y-4">
          {client.notes.map((note: any, index: number) => (
            <div key={note.id || index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              {editingNoteId === note.id ? (
                // Edit Mode
                <div>
                  <Textarea
                    value={editingNoteContent}
                    onChange={(e) => setEditingNoteContent(e.target.value)}
                    rows={3}
                    className="w-full mb-4"
                  />
                  <div className="flex justify-end space-x-3">
                    <Button outline onClick={cancelEditing} className="text-sm px-3 py-1">
                      Cancel
                    </Button>
                    <Button onClick={() => handleEditNote(note.id)} className="text-sm px-3 py-1">
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-900 mb-2">{note.content}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <span>Added on {new Date(note.createdAt || Date.now()).toLocaleDateString()}</span>
                      {note.updatedAt && note.updatedAt !== note.createdAt && (
                        <span className="ml-4">• Updated on {new Date(note.updatedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button outline onClick={() => startEditing(note)} className="text-sm px-3 py-1">
                      <PencilIcon className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                                         <Button 
                       outline 
                       className="text-red-600 border-red-200 hover:bg-red-50 text-sm px-3 py-1"
                       onClick={() => setShowDeleteConfirm(note.id)}
                     >
                       <TrashIcon className="h-3 w-3 mr-1" />
                       Delete
                     </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Notes Yet</h3>
          <p className="text-gray-500">No notes or communication history for this client.</p>
          <div className="mt-4">
            <Button outline onClick={() => setShowAddNote(true)}>
              <PencilIcon className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 

function WorkoutProgramsTab({ client }: { client: Client }) {
  const [programAssignments, setProgramAssignments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    programId: '',
    startDate: '',
    endDate: '',
    nextUpdateDate: '',
    notes: ''
  });

  useEffect(() => {
    loadProgramAssignments();
    loadPrograms();
  }, [client.id]);

  const loadProgramAssignments = async () => {
    try {
      const user = getStoredUser();
      if (!user) return;

      const response = await fetch(`/api/client-program-assignments/client/${client.id}?trainerId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setProgramAssignments(data);
      }
    } catch (error) {
      console.error('Error loading program assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async () => {
    try {
      const user = getStoredUser();
      if (!user) return;

      const response = await fetch(`/api/programs?trainerId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setPrograms(data);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const handleAssignProgram = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!assignmentData.programId || !assignmentData.startDate) return;

    setAssignLoading(true);
    try {
      const user = getStoredUser();
      if (!user) return;

      const response = await fetch('/api/client-program-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainerId: user.id,
          clientId: client.id,
          programId: assignmentData.programId,
          startDate: assignmentData.startDate,
          endDate: assignmentData.endDate || null,
          nextUpdateDate: assignmentData.nextUpdateDate || null,
          notes: assignmentData.notes || null
        }),
      });

      if (response.ok) {
        setShowAssignModal(false);
        setAssignmentData({
          programId: '',
          startDate: '',
          endDate: '',
          nextUpdateDate: '',
          notes: ''
        });
        loadProgramAssignments();
      } else {
        const error = await response.json();
        console.error('Error assigning program:', error);
      }
    } catch (error) {
      console.error('Error assigning program:', error);
    } finally {
      setAssignLoading(false);
    }
  };

  const getActiveAssignment = () => {
    return programAssignments.find(assignment => assignment.isActive);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status with expiration check
  const getAssignmentStatus = (assignment: any) => {
    if (assignment.status === 'active' && isAssignmentExpired(assignment)) {
      return 'expired';
    }
    return assignment.status;
  };

  // Get status color with expiration check
  const getStatusColorWithExpiration = (assignment: any) => {
    const status = getAssignmentStatus(assignment);
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate end date based on start date and program duration
  const calculateEndDate = (startDate: string, program: any) => {
    if (!startDate || !program || !program.programDuration || !program.durationUnit) {
      return '';
    }

    const start = new Date(startDate);
    const duration = program.programDuration;
    const unit = program.durationUnit;

    const end = new Date(start);
    switch (unit) {
      case 'days':
        end.setDate(end.getDate() + duration);
        break;
      case 'weeks':
        end.setDate(end.getDate() + (duration * 7));
        break;
      case 'months':
        end.setMonth(end.getMonth() + duration);
        break;
      default:
        return '';
    }

    return end.toISOString().split('T')[0];
  };

  // Calculate next update date (same as end date for now)
  const calculateNextUpdateDate = (startDate: string, program: any) => {
    return calculateEndDate(startDate, program);
  };

  // Handle program selection change
  const handleProgramChange = (programId: string) => {
    setAssignmentData(prev => ({ ...prev, programId }));
    
    // Auto-calculate dates if start date is already set
    if (assignmentData.startDate) {
      const selectedProgram = programs.find(p => p.id.toString() === programId);
      if (selectedProgram && selectedProgram.programDuration) {
        const endDate = calculateEndDate(assignmentData.startDate, selectedProgram);
        const nextUpdateDate = calculateNextUpdateDate(assignmentData.startDate, selectedProgram);
        setAssignmentData(prev => ({ 
          ...prev, 
          programId,
          endDate,
          nextUpdateDate
        }));
      }
    }
  };

  // Handle start date change
  const handleStartDateChange = (startDate: string) => {
    setAssignmentData(prev => ({ ...prev, startDate }));
    
    // Auto-calculate dates if program is selected
    if (assignmentData.programId) {
      const selectedProgram = programs.find(p => p.id.toString() === assignmentData.programId);
      if (selectedProgram && selectedProgram.programDuration) {
        const endDate = calculateEndDate(startDate, selectedProgram);
        const nextUpdateDate = calculateNextUpdateDate(startDate, selectedProgram);
        setAssignmentData(prev => ({ 
          ...prev, 
          startDate,
          endDate,
          nextUpdateDate
        }));
      }
    }
  };

  // Check if a program assignment is expired
  const isAssignmentExpired = (assignment: any) => {
    if (!assignment.endDate) return false;
    const endDate = new Date(assignment.endDate);
    const now = new Date();
    return endDate < now;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const activeAssignment = getActiveAssignment();

  return (
    <div className="space-y-6">
      {/* Current Program Section */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Current Program</h3>
          <Button onClick={() => {
            setShowAssignModal(true);
          }}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Assign Program
          </Button>
        </div>

        {activeAssignment ? (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-medium text-gray-900">
                {activeAssignment.program.name}
                {activeAssignment.program.isImported && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Imported
                  </span>
                )}
              </h4>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColorWithExpiration(activeAssignment)}`}>
                {getAssignmentStatus(activeAssignment)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Start Date:</span>
                <div className="font-medium">{formatDate(activeAssignment.startDate)}</div>
              </div>
              {activeAssignment.endDate && (
                <div>
                  <span className="text-gray-500">End Date:</span>
                  <div className="font-medium">{formatDate(activeAssignment.endDate)}</div>
                </div>
              )}
              {activeAssignment.nextUpdateDate && (
                <div>
                  <span className="text-gray-500">Next Update:</span>
                  <div className="font-medium">{formatDate(activeAssignment.nextUpdateDate)}</div>
                </div>
              )}
            </div>

            {activeAssignment.notes && (
              <div className="mt-3">
                <span className="text-gray-500">Notes:</span>
                <div className="text-sm mt-1">{activeAssignment.notes}</div>
              </div>
            )}

            {activeAssignment.program.isImported && activeAssignment.program.importedPdfUrl && (
              <div className="mt-4">
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${activeAssignment.program.importedPdfUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                  View Program PDF
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FireIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No program currently assigned</p>
            <Button onClick={() => {
              setShowAssignModal(true);
            }} className="mt-4">
              <PlusIcon className="h-4 w-4 mr-2" />
              Assign Program
            </Button>
          </div>
        )}
      </div>

      {/* Program History Section */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Program History</h3>
        
        {programAssignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No program history yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {programAssignments.map((assignment) => (
              <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    {assignment.program.name}
                    {assignment.program.isImported && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Imported
                      </span>
                    )}
                  </h4>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColorWithExpiration(assignment)}`}>
                    {getAssignmentStatus(assignment)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Assigned:</span>
                    <div className="font-medium">{formatDate(assignment.assignedAt)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Start Date:</span>
                    <div className="font-medium">{formatDate(assignment.startDate)}</div>
                  </div>
                  {assignment.endDate && (
                    <div>
                      <span className="text-gray-500">End Date:</span>
                      <div className="font-medium">{formatDate(assignment.endDate)}</div>
                    </div>
                  )}
                </div>

                {assignment.notes && (
                  <div className="mt-2">
                    <span className="text-gray-500">Notes:</span>
                    <div className="text-sm mt-1">{assignment.notes}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Program Modal */}
      <Dialog open={showAssignModal} onClose={() => setShowAssignModal(false)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Assign Program</h2>
            <button
              onClick={() => setShowAssignModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Program
              </label>
              <Select
                value={assignmentData.programId}
                onChange={(e) => handleProgramChange(e.target.value)}
                required
              >
                <option value="">Choose a program...</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name} {program.isImported ? '(Imported)' : ''}
                  </option>
                ))}
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={assignmentData.startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <Input
                  type="date"
                  value={assignmentData.endDate}
                  onChange={(e) => setAssignmentData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Next Update Date (Optional)
              </label>
              <Input
                type="date"
                value={assignmentData.nextUpdateDate}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, nextUpdateDate: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={assignmentData.notes}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any notes about this program assignment..."
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <Button
                type="button"
                outline
                  onClick={() => {
                  setShowAssignModal(false);
                  setAssignmentData({
                    programId: '',
                    startDate: '',
                    endDate: '',
                    nextUpdateDate: '',
                    notes: ''
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAssignProgram}
                disabled={!assignmentData.programId || !assignmentData.startDate || assignLoading}
              >
                {assignLoading ? 'Assigning...' : 'Assign as Is'}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const user = getStoredUser();
                  if (user && assignmentData.programId) {
                    window.location.href = `/workout-programs/${assignmentData.programId}/edit?customize=true&clientId=${client.id}&trainerId=${user.id}`;
                  }
                }}
                disabled={!assignmentData.programId}
              >
                Customize for Client
              </Button>
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  );
} 

function NutritionProgramsTab({ client }: { client: Client }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [nutritionPrograms, setNutritionPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    nutritionProgramId: '',
    startDate: '',
    endDate: '',
    nextUpdateDate: '',
    notes: ''
  });

  useEffect(() => {
    loadNutritionProgramAssignments();
    loadNutritionPrograms();
  }, [client.id]);

  const loadNutritionProgramAssignments = async () => {
    try {
      const user = getStoredUser();
      if (!user) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client-nutrition-assignments/client/${client.id}?trainerId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error('Error loading nutrition program assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNutritionPrograms = async () => {
    try {
      const user = getStoredUser();
      if (!user) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nutrition-programs?trainerId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setNutritionPrograms(data.programs || []);
      }
    } catch (error) {
      console.error('Error loading nutrition programs:', error);
      setNutritionPrograms([]);
    }
  };

  const handleAssignNutritionProgram = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    try {
      setAssignLoading(true);
      const user = getStoredUser();
      if (!user) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client-nutrition-assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainerId: user.id,
          clientId: client.id,
          nutritionProgramId: assignmentData.nutritionProgramId,
          startDate: assignmentData.startDate,
          endDate: assignmentData.endDate || null,
          nextUpdateDate: assignmentData.nextUpdateDate || null,
          notes: assignmentData.notes || null,
        }),
      });

      if (response.ok) {
        await loadNutritionProgramAssignments();
        setShowAssignModal(false);
        setAssignmentData({
          nutritionProgramId: '',
          startDate: '',
          endDate: '',
          nextUpdateDate: '',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error assigning nutrition program:', error);
    } finally {
      setAssignLoading(false);
    }
  };

  const getActiveAssignment = () => {
    return assignments.find(assignment => assignment.isActive);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssignmentStatus = (assignment: any) => {
    if (assignment.status === 'completed') return 'Completed';
    if (assignment.status === 'paused') return 'Paused';
    if (assignment.endDate && new Date(assignment.endDate) < new Date()) {
      return 'Expired';
    }
    return 'Active';
  };

  const getStatusColorWithExpiration = (assignment: any) => {
    if (assignment.endDate && new Date(assignment.endDate) < new Date()) {
      return 'bg-red-100 text-red-800';
    }
    return getStatusColor(assignment.status);
  };

  const calculateEndDate = (startDate: string, program: any) => {
    if (!startDate || !program.programDuration || !program.durationUnit) return '';
    
    const start = new Date(startDate);
    const duration = program.programDuration;
    
    switch (program.durationUnit) {
      case 'days':
        start.setDate(start.getDate() + duration);
        break;
      case 'weeks':
        start.setDate(start.getDate() + (duration * 7));
        break;
      case 'months':
        start.setMonth(start.getMonth() + duration);
        break;
    }
    
    return start.toISOString().split('T')[0];
  };

  const calculateNextUpdateDate = (startDate: string, program: any) => {
    if (!startDate || !program.programDuration || !program.durationUnit) return '';
    
    const start = new Date(startDate);
    const duration = program.programDuration;
    
    switch (program.durationUnit) {
      case 'days':
        start.setDate(start.getDate() + duration);
        break;
      case 'weeks':
        start.setDate(start.getDate() + (duration * 7));
        break;
      case 'months':
        start.setMonth(start.getMonth() + duration);
        break;
    }
    
    return start.toISOString().split('T')[0];
  };

  const handleProgramChange = (programId: string) => {
    setAssignmentData(prev => ({ ...prev, nutritionProgramId: programId }));
    
    if (programId && assignmentData.startDate) {
      const selectedProgram = nutritionPrograms.find(p => p.id.toString() === programId);
      if (selectedProgram) {
        const endDate = calculateEndDate(assignmentData.startDate, selectedProgram);
        const nextUpdateDate = calculateNextUpdateDate(assignmentData.startDate, selectedProgram);
        setAssignmentData(prev => ({
          ...prev,
          endDate,
          nextUpdateDate
        }));
      }
    }
  };

  const handleStartDateChange = (startDate: string) => {
    setAssignmentData(prev => ({ ...prev, startDate }));
    
    if (startDate && assignmentData.nutritionProgramId) {
      const selectedProgram = nutritionPrograms.find(p => p.id.toString() === assignmentData.nutritionProgramId);
      if (selectedProgram) {
        const endDate = calculateEndDate(startDate, selectedProgram);
        const nextUpdateDate = calculateNextUpdateDate(startDate, selectedProgram);
        setAssignmentData(prev => ({
          ...prev,
          endDate,
          nextUpdateDate
        }));
      }
    }
  };

  const isAssignmentExpired = (assignment: any) => {
    if (!assignment.endDate) return false;
    return new Date(assignment.endDate) < new Date();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  const activeAssignment = getActiveAssignment();

  return (
    <div className="p-6">
      {/* Current Program Section */}
      {activeAssignment && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Nutrition Program</h3>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-xl font-medium text-gray-900">
                    {activeAssignment.nutritionProgram.name}
                  </h4>
                  {activeAssignment.nutritionProgram.isImported && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Imported
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-500">Start Date</span>
                    <p className="font-medium">{formatDate(activeAssignment.startDate)}</p>
                  </div>
                  {activeAssignment.endDate && (
                    <div>
                      <span className="text-sm text-gray-500">End Date</span>
                      <p className="font-medium">{formatDate(activeAssignment.endDate)}</p>
                    </div>
                  )}
                  {activeAssignment.nextUpdateDate && (
                    <div>
                      <span className="text-sm text-gray-500">Next Update</span>
                      <p className="font-medium">{formatDate(activeAssignment.nextUpdateDate)}</p>
                    </div>
                  )}
                </div>
                
                {activeAssignment.notes && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-500">Notes</span>
                    <p className="text-gray-900">{activeAssignment.notes}</p>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColorWithExpiration(activeAssignment)}`}>
                    {getAssignmentStatus(activeAssignment)}
                  </span>
                  {activeAssignment.nutritionProgram.isImported && activeAssignment.nutritionProgram.importedPdfUrl && (
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL}${activeAssignment.nutritionProgram.importedPdfUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <DocumentArrowUpIcon className="h-4 w-4" />
                      View Program PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Program History Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Nutrition Program History</h3>
          <Button
            onClick={() => {
              setShowAssignModal(true);
            }}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Assign Program
          </Button>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg">
          {assignments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No nutrition programs assigned yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {assignment.nutritionProgram.name}
                        </h4>
                        {assignment.nutritionProgram.isImported && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Imported
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                        <div>
                          <span className="text-sm text-gray-500">Assigned</span>
                          <p className="font-medium">{formatDate(assignment.assignedAt)}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Start Date</span>
                          <p className="font-medium">{formatDate(assignment.startDate)}</p>
                        </div>
                        {assignment.endDate && (
                          <div>
                            <span className="text-sm text-gray-500">End Date</span>
                            <p className="font-medium">{formatDate(assignment.endDate)}</p>
                          </div>
                        )}
                        {assignment.nextUpdateDate && (
                          <div>
                            <span className="text-sm text-gray-500">Next Update</span>
                            <p className="font-medium">{formatDate(assignment.nextUpdateDate)}</p>
                          </div>
                        )}
                      </div>
                      
                      {assignment.notes && (
                        <p className="text-gray-600 text-sm mb-2">{assignment.notes}</p>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColorWithExpiration(assignment)}`}>
                          {getAssignmentStatus(assignment)}
                        </span>
                        {assignment.nutritionProgram.isImported && assignment.nutritionProgram.importedPdfUrl && (
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL}${assignment.nutritionProgram.importedPdfUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <DocumentArrowUpIcon className="h-4 w-4" />
                            View PDF
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assign Program Modal */}
      <Dialog open={showAssignModal} onClose={() => setShowAssignModal(false)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Assign Nutrition Program</h2>
            <button
              onClick={() => setShowAssignModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Nutrition Program
              </label>
              <select
                value={assignmentData.nutritionProgramId}
                onChange={(e) => handleProgramChange(e.target.value)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Choose a nutrition program...</option>
                {nutritionPrograms.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name} {program.isImported ? '(Imported)' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={assignmentData.startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={assignmentData.endDate}
                  onChange={(e) => setAssignmentData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Next Update Date (Optional)
              </label>
              <input
                type="date"
                value={assignmentData.nextUpdateDate}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, nextUpdateDate: e.target.value }))}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={assignmentData.notes}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any notes about this nutrition program assignment..."
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <Button
                type="button"
                outline
                  onClick={() => {
                  setShowAssignModal(false);
                  setAssignmentData({
                    nutritionProgramId: '',
                    startDate: '',
                    endDate: '',
                    nextUpdateDate: '',
                    notes: ''
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAssignNutritionProgram}
                disabled={!assignmentData.nutritionProgramId || !assignmentData.startDate || assignLoading}
              >
                {assignLoading ? 'Assigning...' : 'Assign as Is'}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const user = getStoredUser();
                  if (user && assignmentData.nutritionProgramId) {
                    window.location.href = `/nutrition-programs/create?customize=true&programId=${assignmentData.nutritionProgramId}&clientId=${client.id}&trainerId=${user.id}`;
                  }
                }}
                disabled={!assignmentData.nutritionProgramId}
              >
                Customize for Client
              </Button>
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  );
} 