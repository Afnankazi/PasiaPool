/**
 * Check Finternet Payment Status
 */

import { NextRequest, NextResponse } from 'next/server';

const FINTERNET_API_KEY = process.env.FINTERNET_API_KEY;
const FINTERNET_BASE_URL = process.env.FINTERNET_BASE_URL || 'https://api.fmm.finternetlab.io';

export async function GET(
  request: NextRequest,
  { params }: { params: { intentId: string } }
) {
  try {
    const { intentId } = await params;
    if (!FINTERNET_API_KEY) {
      return NextResponse.json(
        { error: 'Finternet API key not configured' },
        { status: 500 }
      );
    }

    console.log('Checking payment status for:', intentId);

    const finternetResponse = await fetch(`${FINTERNET_BASE_URL}/payment-intents/${intentId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': FINTERNET_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!finternetResponse.ok) {
      const errorText = await finternetResponse.text();
      console.error('Finternet API error:', {
        status: finternetResponse.status,
        statusText: finternetResponse.statusText,
        body: errorText
      });
      
      return NextResponse.json(
        { 
          error: `Finternet API error: ${finternetResponse.status} ${finternetResponse.statusText}`,
          details: errorText
        },
        { status: finternetResponse.status }
      );
    }

    const paymentIntent = await finternetResponse.json();
    console.log('Payment status:', paymentIntent);

    return NextResponse.json(paymentIntent);
  } catch (error) {
    console.error('Check payment status error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check payment status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}