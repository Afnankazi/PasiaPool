/**
 * Test Gemini Endpoints Page
 * Find the correct working Gemini API endpoint
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Search } from 'lucide-react';

export default function TestGeminiEndpointsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  const testAllEndpoints = async () => {
    setLoading(true);
    setError('');
    setResults(null);

    try {
      console.log('Testing all Gemini API endpoints...');
      
      const response = await fetch('/api/test-gemini-endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      console.log('Endpoint test results:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Endpoint testing failed');
      }

      setResults(data);
    } catch (error) {
      console.error('Endpoint test error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Search className="mr-2 h-8 w-8" />
          Find Working Gemini API Endpoint
        </h1>
        <p className="text-gray-600">
          Test multiple Gemini API endpoints to find the correct one
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
            <CardTitle>Test All Endpoints</CardTitle>
            <CardDescription>
              This will test multiple Gemini API endpoints to find which one works
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testAllEndpoints} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing All Endpoints...' : 'Test All Gemini Endpoints'}
            </Button>
          </CardContent>
        </Card>

        {results && (
          <>
            {results.workingEndpoints?.length > 0 && (
              <Alert className="mb-6">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Found {results.workingEndpoints.length} working endpoint(s)!
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>
                  Results for all tested endpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.results?.map((result: any, index: number) => (
                    <div 
                      key={index}
                      className={`p-4 border rounded-lg ${
                        result.working ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">
                          {result.endpoint.split('/').pop()}
                        </h4>
                        <span className={`px-2 py-1 rounded text-xs ${
                          result.working ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.working ? '✅ Working' : '❌ Failed'}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600 mb-2">
                        {result.endpoint}
                      </div>
                      
                      <div className="text-sm">
                        <strong>Status:</strong> {result.status} {result.statusText}
                      </div>
                      
                      {result.response && (
                        <div className="text-sm mt-2">
                          <strong>Response:</strong> {result.response}
                        </div>
                      )}
                      
                      {result.error && (
                        <div className="text-sm mt-2 text-red-600">
                          <strong>Error:</strong> {result.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {results.workingEndpoints?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>✅ Working Endpoints</CardTitle>
                  <CardDescription>
                    Use these endpoints in your code
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.workingEndpoints.map((endpoint: any, index: number) => (
                      <div key={index} className="p-3 bg-green-50 border border-green-200 rounded">
                        <code className="text-sm">{endpoint.endpoint}</code>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}