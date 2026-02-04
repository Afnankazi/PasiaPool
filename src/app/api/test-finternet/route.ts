/**
 * Test Finternet API Route
 * Simple endpoint to test Finternet integration
 */

import { NextRequest, NextResponse } from 'next/server';

const FINTERNET_API_KEY = process.env.FINTERNET_API_KEY;
const FINTERNET_BASE_URL = process.env.FINTERNET_BASE_URL || 'https://api.fmm.finternetlab.io';

export async function POST(request: NextRequest) {
  try {
    if (!FINTERNET_API_KEY) {
      return NextResponse.json(
        { error: 'Finternet API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { amount, currency, type, settlementMethod, settlementDestination, description } = body;

    console.log('Creating Finternet payment intent with:', {
      amount,
      currency,
      type,
      settlementMethod,
      settlementDestination,
      description
    });

    // Make request to Finternet API
    const finternetResponse = await fetch(`${FINTERNET_BASE_URL}/payment-intents`, {
      method: 'POST',
      headers: {
        'X-API-Key': FINTERNET_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: currency || 'USDC',
        type: type || 'CONDITIONAL',
        settlementMethod: settlementMethod || 'OFF_RAMP_MOCK',
        settlementDestination: settlementDestination || 'test_bank_account',
        description: description || 'Test payment',
        metadata: {
          source: 'PasiaPool',
          testMode: true,
          timestamp: new Date().toISOString(),
        }
      }),
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
    console.log('Finternet payment intent created:', paymentIntent);

    return NextResponse.json(paymentIntent);
  } catch (error) {
    console.error('Test Finternet API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create payment intent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Finternet API integration ready',
    apiKey: FINTERNET_API_KEY ? 'Configured' : 'Missing',
    baseUrl: FINTERNET_BASE_URL,
    timestamp: new Date().toISOString(),
  });
}