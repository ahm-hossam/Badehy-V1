import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await prisma.$connect();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    console.log('Fetching clients with search:', search);

    const clients = await prisma.client.findMany({
      where: {
        name: {
          contains: search,
          mode: 'insensitive', // Case-insensitive search
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    console.log(`Found ${clients.length} clients`);

    return NextResponse.json(clients, { status: 200 });
    
  } catch (error) {
    console.error('Clients fetch error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    await prisma.$connect();
    
    const body = await request.json();
    const { name } = body;

    console.log('Creating client:', { name });

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Client name is required.' }, { status: 400 });
    }

    const client = await prisma.client.create({
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

    console.log('Client created successfully:', { id: client.id, name: client.name });

    return NextResponse.json(client, { status: 201 });
    
  } catch (error) {
    console.error('Client creation error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 