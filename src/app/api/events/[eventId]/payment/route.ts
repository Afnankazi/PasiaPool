/**
 * Event Payment API Routes
 * Handle Finternet payment integration for events
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
    const { amount, currency, paymentType, settlementDestination, metadata } = body;

    // Verify user is event leader
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { leader: true }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.leaderId !== user.id) {
      return NextResponse.json({ error: 'Only event leader can create payments' }, { status: 403 });
    }

    const result = await cooperPaymentService.createEventPayment({
      eventId: eventId,
      amount,
      currency,
      paymentType,
      settlementDestination,
      metadata,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Create event payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
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

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        leader: true,
        participants: {
          include: { user: true }
        },
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({
      event,
      paymentUrl: event.paymentUrl,
      paymentIntentId: event.paymentIntentId,
    });
  } catch (error) {
    console.error('Get event payment error:', error);
    return NextResponse.json(
      { error: 'Failed to get payment info' },
      { status: 500 }
    );
  }
}