import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    // Test if we can access the TransactionImage model
    const count = await prisma.transactionImage.count();
    
    return NextResponse.json({
      success: true,
      message: 'TransactionImage model is accessible',
      count: count
    });
  } catch (error) {
    console.error('Error testing TransactionImage:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const testFile = formData.get('test') as File;
    
    if (!testFile) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Test creating a transaction image
    const bytes = await testFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const testImage = await prisma.transactionImage.create({
      data: {
        installmentId: 1, // Test with a dummy ID
        filename: `test_${Date.now()}.jpg`,
        originalName: testFile.name,
        mimeType: testFile.type,
        size: testFile.size,
        imageData: buffer,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'TransactionImage created successfully',
      image: {
        id: testImage.id,
        filename: testImage.filename,
        originalName: testImage.originalName,
        mimeType: testImage.mimeType,
        size: testImage.size,
      }
    });
  } catch (error) {
    console.error('Error testing TransactionImage creation:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 