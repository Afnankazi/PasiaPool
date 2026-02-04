/**
 * Get Event Details API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        subCategories: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  }
                }
              }
            }
          }
        },
        transactions: {
          include: {
            user: {
              select: {
                name: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        bills: {
          include: {
            uploadedBy: {
              select: {
                name: true,
              }
            }
          },
          orderBy: { uploadedAt: 'desc' },
          take: 5
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user has access to this event
    const isParticipant = event.participants.some(p => p.userId === user.id);
    const isLeader = event.leaderId === user.id;

    if (!isParticipant && !isLeader) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(event);

  } catch (error) {
    console.error('Get event details error:', error);
    return NextResponse.json(
      { error: 'Failed to get event details' },
      { status: 500 }
    );
  }
}