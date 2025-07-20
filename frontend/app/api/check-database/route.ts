import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    // Check if we can connect to the database
    await prisma.$connect();
    
    // Check if TransactionImage table exists by trying to count
    const transactionImageCount = await prisma.transactionImage.count();
    
    // Check if Installment table exists
    const installmentCount = await prisma.installment.count();
    
    // Check if Subscription table exists
    const subscriptionCount = await prisma.subscription.count();
    
    // Check if TrainerClient table exists
    const trainerClientCount = await prisma.trainerClient.count();
    
    return NextResponse.json({
      success: true,
      database: 'Connected',
      tables: {
        TransactionImage: {
          exists: true,
          count: transactionImageCount
        },
        Installment: {
          exists: true,
          count: installmentCount
        },
        Subscription: {
          exists: true,
          count: subscriptionCount
        },
        TrainerClient: {
          exists: true,
          count: trainerClientCount
        }
      }
    });
  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 