"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import { Select } from '@/components/select';
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
  ArrowLeftIcon
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
    installments: Array<{
      id: number;
      amount: number;
      status: string;
      transactionImages: Array<{
        id: number;
        filename: string;
        originalName: string;
        uploadedAt: string;
      }>;
    }>;
  }>;
}

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadClientDetails();
  }, [clientId]);

  const loadClientDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data);
      } else {
        console.error('Failed to load client details');
      }
    } catch (error) {
      console.error('Error loading client details:', error);
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
    { id: 'notes', name: 'Notes', icon: ChatBubbleLeftRightIcon, count: 0 },
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{client.fullName}</h1>
              <p className="text-gray-600">Client ID: {client.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button outline onClick={() => router.push(`/clients/edit/${client.id}`)}>
              <EyeIcon className="h-4 w-4 mr-2" />
              View Full Profile
            </Button>
            <Button onClick={() => setEditing(!editing)}>
              <PencilIcon className="h-4 w-4 mr-2" />
              {editing ? 'Cancel Edit' : 'Edit Client'}
            </Button>
          </div>
        </div>

        {/* Profile Completion Badge */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getProfileCompletionColor(client.profileCompletion)}`}>
              {client.profileCompletion === 'Completed' ? (
                <ShieldCheckIcon className="h-4 w-4 mr-1" />
              ) : (
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              )}
              {client.profileCompletion}
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Profile Completion</span>
                <span>{getProfileCompletionPercentage()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${getProfileCompletionPercentage()}%` }}
                ></div>
              </div>
            </div>
          </div>
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
          {activeTab === 'overview' && <OverviewTab client={client} />}
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
function OverviewTab({ client }: { client: Client }) {
  const totalPayments = client.subscriptions.reduce((sum, sub) => sum + sub.priceAfterDisc, 0);
  const activeSubscriptions = client.subscriptions.filter(sub => sub.paymentStatus === 'PAID').length;
  const daysSinceRegistration = Math.floor((Date.now() - new Date(client.registrationDate).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-6">Client Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Basic Info Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 rounded-lg">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-900">Basic Info</p>
              <p className="text-lg font-semibold text-blue-700">{client.fullName}</p>
              <p className="text-sm text-blue-600">{client.email}</p>
            </div>
          </div>
        </div>

        {/* Contact Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg">
              <PhoneIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-900">Contact</p>
              <p className="text-lg font-semibold text-green-700">{client.phone}</p>
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
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-900">Financial</p>
              <p className="text-lg font-semibold text-purple-700">${totalPayments.toFixed(2)}</p>
              <p className="text-sm text-purple-600">{activeSubscriptions} active subscriptions</p>
            </div>
          </div>
        </div>

        {/* Registration Card */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-500 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-orange-900">Member Since</p>
              <p className="text-lg font-semibold text-orange-700">
                {new Date(client.registrationDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-orange-600">{daysSinceRegistration} days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Goals and Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h4 className="font-semibold mb-4 flex items-center text-gray-900">
            <FireIcon className="h-5 w-5 mr-2 text-red-500" />
            Fitness Goals & Preferences
          </h4>
          <div className="space-y-3">
            <div className="flex items-start">
              <StarIcon className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Primary Goal</p>
                <p className="text-gray-600">{client.goal || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-start">
              <MapPinIcon className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Workout Place</p>
                <p className="text-gray-600">{client.workoutPlace || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-start">
              <ClockIcon className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Training Schedule</p>
                <p className="text-gray-600">{client.preferredTrainingDays} at {client.preferredTrainingTime}</p>
              </div>
            </div>
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Weak Areas</p>
                <p className="text-gray-600">{client.weakAreas || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h4 className="font-semibold mb-4 flex items-center text-gray-900">
            <HeartIcon className="h-5 w-5 mr-2 text-green-500" />
            Nutrition & Health
          </h4>
          <div className="space-y-3">
            <div className="flex items-start">
              <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Nutrition Goal</p>
                <p className="text-gray-600">{client.nutritionGoal || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-start">
              <DocumentTextIcon className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Diet Preference</p>
                <p className="text-gray-600">{client.dietPreference || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-start">
              <ClockIconSolid className="h-4 w-4 text-purple-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Meals per Day</p>
                <p className="text-gray-600">{client.mealCount || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Allergies</p>
                <p className="text-gray-600">{client.foodAllergies || 'None'}</p>
              </div>
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
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Profile Information</h3>
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information */}
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-blue-500" />
              Basic Information
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <Input
                  value={client.fullName}
                  disabled={!editing}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input
                    value={client.email}
                    disabled={!editing}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <Input
                    value={client.phone}
                    disabled={!editing}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <Input
                    value={client.gender}
                    disabled={!editing}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <Input
                    value={client.age}
                    disabled={!editing}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Physical Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-green-500" />
              Physical Information
            </h4>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                  <Input
                    value={client.height || ''}
                    disabled={!editing}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <Input
                    value={client.weight || ''}
                    disabled={!editing}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workout Place</label>
                <Input
                  value={client.workoutPlace || ''}
                  disabled={!editing}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Days</label>
                  <Input
                    value={client.preferredTrainingDays || ''}
                    disabled={!editing}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                  <Input
                    value={client.preferredTrainingTime || ''}
                    disabled={!editing}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Goals and Nutrition */}
        <div className="space-y-6">
          {/* Goals and Preferences */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <FireIcon className="h-5 w-5 mr-2 text-red-500" />
              Goals and Preferences
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Goal</label>
                <Textarea
                  value={client.goal || ''}
                  disabled={!editing}
                  rows={3}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weak Areas</label>
                <Textarea
                  value={client.weakAreas || ''}
                  disabled={!editing}
                  rows={3}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Availability</label>
                  <Input
                    value={client.equipmentAvailability || ''}
                    disabled={!editing}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Favorite Training Style</label>
                  <Input
                    value={client.favoriteTrainingStyle || ''}
                    disabled={!editing}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Nutrition Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <HeartIcon className="h-5 w-5 mr-2 text-green-500" />
              Nutrition Information
            </h4>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nutrition Goal</label>
                  <Input
                    value={client.nutritionGoal || ''}
                    disabled={!editing}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diet Preference</label>
                  <Input
                    value={client.dietPreference || ''}
                    disabled={!editing}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meals per Day</label>
                  <Input
                    value={client.mealCount || ''}
                    disabled={!editing}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Nutrition Plan</label>
                  <Input
                    value={client.currentNutritionPlan || ''}
                    disabled={!editing}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Food Allergies</label>
                <Textarea
                  value={client.foodAllergies || ''}
                  disabled={!editing}
                  rows={2}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disliked Ingredients</label>
                <Textarea
                  value={client.dislikedIngredients || ''}
                  disabled={!editing}
                  rows={2}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
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
                  <p className="text-2xl font-bold text-blue-700">${subscription.priceAfterDisc.toFixed(2)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-900 mb-1">Installments</p>
                  <p className="text-2xl font-bold text-green-700">{subscription.installments.length} payments</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-purple-900 mb-1">Transaction Images</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {subscription.installments.reduce((sum, inst) => sum + inst.transactionImages.length, 0)} uploaded
                  </p>
                </div>
              </div>

              {/* Installments */}
              <div className="mt-6">
                <h5 className="font-medium text-gray-900 mb-3">Payment History</h5>
                <div className="space-y-3">
                  {subscription.installments.map((installment) => (
                    <div key={installment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          installment.status === 'PAID' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-gray-900">${installment.amount.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">{installment.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {installment.transactionImages.length} images
                        </p>
                      </div>
                    </div>
                  ))}
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
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-6">Notes & Communication</h3>
      
      <div className="text-center py-12">
        <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Notes Yet</h3>
        <p className="text-gray-500">No notes or communication history for this client.</p>
        <div className="mt-4">
          <Button outline>
            <PencilIcon className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>
      </div>
    </div>
  );
} 