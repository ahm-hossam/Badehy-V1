"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { Select } from "@/components/select";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/auth";
import { Dropdown, DropdownButton, DropdownMenu } from "@/components/dropdown";
import { CalendarIcon } from '@heroicons/react/20/solid';
import { UserIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { DateRange, Range, RangeKeyDict } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from "@/components/table";

export default function ResponsesPage() {
  const [responses, setResponses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [formId, setFormId] = useState("");
  const [clientId, setClientId] = useState("");
  const [filledBy, setFilledBy] = useState(""); // Add filter for filled by
  const [forms, setForms] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [trainerId, setTrainerId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateRange, setDateRange] = useState<Range>({ startDate: undefined, endDate: undefined, key: 'selection' });
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (user && user.id) setTrainerId(user.id);
    else setTrainerId(null);
  }, []);

  useEffect(() => {
    if (!trainerId) return;
    fetch(`/api/checkins?trainerId=${trainerId}`)
      .then(res => res.json())
      .then(data => setForms(data || []));
    fetch(`/api/clients?trainerId=${trainerId}`)
      .then(res => res.json())
      .then(data => setClients(data || []));
  }, [trainerId]);

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
      filledBy ? `filledBy=${filledBy}` : null, // Add filledBy filter
      fromDate ? `from=${fromDate}` : null,
      toDate ? `to=${toDate}` : null,
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
  }, [trainerId, page, pageSize, formId, clientId, filledBy, fromDate, toDate]);

  if (trainerId === null) {
    return <div className="text-center text-red-500 py-12">You must be logged in as a trainer to view responses.</div>;
  }

  // Helper to get the name from answers if client is anonymous
  function getNameFromAnswers(resp: any): string {
    if (resp.client?.fullName) return resp.client.fullName;
    if (resp.form?.questions && resp.answers) {
      // Find the 'Full Name' question (case-insensitive, ignore spaces/punctuation)
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
      const nameQ = resp.form.questions.find(
        (q: any) => q.label && normalize(q.label) === 'fullname'
      );
      if (nameQ) {
        const val = resp.answers[nameQ.id];
        if (val && typeof val === 'string') return val;
      }
    }
    return '-';
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Responses</h1>
        <p className="mb-6 text-zinc-600">View and manage all client submissions to your check-in forms. Use the filters to find responses for a specific form or client.</p>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
        <div className="flex gap-2 w-full sm:w-auto">
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
          <Select value={filledBy} onChange={e => { setFilledBy(e.target.value); setPage(1); }} className="w-32">
            <option value="">All</option>
            <option value="trainer">Trainer</option>
            <option value="client">Client</option>
          </Select>
          <div className="relative">
            <Button
              outline
              className="w-64 flex items-center justify-between text-left"
              onClick={() => setShowDateDropdown(v => !v)}
              type="button"
            >
              <span>
                {fromDate && toDate
                  ? `${fromDate} to ${toDate}`
                  : fromDate
                  ? `From ${fromDate}`
                  : toDate
                  ? `To ${toDate}`
                  : "Submission Date"}
              </span>
              <CalendarIcon className="w-5 h-5 ml-2 text-zinc-400" />
            </Button>
            {showDateDropdown && (
              <div className="absolute z-50 mt-2 left-0 bg-white rounded-xl shadow-lg p-4 min-w-[320px]">
                <DateRange
                  ranges={[dateRange]}
                  onChange={(item: RangeKeyDict) => setDateRange(item.selection)}
                  moveRangeOnFirstSelection={false}
                  showMonthAndYearPickers={true}
                  rangeColors={["#111"]}
                  editableDateInputs={true}
                  maxDate={new Date()}
                />
                <div className="flex gap-2 mt-3 justify-end">
                  <Button outline type="button" onClick={() => {
                    setDateRange({ startDate: undefined, endDate: undefined, key: 'selection' });
                    setFromDate("");
                    setToDate("");
                    setShowDateDropdown(false);
                    setPage(1);
                  }}>Clear</Button>
                  <Button type="button" onClick={() => {
                    if (dateRange.startDate) {
                      let from = new Date(dateRange.startDate);
                      let end = dateRange.endDate ? new Date(dateRange.endDate) : new Date(dateRange.startDate);
                      // If only one date is selected, set both start and end to that date
                      if (!dateRange.endDate || from.toISOString().slice(0, 10) === end.toISOString().slice(0, 10)) {
                        end = new Date(from);
                      }
                      setFromDate(from.toISOString().slice(0, 10));
                      // Always send toDate as end + 1 day
                      let to = new Date(end);
                      to.setDate(to.getDate() + 1);
                      setToDate(to.toISOString().slice(0, 10));
                      // Debug log
                      console.log('Date filter:', { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) });
                    } else {
                      setFromDate("");
                      setToDate("");
                    }
                    setShowDateDropdown(false);
                    setPage(1);
                  }}>Apply</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Form Name</TableHeader>
              <TableHeader>Client Name</TableHeader>
              <TableHeader className="text-center">Filled By</TableHeader>
              <TableHeader>Submission Date</TableHeader>
              <TableHeader></TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-zinc-400">Loading...</TableCell></TableRow>
            ) : error ? (
              <TableRow><TableCell colSpan={5} className="text-center text-red-500 py-8">{error}</TableCell></TableRow>
            ) : responses.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-zinc-400">No responses found.</TableCell></TableRow>
            ) : responses.map((resp) => (
              <TableRow key={resp.id}>
                <TableCell className="font-medium text-zinc-900">{resp.form?.name || "-"}</TableCell>
                <TableCell className="text-zinc-600">{getNameFromAnswers(resp)}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {resp.filledBy === 'trainer' ? (
                      <>
                        <AcademicCapIcon className="w-4 h-4 text-blue-600" />
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                          Trainer
                        </span>
                      </>
                    ) : (
                      <>
                        <UserIcon className="w-4 h-4 text-green-600" />
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                          Client
                        </span>
                      </>
                    )}
                  </div>
                  {resp.filledByName && (
                    <div className="text-xs text-zinc-500 mt-1">
                      {resp.filledByName}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-zinc-600">{resp.submittedAt ? new Date(resp.submittedAt).toLocaleString() : "-"}</TableCell>
                <TableCell className="flex gap-2">
                  <Button outline onClick={() => router.push(`/check-ins/responses/${resp.id}`)}>View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Pagination (basic) */}
        <div className="flex justify-end mt-4 gap-2">
          <Button outline disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="px-2 py-1 text-sm">Page {page}</span>
          <Button outline disabled={page * pageSize >= total} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      </div>
    </div>
  </div>
  );
} 