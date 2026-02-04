import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface GeminiReceiptAnalysis {
  totalAmount: number;
  description: string;
  merchantName?: string;
  date?: string;
  items?: Array<{
    name: string;
    price: number;
  }>;
  confidence: number;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // Analyze with Gemini AI
    const analysis = await analyzeReceiptWithGemini(text);

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Error analyzing receipt text:', error);
    return NextResponse.json(
      { error: 'Failed to analyze receipt text' },
      { status: 500 }
    );
  }
}

async function analyzeReceiptWithGemini(extractedText: string): Promise<GeminiReceiptAnalysis> {
  try {
    // Check if Gemini API key is available
    if (!GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not found, using fallback analysis');
      return fallbackAnalysis(extractedText);
    }

    const prompt = `Analyze this receipt text and extract key information. Return ONLY a valid JSON object with this exact structure:

{
  "totalAmount": number (the final total amount paid),
  "description": string (a concise description of the purchase, e.g. "Grocery shopping at Walmart" or "Coffee and pastry at Starbucks"),
  "merchantName": string (store/restaurant name if identifiable),
  "date": string (date in YYYY-MM-DD format if found, otherwise empty string),
  "items": [
    {
      "name": string,
      "price": number
    }
  ],
  "confidence": number (0.0 to 1.0, how confident you are in the total amount extraction)
}

Receipt text:
${extractedText}

Rules:
- Focus on finding the FINAL TOTAL amount (after tax, tips, etc.)
- If multiple total-like amounts exist, choose the final/grand total
- For description, be concise but descriptive (combine merchant + type of purchase)
- Only include clearly identifiable items in the items array
- Set confidence based on how clear the total amount is in the text
- Return ONLY the JSON object, no additional text or explanation`;

    // Call Gemini API using REST endpoint
    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
          responseMimeType: "application/json", // Force JSON response
        },
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.json();
      console.error('Gemini API error:', err);
      return fallbackAnalysis(extractedText);
    }

    const geminiData = await geminiRes.json();
    console.log('Gemini response data:', JSON.stringify(geminiData, null, 2));
    
    // Parse Gemini response
    try {
      const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        console.error('No response text from Gemini');
        return fallbackAnalysis(extractedText);
      }

      console.log('Raw Gemini text:', responseText);

      // Try to extract JSON if response contains other text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseText;

      const analysis = JSON.parse(jsonString) as GeminiReceiptAnalysis;
      
      // Validate the response
      if (typeof analysis.totalAmount !== 'number' || analysis.totalAmount < 0) {
        console.error('Invalid total amount in Gemini response');
        return fallbackAnalysis(extractedText);
      }
      
      if (!analysis.description || typeof analysis.description !== 'string') {
        analysis.description = 'Purchase from receipt';
      }
      
      if (typeof analysis.confidence !== 'number' || analysis.confidence < 0 || analysis.confidence > 1) {
        analysis.confidence = 0.7; // Default confidence
      }

      // Ensure items array exists
      if (!Array.isArray(analysis.items)) {
        analysis.items = [];
      }
      
      console.log('Successfully parsed Gemini analysis:', analysis);
      return analysis;
      
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      return fallbackAnalysis(extractedText);
    }
    
  } catch (error) {
    console.error('Gemini API error:', error);
    return fallbackAnalysis(extractedText);
  }
}

function fallbackAnalysis(text: string): GeminiReceiptAnalysis {
  // Fallback regex-based analysis if Gemini fails
  const pricePatterns = [
    { pattern: /total[\s:]*\$?(\d+\.?\d*)/i, confidence: 0.9 },
    { pattern: /amount[\s:]*\$?(\d+\.?\d*)/i, confidence: 0.85 },
    { pattern: /grand\s+total[\s:]*\$?(\d+\.?\d*)/i, confidence: 0.95 },
    { pattern: /\$(\d+\.\d{2})/g, confidence: 0.6 },
  ];

  let bestPrice = 0;
  let bestConfidence = 0;

  for (const { pattern, confidence } of pricePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const numericMatch = match.match(/(\d+\.?\d*)/);
        if (numericMatch) {
          const price = parseFloat(numericMatch[1]);
          if (price > 0 && price < 10000 && confidence > bestConfidence) {
            bestPrice = price;
            bestConfidence = confidence;
          }
        }
      }
    }
  }

  // Try to extract merchant name
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const merchantName = lines.length > 0 ? lines[0] : '';

  return {
    totalAmount: bestPrice,
    description: merchantName ? `Purchase at ${merchantName}` : 'Purchase from receipt',
    merchantName,
    date: '',
    items: [],
    confidence: bestConfidence
  };
}
