import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const packages = await prisma.package.findMany();
    
    return NextResponse.json({
      success: true,
      packages: packages,
      count: packages.length
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch packages',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 