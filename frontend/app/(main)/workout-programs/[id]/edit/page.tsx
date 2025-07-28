"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProgramBuilder from '../../ProgramBuilder';

export default function EditProgramPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  
  useEffect(() => {
    async function fetchProgram() {
      if (!params?.id) return;
      setLoading(true);
      console.log('Fetching program with ID:', params.id);
      
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
  }, [params?.id]);
  
  if (loading) return <div className="max-w-4xl mx-auto py-8 px-4 text-center text-zinc-500">Loading...</div>;
  if (!program) return <div className="max-w-4xl mx-auto py-8 px-4 text-center text-red-500">Program not found.</div>;
  
  console.log('Rendering ProgramBuilder with program:', program);
  return <ProgramBuilder mode="edit" initialData={program} />;
} 