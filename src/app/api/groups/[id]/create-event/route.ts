/**
 * Create Cooper Event from Group
 * Convert existing group to payment-enabled event
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
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
    const { name, description, eventType, location, eventDate } = body;

    // Verify user is group creator
    const group = await prisma.group.findUnique({
      where: { id: id },
      include: { 
        members: { include: { user: true } },
        createdBy: true 
      }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.createdByUserId !== user.id) {
      return NextResponse.json({ error: 'Only group creator can create events' }, { status: 403 });
    }

    // Check if event already exists for this group
    const existingEvent = await prisma.event.findFirst({
      where: {
        name: group.name,
        leaderId: user.id,
      }
    });

    if (existingEvent) {
      return NextResponse.json({ 
        error: 'Event already exists for this group',
        event: existingEvent 
      }, { status: 400 });
    }

    // Create Cooper Event
    const event = await prisma.event.create({
      data: {
        name: name || group.name,
        description: description || `Payment-enabled event for ${group.name}`,
        eventType: eventType || 'OTHER',
        location,
        eventDate: eventDate ? new Date(eventDate) : null,
        leaderId: user.id,
        status: 'DRAFT',
      },
    });

    // Create event participants from group members
    const participantData = group.members.map(member => ({
      eventId: event.id,
      userId: member.userId,
      shareAmount: 0, // Will be set when payment is created
      contributionAmount: 0,
      totalOwed: 0,
      refundAmount: 0,
      paymentStatus: 'PENDING' as const,
    }));

    await prisma.eventParticipant.createMany({
      data: participantData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        eventId: event.id,
        userId: user.id,
        action: 'EVENT_CREATED_FROM_GROUP',
        entityType: 'Event',
        entityId: event.id,
        newValue: {
          eventId: event.id,
          groupId: id,
          participantCount: group.members.length,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Return event with participants
    const eventWithParticipants = await prisma.event.findUnique({
      where: { id: event.id },
      include: {
        leader: true,
        participants: {
          include: { user: true }
        }
      }
    });

    return NextResponse.json({
      event: eventWithParticipants,
      message: 'Event created successfully from group'
    });

  } catch (error) {
    console.error('Create event from group error:', error);
    return NextResponse.json(
      { error: 'Failed to create event from group' },
      { status: 500 }
    );
  }
}