import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Ensure Prisma client is ready
    await prisma.$connect();
    
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID.' }, { status: 400 });
    }

    console.log('Fetching profile for user ID:', userId);

    const user = await prisma.registered.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        countryCode: true,
        countryName: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      console.log('User not found:', userId);
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    console.log('Profile fetched successfully:', { id: user.id, email: user.email });

    return NextResponse.json(user, { status: 200 });
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  } finally {
    // Disconnect from database
    await prisma.$disconnect();
  }
} 