/**
 * Cooper Payment Service
 * Integrates Finternet payments with Cooper database models
 */

import { prisma } from './db';
import { finternetClient, CreatePaymentIntentRequest } from './finternet';
import { EventStatus, PaymentStatus, MilestoneStatus, TransactionType, TransactionStatus } from '@prisma/client';

export interface CreateEventPaymentRequest {
  eventId: string;
  amount: string; // Total pool amount
  currency?: string;
  paymentType: 'POOL' | 'MILESTONE' | 'TIME_LOCKED' | 'DELIVERY_VS_PAYMENT';
  settlementDestination: string;
  metadata?: Record<string, any>;
  amountPerPerson?: string; // Amount each person should pay
}

export interface CreateMilestonePaymentRequest {
  eventId: string;
  totalAmount: string;
  milestones: {
    subCategoryId: string;
    amount: string;
    description: string;
    percentage: number;
  }[];
  settlementDestination: string;
}

export class CooperPaymentService {
  
  /**
   * Create a payment intent for an event
   */
  async createEventPayment(request: CreateEventPaymentRequest): Promise<{
    paymentIntent: any;
    event: any;
  }> {
    const event = await prisma.event.findUnique({
      where: { id: request.eventId },
      include: { leader: true, participants: true }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Determine payment intent type based on request
    let paymentIntentType: 'CONDITIONAL' | 'DELIVERY_VS_PAYMENT' = 'CONDITIONAL';
    let metadata = {
      eventId: request.eventId,
      eventType: event.eventType,
      participantCount: event.participants.length,
      ...request.metadata,
    };

    if (request.paymentType === 'MILESTONE') {
      paymentIntentType = 'DELIVERY_VS_PAYMENT';
      metadata = {
        ...metadata,
        releaseType: 'MILESTONE_LOCKED',
        autoRelease: true,
      };
    } else if (request.paymentType === 'TIME_LOCKED') {
      paymentIntentType = 'DELIVERY_VS_PAYMENT';
      const lockUntil = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
      metadata = {
        ...metadata,
        releaseType: 'TIME_LOCKED',
        timeLockUntil: lockUntil.toString(),
        deliveryPeriod: 30 * 24 * 60 * 60,
      };
    } else if (request.paymentType === 'DELIVERY_VS_PAYMENT') {
      paymentIntentType = 'DELIVERY_VS_PAYMENT';
      metadata = {
        ...metadata,
        releaseType: 'DELIVERY_PROOF',
        autoRelease: true,
        deliveryPeriod: 30 * 24 * 60 * 60, // 30 days
      };
    }

    // Create payment intent with Finternet
    const paymentIntentData: CreatePaymentIntentRequest = {
      amount: request.amount,
      currency: request.currency || 'USDC',
      type: paymentIntentType,
      settlementMethod: 'OFF_RAMP_MOCK',
      settlementDestination: request.settlementDestination,
      description: `${event.name} - ${event.eventType}`,
      metadata,
    };

    const paymentIntent = await finternetClient.createPaymentIntent(paymentIntentData);

    // Update event with payment intent details
    const updatedEvent = await prisma.event.update({
      where: { id: request.eventId },
      data: {
        paymentIntentId: paymentIntent.id,
        paymentUrl: paymentIntent.data.paymentUrl,
        status: EventStatus.ACTIVE,
        estimatedTotal: parseFloat(request.amount),
      },
      include: { leader: true, participants: true }
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        eventId: request.eventId,
        userId: event.leaderId,
        type: TransactionType.POOL,
        amount: parseFloat(request.amount),
        currency: request.currency || 'USDC',
        description: `Payment intent created for ${event.name}`,
        paymentIntentId: paymentIntent.id,
        status: TransactionStatus.PENDING,
        metadata: {
          ...metadata,
          amountPerPerson: request.amountPerPerson,
          totalPoolAmount: request.amount,
        },
      },
    });

    return {
      paymentIntent,
      event: updatedEvent,
    };
  }

  /**
   * Create milestone-based payment for an event
   */
  async createMilestonePayment(request: CreateMilestonePaymentRequest): Promise<{
    paymentIntent: any;
    milestones: any[];
    event: any;
  }> {
    // First create the main payment intent
    const eventPayment = await this.createEventPayment({
      eventId: request.eventId,
      amount: request.totalAmount,
      paymentType: 'MILESTONE',
      settlementDestination: request.settlementDestination,
    });

    const createdMilestones = [];

    // Create milestones in Finternet and update sub-categories
    for (const milestone of request.milestones) {
      // Create milestone in Finternet
      const finternetMilestone = await finternetClient.createMilestone(
        eventPayment.paymentIntent.id,
        {
          milestoneIndex: createdMilestones.length,
          amount: milestone.amount,
          description: milestone.description,
          percentage: milestone.percentage,
        }
      );

      // Update sub-category with milestone info
      const updatedSubCategory = await prisma.subCategory.update({
        where: { id: milestone.subCategoryId },
        data: {
          milestoneId: finternetMilestone.id,
          milestoneIndex: finternetMilestone.milestoneIndex,
          milestoneStatus: MilestoneStatus.PENDING,
          estimatedCost: parseFloat(milestone.amount),
        },
      });

      createdMilestones.push({
        finternetMilestone,
        subCategory: updatedSubCategory,
      });
    }

    return {
      paymentIntent: eventPayment.paymentIntent,
      milestones: createdMilestones,
      event: eventPayment.event,
    };
  }

  /**
   * Complete a milestone and release funds
   */
  async completeMilestone(
    subCategoryId: string,
    completedBy: string,
    completionProof?: string
  ): Promise<any> {
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: subCategoryId },
      include: { event: true }
    });

    if (!subCategory || !subCategory.milestoneId || !subCategory.event.paymentIntentId) {
      throw new Error('Sub-category or milestone not found');
    }

    // Complete milestone in Finternet
    const completion = await finternetClient.completeMilestone(
      subCategory.event.paymentIntentId,
      subCategory.milestoneId,
      {
        completedBy,
        completionProof: completionProof || 'milestone_completed',
      }
    );

    // Update sub-category status
    const updatedSubCategory = await prisma.subCategory.update({
      where: { id: subCategoryId },
      data: {
        milestoneStatus: MilestoneStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    // Create transaction record for milestone completion
    await prisma.transaction.create({
      data: {
        eventId: subCategory.eventId,
        userId: completedBy,
        type: TransactionType.SETTLEMENT,
        amount: subCategory.estimatedCost,
        currency: 'USDC',
        description: `Milestone completed: ${subCategory.name}`,
        paymentIntentId: subCategory.event.paymentIntentId,
        status: TransactionStatus.SUCCEEDED,
        metadata: {
          milestoneId: subCategory.milestoneId,
          subCategoryId: subCategoryId,
        },
      },
    });

    return {
      completion,
      subCategory: updatedSubCategory,
    };
  }

  /**
   * Create individual payment intents for event participants
   */
  async createParticipantPayments(
    eventId: string, 
    options?: {
      currency?: string;
      paymentType?: 'POOL' | 'MILESTONE' | 'TIME_LOCKED' | 'DELIVERY_VS_PAYMENT';
      settlementDestination?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<any[]> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { participants: { include: { user: true } } }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const participantPayments = [];
    const currency = options?.currency || 'USDC';
    const settlementDestination = options?.settlementDestination || 'event_pool';
    const paymentType = options?.paymentType || 'POOL';

    // Determine payment intent type based on request
    let paymentIntentType: 'CONDITIONAL' | 'DELIVERY_VS_PAYMENT' = 'CONDITIONAL';
    let baseMetadata = {
      eventId: eventId,
      eventType: event.eventType,
      paymentType,
      ...options?.metadata,
    };

    if (paymentType === 'MILESTONE') {
      paymentIntentType = 'DELIVERY_VS_PAYMENT';
      baseMetadata = {
        ...baseMetadata,
        releaseType: 'MILESTONE_LOCKED',
        autoRelease: true,
      };
    } else if (paymentType === 'TIME_LOCKED') {
      paymentIntentType = 'DELIVERY_VS_PAYMENT';
      const lockUntil = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
      baseMetadata = {
        ...baseMetadata,
        releaseType: 'TIME_LOCKED',
        timeLockUntil: lockUntil.toString(),
        deliveryPeriod: 30 * 24 * 60 * 60,
      };
    } else if (paymentType === 'DELIVERY_VS_PAYMENT') {
      paymentIntentType = 'DELIVERY_VS_PAYMENT';
      baseMetadata = {
        ...baseMetadata,
        releaseType: 'DELIVERY_PROOF',
        autoRelease: true,
        deliveryPeriod: 30 * 24 * 60 * 60, // 30 days
      };
    }

    for (const participant of event.participants) {
      if (participant.shareAmount > 0) {
        // Create redirect URLs for success and cancel
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const successUrl = `${baseUrl}/api/payment/success?payment_intent_id={{PAYMENT_INTENT_ID}}&group_id=${baseMetadata.groupId}&participant_id=${participant.id}`;
        const cancelUrl = `${baseUrl}/dashboard/groups/${baseMetadata.groupId}?payment_cancelled=true`;

        // Create individual payment intent for participant
        const paymentIntent = await finternetClient.createPaymentIntent({
          amount: participant.shareAmount.toString(),
          currency,
          type: paymentIntentType,
          settlementMethod: 'OFF_RAMP_MOCK',
          settlementDestination,
          description: `${event.name} - ${participant.user.name}`,
          metadata: {
            ...baseMetadata,
            participantId: participant.id,
            userId: participant.userId,
            participantName: participant.user.name,
            successUrl,
            cancelUrl,
          },
        });

        // Update participant with payment intent
        const updatedParticipant = await prisma.eventParticipant.update({
          where: { id: participant.id },
          data: {
            paymentIntentId: paymentIntent.id,
            paymentUrl: paymentIntent.data.paymentUrl,
            paymentStatus: PaymentStatus.PENDING,
          },
        });

        // Create transaction record for participant payment
        await prisma.transaction.create({
          data: {
            eventId: eventId,
            userId: participant.userId,
            type: TransactionType.POOL,
            amount: participant.shareAmount,
            currency,
            description: `Individual payment for ${event.name} - ${participant.user.name}`,
            paymentIntentId: paymentIntent.id,
            status: TransactionStatus.PENDING,
            metadata: {
              ...baseMetadata,
              participantId: participant.id,
              participantName: participant.user.name,
            },
          },
        });

        participantPayments.push({
          participant: updatedParticipant,
          paymentIntent,
        });
      }
    }

    return participantPayments;
  }

  /**
   * Monitor payment status and update database
   */
  async monitorPaymentStatus(paymentIntentId: string): Promise<void> {
    try {
      const paymentIntent = await finternetClient.pollPaymentStatus(
        paymentIntentId,
        (status) => {
          console.log(`Payment ${paymentIntentId} status: ${status}`);
        }
      );

      // Update event or participant based on payment completion
      if (paymentIntent.data.status === 'SUCCEEDED') {
        await this.handlePaymentSuccess(paymentIntentId);
      }
    } catch (error) {
      console.error('Payment monitoring failed:', error);
      await this.handlePaymentFailure(paymentIntentId);
    }
  }

  private async handlePaymentSuccess(paymentIntentId: string): Promise<void> {
    // Update event if it's an event payment
    const event = await prisma.event.findFirst({
      where: { paymentIntentId }
    });

    if (event) {
      await prisma.event.update({
        where: { id: event.id },
        data: { status: EventStatus.IN_PROGRESS }
      });
    }

    // Update participant if it's a participant payment
    const participant = await prisma.eventParticipant.findFirst({
      where: { paymentIntentId },
      include: { event: true }
    });

    if (participant) {
      await prisma.eventParticipant.update({
        where: { id: participant.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paidAt: new Date(),
        }
      });

      // Update event's totalPooled amount
      const allParticipants = await prisma.eventParticipant.findMany({
        where: { eventId: participant.eventId }
      });

      const totalPooled = allParticipants
        .filter(p => p.paymentStatus === PaymentStatus.PAID || p.id === participant.id)
        .reduce((sum, p) => sum + Number(p.shareAmount), 0);

      await prisma.event.update({
        where: { id: participant.eventId },
        data: { 
          totalPooled,
          // Update status to IN_PROGRESS if this is the first payment
          ...(participant.event.status === EventStatus.ACTIVE && { status: EventStatus.IN_PROGRESS })
        }
      });
    }

    // Update transaction status
    await prisma.transaction.updateMany({
      where: { paymentIntentId },
      data: { status: TransactionStatus.SUCCEEDED }
    });
  }

  private async handlePaymentFailure(paymentIntentId: string): Promise<void> {
    // Update transaction status
    await prisma.transaction.updateMany({
      where: { paymentIntentId },
      data: { status: TransactionStatus.FAILED }
    });

    // Update participant payment status if applicable
    await prisma.eventParticipant.updateMany({
      where: { paymentIntentId },
      data: { paymentStatus: PaymentStatus.FAILED }
    });
  }

  /**
   * Recalculate and update totalPooled for an event
   */
  async updateEventTotalPooled(eventId: string): Promise<number> {
    const participants = await prisma.eventParticipant.findMany({
      where: { eventId }
    });

    const totalPooled = participants
      .filter(p => p.paymentStatus === PaymentStatus.PAID)
      .reduce((sum, p) => sum + Number(p.shareAmount), 0);

    await prisma.event.update({
      where: { id: eventId },
      data: { totalPooled }
    });

    return totalPooled;
  }

  /**
   * Submit delivery proof for DvP payments
   */
  async submitDeliveryProof(
    eventId: string,
    trackingNumber: string,
    deliveredAt: string,
    submittedBy: string
  ): Promise<any> {
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event || !event.paymentIntentId) {
      throw new Error('Event or payment intent not found');
    }

    const proofHash = finternetClient.generateDeliveryProof(trackingNumber, deliveredAt);
    
    const deliveryProof = await finternetClient.submitDeliveryProof(
      event.paymentIntentId,
      {
        proofHash,
        proofURI: `https://tracking.example.com/${trackingNumber}`,
        submittedBy,
      }
    );

    // Update event status
    await prisma.event.update({
      where: { id: eventId },
      data: { status: EventStatus.SETTLING }
    });

    return deliveryProof;
  }
}

export const cooperPaymentService = new CooperPaymentService();