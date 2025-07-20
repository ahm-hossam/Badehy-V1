import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ installmentId: string }> }
) {
  try {
    const { installmentId } = await params;
    const installmentIdNum = parseInt(installmentId);

    if (isNaN(installmentIdNum)) {
      return NextResponse.json({ error: 'Invalid installment ID' }, { status: 400 });
    }

    const images = await prisma.transactionImage.findMany({
      where: {
        installmentId: installmentIdNum,
      },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        size: true,
        uploadedAt: true,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching transaction images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ installmentId: string }> }
) {
  try {
    console.log('POST /api/transaction-images/[installmentId] called');
    
    const { installmentId } = await params;
    const installmentIdNum = parseInt(installmentId);

    console.log('Installment ID:', installmentId, 'Parsed:', installmentIdNum);

    if (isNaN(installmentIdNum)) {
      console.log('Invalid installment ID');
      return NextResponse.json({ error: 'Invalid installment ID' }, { status: 400 });
    }

    // Check if installment exists
    const installment = await prisma.installment.findUnique({
      where: { id: installmentIdNum },
    });

    console.log('Installment found:', !!installment);

    if (!installment) {
      console.log('Installment not found');
      return NextResponse.json({ error: 'Installment not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const images = formData.getAll('images') as File[];

    console.log('Images received:', images.length);

    if (!images || images.length === 0) {
      console.log('No images provided');
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    const uploadedImages = [];

    for (const image of images) {
      console.log('Processing image:', image.name, image.type, image.size);
      
      // Validate file type
      if (!image.type.startsWith('image/')) {
        console.log('Skipping non-image file:', image.name);
        continue; // Skip non-image files
      }

      try {
        // Convert image to buffer
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);

        console.log('Image converted to buffer, size:', buffer.length);

        // Save to database
        const savedImage = await prisma.transactionImage.create({
          data: {
            installmentId: installmentIdNum,
            filename: `${Date.now()}_${image.name}`,
            originalName: image.name,
            mimeType: image.type,
            size: image.size,
            imageData: buffer,
          },
        });

        console.log('Image saved to database, ID:', savedImage.id);

        uploadedImages.push({
          id: savedImage.id,
          filename: savedImage.filename,
          originalName: savedImage.originalName,
          mimeType: savedImage.mimeType,
          size: savedImage.size,
        });
      } catch (imageError) {
        console.error('Error processing image:', image.name, imageError);
        // Continue with other images
      }
    }

    console.log('Upload completed, images uploaded:', uploadedImages.length);

    return NextResponse.json({
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      images: uploadedImages,
    });
  } catch (error) {
    console.error('Error uploading transaction images:', error);
    return NextResponse.json({ 
      error: 'Failed to upload images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ installmentId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    const { installmentId } = await params;
    const installmentIdNum = parseInt(installmentId);

    if (isNaN(installmentIdNum)) {
      return NextResponse.json({ error: 'Invalid installment ID' }, { status: 400 });
    }

    // Delete the specific image
    await prisma.transactionImage.deleteMany({
      where: {
        id: parseInt(imageId),
        installmentId: installmentIdNum,
      },
    });

    return NextResponse.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
} 