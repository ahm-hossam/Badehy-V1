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
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from "@/components/table";

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
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

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

  // Pagination logic for check-ins
  const paginatedCheckIns = filtered.slice((page - 1) * pageSize, page * pageSize);

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
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Created</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-zinc-400">Loading...</TableCell></TableRow>
            ) : paginatedCheckIns.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-zinc-400">No check-ins found.</TableCell></TableRow>
            ) : paginatedCheckIns.map(checkIn => (
              <TableRow key={checkIn.id}>
                <TableCell className="font-medium text-zinc-900">{checkIn.name}</TableCell>
                <TableCell className="text-zinc-600">{new Date(checkIn.createdAt).toLocaleString()}</TableCell>
                <TableCell className="flex gap-2">
                  <Button outline onClick={() => router.push(`/check-ins/${checkIn.id}/edit`)}>Edit</Button>
                  <Button outline onClick={() => { setDeleteTarget(checkIn); setShowDeleteDialog(true); }}>Delete</Button>
                  <Button outline onClick={() => handleCopy(checkIn.id)}>Copy URL</Button>
                  <Button outline onClick={() => window.open(`/check-ins/${checkIn.id}`, '_blank')}>Review</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Pagination (matching responses page) */}
        <div className="flex justify-end mt-4 gap-2">
          <Button outline disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="px-2 py-1 text-sm">Page {page}</span>
          <Button outline disabled={page * pageSize >= filtered.length} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
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