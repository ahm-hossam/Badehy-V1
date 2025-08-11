import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/services
router.get('/', async (req: Request, res: Response) => {
  try {
    const { trainerId, status = 'all', type = 'all', search = '', page = '1', pageSize = '20', sort = 'createdAt:desc' } = req.query as Record<string, string>;
    if (!trainerId) return res.status(400).json({ error: 'trainerId is required' });

    const [sortField, sortDir] = (sort || 'createdAt:desc').split(':');
    const take = Math.min(Math.max(parseInt(pageSize), 1), 100);
    const skip = (Math.max(parseInt(page), 1) - 1) * take;

    const where: any = { trainerId: Number(trainerId) };
    if (status !== 'all') where.status = status;
    if (type === 'free') where.priceEGP = 0;
    if (type === 'paid') where.priceEGP = { gt: 0 };
    if (search && search.trim() !== '') where.name = { contains: search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.service.findMany({
        where,
        orderBy: { [sortField as any]: (sortDir === 'asc' ? 'asc' : 'desc') as any },
        skip,
        take,
      }),
      prisma.service.count({ where }),
    ]);

    res.json({ items, total, page: Number(page), pageSize: take });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// POST /api/services
router.post('/', async (req: Request, res: Response) => {
  try {
    const { trainerId, name, description, priceEGP, status = 'active' } = req.body;
    if (!trainerId || !name || priceEGP === undefined) return res.status(400).json({ error: 'trainerId, name, priceEGP are required' });
    const service = await prisma.service.create({
      data: {
        trainerId: Number(trainerId),
        name: String(name),
        description: description ? String(description) : null,
        priceEGP: String(Number(priceEGP).toFixed(2)),
        status: String(status),
      },
    });
    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// PUT /api/services/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, priceEGP, status } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = String(name);
    if (description !== undefined) data.description = description ? String(description) : null;
    if (priceEGP !== undefined) data.priceEGP = String(Number(priceEGP).toFixed(2));
    if (status !== undefined) data.status = String(status);
    const updated = await prisma.service.update({ where: { id: Number(id) }, data });
    res.json(updated);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// DELETE /api/services/:id (prevent hard delete if has assignments)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const hasAssignments = await prisma.clientService.count({ where: { serviceId: Number(id), isActive: true } });
    if (hasAssignments > 0) {
      return res.status(400).json({ error: 'Service has active assignments. Set status to inactive instead of deleting.' });
    }
    await prisma.service.delete({ where: { id: Number(id) } });
    res.json({ message: 'Service deleted' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

async function createIncomeIfNotExists(params: {
  trainerId: number
  clientId?: number | null
  source: string
  amount: number
  paymentMethod?: string | null
  date?: Date
  token: string
  notes?: string | null
}) {
  try {
    const { trainerId, clientId, source, amount, paymentMethod, date, token, notes } = params
    if (!Number.isFinite(amount) || amount <= 0) return
    const existing = await prisma.financialRecord.findFirst({ where: { trainerId, type: 'income', source, notes: { contains: token } }, select: { id: true } })
    if (existing) return
    await prisma.financialRecord.create({
      data: {
        trainerId,
        clientId: clientId ?? null,
        type: 'income',
        source,
        date: date ?? new Date(),
        amount,
        paymentMethod: paymentMethod ?? null,
        notes: notes ? `${notes} | ${token}` : token,
      },
    })
  } catch (e) {
    console.warn('Failed to create income record (services):', e)
  }
}

// Assign service to a client
router.post('/:id/assign', async (req: Request, res: Response) => {
  try {
    const serviceId = Number(req.params.id);
    const { trainerId, clientId, priceOverrideEGP, startDate, endDate, notes, paymentStatus = 'pending', paymentMethod } = req.body;
    if (!trainerId || !clientId) return res.status(400).json({ error: 'trainerId and clientId are required' });

    const service = await prisma.service.findFirst({ where: { id: serviceId, trainerId: Number(trainerId), status: 'active' } });
    if (!service) return res.status(404).json({ error: 'Service not found or inactive' });

    // Prevent duplicate active assignment
    const existing = await prisma.clientService.findFirst({ where: { trainerId: Number(trainerId), clientId: Number(clientId), serviceId, isActive: true } });
    if (existing) return res.status(400).json({ error: 'Service already assigned to this client' });

    const assignment = await prisma.clientService.create({
      data: {
        trainerId: Number(trainerId),
        clientId: Number(clientId),
        serviceId,
        serviceName: service.name,
        priceEGP: String(Number((priceOverrideEGP ?? service.priceEGP)).toFixed(2)),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        notes: notes ? String(notes) : null,
        paymentStatus: String(paymentStatus),
        paymentMethod: paymentMethod ? String(paymentMethod) : null,
      },
    });
    // Auto income if marked paid
    try {
      if (String(assignment.paymentStatus).toLowerCase() === 'paid' && Number(assignment.priceEGP) > 0) {
        await createIncomeIfNotExists({
          trainerId: assignment.trainerId,
          clientId: assignment.clientId,
          source: 'Service',
          amount: Number(assignment.priceEGP),
          paymentMethod: assignment.paymentMethod ?? null,
          date: assignment.startDate ?? new Date(),
          token: `srv:${assignment.id}`,
          notes: `Service: ${assignment.serviceName}`,
        })
      }
    } catch {}
    res.status(201).json(assignment);
  } catch (error) {
    console.error('Error assigning service:', error);
    res.status(500).json({ error: 'Failed to assign service' });
  }
});

// Update assignment (payment status / unassign / dates / notes)
router.patch('/assignments/:assignmentId', async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const { paymentStatus, paymentMethod, endDate, notes, isActive, refundAmount, refundReason } = req.body;

    const data: any = {};
    if (paymentStatus !== undefined) data.paymentStatus = String(paymentStatus);
    if (paymentMethod !== undefined) data.paymentMethod = paymentMethod ? String(paymentMethod) : null;
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
    if (notes !== undefined) data.notes = notes ? String(notes) : null;
    if (isActive === false) {
      data.isActive = false;
      data.unassignedAt = new Date();
    }
    const updated = await prisma.clientService.update({ where: { id: Number(assignmentId) }, data });
    // Auto income if now paid
    try {
      if (String(updated.paymentStatus || '').toLowerCase() === 'paid' && Number(updated.priceEGP) > 0) {
        const token = `Service:${updated.id}`
        const exists = await prisma.financialRecord.findFirst({ where: { trainerId: updated.trainerId, type: 'income', source: 'Service', notes: { contains: token } } })
        if (!exists) {
          await prisma.financialRecord.create({
            data: {
              trainerId: updated.trainerId,
              clientId: updated.clientId,
              type: 'income',
              source: 'Service',
              date: updated.startDate ?? new Date(),
              amount: Number(updated.priceEGP),
              paymentMethod: updated.paymentMethod ?? null,
              notes: `${token} | ${updated.serviceName}`,
            },
          })
        }
      }
    } catch (e) { console.warn('Failed to create income record (services.patch):', e) }

    // Optional refund without unassigning
    try {
      const refund = refundAmount !== undefined && refundAmount !== null ? Number(refundAmount) : 0
      if (refund && refund > 0) {
        const token = `Service refund:${updated.id}`
        const existsRefund = await prisma.financialRecord.findFirst({ where: { trainerId: updated.trainerId, type: 'income', source: 'Service', notes: { contains: token } } })
        if (!existsRefund) {
          await prisma.financialRecord.create({
            data: {
              trainerId: updated.trainerId,
              clientId: updated.clientId,
              type: 'income',
              source: 'Service',
              date: new Date(),
              amount: -Math.abs(refund),
              paymentMethod: null,
              notes: `${token}${refundReason ? ' | ' + String(refundReason) : ''}`,
            },
          })
        }
      }
    } catch (e) { console.warn('Failed to create refund income (services.patch):', e) }
    res.json(updated);
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// GET assignments (optionally by client)
router.get('/assignments', async (req: Request, res: Response) => {
  try {
    const { trainerId, clientId } = req.query as Record<string, string>
    if (!trainerId) return res.status(400).json({ error: 'trainerId is required' })
    const where: any = { trainerId: Number(trainerId) }
    if (clientId) where.clientId = Number(clientId)
    const assignments = await prisma.clientService.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    res.json(assignments)
  } catch (error) {
    console.error('Error fetching service assignments:', error)
    res.status(500).json({ error: 'Failed to fetch service assignments' })
  }
})

// DELETE assignment (soft-unassign)
router.delete('/assignments/:assignmentId', async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params
    const existing = await prisma.clientService.findUnique({ where: { id: Number(assignmentId) } })
    const updated = await prisma.clientService.update({
      where: { id: Number(assignmentId) },
      data: { isActive: false, unassignedAt: new Date() },
    })
    // Create optional negative record when query param refundAmount is provided
    try {
      const refundRaw = (req.query.refundAmount as string | undefined) || ''
      const refund = refundRaw ? Number(refundRaw) : 0
      if (existing && refund && refund > 0) {
        await prisma.financialRecord.create({
          data: {
            trainerId: existing.trainerId,
            clientId: existing.clientId,
            type: 'income',
            source: 'Service',
            date: new Date(),
            amount: -Math.abs(refund),
            paymentMethod: null,
            notes: `Service refund:${existing.id}`,
          },
        })
      }
    } catch (e) { console.warn('Failed to create refund income (service unassign):', e) }
    res.json(updated)
  } catch (error) {
    console.error('Error unassigning service:', error)
    res.status(500).json({ error: 'Failed to unassign service' })
  }
})

export default router;


