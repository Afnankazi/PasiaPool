/**
 * List Gemini Models Page
 * Show available models for your API key
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, List } from 'lucide-react';

export default function ListGeminiModelsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  const listModels = async () => {
    setLoading(true);
    setError('');
    setResults(null);

    try {
      console.log('Listing available Gemini models...');
      
      const response = await fetch('/api/list-gemini-models');
      const data = await response.json();
      console.log('Model listing results:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Model listing failed');
      }

      setResults(data);
    } catch (error) {
      console.error('Model listing error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-load on component mount
  useEffect(() => {
    listModels();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <List className="mr-2 h-8 w-8" />
          Available Gemini Models
        </h1>
        <p className="text-gray-600">
          See which Gemini models are available for your API key
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Refresh Model List</CardTitle>
            <CardDescription>
              Get the latest list of available models
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={listModels} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Loading Models...' : 'Refresh Model List'}
            </Button>
          </CardContent>
        </Card>

        {results && (
          <>
            {results.workingVersions?.length > 0 && (
              <Alert className="mb-6">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Found {results.workingVersions.length} working API version(s)!
                </AlertDescription>
              </Alert>
            )}

            {results.results?.map((result: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    API Version: {result.apiVersion}
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.working ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {result.working ? '✅ Working' : '❌ Failed'}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Status: {result.status} {result.statusText}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {result.working && result.generateContentModels && (
                    <div>
                      <h4 className="font-medium mb-3">
                        Models that support generateContent ({result.generateContentModels.length}):
                      </h4>
                      <div className="space-y-3">
                        {result.generateContentModels.map((model: any, modelIndex: number) => (
                          <div key={modelIndex} className="p-3 border rounded-lg bg-green-50">
                            <div className="font-medium text-sm mb-1">
                              {model.displayName || model.name}
                            </div>
                            <div className="text-xs text-gray-600 mb-2">
                              <code>{model.name}</code>
                            </div>
                            {model.description && (
                              <div className="text-sm text-gray-700 mb-2">
                                {model.description}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              Supported methods: {model.supportedMethods?.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.error && (
                    <div className="text-sm text-red-600">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}