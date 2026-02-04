import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is logged in
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUserId = session.user.id;
    const resolvedParams = await params;
    const groupId = resolvedParams.id;

    // Check if user is a member of this group
    const membership = await prisma.usersOnGroups.findUnique({
      where: {
        userId_groupId: {
          userId: currentUserId,
          groupId: groupId,
        },
      },
    });

    if (!membership) {
      return new NextResponse("Not a member of this group", { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { description, amount, category, date, splitType, paidByUserId, splits } = body;

    // Validate required fields
    if (!description || !amount || !date || !splitType || !paidByUserId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Validate amount is a positive number
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return new NextResponse("Invalid amount", { status: 400 });
    }

    // Validate split type
    if (!['EQUAL', 'UNEQUAL', 'PERCENTAGE'].includes(splitType)) {
      return new NextResponse("Invalid split type", { status: 400 });
    }

    // Get all group members for splitting
    const groupMembers = await prisma.usersOnGroups.findMany({
      where: { groupId },
      include: { user: true },
    });

    if (groupMembers.length === 0) {
      return new NextResponse("No members found in group", { status: 400 });
    }

    // Create expense with splits in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the expense
      const expense = await tx.expense.create({
        data: {
          description,
          amount: parsedAmount,
          category: category || null,
          date: new Date(date),
          splitType: splitType as 'EQUAL' | 'UNEQUAL' | 'PERCENTAGE',
          groupId,
          paidByUserId,
          createdByUserId: currentUserId,
        },
      });

      // Calculate splits based on split type
      let expenseSplits: { userId: string; amountOwed: number }[] = [];

      if (splits && Array.isArray(splits)) {
        // Use custom splits provided from frontend
        expenseSplits = splits.map((split: { userId: string; amountOwed: string | number }) => ({
          userId: split.userId,
          amountOwed: parseFloat(split.amountOwed.toString()) || 0,
        }));

        // Validate that all group members are included in splits
        const splitUserIds = new Set(expenseSplits.map(s => s.userId));
        const groupMemberIds = new Set(groupMembers.map(m => m.userId));
        
        if (splitUserIds.size !== groupMemberIds.size || 
            !Array.from(groupMemberIds).every(id => splitUserIds.has(id))) {
          return new NextResponse("Splits must include all group members", { status: 400 });
        }

        // Validate total split amount matches expense amount (with small tolerance for rounding)
        const totalSplitAmount = expenseSplits.reduce((sum, split) => sum + split.amountOwed, 0);
        if (Math.abs(totalSplitAmount - parsedAmount) > 0.01) {
          return new NextResponse("Split amounts must equal total expense amount", { status: 400 });
        }
      } else {
        // Default to equal split if no custom splits provided
        const amountPerPerson = parsedAmount / groupMembers.length;
        expenseSplits = groupMembers.map(member => ({
          userId: member.userId,
          amountOwed: amountPerPerson,
        }));
      }

      // Create expense splits
      await tx.expenseSplit.createMany({
        data: expenseSplits.map(split => ({
          expenseId: expense.id,
          userId: split.userId,
          amountOwed: split.amountOwed,
        })),
      });

      // Return expense with splits
      return await tx.expense.findUnique({
        where: { id: expense.id },
        include: {
          paidBy: {
            select: { id: true, name: true, email: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          splits: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[CREATE_EXPENSE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
