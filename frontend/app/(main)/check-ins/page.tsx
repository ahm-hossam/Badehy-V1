"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlusIcon } from '@heroicons/react/20/solid';
import { Alert } from '@/components/alert';
import { getStoredUser } from '@/lib/auth';
import { useSearchParams } from 'next/navigation';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Toast } from '@/components/toast';

export default function CheckInsPage() {
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  // Fetch check-ins
  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/checkins?trainerId=${user.id}`)
      .then(res => res.json())
      .then(data => setCheckIns(data))
      .finally(() => setLoading(false));
  }, []);

  // Show success toast if redirected from create/edit
  useEffect(() => {
    if (searchParams.get('success') === '1') {
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 2000);
      // Remove ?success=1 from URL
      router.replace('/check-ins');
    }
  }, [searchParams, router]);

  const handleCopy = (id: number) => {
    navigator.clipboard.writeText(`${window.location.origin}/check-ins/${id}`);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 1500);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/checkins/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setCheckIns(checkIns.filter(c => c.id !== deleteTarget.id));
      setShowDeleteDialog(false);
      setDeleteTarget(null);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 2000);
    } catch (err) {
      setShowDeleteDialog(false);
      setDeleteTarget(null);
      setErrorMsg('Failed to delete check-in');
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 2000);
    }
  };

  const filtered = filter.trim()
    ? checkIns.filter(c => c.name.toLowerCase().includes(filter.trim().toLowerCase()))
    : checkIns;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Check-ins</h1>
      <p className="mb-6 text-zinc-600">Create and manage your custom check-in forms to send to your clients. Each check-in generates a unique link you can share.</p>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
        <Input
          placeholder="Filter by check-in name..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="sm:w-64"
        />
        <Link href="/check-ins/create">
          <Button className="ml-auto flex items-center gap-2 hover:cursor-pointer">
            <PlusIcon className="h-5 w-5" />
            Create New
          </Button>
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Created</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="text-center py-8 text-zinc-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-8 text-zinc-400">No check-ins found.</td></tr>
            ) : filtered.map(checkIn => (
              <tr key={checkIn.id} className="border-b last:border-0">
                <td className="px-4 py-2 font-medium text-zinc-900">{checkIn.name}</td>
                <td className="px-4 py-2 text-zinc-600">{new Date(checkIn.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2 flex gap-2">
                  <Button outline onClick={() => router.push(`/check-ins/${checkIn.id}/edit`)}>Edit</Button>
                  <Button outline onClick={() => { setDeleteTarget(checkIn); setShowDeleteDialog(true); }}>Delete</Button>
                  <Button outline onClick={() => handleCopy(checkIn.id)}>Copy URL</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Toasts and dialogs */}
      <Toast open={showSuccessToast} message="Check-in deleted successfully!" type="success" onClose={() => setShowSuccessToast(false)} />
      <Toast open={showCopyToast} message="Copied!" type="success" onClose={() => setShowCopyToast(false)} />
      <Toast open={showErrorToast} message={errorMsg || 'An error occurred.'} type="error" onClose={() => setShowErrorToast(false)} />
      <ConfirmDialog
        open={showDeleteDialog}
        title="Confirm Delete"
        message="Are you sure you want to delete"
        itemName={deleteTarget?.name}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
} 