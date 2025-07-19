'use client';

export default function HomePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-zinc-900">Home</h1>
      <p className="mt-4 text-zinc-600">Welcome to your dashboard!</p>
      
      <div className="mt-6 space-y-4">
        <div className="p-4 bg-white border border-zinc-200 rounded-lg">
          <h3 className="text-lg font-semibold text-zinc-900">Dashboard Card</h3>
          <p className="text-zinc-600">This is your main dashboard content.</p>
        </div>
        
        <div className="p-4 bg-zinc-50 rounded-lg">
          <p className="text-zinc-900">Additional content area</p>
        </div>
      </div>
    </div>
  );
} 