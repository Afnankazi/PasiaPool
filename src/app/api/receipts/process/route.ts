// Receipt processing API using Gemini Vision API
// This endpoint processes receipt images directly using Google's Gemini Vision API
// No local OCR installation required - works on Vercel and other cloud platforms

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_VISION_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('receipt') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit for OCR processing)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Please upload an image smaller than 10MB.' },
        { status: 400 }
      );
    }

    // Create temp directory if it doesn't exist
    const tempDir = join(process.cwd(), 'public', 'temp');
    try {
      await mkdir(tempDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    // Save file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `receipt_${session.user.id}_${Date.now()}.${file.name.split('.').pop()}`;
    const filePath = join(tempDir, fileName);
    
    await writeFile(filePath, buffer);

    let geminiAnalysis: GeminiReceiptAnalysis | null = null;
    let extractedText = '';

    try {
      // Use Gemini Vision API for direct image analysis (no OCR needed)
      if (GEMINI_API_KEY) {
        console.log('Processing receipt image with Gemini Vision API...');
        
        // Convert image to base64 for Gemini API
        const base64Image = buffer.toString('base64');
        const mimeType = file.type;

        const geminiPayload = {
          contents: [{
            parts: [
              {
                text: `Analyze this receipt image and extract structured information. Return a JSON object with the following exact structure:
{
  "totalAmount": <number>,
  "description": "<string describing the purchase>",
  "merchantName": "<store/restaurant name>",
  "date": "<YYYY-MM-DD format if visible>",
  "items": [{"name": "<item name>", "price": <number>}],
  "confidence": <number between 0 and 1>,
  "extractedText": "<all visible text from the receipt>"
}

Please be accurate with the total amount and include all visible text in the extractedText field.`
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 4096,
          }
        };

        const geminiResponse = await fetch(`${GEMINI_VISION_API_URL}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(geminiPayload)
        });

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (responseText) {
            try {
              // Extract JSON from the response
              const jsonMatch = responseText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                geminiAnalysis = parsed;
                extractedText = parsed.extractedText || '';
                console.log('Gemini Vision analysis completed successfully');
              }
            } catch (parseError) {
              console.error('Failed to parse Gemini response:', parseError);
              // Simple fallback
              geminiAnalysis = {
                totalAmount: 0,
                description: 'Receipt processed - please verify details',
                merchantName: '',
                date: '',
                items: [],
                confidence: 0.3
              };
            }
          }
        } else {
          console.error('Gemini Vision API request failed:', geminiResponse.status);
          const errorText = await geminiResponse.text();
          console.error('Error details:', errorText);
        }
      } else {
        console.log('Gemini API key not available, using fallback analysis');
        geminiAnalysis = {
          totalAmount: 0,
          description: 'Receipt uploaded - manual entry required',
          merchantName: '',
          date: '',
          items: [],
          confidence: 0
        };
      }
    } catch (error) {
      console.error('Image processing failed:', error);
      // Fallback analysis
      geminiAnalysis = {
        totalAmount: 0,
        description: 'Receipt uploaded - manual entry required',
        merchantName: '',
        date: '',
        items: [],
        confidence: 0
      };
    }

    // Clean up temp file
    try {
      await unlink(filePath);
    } catch (cleanupError) {
      console.error('Failed to cleanup temp file:', cleanupError);
    }

    // Return processed results
    const response = {
      extractedText: extractedText || '',
      detectedPrice: geminiAnalysis?.totalAmount || 0,
      confidence: geminiAnalysis?.confidence || 0,
      description: geminiAnalysis?.description || '',
      merchantName: geminiAnalysis?.merchantName || '',
      date: geminiAnalysis?.date || '',
      items: geminiAnalysis?.items || [],
      fileName: fileName,
      success: true,
      requiresClientOCR: false,
      message: extractedText ? "Receipt processed successfully" : "Image uploaded but OCR processing failed"
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error processing receipt:', error);
    return NextResponse.json(
      { error: 'Failed to process receipt', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    const geminiRes = await fetch(`${GEMINI_VISION_API_URL}?key=${GEMINI_API_KEY}`, {
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
