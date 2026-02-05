/**
 * Payment Completion Handler Component
 * Handles payment completion detection and redirect
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';

interface PaymentCompletionHandlerProps {
  paymentIntentId: string;
  groupId: string;
  participantId: string;
  amount: string;
  groupName: string;
  participantName: string;
}

export default function PaymentCompletionHandler({
  paymentIntentId,
  groupId,
  participantId,
  amount,
  groupName,
  participantName
}: PaymentCompletionHandlerProps) {
  const router = useRouter();
  const [isPolling, setIsPolling] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string>('PROCESSING');
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(10);

  // Poll payment status
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    const pollPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/payment/status/${paymentIntentId}`);
        if (response.ok) {
          const data = await response.json();
          setPaymentStatus(data.status);

          if (data.status === 'SUCCEEDED' || data.status === 'FINAL') {
            setIsPolling(false);
            
            // Start countdown for automatic redirect
            countdownInterval = setInterval(() => {
              setCountdown(prev => {
                if (prev <= 1) {
                  handleRedirect();
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          } else if (data.status === 'FAILED') {
            setIsPolling(false);
            setError('Payment failed. Please try again.');
          }
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
        setError('Error checking payment status');
      }
    };

    if (isPolling) {
      // Poll immediately, then every 3 seconds
      pollPaymentStatus();
      pollInterval = setInterval(pollPaymentStatus, 3000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [isPolling, paymentIntentId]);

  const handleRedirect = async () => {
    try {
      // Update payment status in our database
      await fetch('/api/payment/success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          status: 'SUCCEEDED',
          metadata: { groupId, participantId }
        })
      });

      // Redirect to group page with success message
      router.push(`/dashboard/groups/${groupId}?payment_success=true&amount=${amount}`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      // Redirect anyway
      router.push(`/dashboard/groups/${groupId}?payment_success=true&amount=${amount}`);
    }
  };

  const handleManualRedirect = () => {
    setCountdown(0);
    handleRedirect();
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Payment Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button onClick={() => router.push(`/dashboard/groups/${groupId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Group
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'SUCCEEDED' || paymentStatus === 'FINAL') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Payment Successful!</CardTitle>
            <CardDescription>
              Your payment of {amount} USDC has been processed successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Group:</strong> {groupName}</p>
              <p><strong>Participant:</strong> {participantName}</p>
              <p><strong>Amount:</strong> {amount} USDC</p>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Redirecting to group page in {countdown} seconds...
              </p>
              
              <div className="flex gap-2">
                <Button onClick={handleManualRedirect} className="flex-1">
                  Return to Group Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <CardTitle>Processing Payment...</CardTitle>
          <CardDescription>
            Please wait while we confirm your payment.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Status:</strong> {paymentStatus}</p>
            <p><strong>Amount:</strong> {amount} USDC</p>
          </div>
          
          <p className="text-xs text-muted-foreground">
            This may take a few moments. Please don't close this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}