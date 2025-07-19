import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    await prisma.$connect();
    
    const body = await request.json();
    const { name } = body;

    console.log('Updating client:', { id, name });

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Client name is required.' }, { status: 400 });
    }

    const clientId = parseInt(id);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID.' }, { status: 400 });
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data: {
        name: name.trim(),
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    console.log('Client updated successfully:', { id: client.id, name: client.name });

    return NextResponse.json(client, { status: 200 });
    
  } catch (error) {
    console.error('Client update error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    await prisma.$connect();
    
    console.log('Deleting client:', { id });

    const clientId = parseInt(id);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID.' }, { status: 400 });
    }

    await prisma.client.delete({
      where: { id: clientId },
    });

    console.log('Client deleted successfully:', { id: clientId });

    return NextResponse.json({ message: 'Client deleted successfully.' }, { status: 200 });
    
  } catch (error) {
    console.error('Client deletion error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 