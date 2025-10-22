import express, { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/leads
router.get('/', async (req: Request, res: Response) => {
  try {
    const { trainerId, search = '', stage = 'all', ownerId, source = 'all', page = '1', pageSize = '20', sort = 'createdAt:desc' } = req.query as Record<string, string>
    if (!trainerId) return res.status(400).json({ error: 'trainerId is required' })

    const take = Math.min(Math.max(parseInt(pageSize), 1), 100)
    const skip = (Math.max(parseInt(page), 1) - 1) * take
    const [sortField, sortDir] = (sort || 'createdAt:desc').split(':')

    const where: any = { trainerId: Number(trainerId), isArchived: false }
    if (search && search.trim()) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { campaign: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (stage !== 'all') where.stage = stage
    if (ownerId && ownerId !== 'all') where.ownerId = Number(ownerId)
    if (source !== 'all') where.source = source

    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { [sortField as any]: (sortDir === 'asc' ? 'asc' : 'desc') as any },
        skip,
        take,
        include: { owner: { select: { id: true, fullName: true, role: true } } },
      }),
      prisma.lead.count({ where }),
    ])

    res.json({ items, total, page: Number(page), pageSize: take })
  } catch (err) {
    console.error('Error fetching leads:', err)
    res.status(500).json({ error: 'Failed to fetch leads' })
  }
})

// Helper to resolve ownerId, supporting the special 'me' value
async function resolveOwnerId(trainerId: number, ownerIdInput: any): Promise<number | null> {
  if (ownerIdInput === undefined || ownerIdInput === null || ownerIdInput === '') return null
  if (ownerIdInput === 'me') {
    const owner = await prisma.teamMember.findFirst({ where: { trainerId, role: 'Owner' }, select: { id: true } })
    return owner?.id ?? null
  }
  const parsed = Number(ownerIdInput)
  return Number.isFinite(parsed) ? parsed : null
}

// POST /api/leads
router.post('/', async (req: Request, res: Response) => {
  try {
    const { trainerId, fullName, phone, email, source, campaign, stage = 'New', ownerId, nextFollowUpAt, notes } = req.body
    if (!trainerId || !fullName) return res.status(400).json({ error: 'trainerId and fullName are required' })

    const resolvedOwnerId = await resolveOwnerId(Number(trainerId), ownerId)

    const lead = await prisma.lead.create({
      data: {
        trainerId: Number(trainerId),
        fullName: String(fullName),
        phone: phone ? String(phone) : null,
        email: email ? String(email) : null,
        source: source ? String(source) : null,
        campaign: campaign ? String(campaign) : null,
        stage: String(stage),
        ownerId: resolvedOwnerId,
        nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
        notes: notes ? String(notes) : null,
      },
    })
    res.status(201).json(lead)
  } catch (err) {
    console.error('Error creating lead:', err)
    res.status(500).json({ error: 'Failed to create lead' })
  }
})

// PUT /api/leads/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    const { trainerId, fullName, phone, email, source, campaign, stage, ownerId, score, lastContactAt, nextFollowUpAt, notes, isArchived } = req.body
    const data: any = {}
    if (fullName !== undefined) data.fullName = String(fullName)
    if (phone !== undefined) data.phone = phone ? String(phone) : null
    if (email !== undefined) data.email = email ? String(email) : null
    if (source !== undefined) data.source = source ? String(source) : null
    if (campaign !== undefined) data.campaign = campaign ? String(campaign) : null
    if (stage !== undefined) data.stage = String(stage)
    if (ownerId !== undefined) {
      let resolvedTrainerId = Number(trainerId)
      if (!resolvedTrainerId || !Number.isFinite(resolvedTrainerId)) {
        const existing = await prisma.lead.findUnique({ where: { id }, select: { trainerId: true } })
        resolvedTrainerId = existing?.trainerId ?? 0
      }
      data.ownerId = await resolveOwnerId(resolvedTrainerId, ownerId)
    }
    if (score !== undefined) data.score = score === null ? null : Number(score)
    if (lastContactAt !== undefined) data.lastContactAt = lastContactAt ? new Date(lastContactAt) : null
    if (nextFollowUpAt !== undefined) data.nextFollowUpAt = nextFollowUpAt ? new Date(nextFollowUpAt) : null
    if (notes !== undefined) data.notes = notes ? String(notes) : null
    if (isArchived !== undefined) data.isArchived = Boolean(isArchived)

    const updated = await prisma.lead.update({ where: { id }, data })
    res.json(updated)
  } catch (err) {
    console.error('Error updating lead:', err)
    res.status(500).json({ error: 'Failed to update lead' })
  }
})

// DELETE /api/leads/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    // Hard delete for now; could be soft-archive if preferred
    await prisma.lead.delete({ where: { id } })
    res.json({ message: 'Lead deleted' })
  } catch (err) {
    console.error('Error deleting lead:', err)
    res.status(500).json({ error: 'Failed to delete lead' })
  }
})

// POST /api/leads/:id/convert
router.post('/:id/convert', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    const { selectedFormId } = req.body as { selectedFormId?: number }

    const lead = await prisma.lead.findUnique({ where: { id } })
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    if (lead.convertedClientId) {
      return res.json({ clientId: lead.convertedClientId, alreadyConverted: true })
    }

    // Try to dedupe by phone/email for this trainer
    const whereExisting: any = { trainerId: lead.trainerId }
    const or: any[] = []
    if (lead.phone) or.push({ phone: lead.phone })
    if (lead.email) or.push({ email: lead.email })
    if (or.length > 0) whereExisting.OR = or
    let existingClient = or.length > 0 ? await prisma.trainerClient.findFirst({ where: whereExisting }) : null

    let clientId: number
    if (existingClient) {
      // Update some empty fields if needed
      await prisma.trainerClient.update({
        where: { id: existingClient.id },
        data: {
          fullName: existingClient.fullName || lead.fullName,
          source: existingClient.source || lead.source || undefined,
        },
      })
      clientId = existingClient.id
    } else {
      const created = await prisma.trainerClient.create({
        data: {
          trainerId: lead.trainerId,
          fullName: lead.fullName,
          phone: lead.phone || '',
          email: lead.email || '',
          source: lead.source || null,
          registrationDate: new Date(),
          injuriesHealthNotes: null,
          goals: null,
          originLeadId: lead.id,
          selectedFormId: selectedFormId ? Number(selectedFormId) : undefined,
        },
      })
      clientId = created.id
    }

    const updatedLead = await prisma.lead.update({
      where: { id: lead.id },
      data: { convertedClientId: clientId, stage: 'Won' },
    })

    res.json({ clientId, lead: updatedLead })
  } catch (err) {
    console.error('Error converting lead:', err)
    res.status(500).json({ error: 'Failed to convert lead' })
  }
})

export default router


