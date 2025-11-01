'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TokenStorage } from '@/lib/storage';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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

export default function DayDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayId = searchParams.get('dayId');
  const assignmentId = searchParams.get('assignmentId');
  const dayName = searchParams.get('dayName');
  
  const [dayData, setDayData] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [error, setError] = useState('');
  const [notesModal, setNotesModal] = useState<{visible: boolean, notes: string, exerciseName: string}>({
    visible: false,
    notes: '',
    exerciseName: ''
  });
  const [videoModal, setVideoModal] = useState<{visible: boolean, videoUrl: string, exerciseName: string}>({
    visible: false,
    videoUrl: '',
    exerciseName: ''
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDayData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      let token = (globalThis as any).ACCESS_TOKEN || await TokenStorage.getAccessToken();
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch active program to get day data
      const apiUrl = getApiUrl();
      const programRes = await fetch(`${apiUrl}/mobile/programs/active`, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'skip_zrok_interstitial': 'true'
        } 
      });
      
      // Safe JSON parsing - read body first
      const programText = await programRes.text();
      
      // Check if response is HTML (zrok interstitial or Next.js error page)
      const isProgramHtml = programText.trim().startsWith('<!DOCTYPE') || programText.trim().startsWith('<html');
      if (isProgramHtml) {
        console.error('[DayDetail] Received HTML instead of JSON:', programText.substring(0, 300));
        const isZrok = programText.includes('zrok') || programText.includes('interstitial');
        if (isZrok) {
          console.warn('[DayDetail] Zrok interstitial detected - request blocked by proxy');
          throw new Error('Network proxy issue. Please wait a moment and try again.');
        }
        throw new Error('Server returned an error page. Please try again.');
      }
      
      // Check content type
      const contentType = programRes.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('[DayDetail] Non-JSON response (status 200):', programText.substring(0, 200));
        throw new Error('Server returned non-JSON response');
      }
      
      let programJson: any;
      try {
        programJson = JSON.parse(programText);
      } catch (parseError: any) {
        console.error('[DayDetail] JSON parse error:', parseError, 'Text:', programText.substring(0, 200));
        throw new Error('Failed to parse server response');
      }
      if (!programRes.ok) throw new Error(programJson.error || 'Failed to fetch program');

      // Find the specific day
      const day = programJson.assignment.program.weeks
        .flatMap((week: any) => week.days)
        .find((d: any) => d.id === Number(dayId));

      if (!day) throw new Error('Day not found');
      setDayData(day);

      // Fetch active session
      const apiUrl2 = getApiUrl();
      const sessionRes = await fetch(`${apiUrl2}/mobile/sessions/active`, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'skip_zrok_interstitial': 'true'
        } 
      });
      
      if (sessionRes.ok) {
        // Safe JSON parsing
        const sessionContentType = sessionRes.headers.get('content-type');
        if (sessionContentType && sessionContentType.includes('application/json')) {
          try {
            const sessionText = await sessionRes.text();
            // Check for HTML
            if (!sessionText.trim().startsWith('<!DOCTYPE') && !sessionText.trim().startsWith('<html')) {
              const sessionJson = JSON.parse(sessionText);
              setActiveSession(sessionJson.session);
            } else {
              console.warn('[DayDetail] Session response is HTML, skipping');
            }
          } catch (e) {
            console.warn('[DayDetail] Failed to parse session JSON:', e);
          }
        }
      }

    } catch (e: any) {
      console.error("Error fetching day data:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [dayId, router]);

  useEffect(() => {
    if (dayId) {
      fetchDayData();
    }
  }, [dayId, fetchDayData]);

  useEffect(() => {
    if (activeSession) {
      if (activeSession.status === 'active') {
        if (timerRef.current) clearInterval(timerRef.current);
        const startTime = new Date(activeSession.startedAt).getTime();
        const pausedTime = activeSession.pausedAt ? new Date(activeSession.pausedAt).getTime() - startTime : 0;
        const resumedTime = activeSession.resumedAt ? new Date(activeSession.resumedAt).getTime() : 0;
        
        timerRef.current = setInterval(() => {
          const now = Date.now();
          const baseTime = resumedTime > 0 ? resumedTime : startTime;
          const elapsed = Math.floor((now - baseTime) / 1000) + Math.floor(pausedTime / 1000);
          setSessionTimer(elapsed);
        }, 1000);
      } else if (activeSession.status === 'paused') {
        const startTime = new Date(activeSession.startedAt).getTime();
        const pausedTime = activeSession.pausedAt ? new Date(activeSession.pausedAt).getTime() - startTime : 0;
        setSessionTimer(Math.floor(pausedTime / 1000));
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setSessionTimer(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession]);

  const handleStartWorkout = async () => {
    try {
      let token = (globalThis as any).ACCESS_TOKEN || await TokenStorage.getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const apiUrl3 = getApiUrl();
      const res = await fetch(`${apiUrl3}/mobile/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'skip_zrok_interstitial': 'true'
        },
        body: JSON.stringify({ assignmentId: Number(assignmentId), dayId: Number(dayId) }),
      });
      
      // Safe JSON parsing - read body first
      const text = await res.text();
      
      // Check if response is HTML
      const isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');
      if (isHtml) {
        const isZrok = text.includes('zrok') || text.includes('interstitial');
        if (isZrok) {
          throw new Error('Network proxy issue. Please wait a moment and try again.');
        }
        throw new Error('Server returned an error page. Please try again.');
      }
      
      // Check content type
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server error: ${res.status}`);
      }
      
      let json: any;
      try {
        json = JSON.parse(text);
      } catch (parseError: any) {
        throw new Error('Failed to parse server response');
      }
      
      if (!res.ok) throw new Error(json.error || 'Failed to start workout');
      setActiveSession(json.session);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handlePauseResumeWorkout = async () => {
    try {
      let token = (globalThis as any).ACCESS_TOKEN || await TokenStorage.getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const action = activeSession.status === 'active' ? 'pause' : 'resume';
      const apiUrl4 = getApiUrl();
      const res = await fetch(`${apiUrl4}/mobile/sessions/${activeSession.id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'skip_zrok_interstitial': 'true'
        },
      });
      
      // Safe JSON parsing - read body first
      const text = await res.text();
      
      // Check if response is HTML
      const isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');
      if (isHtml) {
        const isZrok = text.includes('zrok') || text.includes('interstitial');
        if (isZrok) {
          throw new Error('Network proxy issue. Please wait a moment and try again.');
        }
        throw new Error('Server returned an error page. Please try again.');
      }
      
      // Check content type
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server error: ${res.status}`);
      }
      
      let json: any;
      try {
        json = JSON.parse(text);
      } catch (parseError: any) {
        throw new Error('Failed to parse server response');
      }
      
      if (!res.ok) throw new Error(json.error || `Failed to ${action} workout`);
      setActiveSession(json.session);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      let token = (globalThis as any).ACCESS_TOKEN || await TokenStorage.getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const apiUrl5 = getApiUrl();
      const res = await fetch(`${apiUrl5}/mobile/sessions/${activeSession.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'skip_zrok_interstitial': 'true'
        },
      });
      
      // Safe JSON parsing - read body first
      const text = await res.text();
      
      // Check if response is HTML
      const isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');
      if (isHtml) {
        const isZrok = text.includes('zrok') || text.includes('interstitial');
        if (isZrok) {
          throw new Error('Network proxy issue. Please wait a moment and try again.');
        }
        throw new Error('Server returned an error page. Please try again.');
      }
      
      // Check content type
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server error: ${res.status}`);
      }
      
      let json: any;
      try {
        json = JSON.parse(text);
      } catch (parseError: any) {
        throw new Error('Failed to parse server response');
      }
      if (!res.ok) throw new Error(json.error || 'Failed to complete workout');
      setActiveSession(null);
      router.push('/workout');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
      .map(v => v < 10 ? "0" + v : v)
      .filter((v, i) => v !== "00" || i > 0)
      .join(":");
  };

  const formatSets = (sets: any, exercise: any) => {
    if (!sets) return [];
    
    try {
      const setsArray = Array.isArray(sets) ? sets : JSON.parse(sets);
      if (!Array.isArray(setsArray) || setsArray.length === 0) return [];
      
      return setsArray.map((set: any, index: number) => {
        let reps = set.reps || 'N/A';
        const rest = set.rest ? `${set.rest}s` : '';
        const tempo = set.tempo || '';
        const modifiers = [];
        
        if (exercise.dropset) modifiers.push('Dropset');
        if (exercise.singleLeg) modifiers.push('Single Leg');
        if (exercise.failure) {
          modifiers.push('To Failure');
          reps = 'Failure';
        }

        return {
          setNumber: index + 1,
          reps: reps,
          rest: rest,
          tempo: tempo,
          modifiers: modifiers
        };
      });
    } catch {
      return [];
    }
  };

  const getGroupTypeColor = (groupType: string) => {
    switch (groupType?.toLowerCase()) {
      case 'superset': return '#4F46E5';
      case 'giant': return '#7C3AED';
      case 'circuit': return '#059669';
      case 'emom': return '#DC2626';
      case 'tabata': return '#EA580C';
      case 'rft': return '#0891B2';
      case 'amrap': return '#BE185D';
      default: return '#6B7280';
    }
  };

  const openNotesModal = (notes: string, exerciseName: string) => {
    setNotesModal({
      visible: true,
      notes,
      exerciseName
    });
  };

  const closeNotesModal = () => {
    setNotesModal({
      visible: false,
      notes: '',
      exerciseName: ''
    });
  };

  const openVideoModal = (videoUrl: string, exerciseName: string) => {
    setVideoModal({
      visible: true,
      videoUrl,
      exerciseName
    });
  };

  const closeVideoModal = () => {
    setVideoModal({
      visible: false,
      videoUrl: '',
      exerciseName: ''
    });
  };

  const getVideoUrl = (videoUrl: string | null | undefined) => {
    if (!videoUrl) return null;
    if (videoUrl.startsWith('http')) return videoUrl;
    // If relative path, prepend API URL
    const apiUrl6 = getApiUrl() || 'http://localhost:4000';
    const cleanPath = videoUrl.startsWith('/') ? videoUrl : `/${videoUrl}`;
    return `${apiUrl6}${cleanPath}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading workout details...</p>
        </div>
      </div>
    );
  }

  if (error && !dayData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pb-20 px-4">
        <div className="text-center max-w-sm">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!dayData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pb-20 px-4">
        <div className="text-center max-w-sm">
          <svg className="w-12 h-12 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-slate-600 mb-4">Day not found</p>
          <button
            onClick={() => router.back()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isOffDay = dayData.dayType === 'off';
  const isCurrentDayActive = activeSession && activeSession.dayId === Number(dayId) && (activeSession.status === 'active' || activeSession.status === 'paused');

  // Group exercises by superset
  const exercises = dayData.exercises || [];
  const groupedExercises: any[] = [];
  const processedIds = new Set<number>();

  exercises.forEach((exercise: any) => {
    if (processedIds.has(exercise.id)) return;

    if (exercise.groupType && exercise.groupType !== 'single' && exercise.groupType !== 'none') {
      const groupExercises = exercises.filter((e: any) => 
        e.groupId === exercise.groupId && e.groupType === exercise.groupType
      );
      
      groupExercises.forEach((e: any) => processedIds.add(e.id));
      groupedExercises.push({
        type: 'group',
        groupType: exercise.groupType,
        groupId: exercise.groupId,
        exercises: groupExercises
      });
    } else {
      processedIds.add(exercise.id);
      groupedExercises.push({
        type: 'single',
        exercise: exercise
      });
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 pt-3 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/workout')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{dayData.name || `Day ${dayData.dayNumber}`}</h1>
            <p className="text-sm text-slate-600">{dayData.exercises?.length || 0} exercises</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {isOffDay ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg className="w-20 h-20 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-slate-600 mt-4">Rest Day</h2>
            <p className="text-base text-slate-500 mt-2">Enjoy your recovery day!</p>
          </div>
        ) : (
          <>
            {/* Session Controls */}
            {isCurrentDayActive && (
              <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-slate-200">
                {/* Timer Display */}
                <div className="flex items-center gap-4 mb-5 pb-4 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-600 mb-1">Workout Time</p>
                    <p className="text-2xl font-bold text-slate-900">{formatTime(sessionTimer)}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handlePauseResumeWorkout}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-slate-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      {activeSession.status === 'active' ? (
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      ) : (
                        <path d="M8 5v14l11-7z" />
                      )}
                    </svg>
                    <span>{activeSession.status === 'active' ? 'Pause' : 'Resume'}</span>
                  </button>
                  
                  <button
                    onClick={handleCompleteWorkout}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span>Complete</span>
                  </button>
                </div>
              </div>
            )}

            {/* Exercises */}
            <div className="space-y-4">
              {groupedExercises.map((item, index) => {
                if (item.type === 'group') {
                  const groupColor = getGroupTypeColor(item.groupType);
                  return (
                    <div key={`group-${item.groupId}`} className="mb-5">
                      {/* Group Header */}
                      <div className="flex items-center gap-3 mb-3 px-1">
                        <div 
                          className="px-3 py-1.5 rounded-full text-white text-xs font-bold"
                          style={{ backgroundColor: groupColor }}
                        >
                          {item.groupType.toUpperCase()}
                        </div>
                        <p className="text-base font-semibold text-slate-700">
                          {item.exercises.length} Linked Exercises
                        </p>
                      </div>

                      {/* Group Exercises */}
                      {item.exercises.map((exercise: any, exerciseIndex: number) => {
                        const sets = formatSets(exercise.sets, exercise);
                        
                        return (
                          <div 
                            key={exercise.id} 
                            className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-200 ${
                              exerciseIndex < item.exercises.length - 1 ? 'mb-3' : ''
                            }`}
                            style={{ borderLeftWidth: '4px', borderLeftColor: groupColor }}
                          >
                            {/* Exercise Header */}
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="text-xl font-bold text-slate-900 flex-1 pr-3">
                                {exercise.exercise?.name}
                              </h3>
                              <div className="flex items-center gap-2">
                                {exercise.exercise?.videoUrl && (
                                  <button
                                    onClick={() => openVideoModal(exercise.exercise.videoUrl, exercise.exercise?.name)}
                                    className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center hover:bg-indigo-200 transition-colors"
                                  >
                                    <svg className="w-5 h-5 text-indigo-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </button>
                                )}
                                {exercise.notes && (
                                  <button
                                    onClick={() => openNotesModal(exercise.notes, exercise.exercise?.name)}
                                    className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition-colors"
                                  >
                                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Description */}
                            {exercise.exercise?.description && (
                              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                                {exercise.exercise.description}
                              </p>
                            )}

                            {/* Sets */}
                            <div className="mt-4">
                              <h4 className="text-base font-semibold text-slate-700 mb-3">Sets & Reps</h4>
                              <div className="space-y-2">
                                {sets.length > 0 ? sets.map((set: any, idx: number) => (
                                  <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-xs font-semibold text-slate-600">Set {set.setNumber}</span>
                                      <span className="text-sm font-bold text-slate-900">{set.reps} reps</span>
                                    </div>
                                    <div className="flex gap-4">
                                      {set.rest && (
                                        <div className="flex items-center gap-1.5">
                                          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          <span className="text-xs text-slate-600">Rest {set.rest}</span>
                                        </div>
                                      )}
                                      {set.tempo && set.tempo !== '0' && (
                                        <div className="flex items-center gap-1.5">
                                          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                          </svg>
                                          <span className="text-xs text-slate-600">Tempo {set.tempo}</span>
                                        </div>
                                      )}
                                    </div>
                                    {set.modifiers.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        {set.modifiers.map((modifier: string, modIdx: number) => (
                                          <span
                                            key={modIdx}
                                            className="px-2 py-0.5 bg-indigo-100 rounded text-xs font-medium text-indigo-700"
                                          >
                                            {modifier}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )) : (
                                  <p className="text-sm text-red-500">No sets data found</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                } else {
                  // Single exercise
                  const exercise = item.exercise;
                  const sets = formatSets(exercise.sets, exercise);
                  
                  return (
                    <div key={exercise.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                      {/* Exercise Header */}
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold text-slate-900 flex-1 pr-3">
                          {exercise.exercise?.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          {exercise.exercise?.videoUrl && (
                            <button
                              onClick={() => openVideoModal(exercise.exercise.videoUrl, exercise.exercise?.name)}
                              className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center hover:bg-indigo-200 transition-colors"
                            >
                              <svg className="w-5 h-5 text-indigo-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </button>
                          )}
                          {exercise.notes && (
                            <button
                              onClick={() => openNotesModal(exercise.notes, exercise.exercise?.name)}
                              className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition-colors"
                            >
                              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {exercise.exercise?.description && (
                        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                          {exercise.exercise.description}
                        </p>
                      )}

                      {/* Sets */}
                      <div className="mt-4">
                        <h4 className="text-base font-semibold text-slate-700 mb-3">Sets & Reps</h4>
                        <div className="space-y-2">
                          {sets.length > 0 ? sets.map((set: any, idx: number) => (
                            <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-semibold text-slate-600">Set {set.setNumber}</span>
                                <span className="text-sm font-bold text-slate-900">{set.reps} reps</span>
                              </div>
                              <div className="flex gap-4">
                                {set.rest && (
                                  <div className="flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-xs text-slate-600">Rest {set.rest}</span>
                                  </div>
                                )}
                                {set.tempo && set.tempo !== '0' && (
                                  <div className="flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span className="text-xs text-slate-600">Tempo {set.tempo}</span>
                                  </div>
                                )}
                              </div>
                              {set.modifiers.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {set.modifiers.map((modifier: string, modIdx: number) => (
                                    <span
                                      key={modIdx}
                                      className="px-2 py-0.5 bg-indigo-100 rounded text-xs font-medium text-indigo-700"
                                    >
                                      {modifier}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )) : (
                            <p className="text-sm text-red-500">No sets data found</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>

            {/* Start Workout Button */}
            {!isCurrentDayActive && (
              <button
                onClick={handleStartWorkout}
                className="w-full bg-indigo-600 text-white py-4 px-6 rounded-2xl font-bold text-lg mt-6 flex items-center justify-center gap-3 hover:bg-indigo-700 transition-colors shadow-lg"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Start Workout</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Notes Modal */}
      {notesModal.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl max-h-[70%] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Notes</h3>
                <p className="text-sm text-slate-600 mt-1">{notesModal.exerciseName}</p>
              </div>
              <button
                onClick={closeNotesModal}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-base leading-relaxed text-slate-700 whitespace-pre-wrap">
                {notesModal.notes}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Video Bottom Sheet */}
      {videoModal.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end" onClick={closeVideoModal}>
          <div className="bg-white w-full rounded-t-3xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Exercise Video</h3>
                <p className="text-sm text-slate-600 mt-1">{videoModal.exerciseName}</p>
              </div>
              <button
                onClick={closeVideoModal}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Video Player */}
            <div className="relative w-full bg-black" style={{ aspectRatio: '16/9' }}>
              {videoModal.videoUrl.includes('youtube.com') || videoModal.videoUrl.includes('youtu.be') ? (
                // YouTube video - extract video ID and embed
                (() => {
                  const getYouTubeId = (url: string) => {
                    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                    const match = url.match(regExp);
                    return match && match[2].length === 11 ? match[2] : null;
                  };
                  const videoId = getYouTubeId(videoModal.videoUrl);
                  return videoId ? (
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      Invalid YouTube URL
                    </div>
                  );
                })()
              ) : (
                // Local video - use HTML5 video player
                <video
                  src={getVideoUrl(videoModal.videoUrl) || ''}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  playsInline
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

