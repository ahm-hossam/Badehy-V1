'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TokenStorage } from '@/lib/storage';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await TokenStorage.getAccessToken();
      if (token) {
        router.push('/home');
      } else {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-slate-600">Loading...</div>
    </div>
  );
}

