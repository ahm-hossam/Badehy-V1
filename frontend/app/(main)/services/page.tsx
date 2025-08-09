'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/button'
import { Dialog, DialogBody, DialogTitle } from '@/components/dialog'
import { Input } from '@/components/input'
import { Select } from '@/components/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { getStoredUser } from '@/lib/auth'

type Service = {
  id: number
  trainerId: number
  name: string
  description?: string | null
  priceEGP: string | number
  status: string
  createdAt: string
}

export default function ServicesPage() {
  const [user] = useState(getStoredUser())
  const [items, setItems] = useState<Service[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [status, setStatus] = useState<'all'|'active'|'inactive'>('all')
  const [type, setType] = useState<'all'|'free'|'paid'>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState({ name: '', description: '', priceEGP: '0', status: 'active' })
  const [showFilters, setShowFilters] = useState(false)
  const [showDeletedToast, setShowDeletedToast] = useState(false)
  const [showSavedToast, setShowSavedToast] = useState(false)
  const [savedToastMessage, setSavedToastMessage] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Service | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Use frontend API proxy to avoid CORS/env issues
  const apiBase = ''

  const load = async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const qs = new URLSearchParams({
        trainerId: String(user.id),
        page: String(page),
        pageSize: String(pageSize),
        status,
        type,
        search,
        sort: 'createdAt:desc'
      })
      const res = await fetch(`/api/services?${qs.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load services')
      const data = await res.json()
      setItems(data.items || [])
      setTotal(data.total || 0)
    } catch (e: any) {
      setError(e.message || 'Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [user?.id, page, pageSize, status, type, search])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', description: '', priceEGP: '0', status: 'active' })
    setOpen(true)
  }
  const openEdit = (svc: Service) => {
    setEditing(svc)
    setForm({ name: svc.name, description: svc.description || '', priceEGP: String(svc.priceEGP), status: svc.status })
    setOpen(true)
  }
  const onSave = async () => {
    if (!user?.id) return
    try {
      const body = { trainerId: user.id, ...form, priceEGP: Number(form.priceEGP) }
      const url = editing ? `/api/services/${editing.id}` : `/api/services`
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save service')
      }
      setOpen(false)
      await load()
      setTimeout(() => {
        setSavedToastMessage(editing ? 'Service updated successfully!' : 'Service created successfully!')
        setShowSavedToast(true)
        setTimeout(() => setShowSavedToast(false), 2000)
      }, 100)
    } catch (e: any) {
      alert(e.message || 'Failed to save service')
    }
  }
  const onDelete = (svc: Service) => {
    setDeleteError(null)
    setConfirmDelete(svc)
  }

  const confirmDeleteService = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/services/${confirmDelete.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to delete service')
      setConfirmDelete(null)
      await load()
      setTimeout(() => {
        setShowDeletedToast(true)
        setTimeout(() => setShowDeletedToast(false), 2000)
      }, 100)
    } catch (e: any) {
      setDeleteError(e.message || 'Failed to delete service')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <p className="text-sm text-gray-600 mt-1">Create and manage add-on services.</p>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1.5)-1px)] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="px-4 py-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1.5)-1px)] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            <span>Filters</span>
          </button>
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreate}>Create New Service</Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Services Table */}
      <Table className="[--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Description</TableHeader>
                <TableHeader>Price (EGP)</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Date Created</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-zinc-400">Loading…</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-zinc-400">No services found.</TableCell></TableRow>
              ) : (
                items.map(svc => (
                  <TableRow key={svc.id}>
                    <TableCell className="font-medium">{svc.name}</TableCell>
                    <TableCell className="max-w-md truncate" title={svc.description || ''}>{svc.description}</TableCell>
                    <TableCell>{Number(svc.priceEGP).toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 text-xs rounded font-semibold ${svc.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{svc.status}</span>
                    </TableCell>
                    <TableCell>{new Date(svc.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button outline onClick={() => openEdit(svc)}>Edit</Button>
                      <Button outline onClick={() => onDelete(svc)} className="text-red-600 hover:text-red-700">Delete</Button>
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

        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogBody className="bg-white">
            <DialogTitle>{editing ? 'Edit Service' : 'Create Service'}</DialogTitle>
            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Service name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the service"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price (EGP)</label>
                <Input type="number" min="0" step="0.01" value={form.priceEGP} onChange={e => setForm({ ...form, priceEGP: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                Cancel
              </button>
              <Button type="button" onClick={onSave}>Save</Button>
            </div>
          </DialogBody>
        </Dialog>
        {confirmDelete && (
          <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
            <div className="p-6 z-[9999]">
              <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
              <p>
                Are you sure you want to delete <span className="font-bold">{confirmDelete.name}</span>?
              </p>
              {deleteError && (
                <p className="text-sm text-red-600 mt-3">{deleteError}</p>
              )}
              <div className="flex justify-end gap-2 mt-6">
                <Button outline type="button" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                <Button color="red" type="button" onClick={confirmDeleteService} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </Dialog>
        )}
        {showDeletedToast && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Service deleted successfully!
            </div>
          </div>
        )}
        {showSavedToast && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {savedToastMessage || 'Service saved successfully!'}
            </div>
          </div>
        )}
      </div>
  )
}


