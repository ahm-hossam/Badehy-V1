"use client";
import React, { useEffect, useMemo, useState } from "react";
import { getStoredUser } from "@/lib/auth";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { Dialog, DialogBody, DialogTitle } from "@/components/dialog";
import { Toast } from "@/components/toast";

type RecordItem = {
  id: number
  date: string
  type: 'income' | 'expense'
  source: string
  category?: string | null
  client?: { id: number, fullName: string } | null
  amount: number
  paymentMethod?: string | null
  notes?: string | null
}

export default function FinancePage() {
  const user = getStoredUser()
  const trainerId = user?.isTeamMember && user.trainerId ? user.trainerId : user?.id
  const [activeTab, setActiveTab] = useState<'overview'|'income'|'expenses'>('overview')
  const [from, setFrom] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10))
  const [to, setTo] = useState<string>(new Date().toISOString().slice(0,10))
  const [rangePreset, setRangePreset] = useState<'this'|'last'|'custom'>('this')

  // Overview
  const [overview, setOverview] = useState<{ totalIncome: number, totalExpenses: number, netProfit: number, grossIncome?: number, totalRefunds?: number }>({ totalIncome: 0, totalExpenses: 0, netProfit: 0 })

  // Income
  const [income, setIncome] = useState<RecordItem[]>([])
  const [incomeTotal, setIncomeTotal] = useState(0)
  const [incomePage, setIncomePage] = useState(1)
  const [openAddIncome, setOpenAddIncome] = useState(false)
  const [addIncome, setAddIncome] = useState({ date: '', clientId: '', amount: '', paymentMethod: '', notes: '' })
  const [showToast, setShowToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' })

  // Expenses
  const [expenses, setExpenses] = useState<RecordItem[]>([])
  const [expensesTotal, setExpensesTotal] = useState(0)
  const [expensesPage, setExpensesPage] = useState(1)
  const [openAddExpense, setOpenAddExpense] = useState(false)
  const [addExpense, setAddExpense] = useState({ date: '', category: 'Miscellaneous', description: '', amount: '', paymentMethod: '', notes: '' })

  // Edit modal shared
  // Reports removed for now
  const [editRecord, setEditRecord] = useState<RecordItem | null>(null)
  const [editForm, setEditForm] = useState<{ date: string; amount: string; paymentMethod: string; notes: string; category?: string; clientId?: string }>({ date: '', amount: '', paymentMethod: '', notes: '' })
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; type: 'income'|'expense' } | null>(null)

  const loadOverview = async () => {
    if (!trainerId) return
    const qs = new URLSearchParams({ trainerId: String(trainerId), from, to })
    const res = await fetch(`/api/finance/overview?${qs.toString()}`)
    const data = await res.json().catch(() => ({}))
    setOverview({
      totalIncome: Number(data.totalIncome || 0),
      totalExpenses: Number(data.totalExpenses || 0),
      netProfit: Number(data.netProfit || 0),
      grossIncome: Number(data.grossIncome || 0),
      totalRefunds: Number(data.totalRefunds || 0),
    })
  }

  const loadIncome = async () => {
    if (!trainerId) return
    const qs = new URLSearchParams({ trainerId: String(trainerId), page: String(incomePage), pageSize: String(20), from, to })
    const res = await fetch(`/api/finance/income?${qs.toString()}`)
    const data = await res.json().catch(() => ({ items: [], total: 0 }))
    setIncome(Array.isArray(data.items) ? data.items : [])
    setIncomeTotal(Number(data.total || 0))
  }

  const loadExpenses = async () => {
    if (!trainerId) return
    const qs = new URLSearchParams({ trainerId: String(trainerId), page: String(expensesPage), pageSize: String(20), from, to })
    const res = await fetch(`/api/finance/expenses?${qs.toString()}`)
    const data = await res.json().catch(() => ({ items: [], total: 0 }))
    setExpenses(Array.isArray(data.items) ? data.items : [])
    setExpensesTotal(Number(data.total || 0))
  }

  useEffect(() => { loadOverview() }, [trainerId, from, to])
  useEffect(() => { if (activeTab === 'income') loadIncome() }, [activeTab, trainerId, from, to, incomePage])
  useEffect(() => { if (activeTab === 'expenses') loadExpenses() }, [activeTab, trainerId, from, to, expensesPage])
  // Reports removed for now

  useEffect(() => {
    // apply presets
    if (rangePreset === 'this') {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      setFrom(start.toISOString().slice(0,10))
      setTo(new Date().toISOString().slice(0,10))
    } else if (rangePreset === 'last') {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth()-1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      setFrom(start.toISOString().slice(0,10))
      setTo(end.toISOString().slice(0,10))
    }
  }, [rangePreset])

  const handleCreateIncome = async () => {
    if (!trainerId || !addIncome.date || !addIncome.amount) return
    const body: any = { trainerId: trainerId, date: addIncome.date, amount: Number(addIncome.amount) }
    if (addIncome.clientId) body.clientId = Number(addIncome.clientId)
    if (addIncome.paymentMethod) body.paymentMethod = addIncome.paymentMethod
    if (addIncome.notes) body.notes = addIncome.notes
    const res = await fetch('/api/finance/income', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      setOpenAddIncome(false)
      setAddIncome({ date: '', clientId: '', amount: '', paymentMethod: '', notes: '' })
      loadIncome(); loadOverview()
      setShowToast({ open: true, message: 'Income created successfully!' })
      setTimeout(()=>setShowToast({ open: false, message: '' }), 2000)
    } else {
      const err = await res.json().catch(() => ({})); alert(err.error || 'Failed to add income')
    }
  }

  const handleCreateExpense = async () => {
    if (!trainerId || !addExpense.date || !addExpense.amount) return
    const body: any = { trainerId: trainerId, date: addExpense.date, category: addExpense.category, amount: Number(addExpense.amount) }
    if (addExpense.paymentMethod) body.paymentMethod = addExpense.paymentMethod
    if (addExpense.description) body.description = addExpense.description
    if (addExpense.notes) body.notes = addExpense.notes
    const res = await fetch('/api/finance/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      setOpenAddExpense(false)
      setAddExpense({ date: '', category: 'Miscellaneous', description: '', amount: '', paymentMethod: '', notes: '' })
      loadExpenses(); loadOverview()
      setShowToast({ open: true, message: 'Expense created successfully!' })
      setTimeout(()=>setShowToast({ open: false, message: '' }), 2000)
    } else {
      const err = await res.json().catch(() => ({})); alert(err.error || 'Failed to add expense')
    }
  }

  const Currency = ({ value }: { value: number }) => <span>{value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>

  const deleteRecord = async (id: number, kind: 'income'|'expense') => {
    const res = await fetch(`/api/finance/${id}`, { method: 'DELETE' })
    if (res.ok) {
      if (kind==='income') loadIncome(); else loadExpenses();
      loadOverview()
      setShowToast({ open: true, message: `${kind === 'income' ? 'Income' : 'Expense'} deleted successfully!` })
      setTimeout(()=>setShowToast({ open: false, message: '' }), 2000)
    } else {
      const err = await res.json().catch(()=>({})); alert(err.error || 'Failed to delete')
    }
  }

  const openEdit = (r: RecordItem) => {
    setEditRecord(r)
    setEditForm({
      date: r.date.slice(0,10),
      amount: String(r.amount),
      paymentMethod: r.paymentMethod || '',
      notes: r.notes || '',
      category: r.category || undefined,
      clientId: r.client?.id ? String(r.client.id) : undefined,
    })
  }

  const saveEdit = async () => {
    if (!editRecord) return
    const body: any = {
      date: editForm.date,
      amount: Number(editForm.amount),
      paymentMethod: editForm.paymentMethod,
      notes: editForm.notes,
    }
    if (editRecord.type === 'expense') body.category = editForm.category
    if (editRecord.type === 'income' && editForm.clientId) body.clientId = Number(editForm.clientId)
    const res = await fetch(`/api/finance/${editRecord.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      setEditRecord(null)
      if (editRecord.type==='income') loadIncome(); else loadExpenses();
      loadOverview()
    } else {
      const err = await res.json().catch(()=>({})); alert(err.error || 'Failed to update record')
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
        <p className="text-sm text-gray-600 mt-1">Track your income and expenses</p>
      </div>

      <div className="flex items-center gap-3">
        <div>
          <label className="block text-xs text-zinc-500">From</label>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-zinc-500">To</label>
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-zinc-500">Preset</label>
          <Select value={rangePreset} onChange={e=>setRangePreset(e.target.value as any)}>
            <option value="this">This Month</option>
            <option value="last">Last Month</option>
            <option value="custom">Custom</option>
          </Select>
        </div>
        <div className="ml-auto flex gap-2">
          <Button outline onClick={() => setOpenAddIncome(true)}>Add Income</Button>
          <Button outline onClick={() => setOpenAddExpense(true)}>Add Expense</Button>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex gap-x-6">
          {([
            { id: 'overview', name: 'Overview' },
            { id: 'income', name: 'Income' },
            { id: 'expenses', name: 'Expenses' },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-2 px-2 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>{tab.name}</button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard title="Total Income" value={<Currency value={overview.totalIncome} />} accent="from-green-500 to-emerald-500" subtitle={`This period${overview?.totalRefunds ? ` (Refunds: ${overview.totalRefunds.toLocaleString()})` : ''}`} />
          <KpiCard title="Total Expenses" value={<Currency value={overview.totalExpenses} />} accent="from-red-500 to-rose-500" subtitle="This period" />
          <KpiCard title="Net Profit" value={<span className={`${overview.netProfit>=0?'text-green-700':'text-red-600'}`}><Currency value={overview.netProfit} /></span>} accent="from-blue-500 to-indigo-500" subtitle="Income − Expenses" />
        </div>
      )}

      {activeTab === 'income' && (
        <div className="space-y-3">
          <div className="flex justify-end"><Button onClick={() => setOpenAddIncome(true)}>Add Income</Button></div>
          <div className="bg-white shadow rounded-lg overflow-hidden">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Date</TableHeader>
                <TableHeader>Client</TableHeader>
                <TableHeader>Source</TableHeader>
                <TableHeader>Amount</TableHeader>
                <TableHeader>Method</TableHeader>
                <TableHeader>Notes</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {income.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-zinc-400">No income found.</TableCell></TableRow>
              ) : income.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                  <TableCell>{r.client?.fullName || '-'}</TableCell>
                  <TableCell>{r.source}</TableCell>
                  <TableCell><Currency value={Number(r.amount)} /></TableCell>
                  <TableCell>{r.paymentMethod || '-'}</TableCell>
                  <TableCell>{r.notes || '-'}</TableCell>
                  <TableCell className="text-right"><div className="flex gap-2 justify-end"><Button outline onClick={()=>openEdit(r)}>Edit</Button><Button outline onClick={()=>setConfirmDelete({ id: r.id, type: 'income' })}>Delete</Button></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          <div className="flex justify-end gap-2">
            <Button outline disabled={incomePage===1} onClick={()=>setIncomePage(incomePage-1)}>Previous</Button>
            <span className="px-2 py-1 text-sm">Page {incomePage}</span>
            <Button outline disabled={incomePage*20>=incomeTotal} onClick={()=>setIncomePage(incomePage+1)}>Next</Button>
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="space-y-3">
          <div className="flex justify-end"><Button onClick={() => setOpenAddExpense(true)}>Add Expense</Button></div>
          <div className="bg-white shadow rounded-lg overflow-hidden">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Date</TableHeader>
                <TableHeader>Category</TableHeader>
                <TableHeader>Amount</TableHeader>
                <TableHeader>Method</TableHeader>
                <TableHeader>Notes</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-zinc-400">No expenses found.</TableCell></TableRow>
              ) : expenses.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                  <TableCell>{r.category || '-'}</TableCell>
                  <TableCell><Currency value={Number(r.amount)} /></TableCell>
                  <TableCell>{r.paymentMethod || '-'}</TableCell>
                  <TableCell>{r.notes || '-'}</TableCell>
                  <TableCell className="text-right"><div className="flex gap-2 justify-end"><Button outline onClick={()=>openEdit(r)}>Edit</Button><Button outline onClick={()=>setConfirmDelete({ id: r.id, type: 'expense' })}>Delete</Button></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          <div className="flex justify-end gap-2">
            <Button outline disabled={expensesPage===1} onClick={()=>setExpensesPage(expensesPage-1)}>Previous</Button>
            <span className="px-2 py-1 text-sm">Page {expensesPage}</span>
            <Button outline disabled={expensesPage*20>=expensesTotal} onClick={()=>setExpensesPage(expensesPage+1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Reports tab removed for now */}

      {openAddIncome && (
        <Dialog open={openAddIncome} onClose={() => setOpenAddIncome(false)}>
          <DialogBody className="bg-white">
            <DialogTitle>Add Income</DialogTitle>
            <div className="space-y-3 mt-2">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <Input type="date" value={addIncome.date} onChange={e=>setAddIncome({...addIncome,date:e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Client (optional, ID)</label>
                <Input value={addIncome.clientId} onChange={e=>setAddIncome({...addIncome,clientId:e.target.value})} placeholder="Client ID" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <Input type="number" value={addIncome.amount} onChange={e=>setAddIncome({...addIncome,amount:e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <Input value={addIncome.paymentMethod} onChange={e=>setAddIncome({...addIncome,paymentMethod:e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <Input value={addIncome.notes} onChange={e=>setAddIncome({...addIncome,notes:e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button outline onClick={()=>setOpenAddIncome(false)}>Cancel</Button>
              <Button onClick={handleCreateIncome}>Save</Button>
            </div>
          </DialogBody>
        </Dialog>
      )}

      {editRecord && (
        <Dialog open={!!editRecord} onClose={() => setEditRecord(null)}>
          <DialogBody className="bg-white">
            <DialogTitle>Edit {editRecord.type === 'income' ? 'Income' : 'Expense'}</DialogTitle>
            <div className="space-y-3 mt-2">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <Input type="date" value={editForm.date} onChange={e=>setEditForm({...editForm,date:e.target.value})} />
              </div>
              {editRecord.type === 'income' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Client (optional, ID)</label>
                  <Input value={editForm.clientId || ''} onChange={e=>setEditForm({...editForm,clientId:e.target.value})} placeholder="Client ID" />
                </div>
              )}
              {editRecord.type === 'expense' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <Select value={editForm.category} onChange={e=>setEditForm({...editForm,category:e.target.value})}>
                    {['Ads','Salaries','Rent','Tools','Miscellaneous'].map(c=> <option key={c} value={c}>{c}</option>)}
                  </Select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <Input type="number" value={editForm.amount} onChange={e=>setEditForm({...editForm,amount:e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <Input value={editForm.paymentMethod} onChange={e=>setEditForm({...editForm,paymentMethod:e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <Input value={editForm.notes} onChange={e=>setEditForm({...editForm,notes:e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button outline onClick={()=>setEditRecord(null)}>Cancel</Button>
              <Button onClick={saveEdit}>Save</Button>
            </div>
          </DialogBody>
        </Dialog>
      )}

      {confirmDelete && (
        <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
          <DialogBody className="bg-white">
            <DialogTitle>Confirm Delete</DialogTitle>
            <div className="mt-2">Are you sure you want to delete this {confirmDelete.type === 'income' ? 'income' : 'expense'} record?</div>
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">Cancel</button>
              <Button type="button" color="red" onClick={() => { const { id, type } = confirmDelete; setConfirmDelete(null); deleteRecord(id, type); }}>Delete</Button>
            </div>
          </DialogBody>
        </Dialog>
      )}

      <Toast open={showToast.open} message={showToast.message} type="success" onClose={() => setShowToast({ open: false, message: '' })} />

      {openAddExpense && (
        <Dialog open={openAddExpense} onClose={() => setOpenAddExpense(false)}>
          <DialogBody className="bg-white">
            <DialogTitle>Add Expense</DialogTitle>
            <div className="space-y-3 mt-2">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <Input type="date" value={addExpense.date} onChange={e=>setAddExpense({...addExpense,date:e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <Select value={addExpense.category} onChange={e=>setAddExpense({...addExpense,category:e.target.value})}>
                  {['Ads','Salaries','Rent','Tools','Miscellaneous'].map(c=> <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <Input type="number" value={addExpense.amount} onChange={e=>setAddExpense({...addExpense,amount:e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <Input value={addExpense.paymentMethod} onChange={e=>setAddExpense({...addExpense,paymentMethod:e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes / Description</label>
                <Input value={addExpense.description} onChange={e=>setAddExpense({...addExpense,description:e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button outline onClick={()=>setOpenAddExpense(false)}>Cancel</Button>
              <Button onClick={handleCreateExpense}>Save</Button>
            </div>
          </DialogBody>
        </Dialog>
      )}
    </div>
  )
}

function KpiCard({ title, value, subtitle, accent }: { title: string; value: React.ReactNode; subtitle?: string; accent: string }) {
  return (
    <div className="relative p-5 bg-white rounded-xl overflow-hidden shadow-sm">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className="text-sm text-zinc-500 mb-1">{title}</div>
      <div className="text-3xl font-semibold mb-1">{value}</div>
      {subtitle && <div className="text-xs text-zinc-400">{subtitle}</div>}
    </div>
  )
}


