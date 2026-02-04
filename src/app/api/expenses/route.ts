import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'personal', 'group', or null for all

    // Build the where clause based on type
    const whereClause: Record<string, unknown> = {
      OR: [
        { paidByUserId: userId },
        { splits: { some: { userId: userId } } }
      ]
    };

    if (type === 'personal') {
      whereClause.groupId = null;
    } else if (type === 'group') {
      whereClause.groupId = { not: null };
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        paidBy: {
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
        },
        group: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(expenses);

  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    
    const {
      description,
      amount,
      category,
      date,
      splitType,
      groupId, // Optional for personal expenses
      splits // For personal expenses, this will be empty or contain only the user
    } = body;

    // Validate required fields
    if (!description || !amount || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For personal expenses, create a single split for the user
    const expenseSplits = groupId ? splits : [{
      userId: userId,
      amountOwed: parseFloat(amount)
    }];

    // Create the expense
    const expense = await prisma.expense.create({
      data: {
        description,
        amount: parseFloat(amount),
        category: category || null,
        date: new Date(date),
        splitType: splitType || 'EQUAL',
        groupId: groupId || null,
        paidByUserId: userId,
        createdByUserId: userId,
        splits: {
          create: expenseSplits
        }
      },
      include: {
        paidBy: {
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
        },
        group: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
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
        }
      }
    });

    return NextResponse.json(expense, { status: 201 });

  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
