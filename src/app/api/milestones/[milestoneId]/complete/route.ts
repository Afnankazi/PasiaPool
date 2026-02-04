/**
 * Complete Milestone API Route
 * Handle milestone completion and fund release
 */

import { NextRequest, NextResponse } from 'next/server';
import { cooperPaymentService } from '@/lib/cooper-payment-service';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { milestoneId: string } }
) {
  try {
    const { milestoneId } = await params;
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
    const { completionProof } = body;

    // Find sub-category by milestone ID
    const subCategory = await prisma.subCategory.findFirst({
      where: { milestoneId: milestoneId },
      include: { 
        event: { include: { leader: true } },
        participants: { include: { user: true } }
      }
    });

    if (!subCategory) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Check if user has permission to complete milestone
    const isEventLeader = subCategory.event.leaderId === user.id;
    const isParticipant = subCategory.participants.some(p => p.userId === user.id);

    if (!isEventLeader && !isParticipant) {
      return NextResponse.json({ 
        error: 'Only event leader or milestone participants can complete milestones' 
      }, { status: 403 });
    }

    const result = await cooperPaymentService.completeMilestone(
      subCategory.id,
      user.id,
      completionProof
    );

    // Create notification for event leader
    if (!isEventLeader) {
      await prisma.notification.create({
        data: {
          userId: subCategory.event.leaderId,
          eventId: subCategory.eventId,
          type: 'MILESTONE_COMPLETED',
          title: 'Milestone Completed',
          message: `${subCategory.name} has been completed by ${user.name}`,
          actionUrl: `/events/${subCategory.eventId}`,
        }
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Complete milestone error:', error);
    return NextResponse.json(
      { error: 'Failed to complete milestone' },
      { status: 500 }
    );
  }
}