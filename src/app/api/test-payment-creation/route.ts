/**
 * Test Payment Creation API
 * Simple endpoint to test if Finternet payment creation is working
 */

import { NextRequest, NextResponse } from 'next/server';

const FINTERNET_API_KEY = process.env.FINTERNET_API_KEY;
const FINTERNET_BASE_URL = process.env.FINTERNET_BASE_URL || 'https://api.fmm.finternetlab.io/api/v1';

export async function POST(request: NextRequest) {
  try {
    if (!FINTERNET_API_KEY) {
      return NextResponse.json(
        { error: 'Finternet API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { amount = '100.00', settlementDestination = 'test_bank_account' } = body;

    console.log('Testing Finternet payment creation with:', {
      amount,
      settlementDestination,
      apiKey: FINTERNET_API_KEY ? 'Present' : 'Missing',
      baseUrl: FINTERNET_BASE_URL
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
        currency: 'USDC',
        type: 'CONDITIONAL',
        settlementMethod: 'OFF_RAMP_MOCK',
        settlementDestination,
        description: 'Test payment creation',
        metadata: {
          source: 'PasiaPool-Test',
          testMode: true,
          timestamp: new Date().toISOString(),
        }
      }),
    });

    console.log('Finternet response status:', finternetResponse.status);
    console.log('Finternet response headers:', Object.fromEntries(finternetResponse.headers.entries()));

    if (!finternetResponse.ok) {
      const errorText = await finternetResponse.text();
      console.error('Finternet API error response:', errorText);
      
      return NextResponse.json(
        { 
          error: `Finternet API error: ${finternetResponse.status} ${finternetResponse.statusText}`,
          details: errorText,
          requestData: {
            amount,
            currency: 'USDC',
            type: 'CONDITIONAL',
            settlementMethod: 'OFF_RAMP_MOCK',
            settlementDestination,
          }
        },
        { status: finternetResponse.status }
      );
    }

    const paymentIntent = await finternetResponse.json();
    console.log('Finternet payment intent created successfully:', paymentIntent);

    return NextResponse.json({
      success: true,
      paymentIntent,
      message: 'Payment creation test successful'
    });

  } catch (error) {
    console.error('Test payment creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test payment creation',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Test Payment Creation API ready',
    apiKey: FINTERNET_API_KEY ? 'Configured' : 'Missing',
    baseUrl: FINTERNET_BASE_URL,
    timestamp: new Date().toISOString(),
  });
}