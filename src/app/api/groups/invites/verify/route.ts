import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=InvalidInviteToken', req.url));
  }

  try {
    // 1. Find the invitation by the token
    const invitation = await prisma.groupInvitation.findUnique({
      where: { token },
      include: {
        group: true,
        invitedBy: true
      }
    });

    // 2. Check if invitation exists and is valid
    if (!invitation) {
      return NextResponse.redirect(new URL('/login?error=InvalidToken', req.url));
    }

    // 3. Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      // Clean up expired invitation
      await prisma.groupInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      });
      return NextResponse.redirect(new URL('/login?error=ExpiredToken', req.url));
    }

    // 4. Check if invitation has already been used
    if (invitation.status !== 'PENDING') {
      return NextResponse.redirect(new URL('/login?error=InvitationAlreadyUsed', req.url));
    }

    // 5. Get current session to check if user is logged in
    const session = await getServerSession(authOptions);

    // 6. Find the user by the invited email
    const invitedUser = await prisma.user.findUnique({
      where: { email: invitation.email }
    });

    // 7. Handle case where user doesn't exist - redirect to signup
    if (!invitedUser) {
      const signupUrl = new URL('/signup', req.url);
      signupUrl.searchParams.set('email', invitation.email);
      signupUrl.searchParams.set('inviteToken', token);
      signupUrl.searchParams.set('groupName', invitation.group.name);
      return NextResponse.redirect(signupUrl);
    }

    // 8. Handle case where user exists but is not logged in
    if (!session?.user?.id) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('inviteToken', token);
      loginUrl.searchParams.set('message', `Please log in to join "${invitation.group.name}"`);
      return NextResponse.redirect(loginUrl);
    }

    // 9. Verify that the logged-in user matches the invited email
    if (session.user.email !== invitation.email) {
      const errorUrl = new URL('/login?error=EmailMismatch', req.url);
      return NextResponse.redirect(errorUrl);
    }

    // 10. Check if user is already a member of the group
    const existingMembership = await prisma.usersOnGroups.findUnique({
      where: {
        userId_groupId: {
          userId: invitedUser.id,
          groupId: invitation.groupId
        }
      }
    });

    if (existingMembership) {
      // Update invitation status and redirect to group
      await prisma.groupInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      });
      return NextResponse.redirect(new URL(`/dashboard/groups/${invitation.groupId}?message=AlreadyMember`, req.url));
    }

    // 11. Add user to the group and update invitation status
    await prisma.$transaction([
      // Add user to group
      prisma.usersOnGroups.create({
        data: {
          groupId: invitation.groupId,
          userId: invitedUser.id
        }
      }),
      // Update invitation status
      prisma.groupInvitation.update({
        where: { id: invitation.id },
        data: { 
          status: 'ACCEPTED',
          invitedUserId: invitedUser.id // Link the user who accepted
        }
      })
    ]);

    // 12. Redirect to the group page with success message
    const groupUrl = new URL(`/dashboard/groups/${invitation.groupId}`, req.url);
    groupUrl.searchParams.set('message', 'WelcomeToGroup');
    groupUrl.searchParams.set('invitedBy', invitation.invitedBy.name);
    return NextResponse.redirect(groupUrl);

  } catch (error) {
    console.error("[VERIFY_INVITE_ERROR]", error);
    
    // Handle specific database errors
    if (error && typeof error === 'object' && 'code' in error) {
      // Unique constraint violation (user already in group)
      if (error.code === 'P2002') {
        try {
          // Update invitation status and redirect
          await prisma.groupInvitation.update({
            where: { token },
            data: { status: 'ACCEPTED' }
          });
          
          const invitation = await prisma.groupInvitation.findUnique({
            where: { token }
          });
          
          if (invitation) {
            return NextResponse.redirect(
              new URL(`/dashboard/groups/${invitation.groupId}?message=AlreadyMember`, req.url)
            );
          }
        } catch (updateError) {
          console.error("Error updating invitation after duplicate error:", updateError);
        }
      }
    }
    
    return NextResponse.redirect(new URL('/login?error=InviteError', req.url));
  }
}

// Optional: Handle POST requests for programmatic invitation acceptance
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // Find and validate invitation
    const invitation = await prisma.groupInvitation.findUnique({
      where: { token },
      include: {
        group: true,
        invitedBy: true
      }
    });

    if (!invitation || invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 });
    }

    // Verify user email matches invitation
    if (session.user.email !== invitation.email) {
      return NextResponse.json({ error: 'Email mismatch' }, { status: 403 });
    }

    // Check if already a member
    const existingMembership = await prisma.usersOnGroups.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: invitation.groupId
        }
      }
    });

    if (existingMembership) {
      await prisma.groupInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      });
      return NextResponse.json({ 
        message: 'Already a member',
        groupId: invitation.groupId 
      });
    }

    // Add to group
    await prisma.$transaction([
      prisma.usersOnGroups.create({
        data: {
          groupId: invitation.groupId,
          userId: session.user.id
        }
      }),
      prisma.groupInvitation.update({
        where: { id: invitation.id },
        data: { 
          status: 'ACCEPTED',
          invitedUserId: session.user.id
        }
      })
    ]);

    return NextResponse.json({
      message: 'Successfully joined group',
      groupId: invitation.groupId,
      groupName: invitation.group.name
    });

  } catch (error) {
    console.error("[ACCEPT_INVITE_ERROR]", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}