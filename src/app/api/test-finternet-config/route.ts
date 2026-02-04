/**
 * Test Finternet Configuration
 * Quick endpoint to verify configuration
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    apiKey: process.env.FINTERNET_API_KEY ? 'Configured ✅' : 'Missing ❌',
    baseUrl: process.env.FINTERNET_BASE_URL || 'Not set',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json({
    status: 'Finternet Configuration Check',
    config,
    ready: !!process.env.FINTERNET_API_KEY,
  });
}