import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's groups with counts
    const userGroups = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        groups: {
          include: {
            group: {
              include: {
                _count: {
                  select: {
                    expenses: true,
                    settlements: true,
                    members: true
                  }
                },
                expenses: {
                  include: {
                    splits: true
                  }
                }
              }
            }
          }
        },
        expensesPaid: {
          include: {
            group: {
              select: {
                name: true
              }
            }
          }
        },
        splitsOwed: {
          include: {
            expense: {
              include: {
                group: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!userGroups) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate total stats
    const totalGroups = userGroups.groups.length;
    const totalExpenses = userGroups.expensesPaid.length;
    const totalAmountPaid = userGroups.expensesPaid.reduce((sum, expense) => sum + expense.amount, 0);
    const totalAmountOwed = userGroups.splitsOwed.reduce((sum, split) => sum + split.amountOwed, 0);

    // Group expenses by category
    const expensesByCategory = userGroups.expensesPaid.reduce((acc: Record<string, number>, expense) => {
      const category = expense.category || 'Other';
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {});

    // Group expenses by month (last 6 months)
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    
    const expensesByMonth = userGroups.expensesPaid
      .filter(expense => new Date(expense.date) >= sixMonthsAgo)
      .reduce((acc: Record<string, number>, expense) => {
        const monthYear = new Date(expense.date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        acc[monthYear] = (acc[monthYear] || 0) + expense.amount;
        return acc;
      }, {});

    // Group activity data
    const groupActivity = userGroups.groups.map(userGroup => ({
      name: userGroup.group.name,
      expenses: userGroup.group._count.expenses,
      members: userGroup.group._count.members,
      settlements: userGroup.group._count.settlements,
      totalAmount: userGroup.group.expenses.reduce((sum, expense) => sum + expense.amount, 0)
    }));

    // Recent activity (last 10 expenses)
    const recentExpenses = userGroups.expensesPaid
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(expense => ({
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        groupName: expense.group?.name || 'Personal',
        category: expense.category
      }));

    // Balance data (what user owes vs what others owe them)
    const balanceData = userGroups.groups.map(userGroup => {
      const groupExpenses = userGroup.group.expenses;
      let owedToUser = 0;
      let userOwes = 0;

      groupExpenses.forEach(expense => {
        if (expense.paidByUserId === userId) {
          // User paid, others owe them
          expense.splits.forEach(split => {
            if (split.userId !== userId) {
              owedToUser += split.amountOwed;
            }
          });
        } else {
          // Someone else paid, check if user owes
          const userSplit = expense.splits.find(split => split.userId === userId);
          if (userSplit) {
            userOwes += userSplit.amountOwed;
          }
        }
      });

      return {
        groupName: userGroup.group.name,
        owedToUser,
        userOwes,
        netBalance: owedToUser - userOwes
      };
    });

    const response = {
      totalStats: {
        totalGroups,
        totalExpenses,
        totalAmountPaid,
        totalAmountOwed,
        netBalance: totalAmountPaid - totalAmountOwed
      },
      expensesByCategory: Object.entries(expensesByCategory).map(([category, amount]) => ({
        category,
        amount
      })),
      expensesByMonth: Object.entries(expensesByMonth).map(([month, amount]) => ({
        month,
        amount
      })),
      groupActivity,
      recentExpenses,
      balanceData
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
