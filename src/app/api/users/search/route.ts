import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // Check if user is logged in
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const currentUserId = session.user.id;

    // Search users by name or email with a fast query
    // Exclude the current user from results
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            id: {
              not: currentUserId,
            },
          },
          {
            OR: [
              {
                name: {
                  startsWith: query,
                  mode: 'insensitive',
                },
              },
              {
                name: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  startsWith: query,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      take: 10, // Limit results for performance
      orderBy: [
        {
          // Prioritize exact matches at the beginning
          name: 'asc',
        },
      ],
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("[SEARCH_USERS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
