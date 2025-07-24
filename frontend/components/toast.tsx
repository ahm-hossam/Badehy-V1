import React from 'react';

export function Toast({ open, message, type = 'success', onClose }: {
  open: boolean;
  message: string;
  type?: 'success' | 'error';
  onClose?: () => void;
}) {
  if (!open) return null;
  const color = type === 'success' ? 'bg-green-600' : 'bg-red-600';
  const icon = type === 'success' ? (
    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
  ) : (
    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
  );
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`${color} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2`}>
        {icon}
        {message}
        {onClose && (
          <button onClick={onClose} className="ml-2 text-white/80 hover:text-white">✕</button>
        )}
      </div>
    </div>
  );
} 