import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for PDF uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '../../uploads/templates');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get all templates for a trainer
router.get('/', async (req, res) => {
  try {
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const templates = await prisma.pDFTemplate.findMany({
      where: { 
        trainerId: parseInt(trainerId as string),
        isActive: true
      },
      include: {
        pages: {
          orderBy: { pageOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Upload a new template (complete or page-by-page)
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { trainerId, name, description, category, uploadType, pageName, pageOrder } = req.body;
    const file = req.file;

    if (!trainerId || !name || !file) {
      return res.status(400).json({ error: 'Trainer ID, name, and file are required' });
    }

    // Check if trainer exists
    const trainer = await prisma.registered.findUnique({
      where: { id: parseInt(trainerId) }
    });

    if (!trainer) {
      return res.status(404).json({ error: 'Trainer not found' });
    }

    if (uploadType === 'page-by-page') {
      // Page-by-page upload
      if (!pageName || pageOrder === undefined) {
        return res.status(400).json({ error: 'Page name and order are required for page-by-page uploads' });
      }

      // Check if template exists, if not create it
      let template = await prisma.pDFTemplate.findFirst({
        where: { 
          trainerId: parseInt(trainerId),
          name: name,
          uploadType: 'page-by-page'
        }
      });

      if (!template) {
        // Create new template
        template = await prisma.pDFTemplate.create({
          data: {
            trainerId: parseInt(trainerId),
            name,
            description: description || '',
            uploadType: 'page-by-page',
            category: category || 'general',
            isActive: true
          }
        });
      }

      // Create the page
      const page = await prisma.pDFTemplatePage.create({
        data: {
          templateId: template.id,
          pageName,
          pageOrder: parseInt(pageOrder),
          fileUrl: `/uploads/templates/${file.filename}`
        }
      });

      // Return the updated template with all pages
      const updatedTemplate = await prisma.pDFTemplate.findUnique({
        where: { id: template.id },
        include: {
          pages: {
            orderBy: { pageOrder: 'asc' }
          }
        }
      });

      res.json(updatedTemplate);
    } else {
      // Complete template upload
      const template = await prisma.pDFTemplate.create({
        data: {
          trainerId: parseInt(trainerId),
          name,
          description: description || '',
          fileUrl: `/uploads/templates/${file.filename}`,
          uploadType: 'complete',
          category: category || 'general',
          isActive: true
        }
      });

      res.json(template);
    }
  } catch (error) {
    console.error('Error uploading template:', error);
    res.status(500).json({ error: 'Failed to upload template' });
  }
});

// Add a page to an existing template
router.post('/:templateId/pages', upload.single('file'), async (req, res) => {
  try {
    const { templateId } = req.params;
    const { pageName, pageOrder } = req.body;
    const file = req.file;

    if (!pageName || pageOrder === undefined || !file) {
      return res.status(400).json({ error: 'Page name, order, and file are required' });
    }

    // Check if template exists and belongs to trainer
    const template = await prisma.pDFTemplate.findUnique({
      where: { id: parseInt(templateId) }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (template.uploadType !== 'page-by-page') {
      return res.status(400).json({ error: 'Can only add pages to page-by-page templates' });
    }

    // Create the page
    const page = await prisma.pDFTemplatePage.create({
      data: {
        templateId: parseInt(templateId),
        pageName,
        pageOrder: parseInt(pageOrder),
        fileUrl: `/uploads/templates/${file.filename}`
      }
    });

    // Return the updated template with all pages
    const updatedTemplate = await prisma.pDFTemplate.findUnique({
      where: { id: parseInt(templateId) },
      include: {
        pages: {
          orderBy: { pageOrder: 'asc' }
        }
      }
    });

    res.json(updatedTemplate);
  } catch (error) {
    console.error('Error adding page to template:', error);
    res.status(500).json({ error: 'Failed to add page to template' });
  }
});

// Delete a page from a template
router.delete('/:templateId/pages/:pageId', async (req, res) => {
  try {
    const { templateId, pageId } = req.params;

    const page = await prisma.pDFTemplatePage.findUnique({
      where: { id: parseInt(pageId) }
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    if (page.templateId !== parseInt(templateId)) {
      return res.status(400).json({ error: 'Page does not belong to this template' });
    }

    // Delete the file from storage
    if (page.fileUrl) {
      const filePath = path.join(__dirname, '../../uploads', page.fileUrl.replace('/uploads/', ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete the page
    await prisma.pDFTemplatePage.delete({
      where: { id: parseInt(pageId) }
    });

    // Return the updated template with remaining pages
    const updatedTemplate = await prisma.pDFTemplate.findUnique({
      where: { id: parseInt(templateId) },
      include: {
        pages: {
          orderBy: { pageOrder: 'asc' }
        }
      }
    });

    res.json(updatedTemplate);
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

// Delete a template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const template = await prisma.pDFTemplate.findUnique({
      where: { id: parseInt(id) },
      include: { pages: true }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Check if the template belongs to the trainer
    if (template.trainerId !== parseInt(trainerId as string)) {
      return res.status(403).json({ error: 'You can only delete your own templates' });
    }

    // Delete all page files from storage
    for (const page of template.pages) {
      if (page.fileUrl) {
        const filePath = path.join(__dirname, '../../uploads', page.fileUrl.replace('/uploads/', ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // Delete the main template file if it exists
    if (template.fileUrl) {
      const filePath = path.join(__dirname, '../../uploads', template.fileUrl.replace('/uploads/', ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete from database (pages will be deleted via cascade)
    await prisma.pDFTemplate.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router; 