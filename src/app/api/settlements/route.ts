import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get all settlements where user is involved
    const settlements = await prisma.settlement.findMany({
      where: {
        OR: [
          { paidByUserId: userId },
          { receivedByUserId: userId }
        ]
      },
      include: {
        group: {
          select: {
            id: true,
            name: true
          }
        },
        paidBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        receivedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Calculate debt summaries by analyzing expenses and settlements
    const userGroups = await prisma.usersOnGroups.findMany({
      where: { userId },
      include: {
        group: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const debtSummaries = [];
    let totalOwedToMe = 0;
    let totalIOwePeople = 0;

    for (const userGroup of userGroups) {
      const groupId = userGroup.group.id;
      
      // Get all expenses in this group
      const groupExpenses = await prisma.expense.findMany({
        where: { groupId },
        include: {
          splits: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true
                }
              }
            }
          },
          paidBy: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        }
      });

      // Get all settlements in this group
      const groupSettlements = await prisma.settlement.findMany({
        where: { groupId }
      });

      // Calculate net balances for each user in this group
      const userBalances = new Map<string, number>();

      // Process expenses
      for (const expense of groupExpenses) {
        const paidBy = expense.paidBy;
        
        // Add the full amount to who paid
        userBalances.set(paidBy.id, (userBalances.get(paidBy.id) || 0) + expense.amount);
        
        // Subtract splits from each user
        for (const split of expense.splits) {
          userBalances.set(split.userId, (userBalances.get(split.userId) || 0) - split.amountOwed);
        }
      }

      // Process settlements to adjust balances
      for (const settlement of groupSettlements) {
        // Settlement: paidBy pays receivedBy, so we adjust balances accordingly
        // Subtract from payer (they paid out money, reduces their positive balance)
        // Add to receiver (they received money, increases their positive balance)
        const currentPayer = userBalances.get(settlement.paidByUserId) || 0;
        const currentReceiver = userBalances.get(settlement.receivedByUserId) || 0;
        
        userBalances.set(settlement.paidByUserId, currentPayer - settlement.amount);
        userBalances.set(settlement.receivedByUserId, currentReceiver + settlement.amount);
      }

      // Create debt summaries for users in this group (excluding current user)
      for (const [otherUserId, balance] of userBalances.entries()) {
        if (otherUserId === userId || Math.abs(balance) < 0.01) continue;

        const otherUser = await prisma.user.findUnique({
          where: { id: otherUserId },
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        });

        if (!otherUser) continue;

        const otherBalance = balance;
        
        // The net amount is simply the negative of the other person's balance
        // If they have -250, they owe you 250
        // If they have +250, you owe them 250
        const netAmount = -otherBalance;

        if (Math.abs(netAmount) >= 0.01) {
          debtSummaries.push({
            userId: otherUser.id,
            userName: otherUser.name,
            userEmail: otherUser.email,
            userImage: otherUser.image,
            groupId: userGroup.group.id,
            groupName: userGroup.group.name,
            totalOwed: netAmount > 0 ? netAmount : 0,
            totalOwing: netAmount < 0 ? Math.abs(netAmount) : 0,
            netAmount: netAmount
          });

          if (netAmount > 0) {
            totalOwedToMe += netAmount;
          } else {
            totalIOwePeople += Math.abs(netAmount);
          }
        }
      }
    }

    const netBalance = totalOwedToMe - totalIOwePeople;

    return NextResponse.json({
      settlements,
      debtSummaries,
      totalOwedToMe,
      totalIOwePeople,
      netBalance
    });

  } catch (error) {
    console.error('Error fetching settlements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { amount, note, groupId, paidByUserId, receivedByUserId } = await request.json();

    // Validate required fields
    if (!amount || !groupId || !paidByUserId || !receivedByUserId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Verify user is part of the group
    const userInGroup = await prisma.usersOnGroups.findFirst({
      where: {
        userId: session.user.id,
        groupId
      }
    });

    if (!userInGroup) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    // Verify both users are part of the group
    const paidByInGroup = await prisma.usersOnGroups.findFirst({
      where: { userId: paidByUserId, groupId }
    });

    const receivedByInGroup = await prisma.usersOnGroups.findFirst({
      where: { userId: receivedByUserId, groupId }
    });

    if (!paidByInGroup || !receivedByInGroup) {
      return NextResponse.json(
        { error: 'All users must be members of the group' },
        { status: 400 }
      );
    }

    // Create the settlement
    const settlement = await prisma.settlement.create({
      data: {
        amount,
        note,
        date: new Date(),
        groupId,
        paidByUserId,
        receivedByUserId,
        createdByUserId: session.user.id
      },
      include: {
        group: {
          select: {
            id: true,
            name: true
          }
        },
        paidBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        receivedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json(settlement, { status: 201 });

  } catch (error) {
    console.error('Error creating settlement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
