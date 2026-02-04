import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { sendEmail, createInvitationEmailHtml } from "@/lib/email";
import crypto from "crypto";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
});


export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", {
        status: 401,
      });
    }
    
    // Validate request body with Zod
    const body = await request.json();
    const validationResult = inviteSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation error", 
          details: validationResult.error.format() 
        },
        { status: 400 }
      );
    }

    const { email: inviteeEmail } = validationResult.data;
    const resolvedParams = await params;
    const groupId = resolvedParams.id;
    const inviterId = session.user.id;


    // Check if the group exists and if the inviter is a member
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        OR: [
          { createdByUserId: inviterId },
          { members: { some: { userId: inviterId } } }
        ]
      },
      include: {
        createdBy: true,
        members: {
          include: {
            user: true
          }
        }
      }
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found or you don't have permission to invite members" },
        { status: 404 }
      );
    }

    // Check if the invitee is already a member
    const existingMember = group.members.find(
      member => member.user.email === inviteeEmail
    );

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this group" },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.groupInvitation.findFirst({
      where: {
        email: inviteeEmail,
        groupId: groupId,
        status: "PENDING",
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email" },
        { status: 400 }
      );
    }

    // Check if the invitee has a user account
    const inviteeUser = await prisma.user.findUnique({
      where: { email: inviteeEmail }
    });

    // Generate invitation token and expiry
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create the invitation
    const invitation = await prisma.groupInvitation.create({
      data: {
        token,
        email: inviteeEmail,
        expiresAt,
        groupId,
        invitedByUserId: inviterId,
        invitedUserId: inviteeUser?.id || null,
        status: "PENDING",
      },
      include: {
        group: true,
        invitedBy: true
      }
    });

    // Send invitation email
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const invitationUrl = `${baseUrl}/api/groups/invites/verify?token=${token}`;
    
    try {
      const emailHtml = createInvitationEmailHtml({
        inviterName: invitation.invitedBy.name,
        groupName: invitation.group.name,
        invitationUrl,
        expiresAt
      });

      await sendEmail({
        to: inviteeEmail,
        subject: `${invitation.invitedBy.name} invited you to join "${invitation.group.name}"`,
        html: emailHtml
      });

      console.log("✅ Invitation email sent successfully to:", inviteeEmail);
      
    } catch (emailError) {
      console.error("❌ Failed to send invitation email:", emailError);
      
      // If email fails, delete the invitation and return error
      await prisma.groupInvitation.delete({
        where: { id: invitation.id }
      });
      
      return NextResponse.json(
        { 
          error: "Failed to send invitation email", 
          details: emailError instanceof Error ? emailError.message : "Unknown email error"
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Invitation sent successfully",
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
        status: invitation.status
      }
    });

  } catch (error) {
    console.error("Error sending group invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}