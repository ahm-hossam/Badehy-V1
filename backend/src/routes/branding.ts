import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/branding');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    console.log('File filter check:', file.originalname, file.mimetype);
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get branding settings for a trainer
router.get('/:trainerId', async (req, res) => {
  try {
    const { trainerId } = req.params;
    
    if (!trainerId || trainerId === 'undefined') {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }
    
    const branding = await prisma.brandingSettings.findFirst({
      where: { trainerId: parseInt(trainerId) }
    });

    if (branding) {
      // Transform backend fields to frontend format
      res.json({
        id: branding.id,
        trainerId: branding.trainerId.toString(),
        companyName: branding.companyName,
        logoUrl: branding.logoUrl,
        email: branding.contactEmail,
        phone: branding.contactPhone,
        website: branding.website || '',
        address: branding.address || ''
      });
    } else {
      // Return default branding if none exists
      res.json({
        trainerId: trainerId,
        companyName: '',
        email: '',
        phone: '',
        website: '',
        address: ''
      });
    }
  } catch (error) {
    console.error('Error fetching branding:', error);
    res.status(500).json({ error: 'Failed to fetch branding settings' });
  }
});

// Create or update branding settings
router.post('/', async (req, res) => {
  try {
    console.log('Branding POST request received');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body:', req.body);
    
    // For now, handle only JSON requests to simplify debugging
    const brandingData = req.body;

    const {
      trainerId,
      companyName,
      logoUrl,
      email,
      phone,
      website,
      address
    } = brandingData;

    // Handle logo URL (no file upload for now)
    let finalLogoUrl = logoUrl || '';

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    // Check if branding already exists
    const existingBranding = await prisma.brandingSettings.findFirst({
      where: { trainerId: parseInt(trainerId) }
    });

    let branding;
    if (existingBranding) {
      // Update existing branding
      branding = await prisma.brandingSettings.update({
        where: { id: existingBranding.id },
        data: {
          companyName,
          logoUrl: finalLogoUrl,
          contactEmail: email,
          contactPhone: phone,
          website,
          address
        }
      });
    } else {
      // Create new branding
      branding = await prisma.brandingSettings.create({
        data: {
          trainerId: parseInt(trainerId),
          companyName,
          logoUrl: finalLogoUrl,
          contactEmail: email,
          contactPhone: phone,
          website,
          address
        }
      });
    }

    // Return in frontend format
    res.json({
      id: branding.id,
      trainerId: branding.trainerId.toString(),
      companyName: branding.companyName,
      logoUrl: branding.logoUrl,
      email: branding.contactEmail,
      phone: branding.contactPhone,
      website: branding.website || '',
      address: branding.address || ''
    });
  } catch (error: any) {
    console.error('Error saving branding:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        error: 'Failed to save branding settings',
        details: error.message 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to save branding settings',
        details: 'Unknown error occurred'
      });
    }
  }
});

export default router; 