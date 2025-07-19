import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for memory storage (we'll store in database)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Only allow JPG and PNG
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG files are allowed'));
    }
  }
});

// Upload transaction images for an installment
router.post('/upload/:installmentId', upload.array('images', 10), async (req: express.Request, res: express.Response) => {
  try {
    const { installmentId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    // Verify installment exists
    const installment = await prisma.installment.findUnique({
      where: { id: parseInt(installmentId) }
    });

    if (!installment) {
      return res.status(404).json({ error: 'Installment not found' });
    }

    // Save images to database
    const savedImages = [];
    for (const file of files) {
      const transactionImage = await prisma.transactionImage.create({
        data: {
          installmentId: parseInt(installmentId),
          filename: `${Date.now()}-${file.originalname}`,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          imageData: file.buffer
        }
      });
      savedImages.push({
        id: transactionImage.id,
        filename: transactionImage.filename,
        originalName: transactionImage.originalName,
        mimeType: transactionImage.mimeType,
        size: transactionImage.size,
        uploadedAt: transactionImage.uploadedAt
      });
    }

    res.json({ 
      message: 'Images uploaded successfully', 
      images: savedImages 
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// Get transaction images for an installment
router.get('/installment/:installmentId', async (req: express.Request, res: express.Response) => {
  try {
    const { installmentId } = req.params;

    const images = await prisma.transactionImage.findMany({
      where: { installmentId: parseInt(installmentId) },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        size: true,
        uploadedAt: true
      },
      orderBy: { uploadedAt: 'desc' }
    });

    res.json({ images });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Get transaction images for a subscription (all installments)
router.get('/subscription/:subscriptionId', async (req: express.Request, res: express.Response) => {
  try {
    const { subscriptionId } = req.params;

    const installmentsWithImages = await prisma.installment.findMany({
      where: { subscriptionId: parseInt(subscriptionId) },
      include: {
        transactionImages: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimeType: true,
            size: true,
            uploadedAt: true
          },
          orderBy: { uploadedAt: 'desc' }
        }
      },
      orderBy: { paidDate: 'desc' }
    });

    res.json({ installments: installmentsWithImages });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Get a specific image by ID
router.get('/image/:imageId', async (req: express.Request, res: express.Response) => {
  try {
    const { imageId } = req.params;

    const image = await prisma.transactionImage.findUnique({
      where: { id: parseInt(imageId) }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.set('Content-Type', image.mimeType);
    res.set('Content-Disposition', `inline; filename="${image.originalName}"`);
    res.send(image.imageData);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

// Delete a transaction image
router.delete('/image/:imageId', async (req: express.Request, res: express.Response) => {
  try {
    const { imageId } = req.params;

    const image = await prisma.transactionImage.findUnique({
      where: { id: parseInt(imageId) }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    await prisma.transactionImage.delete({
      where: { id: parseInt(imageId) }
    });

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

export default router; 