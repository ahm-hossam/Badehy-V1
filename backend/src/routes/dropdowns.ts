import { Router, Request, Response } from 'express'

const router = Router()

// Static options (can be moved to config/db in future)
const sources = [
  'Facebook Ads',
  'Instagram',
  'Referral',
  'Walk-in',
  'Website',
  'Other',
]

const paymentMethods = [
  'Instapay',
  'Vodafone Cash',
  'Cash',
  'Credit Card',
  'Bank Transfer',
]

// GET /api/dropdowns
router.get('/', (req: Request, res: Response) => {
  res.json({ sources, paymentMethods })
})

export default router 