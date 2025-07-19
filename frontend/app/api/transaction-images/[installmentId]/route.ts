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