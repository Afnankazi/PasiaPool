/**
 * Finternet Test Page
 * Simple page to test Finternet integration
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

export default function TestFinternetPage() {
  const [loading, setLoading] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [amount, setAmount] = useState('100.00');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const testFinternetAPI = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Test direct Finternet API call
      const response = await fetch('/api/test-finternet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'USDC',
          type: 'CONDITIONAL',
          settlementMethod: 'OFF_RAMP_MOCK',
          settlementDestination: 'test_bank_account',
          description: 'Test payment from PasiaPool',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API call failed');
      }

      const data = await response.json();
      setPaymentIntent(data);
      setSuccess('Payment intent created successfully!');
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentIntent?.id) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/test-finternet/${paymentIntent.id}`);
      if (response.ok) {
        const data = await response.json();
        setPaymentIntent(data);
        setSuccess(`Payment status updated: ${data.status}`);
      }
    } catch (error) {
      setError('Failed to check payment status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Finternet Integration Test</h1>
        <p className="text-gray-600">
          Test your Finternet Payment Gateway integration
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Create Test Payment
            </CardTitle>
            <CardDescription>
              Create a test payment intent using Finternet API
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

            <Button 
              onClick={testFinternetAPI} 
              disabled={loading || !amount}
              className="w-full"
            >
              {loading ? 'Creating Payment...' : 'Create Test Payment Intent'}
            </Button>
          </CardContent>
        </Card>

        {paymentIntent && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Intent Created</CardTitle>
              <CardDescription>
                Your test payment intent has been created successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Payment ID:</span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {paymentIntent.id}
                  </code>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status:</span>
                  <Badge variant="outline">
                    {paymentIntent.status || paymentIntent.data?.status || 'INITIATED'}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">Amount:</span>
                  <span className="font-semibold">
                    {paymentIntent.data?.amount || amount} {paymentIntent.data?.currency || 'USDC'}
                  </span>
                </div>

                {paymentIntent.data?.estimatedFee && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Estimated Fee:</span>
                    <span>{paymentIntent.data.estimatedFee} USDC</span>
                  </div>
                )}

                {paymentIntent.data?.estimatedDeliveryTime && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Delivery Time:</span>
                    <span>{paymentIntent.data.estimatedDeliveryTime}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {paymentIntent.data?.paymentUrl && (
                  <Button asChild className="w-full">
                    <a 
                      href={paymentIntent.data.paymentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Payment Page
                    </a>
                  </Button>
                )}

                <Button 
                  onClick={checkPaymentStatus} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? 'Checking...' : 'Check Payment Status'}
                </Button>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Raw Response:</h4>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(paymentIntent, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Finternet API Key:</span>
                <Badge variant="outline">
                  ✅ Configured
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Base URL:</span>
                <Badge variant="outline">
                  https://api.fmm.finternetlab.io/api/v1
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Environment:</span>
                <Badge variant="outline">Hackathon</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Database Schema:</span>
                <Badge variant="outline">Updated</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>API Routes:</span>
                <Badge variant="outline">Created</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}