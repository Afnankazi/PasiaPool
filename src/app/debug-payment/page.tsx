/**
 * Debug Payment Creation Page
 * Simple page to test and debug payment creation issues
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Bug } from 'lucide-react';

export default function DebugPaymentPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('100.00');
  const [settlementDestination, setSettlementDestination] = useState('bank_account_123');

  const testPaymentCreation = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('Testing payment creation...');
      
      const response = await fetch('/api/test-payment-creation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          settlementDestination,
        }),
      });

      const data = await response.json();
      console.log('Test response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Test failed');
      }

      setResult(data);
    } catch (error) {
      console.error('Test error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const checkAPIStatus = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/test-payment-creation');
      const data = await response.json();
      console.log('API status:', data);
      setResult(data);
    } catch (error) {
      console.error('Status check error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Bug className="mr-2 h-8 w-8" />
          Debug Payment Creation
        </h1>
        <p className="text-gray-600">
          Test and debug Finternet payment creation issues
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
            {result.success ? 'Test successful!' : 'API Status retrieved'}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>API Status Check</CardTitle>
            <CardDescription>
              Check if the Finternet API is properly configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={checkAPIStatus} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Checking...' : 'Check API Status'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Payment Creation</CardTitle>
            <CardDescription>
              Test creating a payment intent directly with Finternet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (USDC)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100.00"
              />
            </div>

            <div>
              <Label htmlFor="settlement">Settlement Destination</Label>
              <Input
                id="settlement"
                value={settlementDestination}
                onChange={(e) => setSettlementDestination(e.target.value)}
                placeholder="bank_account_123"
              />
            </div>

            <Button 
              onClick={testPaymentCreation} 
              disabled={loading || !amount || !settlementDestination}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Payment Creation'}
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
                <pre className="text-xs overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Common Issues & Solutions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <strong>1. API Key Issues:</strong>
                <p className="text-gray-600">Make sure FINTERNET_API_KEY is set in your .env file</p>
              </div>
              <div>
                <strong>2. Network Issues:</strong>
                <p className="text-gray-600">Check if you can reach api.fmm.finternetlab.io</p>
              </div>
              <div>
                <strong>3. Invalid Settlement Destination:</strong>
                <p className="text-gray-600">Try using 'bank_account_123' or 'test_destination'</p>
              </div>
              <div>
                <strong>4. Amount Format:</strong>
                <p className="text-gray-600">Make sure amount is a valid decimal number</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}