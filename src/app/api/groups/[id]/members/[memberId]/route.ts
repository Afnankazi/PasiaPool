/**
 * Group Member Management API Routes
 * Handle removing members from groups
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const { id: groupId, memberId } = await params;
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

    // Check if the user is the group leader
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { 
        members: { include: { user: true } },
        createdBy: true 
      }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.createdByUserId !== user.id) {
      return NextResponse.json({ error: 'Only group leaders can remove members' }, { status: 403 });
    }

    // Find the member to remove
    const memberToRemove = await prisma.groupMember.findUnique({
      where: { id: memberId },
      include: { user: true }
    });

    if (!memberToRemove) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (memberToRemove.groupId !== groupId) {
      return NextResponse.json({ error: 'Member does not belong to this group' }, { status: 400 });
    }

    // Prevent removing the group leader
    if (memberToRemove.userId === group.createdByUserId) {
      return NextResponse.json({ error: 'Cannot remove the group leader' }, { status: 400 });
    }

    // Check if member has any pending expenses or settlements
    const memberExpenses = await prisma.expense.count({
      where: {
        groupId: groupId,
        OR: [
          { paidByUserId: memberToRemove.userId },
          { createdByUserId: memberToRemove.userId }
        ]
      }
    });

    const memberSplits = await prisma.expenseSplit.count({
      where: {
        userId: memberToRemove.userId,
        expense: { groupId: groupId }
      }
    });

    if (memberExpenses > 0 || memberSplits > 0) {
      return NextResponse.json({ 
        error: 'Cannot remove member with existing expenses or splits. Please settle all expenses first.' 
      }, { status: 400 });
    }

    // Remove the member
    await prisma.groupMember.delete({
      where: { id: memberId }
    });

    // Also remove from any associated Cooper events
    const cooperEvents = await prisma.event.findMany({
      where: {
        OR: [
          { name: group.name },
          { description: { contains: group.name } }
        ]
      }
    });

    for (const event of cooperEvents) {
      await prisma.eventParticipant.deleteMany({
        where: {
          eventId: event.id,
          userId: memberToRemove.userId
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `${memberToRemove.user.name} has been removed from the group`,
      removedMember: {
        id: memberToRemove.id,
        userId: memberToRemove.userId,
        userName: memberToRemove.user.name
      }
    });

  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}