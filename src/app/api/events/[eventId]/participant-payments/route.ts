/**
 * Create Individual Payment Intents for Event Participants
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { finternetClient } from '@/lib/finternet';

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = await params;
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { shareAmount } = body;

    // Verify user is event leader
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { 
        leader: true,
        participants: { include: { user: true } }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.leaderId !== user.id) {
      return NextResponse.json({ error: 'Only event leader can create participant payments' }, { status: 403 });
    }

    const participantPayments = [];

    // Create individual payment intents for each participant
    for (const participant of event.participants) {
      if (parseFloat(shareAmount) > 0) {
        try {
          // Create individual payment intent
          const paymentIntent = await finternetClient.createPaymentIntent({
            amount: shareAmount,
            currency: 'USDC',
            type: 'CONDITIONAL',
            settlementMethod: 'OFF_RAMP_MOCK',
            settlementDestination: 'event_pool',
            description: `${event.name} - ${participant.user.name}`,
            metadata: {
              eventId: eventId,
              participantId: participant.id,
              userId: participant.userId,
              groupPayment: true,
            },
          });

          // Update participant with payment intent
          const updatedParticipant = await prisma.eventParticipant.update({
            where: { id: participant.id },
            data: {
              paymentIntentId: paymentIntent.id,
              paymentUrl: paymentIntent.data.paymentUrl,
              shareAmount: parseFloat(shareAmount),
              paymentStatus: 'PENDING',
            },
            include: { user: true }
          });

          // Create transaction record
          await prisma.transaction.create({
            data: {
              eventId: eventId,
              userId: participant.userId,
              type: 'POOL',
              amount: parseFloat(shareAmount),
              currency: 'USDC',
              description: `Individual payment for ${event.name}`,
              paymentIntentId: paymentIntent.id,
              status: 'PENDING',
              metadata: {
                participantId: participant.id,
                shareAmount: parseFloat(shareAmount),
              },
            },
          });

          participantPayments.push({
            participant: updatedParticipant,
            paymentIntent,
          });

        } catch (error) {
          console.error(`Failed to create payment for ${participant.user.name}:`, error);
          // Continue with other participants even if one fails
        }
      }
    }

    // Create notification for participants
    for (const payment of participantPayments) {
      await prisma.notification.create({
        data: {
          userId: payment.participant.userId,
          eventId: eventId,
          type: 'PAYMENT_REQUEST',
          title: 'Payment Required',
          message: `Please complete your payment of $${shareAmount} USDC for ${event.name}`,
          actionUrl: payment.paymentIntent.data.paymentUrl,
        }
      });
    }

    return NextResponse.json({
      payments: participantPayments,
      message: `Created ${participantPayments.length} individual payment intents`
    });

  } catch (error) {
    console.error('Create participant payments error:', error);
    return NextResponse.json(
      { error: 'Failed to create participant payments' },
      { status: 500 }
    );
  }
}