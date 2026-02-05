/**
 * Payment Status API Route
 * Check payment status from Finternet
 */

import { NextRequest, NextResponse } from 'next/server';
import { finternetClient } from '@/lib/finternet';

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentIntentId: string } }
) {
  try {
    const { paymentIntentId } = await params;

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID required' }, { status: 400 });
    }

    // Get payment status from Finternet
    const paymentIntent = await finternetClient.getPaymentIntent(paymentIntentId);

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      data: paymentIntent.data
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}