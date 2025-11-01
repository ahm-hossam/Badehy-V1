'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TokenStorage, MealCompletionStorage } from '@/lib/storage';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function HomePage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [nutritionData, setNutritionData] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [assignedForms, setAssignedForms] = useState<any[]>([]);
  const [completedMeals, setCompletedMeals] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL || '/logo.png';
  const avatarPlaceholderUrl = process.env.NEXT_PUBLIC_AVATAR_PLACEHOLDER_URL;

  const fetchAll = useCallback(async () => {
    try {
      setError('');
      let token = (globalThis as any).ACCESS_TOKEN || await TokenStorage.getAccessToken();
      if (!token) {
        router.push('/login');
        return;
      }

      // Import apiRequest once for all requests
      const { apiRequest } = await import('@/lib/auth');
      
      // Fetch client info and subscription - use apiRequest which handles token refresh
      const meRes = await apiRequest('/mobile/me', { method: 'GET' });
      
      if (!meRes.ok) {
        const contentType = meRes.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Server error: ${meRes.status} ${meRes.statusText}`);
        }
        const errorData = await meRes.json();
        throw new Error(errorData?.error || errorData?.message || `Failed to load client info (${meRes.status})`);
      }
      
      const contentType = meRes.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      
      const meJson = await meRes.json();
      
      if (meRes.ok) {
        setClient(meJson.client);
        setSubscription(meJson.subscription);
        if (meJson.client?.id) {
          const savedCompletions = await MealCompletionStorage.getMealCompletions(meJson.client.id);
          setCompletedMeals(savedCompletions);
          await MealCompletionStorage.cleanupOldCompletions(meJson.client.id);
        }
        if (meJson?.subscription?.expired) {
          router.push('/blocked');
          return;
        }
      } else if (meRes.status === 401) {
        // apiRequest should have already tried to refresh the token
        // If we still get 401, it means refresh failed and tokens were already cleared
        // Double-check and redirect if needed
        const token = await TokenStorage.getAccessToken();
        if (!token) {
          router.push('/login');
          return;
        }
        // If token still exists, don't clear it - might be a temporary network issue
        setError('Authentication failed. Please try again.');
      }

      // Fetch active workout program
      const programRes = await apiRequest('/mobile/programs/active', { method: 'GET' });
      if (programRes.ok) {
        const contentType = programRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const programJson = await programRes.json();
            setData(programJson.assignment || programJson);
          } catch (e) {
            console.warn('[Home] Failed to parse workout program JSON');
          }
        }
      }

      // Fetch active nutrition program
      const nutritionRes = await apiRequest('/mobile/nutrition/active', { method: 'GET' });
      if (nutritionRes.ok) {
        const contentType = nutritionRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const nutritionJson = await nutritionRes.json();
            setNutritionData(nutritionJson.assignment || nutritionJson);
          } catch (e) {
            console.warn('[Home] Failed to parse nutrition program JSON');
          }
        }
      }

      // Fetch assigned forms (skipping for now as per requirements)
      // const formsRes = await fetch(`${API}/mobile/forms/assigned`, {
      //   headers: { Authorization: `Bearer ${token}` },
      // });
      // const formsJson = await formsRes.json();
      // if (formsRes.ok) {
      //   setAssignedForms(formsJson.forms || []);
      // }

    } catch (e: any) {
      console.error('Error fetching home data:', e);
      // Only clear tokens and redirect if it's a confirmed auth failure
      // apiRequest already handles token refresh automatically
      // Only clear if refresh explicitly failed
      const errorMsg = e.message || '';
      if (errorMsg.includes('Session expired') || 
          (errorMsg.includes('No access token') && !errorMsg.includes('refresh'))) {
        // Give it one more chance - check if token exists
        const stillHasToken = await TokenStorage.getAccessToken();
        if (!stillHasToken) {
          // Token was already cleared (probably by apiRequest after failed refresh)
          router.push('/login');
          return;
        }
        // If we still have a token, it might just need a moment
        // Don't clear it, just show error and let user retry
      }
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => { 
    fetchAll(); 
  }, [fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getSubscriptionStatus = () => {
    if (!subscription) {
      if (client?.subscriptions?.[0]) {
        const sub = client.subscriptions[0];
        const endDate = new Date(sub.endDate);
        const now = new Date();
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysLeft < 0 || sub.isCanceled) return { status: 'Expired', color: '#EF4444' };
        if (daysLeft <= 7) return { status: `${daysLeft} days left`, color: '#F59E0B' };
        return { status: 'Active', color: '#10B981' };
      }
      return { status: 'No Subscription', color: '#EF4444' };
    }
    
    if (subscription.expired) {
      return { status: 'Expired', color: '#EF4444' };
    }
    
    if (subscription.endDate) {
      const endDate = new Date(subscription.endDate);
      const now = new Date();
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft < 0) return { status: 'Expired', color: '#EF4444' };
      if (daysLeft <= 7) return { status: `${daysLeft} days left`, color: '#F59E0B' };
      if (daysLeft <= 30) return { status: `Active (${daysLeft} days left)`, color: '#10B981' };
      return { status: 'Active', color: '#10B981' };
    }
    
    return { status: 'Active', color: '#10B981' };
  };

  const getTodayWorkoutStatus = () => {
    const program = data?.program;
    if (!program?.weeks) {
      return { completed: false, hasWorkout: false };
    }
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    
    let foundCompletedToday = false;
    let hasActiveSessionToday = false;
    
    for (const week of program.weeks || []) {
      for (const day of week.days || []) {
        if (day.dayType !== 'off' && day.workoutSessions) {
          for (const session of day.workoutSessions) {
            if (session.status === 'completed' && session.completedAt) {
              const completedDate = new Date(session.completedAt);
              if (completedDate >= todayStart && completedDate < todayEnd) {
                foundCompletedToday = true;
                break;
              }
            }
            if (session.status === 'active' || session.status === 'paused') {
              const startedDate = session.startedAt ? new Date(session.startedAt) : null;
              if (startedDate && startedDate >= todayStart && startedDate < todayEnd) {
                hasActiveSessionToday = true;
              }
            }
          }
        }
        if (foundCompletedToday) break;
      }
      if (foundCompletedToday) break;
    }
    
    return { 
      completed: foundCompletedToday, 
      hasWorkout: foundCompletedToday || hasActiveSessionToday || Boolean(program)
    };
  };

  const getTodayMealsStatus = () => {
    const nutritionProgram = nutritionData?.nutritionProgram;
    if (!nutritionProgram?.weeks) {
      return { completed: false, hasMeals: false, completedCount: 0, totalCount: 0 };
    }
    
    const currentWeekIndex = 0;
    const currentWeek = nutritionProgram.weeks[currentWeekIndex];
    if (!currentWeek?.days || currentWeek.days.length === 0) {
      return { completed: false, hasMeals: false, completedCount: 0, totalCount: 0 };
    }
    
    const todayDayOfWeek = new Date().getDay();
    const today = todayDayOfWeek === 0 ? 7 : todayDayOfWeek;
    
    const todayDayIndex = currentWeek.days.findIndex((day: any) => day.dayOfWeek === today);
    if (todayDayIndex === -1) {
      return { completed: false, hasMeals: false, completedCount: 0, totalCount: 0 };
    }
    
    const todayDay = currentWeek.days[todayDayIndex];
    if (!todayDay.meals || todayDay.meals.length === 0) {
      return { completed: false, hasMeals: true, completedCount: 0, totalCount: 0 };
    }
    
    const totalMeals = todayDay.meals.length;
    let completedCount = 0;
    
    todayDay.meals.forEach((meal: any) => {
      const mealKey = `${currentWeekIndex}-${todayDayIndex}-${meal.id}`;
      if (completedMeals.has(mealKey)) {
        completedCount++;
      }
    });
    
    const allCompleted = completedCount === totalMeals && totalMeals > 0;
    
    return { 
      completed: allCompleted,
      hasMeals: true,
      completedCount,
      totalCount: totalMeals
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const subscriptionStatus = getSubscriptionStatus();
  const workoutStatus = getTodayWorkoutStatus();
  const mealsStatus = getTodayMealsStatus();

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="h-[45px] overflow-hidden">
            <img
              src={logoUrl}
              alt="Logo"
              className="h-8 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-3">
            <Link href="/profile" className="flex items-center gap-3">
              <span className="text-base font-semibold text-slate-900">
                {client?.fullName || client?.email || 'User'}
              </span>
              {client?.avatarUrl ? (
                <img
                  src={client.avatarUrl}
                  alt="Avatar"
                  className="w-9 h-9 rounded-full bg-slate-200"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-5 space-y-4">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">
            {getGreeting()}, {client?.fullName?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-base text-slate-500">
            Ready to crush your fitness goals today?
          </p>
        </div>

        {/* Quick Status Cards */}
        <div className="space-y-3 mb-4">
          {/* Today's Workout Status */}
          <div className="bg-white rounded-2xl p-4 flex items-center shadow-sm border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mr-3">
              <svg className={`w-6 h-6 ${data?.program ? 'text-slate-600' : 'text-slate-400'}`} fill="currentColor" viewBox="0 0 24 24">
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="12" r="3"/>
                <rect x="8" y="11" width="8" height="2" rx="1"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900 mb-1">Today's Workout</p>
              <p className={`text-sm ${!data?.program ? 'text-slate-400' : 'text-slate-600'}`}>
                {workoutStatus.completed 
                  ? 'Completed' 
                  : data?.program 
                    ? 'Not Started' 
                    : 'No program assigned'}
              </p>
            </div>
            {workoutStatus.completed && (
              <div className="ml-2">
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Today's Meals Status */}
          <div className="bg-white rounded-2xl p-4 flex items-center shadow-sm border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mr-3">
              <svg className={`w-6 h-6 ${nutritionData?.nutritionProgram ? 'text-slate-600' : 'text-slate-400'}`} fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 12c0-1.5 1.5-3 4-3s4 1.5 4 3" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900 mb-1">Today's Meals</p>
              <p className={`text-sm ${!nutritionData?.nutritionProgram ? 'text-slate-400' : 'text-slate-600'}`}>
                {mealsStatus.completed 
                  ? 'All Completed' 
                  : mealsStatus.totalCount > 0 
                    ? `${mealsStatus.completedCount}/${mealsStatus.totalCount} Completed`
                    : nutritionData?.nutritionProgram
                      ? 'No meals scheduled'
                      : 'No program assigned'}
              </p>
            </div>
            {mealsStatus.completed && (
              <div className="ml-2">
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Program Overview */}
        {(data?.program || nutritionData?.nutritionProgram) && (
          <div className="space-y-4">
            {data?.program && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center mb-3">
                  <svg className="w-6 h-6 text-indigo-600 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="12" r="3"/>
                    <rect x="8" y="11" width="8" height="2" rx="1"/>
                  </svg>
                  <h2 className="text-lg font-semibold text-slate-900">Current Workout Program</h2>
                </div>
                <h3 className="text-base font-medium text-slate-900 mb-1">{data.program.name}</h3>
                {data.program.description && (
                  <p className="text-sm text-slate-600 mb-3">{data.program.description}</p>
                )}
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-slate-600">
                      {data.program.weeks?.length || 0} weeks
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-slate-600">
                      {data.program.weeks?.reduce((acc: number, week: any) => 
                        acc + (week.days?.filter((day: any) => day.dayType !== 'off').length || 0), 0
                      ) || 0} workout days
                    </span>
                  </div>
                </div>
                <Link
                  href="/workout"
                  className="flex items-center justify-center gap-2 p-3 border border-indigo-600 rounded-xl text-indigo-600 font-semibold text-base"
                >
                  <span>View Program</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
            
            {nutritionData?.nutritionProgram && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center mb-3">
                  <svg className="w-6 h-6 text-green-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 12c0-1.5 1.5-3 4-3s4 1.5 4 3" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                  <h2 className="text-lg font-semibold text-slate-900">Current Nutrition Program</h2>
                </div>
                <h3 className="text-base font-medium text-slate-900 mb-1">{nutritionData.nutritionProgram.name}</h3>
                {nutritionData.nutritionProgram.description && (
                  <p className="text-sm text-slate-600 mb-3">{nutritionData.nutritionProgram.description}</p>
                )}
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-slate-600">
                      {nutritionData.nutritionProgram.weeks?.length || 0} weeks
                    </span>
                  </div>
                  {nutritionData.nutritionProgram.targetCalories && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      </svg>
                      <span className="text-sm text-slate-600">
                        {Math.round(nutritionData.nutritionProgram.targetCalories)} cal/day
                      </span>
                    </div>
                  )}
                </div>
                <Link
                  href="/nutrition"
                  className="flex items-center justify-center gap-2 p-3 border border-green-500 rounded-xl text-green-500 font-semibold text-base"
                >
                  <span>View Program</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Subscription Status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center mb-2">
            <svg className="w-6 h-6 mr-2" style={{ color: subscriptionStatus.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h2 className="text-lg font-semibold text-slate-900">Subscription</h2>
          </div>
          <p className="text-base font-semibold mb-4" style={{ color: subscriptionStatus.color }}>
            {subscriptionStatus.status}
          </p>
          <Link
            href="/profile"
            className="flex items-center justify-center gap-2 p-3 text-slate-600 font-medium text-base"
          >
            <span>View Details</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-600 flex-1">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
