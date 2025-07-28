import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Save to database
    const supportRequest = await prisma.supportRequest.create({
      data: {
        name,
        email,
        subject,
        message,
        status: 'NEW'
      }
    });

    console.log('Support request saved to database:', supportRequest);

    return NextResponse.json(
      { message: 'Support request submitted successfully', id: supportRequest.id },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing support request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 