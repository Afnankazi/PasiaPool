/**
 * Event API Routes
 * Handle event updates and retrieval
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

export async function PATCH(
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
    const { estimatedTotal, status, actualTotal } = body;

    // Verify user is event leader
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { leader: true }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.leaderId !== user.id) {
      return NextResponse.json({ error: 'Only event leader can update event' }, { status: 403 });
    }

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(estimatedTotal !== undefined && { estimatedTotal }),
        ...(status !== undefined && { status }),
        ...(actualTotal !== undefined && { actualTotal }),
      },
      include: {
        leader: true,
        participants: { include: { user: true } }
      }
    });

    return NextResponse.json({
      success: true,
      event: updatedEvent
    });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
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
          include: { user: true },
          orderBy: { id: 'asc' }
        },
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Calculate current totalPooled from participants
    const totalPooled = event.participants
      .filter(p => p.paymentStatus === 'PAID')
      .reduce((sum, p) => sum + Number(p.shareAmount), 0);

    // Update event if totalPooled has changed
    if (totalPooled !== Number(event.totalPooled)) {
      await prisma.event.update({
        where: { id: eventId },
        data: { totalPooled }
      });
      event.totalPooled = totalPooled;
    }

    return NextResponse.json({
      event,
      participantPayments: event.participants.map(p => ({
        id: p.id,
        user: p.user,
        shareAmount: p.shareAmount,
        paymentStatus: p.paymentStatus,
        paymentUrl: p.paymentUrl,
        paymentIntentId: p.paymentIntentId,
        paidAt: p.paidAt
      }))
    });
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json(
      { error: 'Failed to get event' },
      { status: 500 }
    );
  }
}