/**
 * List Available Gemini Models
 * Get the actual available models for your API key
 */

import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function GET() {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    console.log('Listing available Gemini models...');

    // Try both API versions
    const apiVersions = ['v1beta', 'v1'];
    const results = [];

    for (const version of apiVersions) {
      const listModelsUrl = `https://generativelanguage.googleapis.com/${version}/models?key=${GEMINI_API_KEY}`;
      
      try {
        console.log(`Trying API version: ${version}`);
        
        const response = await fetch(listModelsUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const result = {
          apiVersion: version,
          status: response.status,
          statusText: response.statusText,
          working: response.ok
        };

        if (response.ok) {
          const data = await response.json();
          result.models = data.models || [];
          result.modelCount = result.models.length;
          
          // Extract model names that support generateContent
          result.generateContentModels = result.models
            .filter((model: any) => 
              model.supportedGenerationMethods?.includes('generateContent')
            )
            .map((model: any) => ({
              name: model.name,
              displayName: model.displayName,
              description: model.description,
              supportedMethods: model.supportedGenerationMethods
            }));
            
        } else {
          const errorText = await response.text();
          result.error = errorText;
        }

        results.push(result);
        console.log(`Result for ${version}:`, result);

      } catch (error) {
        results.push({
          apiVersion: version,
          status: 'ERROR',
          error: error instanceof Error ? error.message : 'Unknown error',
          working: false
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      workingVersions: results.filter(r => r.working),
      message: 'Model listing completed'
    });

  } catch (error) {
    console.error('Model listing error:', error);
    return NextResponse.json({
      error: 'Failed to list models',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}