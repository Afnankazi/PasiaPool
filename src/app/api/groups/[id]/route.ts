import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET(
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

    // Fetch the specific group where the current user is a member
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        members: {
          some: {
            userId: currentUserId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        expenses: {
          include: {
            paidBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            splits: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            expenses: true,
            settlements: true,
          },
        },
      },
    });

    if (!group) {
      return new NextResponse("Group not found", { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("[FETCH_GROUP_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
