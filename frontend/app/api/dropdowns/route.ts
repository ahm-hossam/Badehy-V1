import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const dropdownData = {
      sources: [
        'Instagram',
        'Facebook',
        'WhatsApp',
        'Referral',
        'Google Search',
        'Website',
        'Other'
      ],
      paymentMethods: [
        'Credit Card',
        'Debit Card',
        'Cash',
        'Bank Transfer',
        'Mobile Payment',
        'Check',
        'Other'
      ]
    };

    return NextResponse.json(dropdownData);
  } catch (error) {
    console.error('Error fetching dropdown data:', error);
    return NextResponse.json({ error: 'Failed to fetch dropdown data' }, { status: 500 });
  }
} 