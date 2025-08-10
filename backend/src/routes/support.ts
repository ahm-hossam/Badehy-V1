import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// POST /api/support
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message, trainerId } = req.body as {
      name?: string
      email?: string
      subject?: string
      message?: string
      trainerId?: number
    }

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' })
    }

    // Resolve trainer id
    let resolvedTrainerId: number | null = null
    if (typeof trainerId === 'number' && Number.isFinite(trainerId)) {
      resolvedTrainerId = trainerId
    } else if (email) {
      const registered = await prisma.registered.findUnique({ where: { email }, select: { id: true } })
      if (registered) {
        resolvedTrainerId = registered.id
      } else {
        const team = await prisma.teamMember.findUnique({ where: { email }, select: { trainerId: true } })
        if (team) resolvedTrainerId = team.trainerId
      }
    }

    if (!resolvedTrainerId) {
      return res.status(400).json({ error: 'Unable to resolve trainer from provided data' })
    }

    const composed = `From: ${name || 'Unknown'} <${email || 'N/A'}>\n\n${message}`
    const created = await prisma.supportRequest.create({
      data: {
        trainerId: resolvedTrainerId,
        subject,
        message: composed,
        status: 'pending',
        priority: 'medium',
      },
    })

    res.json({ id: created.id, success: true })
  } catch (e) {
    console.error('Support route error:', e)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router


