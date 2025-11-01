'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TokenStorage } from '@/lib/storage';

// Use relative paths to go through Next.js rewrites (works in both browser and WebView)
// In browser/WebView, empty string means relative paths which go through Next.js rewrites
// For SSR or direct backend access, use the full URL
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // Check if we're in a WebView - WebView might need absolute URLs
    const isWebView = !!(window as any).ReactNativeWebView;
    if (isWebView) {
      // In WebView, use the same origin as the page (localhost:3002)
      // This will go through Next.js rewrites
      const protocol = window.location.protocol;
      const host = window.location.host;
      return `${protocol}//${host}`;
    }
    return ''; // Use relative paths (goes through Next.js rewrites)
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
};

export default function WorkoutPage() {
  const router = useRouter();
  const [assignment, setAssignment] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(0);

  const fetchWorkoutData = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      let token = (globalThis as any).ACCESS_TOKEN || await TokenStorage.getAccessToken();
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch client info and subscription status
      let meRes: Response;
      const apiUrl = getApiUrl();
      const meUrl = `${apiUrl}/mobile/me`;
      console.log('[Workout] Fetching:', meUrl);
      
      try {
        meRes = await fetch(meUrl, { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'skip_zrok_interstitial': 'true'
          } 
        });
      } catch (networkError: any) {
        console.error('[Workout] Network error:', networkError);
        throw new Error('Connection failed. Please check your internet connection and try again.');
      }
      
      console.log('[Workout] Response status:', meRes.status, 'Content-Type:', meRes.headers.get('content-type'));
      
      // Check content type BEFORE reading body
      const contentType = meRes.headers.get('content-type');
      const text = await meRes.text();
      
      // Check if response is HTML (Next.js error page or zrok interstitial)
      const isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');
      if (isHtml) {
        console.error('[Workout] Received HTML instead of JSON:', text.substring(0, 300));
        // Check if it's a zrok interstitial
        const isZrok = text.includes('zrok') || text.includes('interstitial');
        if (isZrok) {
          console.warn('[Workout] Zrok interstitial detected - request blocked by proxy');
          throw new Error('Network proxy issue. Please wait a moment and try again.');
        }
        throw new Error('Server returned an error page. Please try again.');
      }
      
      if (!meRes.ok) {
        // Check if it's actually JSON before trying to parse
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorJson = text ? JSON.parse(text) : {};
            throw new Error(errorJson?.error || errorJson?.message || `Failed to fetch client info (${meRes.status})`);
          } catch (parseError: any) {
            if (parseError.message && parseError.message.includes('Failed to fetch')) {
              throw parseError;
            }
            throw new Error(`Failed to fetch client info (${meRes.status})`);
          }
        } else {
          // HTML error page or non-JSON response
          console.error('[Workout] Non-JSON error response:', text.substring(0, 200));
          throw new Error(`Server error: ${meRes.status} ${meRes.statusText}`);
        }
      }
      
      // Check content type for successful responses
      if (!contentType || !contentType.includes('application/json')) {
        console.error('[Workout] Non-JSON success response:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response');
      }
      
      let meJson: any = {};
      try {
        if (!text || text.trim() === '') {
          throw new Error('Empty response from server');
        }
        meJson = JSON.parse(text);
      } catch (parseError: any) {
        console.error('[Workout] JSON parse error:', parseError, 'Text:', text.substring(0, 200));
        throw new Error(parseError.message || 'Failed to parse server response');
      }
      
      if (meJson?.subscription?.expired) {
        router.push('/blocked');
        return;
      }

      // Fetch active program
      let programRes: Response;
      const programUrl = `${apiUrl}/mobile/programs/active`;
      console.log('[Workout] Fetching program:', programUrl);
      
      try {
        programRes = await fetch(programUrl, { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'skip_zrok_interstitial': 'true'
          } 
        });
      } catch (networkError: any) {
        console.error('[Workout] Network error fetching program:', networkError);
        throw new Error('Connection failed. Please check your internet connection and try again.');
      }
      
      console.log('[Workout] Program response status:', programRes.status, 'Content-Type:', programRes.headers.get('content-type'));
      
      // Check content type BEFORE reading body
      const programContentType = programRes.headers.get('content-type');
      const programText = await programRes.text();
      
      // Check if response is HTML (Next.js error page or zrok interstitial)
      const isProgramHtml = programText.trim().startsWith('<!DOCTYPE') || programText.trim().startsWith('<html');
      if (isProgramHtml) {
        console.error('[Workout] Received HTML instead of JSON for program:', programText.substring(0, 300));
        // Check if it's a zrok interstitial
        const isZrok = programText.includes('zrok') || programText.includes('interstitial');
        if (isZrok) {
          console.warn('[Workout] Zrok interstitial detected for program - request may be blocked by proxy');
          throw new Error('Network proxy issue. Please wait a moment and try again.');
        }
        throw new Error('Server returned an error page. Please try again.');
      }
      
      if (!programRes.ok) {
        // Check if it's actually JSON before trying to parse
        if (programContentType && programContentType.includes('application/json')) {
          try {
            const errorJson = programText ? JSON.parse(programText) : {};
            throw new Error(errorJson?.error || errorJson?.message || `Failed to fetch active program (${programRes.status})`);
          } catch (parseError: any) {
            if (parseError.message && parseError.message.includes('Failed to fetch')) {
              throw parseError;
            }
            throw new Error(`Failed to fetch active program (${programRes.status})`);
          }
        } else {
          // HTML error page or non-JSON response
          console.error('[Workout] Non-JSON error response:', programText.substring(0, 200));
          throw new Error(`Server error: ${programRes.status} ${programRes.statusText}`);
        }
      }
      
      // Check content type for successful responses
      if (!programContentType || !programContentType.includes('application/json')) {
        console.error('[Workout] Non-JSON response:', programText.substring(0, 200));
        // Empty response might mean no program assigned
        setAssignment(null);
        return;
      }
      
      let programJson: any = {};
      try {
        if (!programText || programText.trim() === '') {
          // Empty response might mean no program assigned
          setAssignment(null);
          return;
        }
        programJson = JSON.parse(programText);
      } catch (parseError: any) {
        console.error('[Workout] JSON parse error for program:', parseError, 'Text:', programText.substring(0, 200));
        throw new Error(parseError.message || 'Failed to parse server response');
      }
      
      setAssignment(programJson.assignment);

      // Fetch active session
      let sessionRes: Response | undefined;
      try {
        const apiUrl = getApiUrl();
        sessionRes = await fetch(`${apiUrl}/mobile/sessions/active`, { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'skip_zrok_interstitial': 'true'
          } 
        });
      } catch (networkError: any) {
        // Session fetch failure is not critical, continue without it
        console.warn('Failed to fetch active session:', networkError);
        sessionRes = undefined;
      }
      
      if (sessionRes) {
        // Check content type BEFORE reading body
        const sessionContentType = sessionRes.headers.get('content-type');
        if (sessionContentType && sessionContentType.includes('application/json') && sessionRes.ok) {
          let sessionJson: any = {};
          try {
            const text = await sessionRes.text();
            if (text) {
              sessionJson = JSON.parse(text);
              setActiveSession(sessionJson.session);
            }
          } catch (parseError) {
            // Session parse error is not critical
            console.warn('[Workout] Failed to parse session response:', parseError);
          }
        }
      }

    } catch (e: any) {
      console.error("Error fetching workout data:", e);
      setError(e.message || 'Failed to load workout program. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchWorkoutData();
  }, [fetchWorkoutData]);

  const getDayStatus = (day: any) => {
    const session = day.workoutSessions?.[0];
    if (session) {
      switch (session.status) {
        case 'completed':
          return { status: 'completed', text: 'Completed', color: '#10B981' };
        case 'active':
          return { status: 'active', text: 'In Progress', color: '#4F46E5' };
        case 'paused':
          return { status: 'paused', text: 'Paused', color: '#F59E0B' };
        default:
          return { status: 'not-started', text: 'Not Started', color: '#6B7280' };
      }
    }
    return { status: 'not-started', text: 'Not Started', color: '#6B7280' };
  };

  const getWeekStatus = (week: any) => {
    if (!week.days || week.days.length === 0) return { isCompleted: false, completedDays: 0, totalDays: 0 };
    
    const totalDays = week.days.length;
    const completedDays = week.days.filter((day: any) => {
      if (day.dayType === 'off') return true;
      const session = day.workoutSessions?.[0];
      return session && session.status === 'completed';
    }).length;
    
    return {
      isCompleted: completedDays === totalDays,
      completedDays,
      totalDays
    };
  };

  const formatWorkoutDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getWorkoutDuration = (day: any) => {
    const session = day.workoutSessions?.[0];
    if (session && session.status === 'completed' && session.totalDuration) {
      return formatWorkoutDuration(session.totalDuration);
    }
    return null;
  };

  const handleDayPress = (day: any) => {
    router.push(`/day-detail?dayId=${day.id}&assignmentId=${assignment.id}&dayName=${encodeURIComponent(day.name || `Day ${day.dayNumber}`)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading your workout program...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pb-20 px-4">
        <div className="text-center max-w-sm">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchWorkoutData}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isEmpty = !assignment || !assignment.program;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 pt-2 pb-1.5">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Workout</h1>
        <p className="text-base text-slate-600">Your personalized training program</p>
      </div>

      <div className="px-4 py-2">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="w-15 h-15 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-semibold text-slate-600 mb-1">No workout program assigned yet.</p>
            <p className="text-sm text-slate-400">Your trainer will assign a program soon!</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Program Summary Card */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 mr-3">
                  <h2 className="text-xl font-bold text-slate-900 mb-1">{assignment.program.name}</h2>
                  {assignment.program.description && (
                    <p className="text-sm text-slate-600 leading-5">{assignment.program.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-2 rounded-full">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-indigo-600">{assignment.program.weeks.length} Weeks</span>
                </div>
              </div>
            </div>

            {/* Week Tabs */}
            <div className="overflow-x-auto -mx-4 px-4">
              <div className="flex gap-1" style={{ width: 'max-content' }}>
                {assignment.program.weeks.map((week: any, index: number) => {
                  const weekStatus = getWeekStatus(week);
                  return (
                    <button
                      key={week.id}
                      onClick={() => setSelectedWeek(index)}
                      className={`px-5 py-2.5 rounded-full whitespace-nowrap transition-colors ${
                        selectedWeek === index
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {weekStatus.isCompleted && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className="text-base font-semibold">{week.name || `Week ${week.weekNumber}`}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Days List */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                {assignment.program.weeks[selectedWeek]?.name || `Week ${assignment.program.weeks[selectedWeek]?.weekNumber}`}
              </h3>
              
              <div className="space-y-3">
                {assignment.program.weeks[selectedWeek]?.days.map((day: any) => {
                  const dayStatus = getDayStatus(day);
                  const isOffDay = day.dayType === 'off';
                  const exerciseCount = day.exercises?.length || 0;
                  const workoutDuration = getWorkoutDuration(day);

                  return (
                    <div
                      key={day.id}
                      className={`bg-white rounded-2xl p-4 shadow-sm border ${
                        isOffDay
                          ? 'bg-amber-50 border-amber-200'
                          : 'border-slate-200 cursor-pointer hover:shadow-md transition-shadow'
                      }`}
                      onClick={() => !isOffDay && handleDayPress(day)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className={`text-lg font-semibold ${isOffDay ? 'text-amber-900' : 'text-slate-900'}`}>
                            {day.name || `Day ${day.dayNumber}`}
                          </h4>
                          {!isOffDay ? (
                            <div className="mt-0.5">
                              <p className="text-sm text-slate-600">
                                {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                              </p>
                              {workoutDuration && (
                                <p className="text-sm font-medium text-green-600 mt-0.5">
                                  Completed in {workoutDuration}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm font-semibold text-amber-900 mt-0.5">Rest Day</p>
                          )}
                        </div>
                        <div className="ml-2">
                          {!isOffDay && (
                            <div
                              className="px-2.5 py-1 rounded-full text-white text-xs font-bold"
                              style={{ backgroundColor: dayStatus.color }}
                            >
                              {dayStatus.text}
                            </div>
                          )}
                          {isOffDay && (
                            <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                          )}
                        </div>
                      </div>

                      {!isOffDay && (
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                          <p className="text-sm text-slate-400">Tap to view exercises and start workout</p>
                          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                      {isOffDay && (
                        <div className="mt-2 pt-2">
                          <p className="text-sm text-amber-700 italic">Enjoy your recovery day!</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
