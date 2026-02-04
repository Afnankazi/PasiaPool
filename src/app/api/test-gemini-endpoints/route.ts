/**
 * Test Multiple Gemini API Endpoints
 * Try different endpoints to find the working one
 */

import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ENDPOINTS_TO_TEST = [
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent", 
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent",
  "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent"
];

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const results = [];

    for (const endpoint of ENDPOINTS_TO_TEST) {
      console.log(`Testing endpoint: ${endpoint}`);
      
      try {
        const testPayload = {
          contents: [{
            parts: [{
              text: "Hello! Please respond with: Working"
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 50,
          }
        };

        const response = await fetch(`${endpoint}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testPayload)
        });

        const result = {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          working: response.ok
        };

        if (response.ok) {
          const data = await response.json();
          result.response = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No text response';
        } else {
          const errorText = await response.text();
          result.error = errorText;
        }

        results.push(result);
        console.log(`Result for ${endpoint}:`, result);

      } catch (error) {
        results.push({
          endpoint,
          status: 'ERROR',
          error: error instanceof Error ? error.message : 'Unknown error',
          working: false
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      workingEndpoints: results.filter(r => r.working),
      message: 'Endpoint testing completed'
    });

  } catch (error) {
    console.error('Endpoint testing error:', error);
    return NextResponse.json({
      error: 'Failed to test endpoints',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Gemini endpoint testing ready',
    apiKey: GEMINI_API_KEY ? 'Configured' : 'Missing',
    endpointsToTest: ENDPOINTS_TO_TEST.length,
    timestamp: new Date().toISOString(),
  });
}