/**
 * Leave Group API Route
 * Handle members leaving groups
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Leave group API called');
    const resolvedParams = await params;
    const groupId = resolvedParams.id;
    console.log('Group ID:', groupId);
    
    const session = await getServerSession(authOptions);
    console.log('Session user ID:', session?.user?.id);
    
    if (!session?.user?.id) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;
    console.log('Current user ID:', currentUserId);

    // Find the group and user's membership
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { 
        members: { include: { user: true } },
        createdBy: true 
      }
    });

    if (!group) {
      console.log('Group not found');
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    console.log('Group found:', group.name, 'Members:', group.members.length);

    // Check if user is a member of the group
    const userMembership = group.members.find(member => member.userId === currentUserId);
    if (!userMembership) {
      console.log('User is not a member');
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 400 });
    }

    // Prevent group leader from leaving if there are other members
    if (group.createdByUserId === currentUserId && group.members.length > 1) {
      console.log('Leader cannot leave with other members');
      return NextResponse.json({ 
        error: 'Group leaders cannot leave while there are other members. Please transfer leadership or remove other members first.' 
      }, { status: 400 });
    }

    // Check if user has any pending expenses or settlements
    const userExpenses = await prisma.expense.count({
      where: {
        groupId: groupId,
        OR: [
          { paidByUserId: currentUserId },
          { createdByUserId: currentUserId }
        ]
      }
    });

    const userSplits = await prisma.expenseSplit.count({
      where: {
        userId: currentUserId,
        expense: { groupId: groupId }
      }
    });

    if (userExpenses > 0 || userSplits > 0) {
      console.log('User has expenses or splits');
      return NextResponse.json({ 
        error: 'Cannot leave group with existing expenses or splits. Please settle all expenses first.' 
      }, { status: 400 });
    }

    console.log('Removing user from group');

    // Remove user from the group
    await prisma.groupMember.delete({
      where: { id: userMembership.id }
    });

    // Remove from any associated Cooper events
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
          userId: currentUserId
        }
      });
    }

    // If this was the last member and the group leader, delete the group
    if (group.members.length === 1 && group.createdByUserId === currentUserId) {
      await prisma.group.delete({
        where: { id: groupId }
      });
      
      console.log('Group deleted');
      return NextResponse.json({
        success: true,
        message: 'You have left the group. The group has been deleted as you were the last member.',
        groupDeleted: true
      });
    }

    console.log('User left group successfully');
    return NextResponse.json({
      success: true,
      message: `You have successfully left ${group.name}`,
      groupDeleted: false
    });

  } catch (error) {
    console.error('Leave group error:', error);
    return NextResponse.json(
      { error: 'Failed to leave group' },
      { status: 500 }
    );
  }
}