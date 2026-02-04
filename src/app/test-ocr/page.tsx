/**
 * Test OCR Page
 * Simple page to test and debug OCR/Gemini API issues
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Eye, Upload } from 'lucide-react';

export default function TestOCRPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const testGeminiAPI = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('Testing Gemini API...');
      
      const response = await fetch('/api/test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      console.log('Gemini test response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Gemini API test failed');
      }

      setResult(data);
    } catch (error) {
      console.error('Gemini test error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const checkGeminiStatus = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/test-gemini');
      const data = await response.json();
      console.log('Gemini status:', data);
      setResult(data);
    } catch (error) {
      console.error('Status check error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testReceiptProcessing = async () => {
    if (!selectedFile) {
      setError('Please select an image file first');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('Testing receipt processing with file:', selectedFile.name);
      
      const formData = new FormData();
      formData.append('receipt', selectedFile);

      const response = await fetch('/api/receipts/process', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('Receipt processing response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Receipt processing failed');
      }

      setResult(data);
    } catch (error) {
      console.error('Receipt processing error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setResult(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Eye className="mr-2 h-8 w-8" />
          Test OCR & Gemini API
        </h1>
        <p className="text-gray-600">
          Debug OCR processing and Gemini Vision API issues
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {result.success ? 'Test successful!' : 'Status retrieved'}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gemini API Status</CardTitle>
            <CardDescription>
              Check if the Gemini API is properly configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={checkGeminiStatus} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Checking...' : 'Check Gemini API Status'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Gemini API</CardTitle>
            <CardDescription>
              Test basic Gemini API functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testGeminiAPI} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Gemini API'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Receipt Processing</CardTitle>
            <CardDescription>
              Test the complete OCR pipeline with an actual image
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="receipt-file" className="block text-sm font-medium mb-2">
                Select Receipt Image
              </label>
              <input
                id="receipt-file"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <Button 
              onClick={testReceiptProcessing} 
              disabled={loading || !selectedFile}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {loading ? 'Processing...' : 'Test Receipt Processing'}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-xs overflow-auto whitespace-pre-wrap max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Common OCR Issues & Solutions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <strong>1. Gemini API Key Issues:</strong>
                <p className="text-gray-600">Check if GEMINI_API_KEY is valid and has proper permissions</p>
              </div>
              <div>
                <strong>2. API Quota Exceeded:</strong>
                <p className="text-gray-600">Check your Google AI Studio quota and billing</p>
              </div>
              <div>
                <strong>3. Image Format Issues:</strong>
                <p className="text-gray-600">Ensure image is in supported format (JPEG, PNG, WebP)</p>
              </div>
              <div>
                <strong>4. Image Size Issues:</strong>
                <p className="text-gray-600">Keep images under 10MB for best results</p>
              </div>
              <div>
                <strong>5. Network Issues:</strong>
                <p className="text-gray-600">Check connectivity to generativelanguage.googleapis.com</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}