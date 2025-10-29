import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '../../uploads/messages');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${uniqueSuffix}-${baseName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, videos
    const allowedTypes = /jpeg|jpg|png|gif|pdf|mp4|mov|avi|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, videos, and documents are allowed.'));
    }
  }
});

// POST /api/message-uploads - Upload a file for a message
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { trainerId, clientId } = req.body;

    if (!trainerId || !clientId) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'trainerId and clientId are required' });
    }

    // Determine file type
    const ext = path.extname(req.file.originalname).toLowerCase();
    let fileType = 'document';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      fileType = 'image';
    } else if (['.pdf'].includes(ext)) {
      fileType = 'pdf';
    } else if (['.mp4', '.mov', '.avi', '.webm'].includes(ext)) {
      fileType = 'video';
    }

    // Return file info
    const fileUrl = `/uploads/messages/${req.file.filename}`;
    
    res.json({
      url: fileUrl,
      type: fileType,
      name: req.file.originalname,
      size: req.file.size
    });
  } catch (error: any) {
    // Delete file if upload failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error uploading file:', error);
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
});

export default router;

