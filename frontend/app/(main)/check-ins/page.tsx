"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlusIcon } from '@heroicons/react/20/solid';
import { getStoredUser } from "@/lib/auth";

export default function CheckInsPage() {
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/checkins?trainerId=${user.id}`)
      .then(res => res.json())
      .then(data => setCheckIns(data))
      .finally(() => setLoading(false));
  }, []);

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
                  <Button outline onClick={() => {}} disabled>Edit</Button>
                  <Button outline onClick={() => {}} disabled>Delete</Button>
                  <Button outline onClick={() => navigator.clipboard.writeText(`${window.location.origin}/check-ins/${checkIn.id}`)}>Copy URL</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 