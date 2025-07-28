import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const supportRequests = await prisma.supportRequest.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(supportRequests);
  } catch (error) {
    console.error('Error fetching support requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID and status are required' },
        { status: 400 }
      );
    }

    const updatedRequest = await prisma.supportRequest.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating support request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 