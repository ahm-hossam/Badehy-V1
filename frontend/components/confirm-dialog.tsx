import React from 'react';
import { Button } from './button';

export function ConfirmDialog({ open, title = 'Confirm Delete', message, itemName, onCancel, onConfirm }: {
  open: boolean;
  title?: string;
  message?: string;
  itemName?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-2xl shadow-lg p-8 min-w-[320px] max-w-full">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <p className="mb-6">{message || 'Are you sure you want to delete'} {itemName && <span className="font-bold">{itemName}</span>}?</p>
        <div className="flex justify-end gap-2">
          <Button outline type="button" onClick={onCancel}>Cancel</Button>
          <Button color="red" type="button" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  );
} 