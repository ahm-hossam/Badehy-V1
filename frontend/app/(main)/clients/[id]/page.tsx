"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import { Select } from '@/components/select';
import { Dialog } from '@/components/dialog';
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
  TrashIcon
} from '@heroicons/react/24/outline';

interface Client {
  id: number;
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
}

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Helper function to get display name
  const getDisplayName = (client: Client) => {
    // If fullName is not "Unknown Client", use it
    if (client.fullName && client.fullName !== "Unknown Client") {
      return client.fullName;
    }
    
    // Otherwise, try to get name from form answers
    if (client.latestSubmission?.answers) {
      const answers = client.latestSubmission.answers;
      const nameKeys = Object.keys(answers).filter(key => 
        key !== 'filledByTrainer' && 
        answers[key] && 
        answers[key] !== 'undefined' &&
        answers[key] !== ''
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

  const loadClientDetails = async () => {
    try {
      setLoading(true);
      // Use the proxy API route to avoid CORS issues
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Frontend received client data:', data);
        if (data.error) {
          console.error('Backend returned error:', data.error);
          setError(data.error);
        } else {
          setClient(data);
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
  };

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
      return { status: 'No Subscription', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    }

    // Find the most recent subscription
    const latestSubscription = client.subscriptions.reduce((latest, current) => {
      return current.id > latest.id ? current : latest;
    });

    console.log('Latest subscription:', latestSubscription);
    console.log('Payment status:', latestSubscription.paymentStatus);
    console.log('End date:', latestSubscription.endDate);

    // Normalize payment status to uppercase for comparison
    const paymentStatus = latestSubscription.paymentStatus?.toUpperCase();

    // Check if subscription is canceled first
    if (paymentStatus === 'CANCELED') {
      return { status: 'Canceled', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    }

    // Check if subscription is pending
    if (paymentStatus === 'PENDING') {
      return { status: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    }

    // For active/expired status, check the end date
    if ((paymentStatus === 'PAID' || paymentStatus === 'FREE') && latestSubscription.endDate) {
      const endDate = new Date(latestSubscription.endDate);
      const currentDate = new Date();
      
      // Check if the date is valid
      if (isNaN(endDate.getTime())) {
        console.log('Invalid end date:', latestSubscription.endDate);
        return { status: 'Unknown', color: 'bg-gray-100 text-gray-700 border-gray-200' };
      }
      
      const isActive = currentDate < endDate;
      
      console.log('End date object:', endDate);
      console.log('Current date object:', currentDate);
      console.log('Is active:', isActive);
      
      if (isActive) {
        return { status: 'Active', color: 'bg-green-100 text-green-700 border-green-200' };
      } else {
        return { status: 'Expired', color: 'bg-red-100 text-red-700 border-red-200' };
      }
    } else if (paymentStatus === 'OVERDUE') {
      return { status: 'Expired', color: 'bg-red-100 text-red-700 border-red-200' };
    } else {
      console.log('Falling back to Unknown status');
      console.log('Payment status was:', paymentStatus);
      console.log('End date was:', latestSubscription.endDate);
      return { status: 'Unknown', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const handleHoldSubscription = () => {
    // TODO: Implement hold subscription functionality
    console.log('Hold subscription clicked');
    setDropdownOpen(false);
  };

  const handleCancelSubscription = () => {
    // TODO: Implement cancel subscription functionality
    console.log('Cancel subscription clicked');
    setDropdownOpen(false);
  };

  const handleAddRenew = () => {
    // TODO: Implement add renew functionality
    console.log('Add renew clicked');
    setDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen) {
        setDropdownOpen(false);
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
    { id: 'subscriptions', name: 'Subscriptions', icon: CreditCardIcon, count: client.subscriptions.length },
    { id: 'checkins', name: 'Check-ins', icon: ClipboardDocumentListIcon, count: 0 },
    { id: 'notes', name: 'Notes', icon: ChatBubbleLeftRightIcon, count: client.notes?.length || 0 },
  ];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
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
                <p className="text-gray-600">{client.email}</p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getSubscriptionStatus().color}`}>
                {getSubscriptionStatus().status}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Subscription Actions Dropdown */}
            <div className="relative">
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
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={handleHoldSubscription}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                    >
                      <ClockIcon className="h-4 w-4 mr-3" />
                      Hold Subscription
                    </button>
                    <button
                      onClick={handleCancelSubscription}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
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
            <Button onClick={() => setEditing(!editing)}>
              <PencilIcon className="h-4 w-4 mr-2" />
              {editing ? 'Cancel Edit' : 'Edit Client'}
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

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
                {tab.count !== null && tab.count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {activeTab === 'overview' && <OverviewTab client={client} onHoldSubscription={handleHoldSubscription} onCancelSubscription={handleCancelSubscription} onAddRenew={handleAddRenew} getDisplayName={getDisplayName} />}
          {activeTab === 'profile' && <ProfileTab client={client} editing={editing} onSave={handleSaveProfile} saving={saving} />}
          {activeTab === 'subscriptions' && <SubscriptionsTab client={client} getPaymentStatusColor={getPaymentStatusColor} />}
          {activeTab === 'checkins' && <CheckinsTab client={client} />}
          {activeTab === 'notes' && <NotesTab client={client} />}
        </div>
      </div>
    </div>
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

  const calculateTotalPayments = () => {
    if (!client.subscriptions || client.subscriptions.length === 0) {
      return 0;
    }

    return client.subscriptions.reduce((total, subscription) => {
      let subscriptionAmount = 0;

      // Normalize payment status to uppercase for comparison
      const paymentStatus = subscription.paymentStatus?.toUpperCase();
      


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
      } else {
        // For other statuses, use price after discount as fallback
        subscriptionAmount = subscription.priceAfterDisc || 0;
      }

      return total + subscriptionAmount;
    }, 0);
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

  const totalPayments = calculateTotalPayments();
  const activeSubscriptions = getActiveSubscriptionsCount();
  const daysSinceRegistration = Math.floor((Date.now() - new Date(client.registrationDate).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-6">Client Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                {client.subscriptions && client.subscriptions.length > 0 
                  ? new Date(client.subscriptions[0].startDate).toLocaleDateString()
                  : new Date(client.registrationDate).toLocaleDateString()
                }
              </p>
              <p className="text-sm text-orange-600">
                {client.subscriptions && client.subscriptions.length > 0 
                  ? `${Math.floor((Date.now() - new Date(client.subscriptions[0].startDate).getTime()) / (1000 * 60 * 60 * 24))} days`
                  : `${Math.floor((Date.now() - new Date(client.registrationDate).getTime()) / (1000 * 60 * 60 * 24))} days`
                }
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
                {client.subscriptions && client.subscriptions.length > 0 && client.subscriptions[0].endDate 
                  ? (() => {
                      const endDate = new Date(client.subscriptions[0].endDate);
                      const currentDate = new Date();
                      const remainingDays = Math.floor((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
                      return remainingDays > 0 ? `${remainingDays} days` : 'Expired';
                    })()
                  : 'No subscription'
                }
              </p>
              <p className="text-sm text-red-600">
                {client.subscriptions && client.subscriptions.length > 0 && client.subscriptions[0].endDate 
                  ? (() => {
                      const endDate = new Date(client.subscriptions[0].endDate);
                      const currentDate = new Date();
                      const remainingDays = Math.floor((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
                      return remainingDays > 0 ? 'until expiration' : 'subscription ended';
                    })()
                  : 'no active plan'
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
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch the form data based on selectedFormId
  useEffect(() => {
    const fetchFormData = async () => {
      if (client.selectedFormId) {
        setLoading(true);
        try {
          const response = await fetch(`/api/checkins/${client.selectedFormId}`);
          if (response.ok) {
            const form = await response.json();
            setSelectedForm(form);
          }
        } catch (error) {
          console.error('Error fetching form data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchFormData();
  }, [client.selectedFormId]);

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
              {/* Non-duplicated core client fields */}
              {[
                { label: 'Email', value: client.email || '', key: 'email' },
                { label: 'Gender', value: client.gender || '', key: 'gender' },
                { label: 'Age', value: client.age || '', key: 'age' },
                { label: 'Source', value: client.source || '', key: 'source' },
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
              
              {/* Form responses */}
              {selectedForm && client.latestSubmission?.answers && selectedForm.questions?.map((question: any, index: number) => {
                const answer = client.latestSubmission?.answers?.[String(question.id)];
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
                            This answer was not stored when the client was created
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Form Data Message */}
        {!loading && (!selectedForm || !client.latestSubmission?.answers || Object.keys(client.latestSubmission?.answers || {}).length === 0) && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center py-8">
              <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Form Responses</h3>
              <p className="text-gray-500">
                {client.selectedFormId 
                  ? "This client hasn't filled out the selected form yet."
                  : "No form was selected for this client."
                }
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
          {client.subscriptions.map((subscription, index) => (
            <div key={subscription.id} className="border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <CreditCardIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Subscription #{subscription.id}</h4>
                    <p className="text-sm text-gray-600">Created on {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPaymentStatusColor(subscription.paymentStatus)}`}>
                  {subscription.paymentStatus}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-blue-700">
                    ${(subscription.priceAfterDisc || 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-900 mb-1">Installments</p>
                  <p className="text-2xl font-bold text-green-700">{subscription.installments?.length || 0} payments</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-purple-900 mb-1">Transaction Images</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {subscription.installments?.reduce((sum, inst) => sum + (inst.transactionImages?.length || 0), 0) || 0} uploaded
                  </p>
                </div>
              </div>

              {/* Installments */}
              <div className="mt-6">
                <h5 className="font-medium text-gray-900 mb-3">Payment History</h5>
                <div className="space-y-3">
                  {subscription.installments?.map((installment) => (
                    <div key={installment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          installment.status === 'PAID' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-gray-900">${(installment.amount || 0).toFixed(2)}</p>
                          <p className="text-sm text-gray-600">{installment.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {installment.transactionImages?.length || 0} images
                        </p>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-4 text-gray-500">
                      No installments found
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Check-ins Tab Component
function CheckinsTab({ client }: { client: Client }) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-6">Check-in Responses</h3>
      
      <div className="text-center py-12">
        <ClipboardDocumentListIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Check-in Responses</h3>
        <p className="text-gray-500">This client hasn't submitted any check-in responses yet.</p>
        <div className="mt-4">
          <Button outline>
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Create Check-in Form
          </Button>
        </div>
      </div>
    </div>
  );
}

// Notes Tab Component
function NotesTab({ client }: { client: Client }) {
  const [notes, setNotes] = useState(client.notes || []);
  const [showAddNote, setShowAddNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteContent, setEditingNoteContent] = useState('');

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

      setNotes(prev => [newNote, ...prev]);
      setNewNoteContent('');
      setShowAddNote(false);
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

      setNotes(prev => prev.map(note => 
        note.id === noteId 
          ? { ...note, content: editingNoteContent.trim(), updatedAt: new Date().toISOString() }
          : note
      ));
      setEditingNoteId(null);
      setEditingNoteContent('');
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleDeleteNote = async (noteId: string) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/clients/${client.id}/notes/${noteId}`, {
      //   method: 'DELETE'
      // });

      setNotes(prev => prev.filter(note => note.id !== noteId));
      setShowDeleteConfirm(null);
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
      
      {notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map((note: any, index: number) => (
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