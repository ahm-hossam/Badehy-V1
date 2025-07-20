import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST() {
  try {
    // Create a test package
    const testPackage = await prisma.package.create({
      data: {
        trainerId: 1, // Use the ID of the registered user
        name: "Basic Training Package"
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Test package created successfully',
      package: testPackage
    });
  } catch (error) {
    console.error('Error creating test package:', error);
    return NextResponse.json({ 
      error: 'Failed to create test package',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 