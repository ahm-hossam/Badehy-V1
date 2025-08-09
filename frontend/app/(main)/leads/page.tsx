'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { Input } from '@/components/input'
import { Select } from '@/components/select'
import { Dialog, DialogBody, DialogTitle } from '@/components/dialog'
import { getStoredUser } from '@/lib/auth'

type Lead = {
  id: number
  trainerId: number
  fullName: string
  phone?: string | null
  email?: string | null
  source?: string | null
  campaign?: string | null
  stage: string
  owner?: { id: number; fullName: string; role: string }
  ownerId?: number | null
  nextFollowUpAt?: string | null
  createdAt: string
}

type TeamMember = { id: number | string; fullName: string; role: string }

export default function LeadsPage() {
  const user = getStoredUser()
  const [items, setItems] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [search, setSearch] = useState('')
  // Stage is hidden for MVP
  const [ownerId, setOwnerId] = useState('all')
  const [loading, setLoading] = useState(false)
  const [openCreate, setOpenCreate] = useState(false)
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', source: '', campaign: '', ownerId: '' })
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [showSavedToast, setShowSavedToast] = useState(false)
  const [editing, setEditing] = useState<Lead | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Lead | null>(null)
  const [showDeletedToast, setShowDeletedToast] = useState(false)

  const load = async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const params = new URLSearchParams({
        trainerId: String(user.id),
        page: String(page),
        pageSize: String(pageSize),
        ownerId,
        search,
      })
      const res = await fetch(`/api/leads?${params.toString()}`)
      const data = await res.json()
      setItems(data.items || [])
      setTotal(data.total || 0)
    } catch (e) {
      // noop
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [user?.id, page, pageSize, ownerId, search])

  useEffect(() => {
    const fetchTeam = async () => {
      if (!user?.id) return
      try {
        const res = await fetch(`/api/team-members?trainerId=${user.id}`)
        if (res.ok) {
          const data = await res.json()
          setTeamMembers(Array.isArray(data) ? data : [])
        }
      } catch {}
    }
    fetchTeam()
  }, [user?.id])

  const saveLead = async () => {
    if (!user?.id || !form.fullName.trim()) return
    try {
      const body = { trainerId: user.id, ...form, ownerId: form.ownerId || null }
      const url = editing ? `/api/leads/${editing.id}` : '/api/leads'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        setOpenCreate(false)
        setEditing(null)
        setForm({ fullName: '', phone: '', email: '', source: '', campaign: '', ownerId: '' })
        load()
        setShowSavedToast(true)
        setTimeout(() => setShowSavedToast(false), 2000)
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Failed to save lead')
      }
    } catch (e: any) {
      alert(e.message || 'Failed to save lead')
    }
  }

  const convertLead = async (lead: Lead) => {
    try {
      const res = await fetch(`/api/leads/${lead.id}/convert`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ selectedFormId: null }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to convert lead')
      // Redirect to client details
      window.location.href = `/clients/${data.clientId}`
    } catch (e: any) {
      alert(e.message || 'Failed to convert lead')
    }
  }

  const deleteLead = async (lead: Lead) => {
    try {
      const res = await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to delete lead')
      setConfirmDelete(null)
      load()
      setShowDeletedToast(true)
      setTimeout(() => setShowDeletedToast(false), 2000)
    } catch (e: any) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <p className="text-sm text-gray-600 mt-1">Manage and convert prospects into clients</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-4 py-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1.5)-1px)] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {/* Stage filter hidden for now; Source filter removed for now */}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setOpenCreate(true)}>Create Lead</Button>
        </div>
      </div>

      <Table className="[--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
        <TableHead>
          <TableRow>
            <TableHeader>Name</TableHeader>
            <TableHeader>Contact</TableHeader>
            <TableHeader>Source</TableHeader>
            {/* <TableHeader>Stage</TableHeader> */}
            <TableHeader>Owner</TableHeader>
            {/* <TableHeader>Next Follow-up</TableHeader> */}
            <TableHeader>Created</TableHeader>
            <TableHeader className="text-right">Actions</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={7} className="text-center py-8 text-zinc-400">Loading…</TableCell></TableRow>
          ) : items.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center py-8 text-zinc-400">No leads found.</TableCell></TableRow>
          ) : (
            items.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.fullName}</TableCell>
                <TableCell>
                  <div className="text-sm text-zinc-700">{lead.phone || '-'}</div>
                  <div className="text-xs text-zinc-400">{lead.email || ''}</div>
                </TableCell>
                <TableCell>{lead.source || '-'}</TableCell>
                {/* <TableCell>{lead.stage}</TableCell> */}
                <TableCell>
                  {lead.owner?.fullName?.trim() ||
                    (lead.ownerId ? (teamMembers.find(tm => tm.id === lead.ownerId)?.fullName || '-') : '-')}
                </TableCell>
                {/* <TableCell>{lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleDateString() : '-'}</TableCell> */}
                <TableCell>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '-'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button outline onClick={() => { setEditing(lead); setOpenCreate(true); setForm({ fullName: lead.fullName || '', phone: lead.phone || '', email: lead.email || '', source: lead.source || '', campaign: lead.campaign || '', ownerId: lead.ownerId ? String(lead.ownerId) : '' }) }}>Edit</Button>
                  <Button outline onClick={() => convertLead(lead)}>Convert</Button>
                  <Button outline onClick={() => setConfirmDelete(lead)} className="text-red-600 hover:text-red-700">Delete</Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="flex justify-end mt-4 gap-2">
        <Button outline disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
        <span className="px-2 py-1 text-sm">Page {page}</span>
        <Button outline disabled={page * pageSize >= total} onClick={() => setPage(page + 1)}>Next</Button>
      </div>

      {openCreate && (
        <Dialog open={openCreate} onClose={() => setOpenCreate(false)}>
          <DialogBody className="bg-white">
            <DialogTitle>{editing ? 'Edit Lead' : 'Create Lead'}</DialogTitle>
            <div className="space-y-3 mt-2">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Lead name" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="e.g., +20123456789" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Source</label>
                  <Input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="Facebook Ads, Referral, …" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Campaign</label>
                  <Input value={form.campaign} onChange={e => setForm({ ...form, campaign: e.target.value })} placeholder="Campaign name" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Owner (optional)</label>
                <Select value={form.ownerId} onChange={e => setForm({ ...form, ownerId: e.target.value })}>
                  <option value="">Unassigned</option>
                  {teamMembers.map(tm => (
                    <option key={tm.id} value={tm.id.toString()}>{tm.fullName} ({tm.role})</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={() => setOpenCreate(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">Cancel</button>
              <Button type="button" onClick={saveLead}>{editing ? 'Update' : 'Save'}</Button>
            </div>
          </DialogBody>
        </Dialog>
      )}
      {confirmDelete && (
        <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
          <DialogBody className="bg-white">
            <DialogTitle>Confirm Delete</DialogTitle>
            <div className="mt-2">Are you sure you want to delete <span className="font-semibold">{confirmDelete.fullName}</span>?</div>
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">Cancel</button>
              <Button type="button" color="red" onClick={() => deleteLead(confirmDelete)}>Delete</Button>
            </div>
          </DialogBody>
        </Dialog>
      )}
      {showSavedToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Lead created successfully!
          </div>
        </div>
      )}
      {showDeletedToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Lead deleted successfully!
          </div>
        </div>
      )}
    </div>
  )
}


