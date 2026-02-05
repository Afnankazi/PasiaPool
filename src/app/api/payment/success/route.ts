/**
 * Payment Success Callback API Route
 * Handle successful payment redirects and update payment status
 */

import { NextRequest, NextResponse } from 'next/server';
import { cooperPaymentService } from '@/lib/cooper-payment-service';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent_id');
    const groupId = searchParams.get('group_id');
    const participantId = searchParams.get('participant_id');

    if (!paymentIntentId) {
      return NextResponse.redirect(new URL('/?error=missing_payment_intent', request.url));
    }

    // Find the participant and event associated with this payment
    const participant = await prisma.eventParticipant.findFirst({
      where: { paymentIntentId },
      include: { 
        event: true,
        user: true 
      }
    });

    if (!participant) {
      return NextResponse.redirect(new URL('/?error=payment_not_found', request.url));
    }

    // Update payment status to PAID if not already updated
    if (participant.paymentStatus !== 'PAID') {
      await cooperPaymentService.updateEventTotalPooled(participant.eventId);
      
      await prisma.eventParticipant.update({
        where: { id: participant.id },
        data: {
          paymentStatus: 'PAID',
          paidAt: new Date(),
        }
      });

      // Update transaction status
      await prisma.transaction.updateMany({
        where: { paymentIntentId },
        data: { status: 'SUCCEEDED' }
      });
    }

    // Redirect back to the group page with success message
    const redirectUrl = groupId 
      ? `/dashboard/groups/${groupId}?payment_success=true&amount=${participant.shareAmount}`
      : `/events/${participant.eventId}?payment_success=true`;

    return NextResponse.redirect(new URL(redirectUrl, request.url));

  } catch (error) {
    console.error('Payment success callback error:', error);
    return NextResponse.redirect(new URL('/?error=payment_callback_failed', request.url));
  }
}

export async function POST(request: NextRequest) {
  // Handle webhook-style callbacks if needed
  try {
    const body = await request.json();
    const { paymentIntentId, status, metadata } = body;

    if (status === 'SUCCEEDED' && paymentIntentId) {
      // Find and update participant payment status
      const participant = await prisma.eventParticipant.findFirst({
        where: { paymentIntentId },
        include: { event: true }
      });

      if (participant && participant.paymentStatus !== 'PAID') {
        await prisma.eventParticipant.update({
          where: { id: participant.id },
          data: {
            paymentStatus: 'PAID',
            paidAt: new Date(),
          }
        });

        // Update event's total pooled amount
        await cooperPaymentService.updateEventTotalPooled(participant.eventId);

        // Update transaction status
        await prisma.transaction.updateMany({
          where: { paymentIntentId },
          data: { status: 'SUCCEEDED' }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}