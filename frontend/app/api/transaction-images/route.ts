import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const installmentId = formData.get('installmentId') as string;
    const file = formData.get('image') as File;

    if (!installmentId || !file) {
      return NextResponse.json({ error: 'Installment ID and image file are required' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;

    // Save to database
    const transactionImage = await prisma.transactionImage.create({
      data: {
        installmentId: parseInt(installmentId),
        filename: filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        imageData: buffer,
      },
    });

    return NextResponse.json({
      id: transactionImage.id,
      filename: transactionImage.filename,
      originalName: transactionImage.originalName,
      size: transactionImage.size,
    });
  } catch (error) {
    console.error('Error uploading transaction image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
} 