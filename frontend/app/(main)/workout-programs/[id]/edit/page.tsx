"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import SimpleProgramBuilder from '../../SimpleProgramBuilder';
import { getStoredUser } from '@/lib/auth';

export default function EditProgramPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [clientInfo, setClientInfo] = useState(null);
  
  useEffect(() => {
    async function fetchProgram() {
      if (!params?.id) return;
      setLoading(true);
      console.log('Fetching program with ID:', params.id);
      
      // Check if we're in customization mode
      const isCustomize = searchParams?.get('customize') === 'true';
      const clientId = searchParams?.get('clientId');
      const trainerId = searchParams?.get('trainerId');
      
      if (isCustomize && clientId && trainerId) {
        console.log('Customization mode detected for client:', clientId);
        
        // Fetch client info
        try {
          const clientRes = await fetch(`/api/clients/${clientId}`);
          if (clientRes.ok) {
            const clientData = await clientRes.json();
            setClientInfo(clientData);
          }
        } catch (error) {
          console.error('Error fetching client info:', error);
        }
        
        // Call clone endpoint to create a customized version
        try {
          const cloneRes = await fetch(`/api/programs/${params.id}/clone`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              trainerId: Number(trainerId),
              customizedForClientId: Number(clientId)
            })
          });
          
          if (cloneRes.ok) {
            const clonedProgram = await cloneRes.json();
            console.log('Program cloned successfully:', clonedProgram);
            setProgram(clonedProgram);
            setLoading(false);
            return;
          } else {
            console.error('Failed to clone program:', cloneRes.statusText);
            const error = await cloneRes.json();
            console.error('Error:', error);
          }
        } catch (error) {
          console.error('Error cloning program:', error);
        }
      }
      
      // Regular fetch
      const res = await fetch(`/api/programs/${params.id}`);
      console.log('Response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Fetched program data:', data);
        console.log('Program weeks:', data.weeks);
        console.log('Program weeks length:', data.weeks?.length);
        
        if (data.weeks && data.weeks.length > 0) {
          console.log('First week:', data.weeks[0]);
          console.log('First week days:', data.weeks[0].days);
          if (data.weeks[0].days && data.weeks[0].days.length > 0) {
            console.log('First day:', data.weeks[0].days[0]);
            console.log('First day exercises:', data.weeks[0].days[0].exercises);
          }
        }
        
        setProgram(data);
      } else {
        console.error('Failed to fetch program:', res.status, res.statusText);
        const errorText = await res.text();
        console.error('Error response:', errorText);
      }
      setLoading(false);
    }
    fetchProgram();
  }, [params?.id, searchParams]);
  
  if (loading) return <div className="max-w-4xl mx-auto py-8 px-4 text-center text-zinc-500">Loading...</div>;
  if (!program) return <div className="max-w-4xl mx-auto py-8 px-4 text-center text-red-500">Program not found.</div>;
  
  console.log('Rendering ProgramBuilder with program:', program);
  
  const isCustomize = searchParams?.get('customize') === 'true';
  const clientId = searchParams?.get('clientId');
  
  return (
    <div>
      {isCustomize && clientInfo && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                Customizing for Client
              </h3>
              <p className="text-sm text-blue-700">
                Changes to this program will only affect <strong>{clientInfo.fullName}</strong>. The original program remains unchanged for other clients.
              </p>
            </div>
          </div>
        </div>
      )}
      <SimpleProgramBuilder 
        mode="edit" 
        initialData={program} 
        customizationData={isCustomize ? {
          isCustomizing: true,
          clientId: clientId,
          clientName: clientInfo?.fullName
        } : null}
      />
    </div>
  );
} 