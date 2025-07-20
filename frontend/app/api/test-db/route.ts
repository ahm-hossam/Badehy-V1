import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing database connection...');

    // Test basic connection
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');

    // Test if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('📋 Tables found:', tables);

    // Test if Subscription table has correct columns
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Subscription' AND table_schema = 'public'
    `;
    console.log('📊 Subscription table columns:', columns);

    return NextResponse.json({ 
      success: true, 
      message: 'Database test successful',
      tables: tables,
      subscriptionColumns: columns
    });
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 