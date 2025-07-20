import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trainerId, client, subscription, installments } = body;

    console.log('🔍 Debug: Starting client creation...');
    console.log('🔍 Debug: trainerId:', trainerId);
    console.log('🔍 Debug: client:', client);
    console.log('🔍 Debug: subscription:', subscription);

    if (!trainerId || !client || !subscription) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Test 1: Check if trainer exists
    console.log('🔍 Debug: Testing trainer existence...');
    const trainer = await prisma.registered.findUnique({
      where: { id: parseInt(trainerId) }
    });
    console.log('🔍 Debug: Trainer found:', trainer);

    if (!trainer) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 400 });
    }

    // Test 2: Check if package exists
    console.log('🔍 Debug: Testing package existence...');
    const package_ = await prisma.package.findUnique({
      where: { id: parseInt(subscription.packageId) }
    });
    console.log('🔍 Debug: Package found:', package_);

    if (!package_) {
      return NextResponse.json({ error: 'Package not found' }, { status: 400 });
    }

    // Test 3: Try to create client
    console.log('🔍 Debug: Creating client...');
    const createdClient = await prisma.trainerClient.create({
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
    console.log('🔍 Debug: Client created:', createdClient);

    // Test 4: Try to create subscription
    console.log('🔍 Debug: Creating subscription...');
    const createdSubscription = await prisma.subscription.create({
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
    console.log('🔍 Debug: Subscription created:', createdSubscription);

    // Test 5: Try to create installments
    console.log('🔍 Debug: Creating installments...');
    const createdInstallments = [];
    if (installments && Array.isArray(installments)) {
      for (const inst of installments) {
        if (!inst.paidDate || !inst.amount) {
          console.log('🔍 Debug: Skipping installment due to missing fields:', inst);
          continue;
        }
        
        const createdInstallment = await prisma.installment.create({
          data: {
            subscriptionId: createdSubscription.id,
            paidDate: new Date(inst.paidDate),
            amount: parseFloat(inst.amount),
            remaining: parseFloat(inst.remaining),
            nextInstallment: inst.nextInstallment ? new Date(inst.nextInstallment) : null,
            status: 'paid',
          },
        });
        createdInstallments.push(createdInstallment);
        console.log('🔍 Debug: Installment created:', createdInstallment);
      }
    }

    console.log('🔍 Debug: All operations successful!');

    return NextResponse.json({
      success: true,
      message: 'Debug test successful',
      result: {
        client: createdClient,
        subscription: createdSubscription,
        installments: createdInstallments,
      }
    });
  } catch (error) {
    console.error('❌ Debug: Error occurred:', error);
    return NextResponse.json({ 
      error: 'Debug test failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 