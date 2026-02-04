import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Check if our user is logged in
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const currentUserId = session.user.id;

    // Getting data from the req object
    const body = await req.json();
    const { name, description } = body; // Remove memberIds since we'll use invitations
    if (!name) {
      return new NextResponse("Group name is required", {
        status: 400,
      });
    }

    // Create the group with only the creator as a member
    const newGroup = await prisma.group.create({
      data: {
        name,
        description,
        createdByUserId: currentUserId,
        members: {
          create: [
            // Add creator as the only initial member
            {
              userId: currentUserId,
            },
          ],
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
    });
    return NextResponse.json(newGroup, {status: 201});
  } catch (error) {
    console.error("[CREATE_GROUP_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
