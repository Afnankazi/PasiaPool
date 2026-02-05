/**
 * Test Gemini API
 * Simple endpoint to test if Gemini Vision API is working
 */

import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    console.log('Testing Gemini API with key:', GEMINI_API_KEY ? 'Present' : 'Missing');

    // Simple text-only test first
    const testPayload = {
      contents: [{
        parts: [{
          text: "Hello! Please respond with a simple JSON object: {\"status\": \"working\", \"message\": \"Gemini API is functional\"}"
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 100,
      }
    };

    console.log('Making request to:', `${GEMINI_API_URL}?key=${GEMINI_API_KEY.substring(0, 10)}...`);

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    console.log('Gemini API response status:', response.status);
    console.log('Gemini API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);

      return NextResponse.json({
        error: `Gemini API error: ${response.status} ${response.statusText}`,
        details: errorText,
        apiKey: GEMINI_API_KEY ? 'Configured' : 'Missing',
        url: GEMINI_API_URL
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('Gemini API success response:', JSON.stringify(data, null, 2));

    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return NextResponse.json({
      success: true,
      geminiResponse: data,
      extractedText: responseText,
      message: 'Gemini API test successful'
    });

  } catch (error) {
    console.error('Gemini API test error:', error);
    return NextResponse.json({
      error: 'Failed to test Gemini API',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Gemini API test endpoint ready',
    apiKey: GEMINI_API_KEY ? 'Configured' : 'Missing',
    apiUrl: GEMINI_API_URL,
    timestamp: new Date().toISOString(),
  });
}