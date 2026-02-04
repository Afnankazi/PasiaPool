/**
 * Get Event Associated with Group
 * Check if group has an associated Cooper event
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

export async function GET(
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

    // Get group to verify access
    const group = await prisma.group.findUnique({
      where: { id: id },
      include: { 
        members: { 
          where: { userId: user.id }
        }
      }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is member of the group
    if (group.members.length === 0 && group.createdByUserId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Look for event associated with this group
    // We'll match by group name and leader for now
    const event = await prisma.event.findFirst({
      where: {
        name: group.name,
        leaderId: group.createdByUserId,
      },
      include: {
        leader: true,
        participants: {
          include: { user: true }
        },
        subCategories: {
          include: {
            participants: { include: { user: true } }
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!event) {
      return NextResponse.json({ 
        event: null,
        message: 'No event associated with this group' 
      });
    }

    return NextResponse.json({
      event,
      isEventLeader: event.leaderId === user.id,
    });

  } catch (error) {
    console.error('Get group event error:', error);
    return NextResponse.json(
      { error: 'Failed to get group event' },
      { status: 500 }
    );
  }
}