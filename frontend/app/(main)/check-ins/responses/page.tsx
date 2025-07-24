"use client";
import { useEffect, useState } from "react";
import { Table } from "@/components/table";
import { Button } from "@/components/button";
import { Select } from "@/components/select";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/auth";

export default function ResponsesPage() {
  const [responses, setResponses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [formId, setFormId] = useState("");
  const [clientId, setClientId] = useState("");
  const [forms, setForms] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const router = useRouter();
  const [trainerId, setTrainerId] = useState<number | null>(null);

  // Set trainerId from logged-in user
  useEffect(() => {
    const user = getStoredUser();
    if (user && user.id) setTrainerId(user.id);
    else setTrainerId(null);
  }, []);

  // Fetch forms and clients for filters
  useEffect(() => {
    if (!trainerId) return;
    fetch(`/api/checkins?trainerId=${trainerId}`)
      .then(res => res.json())
      .then(data => setForms(data || []));
    fetch(`/api/clients?trainerId=${trainerId}`)
      .then(res => res.json())
      .then(data => setClients(data || []));
  }, [trainerId]);

  // Fetch responses with filters
  useEffect(() => {
    if (!trainerId) return;
    setLoading(true);
    setError(null);
    const params = [
      `trainerId=${trainerId}`,
      `page=${page}`,
      `pageSize=${pageSize}`,
      formId ? `formId=${formId}` : null,
      clientId ? `clientId=${clientId}` : null,
    ].filter(Boolean).join("&");
    fetch(`/api/checkins/responses?${params}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch responses");
        const data = await res.json();
        setResponses(data.submissions || []);
        setTotal(data.total || 0);
      })
      .catch((err) => setError(err.message || "Failed to fetch responses"))
      .finally(() => setLoading(false));
  }, [trainerId, page, pageSize, formId, clientId]);

  if (trainerId === null) {
    return <div className="text-center text-red-500 py-12">You must be logged in as a trainer to view responses.</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Responses</h1>
        {/* Filters */}
        <div className="flex gap-2">
          <Select value={formId} onChange={e => { setFormId(e.target.value); setPage(1); }} className="w-48">
            <option value="">All Forms</option>
            {forms.map((form: any) => (
              <option key={form.id} value={form.id}>{form.name}</option>
            ))}
          </Select>
          <Select value={clientId} onChange={e => { setClientId(e.target.value); setPage(1); }} className="w-48">
            <option value="">All Clients</option>
            {clients.map((client: any) => (
              <option key={client.id} value={client.id}>{client.fullName}</option>
            ))}
          </Select>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <Table>
          <thead>
            <tr>
              <th>Form Name</th>
              <th>Client Name</th>
              <th>Submission Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8">Loading...</td></tr>
            ) : error ? (
              <tr><td colSpan={4} className="text-center text-red-500 py-8">{error}</td></tr>
            ) : responses.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8">No responses found.</td></tr>
            ) : responses.map((resp) => (
              <tr key={resp.id}>
                <td>{resp.form?.name || "-"}</td>
                <td>{resp.client?.fullName || "-"}</td>
                <td>{resp.submittedAt ? new Date(resp.submittedAt).toLocaleString() : "-"}</td>
                <td>
                  <Button outline onClick={() => router.push(`/check-ins/responses/${resp.id}`)}>
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {/* Pagination (basic) */}
        <div className="flex justify-end mt-4 gap-2">
          <Button outline disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="px-2 py-1 text-sm">Page {page}</span>
          <Button outline disabled={page * pageSize >= total} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
} 