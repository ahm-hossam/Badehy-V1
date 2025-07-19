import { PrismaClient } from '@prisma/client'
import { Router, Request, Response } from 'express'

const prisma = new PrismaClient()
const router = Router()

// GET /api/packages?trainerId=1&search=term
router.get('/', async (req: Request, res: Response) => {
  const { trainerId, search } = req.query
  if (!trainerId) {
    return res.status(400).json({ error: 'Missing trainerId' })
  }
  try {
    const where: any = { trainerId: Number(trainerId) }
    if (search) {
      where.name = { contains: String(search), mode: 'insensitive' }
    }
    const packages = await prisma.package.findMany({
      where,
      orderBy: { name: 'asc' },
    })
    res.json(packages)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/packages
router.post('/', async (req: Request, res: Response) => {
  const { trainerId, name } = req.body
  if (!trainerId || !name) {
    return res.status(400).json({ error: 'Missing trainerId or name' })
  }
  try {
    // Ensure unique per trainer
    const existing = await prisma.package.findUnique({
      where: { trainerId_name: { trainerId, name } },
    })
    if (existing) {
      return res.status(409).json({ error: 'Package already exists' })
    }
    const pkg = await prisma.package.create({
      data: { trainerId, name },
    })
    res.status(201).json(pkg)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router 