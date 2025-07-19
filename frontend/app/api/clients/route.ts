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

    const clients = await prisma.trainerClient.findMany({
      where: {
        trainerId: parseInt(trainerId),
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      },
      include: {
        subscriptions: {
          include: {
            package: true,
            installments: {
              include: {
                transactionImages: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trainerId, client, subscription, installments } = body;

    if (!trainerId || !client || !subscription) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create client
      const createdClient = await tx.trainerClient.create({
        data: {
          trainerId: parseInt(trainerId),
          fullName: client.fullName,
          phone: client.phone,
          email: client.email || null,
          gender: client.gender || null,
          age: client.age ? parseInt(client.age) : null,
          source: client.source || null,
          notes: client.notes || null,
        },
      });

      // Create subscription
      const createdSubscription = await tx.subscription.create({
        data: {
          trainerClientId: createdClient.id,
          startDate: new Date(subscription.startDate),
          endDate: new Date(subscription.endDate),
          packageId: parseInt(subscription.packageId),
          durationValue: parseInt(subscription.durationValue),
          durationUnit: subscription.durationUnit,
          paymentStatus: subscription.paymentStatus,
          paymentMethod: subscription.paymentMethod || null,
          priceBeforeDisc: parseFloat(subscription.priceBeforeDisc),
          discountApplied: subscription.discountApplied || false,
          priceAfterDisc: parseFloat(subscription.priceAfterDisc),
        },
      });

      // Create installments if provided
      const createdInstallments = [];
      if (installments && Array.isArray(installments)) {
        for (const inst of installments) {
          // Skip installment if required fields are missing
          if (!inst.paidDate || !inst.amount) {
            continue;
          }
          
          const createdInstallment = await tx.installment.create({
            data: {
              subscriptionId: createdSubscription.id,
              paidDate: new Date(inst.paidDate),
              amount: parseFloat(inst.amount),
              remaining: parseFloat(inst.remaining),
              nextInstallment: inst.nextInstallment ? new Date(inst.nextInstallment) : null,
              status: 'paid', // Default status
            },
          });
          createdInstallments.push(createdInstallment);
        }
      }

      return {
        client: createdClient,
        subscription: createdSubscription,
        installments: createdInstallments,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
} 