/**
 * Event Participant Payments API Routes
 * Handle individual payment intents for event participants
 */

import { NextRequest, NextResponse } from 'next/server';
import { cooperPaymentService } from '@/lib/cooper-payment-service';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

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
    const { shareAmount, currency, paymentType, settlementDestination, metadata } = body;

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

    // Update all participants with the share amount
    await prisma.eventParticipant.updateMany({
      where: { eventId: eventId },
      data: { shareAmount: parseFloat(shareAmount) }
    });

    // Create individual payment intents for all participants
    const participantPayments = await cooperPaymentService.createParticipantPayments(eventId, {
      currency: currency || 'USDC',
      paymentType,
      settlementDestination,
      metadata
    });

    return NextResponse.json({
      success: true,
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

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = await params;
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const participants = await prisma.eventParticipant.findMany({
      where: { eventId: eventId },
      include: { user: true },
      orderBy: { id: 'asc' }
    });

    return NextResponse.json({
      participants,
      totalParticipants: participants.length,
      paidParticipants: participants.filter(p => p.paymentStatus === 'PAID').length,
      totalAmount: participants.reduce((sum, p) => sum + Number(p.shareAmount), 0)
    });
  } catch (error) {
    console.error('Get participant payments error:', error);
    return NextResponse.json(
      { error: 'Failed to get participant payments' },
      { status: 500 }
    );
  }
}