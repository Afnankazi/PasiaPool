import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    // Check if user is logged in
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUserId = session.user.id;

    // Fetch all groups where the current user is a member
    const groups = await prisma.group.findMany({
      where: {
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
        _count: {
          select: {
            expenses: true,
            settlements: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("[FETCH_GROUPS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
