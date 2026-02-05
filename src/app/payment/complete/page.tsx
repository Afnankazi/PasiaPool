/**
 * Payment Completion Page
 * Handles payment completion and redirects back to group
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PaymentCompletionHandler from '@/components/PaymentCompletionHandler';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function PaymentCompletePage() {
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const paymentIntentId = searchParams.get('payment_intent_id');
  const groupId = searchParams.get('group_id');
  const participantId = searchParams.get('participant_id');
  const amount = searchParams.get('amount');
  const groupName = searchParams.get('group_name');
  const participantName = searchParams.get('participant_name');

  if (!paymentIntentId || !groupId || !participantId || !amount) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <CardTitle className="text-red-600">Invalid Payment Link</CardTitle>
            <CardDescription>
              This payment completion link is missing required information.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Please return to your group and try the payment again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PaymentCompletionHandler
      paymentIntentId={paymentIntentId}
      groupId={groupId}
      participantId={participantId}
      amount={amount}
      groupName={groupName || 'Unknown Group'}
      participantName={participantName || 'Unknown Participant'}
    />
  );
}