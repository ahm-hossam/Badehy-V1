import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trainerId = searchParams.get('trainerId');
    const search = searchParams.get('search') || '';

    if (!trainerId) {
      return NextResponse.json({ error: 'Trainer ID is required' }, { status: 400 });
    }

    const packages = await prisma.package.findMany({
      where: {
        trainerId: parseInt(trainerId),
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trainerId, name } = body;

    if (!trainerId || !name) {
      return NextResponse.json({ error: 'Trainer ID and name are required' }, { status: 400 });
    }

    // Check if package already exists for this trainer
    const existingPackage = await prisma.package.findFirst({
      where: {
        trainerId: parseInt(trainerId),
        name: name.trim(),
      },
    });

    if (existingPackage) {
      return NextResponse.json({ error: 'Package already exists' }, { status: 400 });
    }

    const newPackage = await prisma.package.create({
      data: {
        trainerId: parseInt(trainerId),
        name: name.trim(),
      },
    });

    return NextResponse.json(newPackage);
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json({ error: 'Failed to create package' }, { status: 500 });
  }
} 