import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// GET /api/finance/overview?trainerId=1&from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const { trainerId, from, to } = req.query as Record<string, string>
    if (!trainerId) return res.status(400).json({ error: 'trainerId is required' })
    const where: any = { trainerId: Number(trainerId) }
    if (from || to) {
      where.date = {}
      if (from) {
        const d = new Date(from)
        d.setHours(0,0,0,0)
        where.date.gte = d
      }
      if (to) {
        const d = new Date(to)
        d.setHours(23,59,59,999)
        where.date.lte = d
      }
    }
    const records = await prisma.financialRecord.findMany({ where })
    let grossIncome = 0
    let refundTotal = 0
    let expensesTotal = 0
    for (const r of records) {
      if (r.type === 'income') {
        const amt = Number(r.amount)
        if (amt >= 0) grossIncome += amt
        else refundTotal += Math.abs(amt)
      } else if (r.type === 'expense') {
        expensesTotal += Number(r.amount)
      }
    }
    const netIncome = grossIncome - refundTotal
    const netProfit = netIncome - expensesTotal
    res.json({ totalIncome: netIncome, totalExpenses: expensesTotal, netProfit, grossIncome, totalRefunds: refundTotal })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to load overview' })
  }
})

// GET /api/finance/summary?trainerId=1
// Returns last 12 months aggregated income and expenses
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { trainerId } = req.query as Record<string, string>
    if (!trainerId) return res.status(400).json({ error: 'trainerId is required' })
    const end = new Date()
    const start = new Date(end)
    start.setMonth(start.getMonth() - 11)
    start.setDate(1)
    const where: any = { trainerId: Number(trainerId), date: { gte: start, lte: end } }
    const records = await prisma.financialRecord.findMany({ where })
    const map: Record<string, { income: number; expense: number }> = {}
    for (let i = 0; i < 12; i++) {
      const d = new Date(start)
      d.setMonth(start.getMonth() + i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      map[key] = { income: 0, expense: 0 }
    }
    records.forEach(r => {
      const d = new Date(r.date as unknown as string)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!map[key]) map[key] = { income: 0, expense: 0 }
      if (r.type === 'income') map[key].income += Number(r.amount)
      else if (r.type === 'expense') map[key].expense += Number(r.amount)
    })
    const months = Object.keys(map)
    res.json({ months, income: months.map(m => map[m].income), expenses: months.map(m => map[m].expense) })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to load summary' })
  }
})

// GET /api/finance/income
router.get('/income', async (req: Request, res: Response) => {
  try {
    const { trainerId, page = '1', pageSize = '20', search = '', from, to } = req.query as Record<string, string>
    if (!trainerId) return res.status(400).json({ error: 'trainerId is required' })
    const take = Math.min(Math.max(parseInt(pageSize), 1), 100)
    const skip = (Math.max(parseInt(page), 1) - 1) * take
    const where: any = { trainerId: Number(trainerId), type: 'income' }
    if (from || to) {
      where.date = {}
      if (from) {
        const d = new Date(from)
        d.setHours(0,0,0,0)
        where.date.gte = d
      }
      if (to) {
        const d = new Date(to)
        d.setHours(23,59,59,999)
        where.date.lte = d
      }
    }
    if (search && search.trim()) {
      where.OR = [
        { source: { contains: search, mode: 'insensitive' } },
        { paymentMethod: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }
    const [allIncome, total] = await Promise.all([
      prisma.financialRecord.findMany({ where, orderBy: { date: 'desc' }, skip, take, include: { client: { select: { id: true, fullName: true } } } }),
      prisma.financialRecord.count({ where })
    ])
    // Split refund (negative amounts) from income list by adding a derived flag and absolute value
    const items = allIncome.map(r => ({
      ...r,
      isRefund: Number(r.amount) < 0,
      displayAmount: Math.abs(Number(r.amount))
    }))
    res.json({ items, total, page: Number(page), pageSize: take })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to load income' })
  }
})

// GET /api/finance/expenses
router.get('/expenses', async (req: Request, res: Response) => {
  try {
    const { trainerId, page = '1', pageSize = '20', search = '', from, to, category } = req.query as Record<string, string>
    if (!trainerId) return res.status(400).json({ error: 'trainerId is required' })
    const take = Math.min(Math.max(parseInt(pageSize), 1), 100)
    const skip = (Math.max(parseInt(page), 1) - 1) * take
    const where: any = { trainerId: Number(trainerId), type: 'expense' }
    if (from || to) {
      where.date = {}
      if (from) {
        const d = new Date(from)
        d.setHours(0,0,0,0)
        where.date.gte = d
      }
      if (to) {
        const d = new Date(to)
        d.setHours(23,59,59,999)
        where.date.lte = d
      }
    }
    if (category && category !== 'all') where.category = category
    if (search && search.trim()) where.notes = { contains: search, mode: 'insensitive' }
    const [items, total, byCategory] = await Promise.all([
      prisma.financialRecord.findMany({ where, orderBy: { date: 'desc' }, skip, take }),
      prisma.financialRecord.count({ where }),
      prisma.financialRecord.groupBy({ by: ['category'], where, _sum: { amount: true } }).catch(()=>[] as any),
    ])
    res.json({ items, total, page: Number(page), pageSize: take, byCategory })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to load expenses' })
  }
})

// POST /api/finance/income (manual)
router.post('/income', async (req: Request, res: Response) => {
  try {
    const { trainerId, clientId, date, amount, paymentMethod, notes } = req.body
    if (!trainerId || !date || !amount) return res.status(400).json({ error: 'Missing required fields' })
    const created = await prisma.financialRecord.create({
      data: {
        trainerId: Number(trainerId),
        clientId: clientId ? Number(clientId) : null,
        type: 'income',
        source: 'Manual',
        date: new Date(date),
        amount: Number(amount),
        paymentMethod: paymentMethod || null,
        notes: notes || null,
      },
    })
    res.status(201).json(created)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to create income' })
  }
})

// POST /api/finance/expenses
router.post('/expenses', async (req: Request, res: Response) => {
  try {
    const { trainerId, date, category, description, amount, paymentMethod, notes } = req.body
    if (!trainerId || !date || !amount) return res.status(400).json({ error: 'Missing required fields' })
    const created = await prisma.financialRecord.create({
      data: {
        trainerId: Number(trainerId),
        type: 'expense',
        source: 'Expense',
        category: category || 'Miscellaneous',
        date: new Date(date),
        amount: Number(amount),
        paymentMethod: paymentMethod || null,
        notes: description ? String(description) : notes || null,
      },
    })
    res.status(201).json(created)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to create expense' })
  }
})

// DELETE /api/finance/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    await prisma.financialRecord.delete({ where: { id } })
    res.json({ success: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to delete record' })
  }
})

// PATCH /api/finance/:id
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    const { date, amount, paymentMethod, notes, category, clientId } = req.body
    const data: any = {}
    if (date !== undefined) data.date = new Date(date)
    if (amount !== undefined) data.amount = Number(amount)
    if (paymentMethod !== undefined) data.paymentMethod = paymentMethod || null
    if (notes !== undefined) data.notes = notes || null
    if (category !== undefined) data.category = category || null
    if (clientId !== undefined) data.clientId = clientId ? Number(clientId) : null
    const updated = await prisma.financialRecord.update({ where: { id }, data })
    res.json(updated)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to update record' })
  }
})

export default router


