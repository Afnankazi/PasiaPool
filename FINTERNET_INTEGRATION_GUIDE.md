# Finternet Integration Guide

## Overview

Your PasiaPool application now has complete Finternet Payment Gateway integration with the Cooper database schema. This enables programmable payments, milestone-based releases, and advanced payment workflows.

## 🚀 What's Been Integrated

### 1. Core Finternet Client (`src/lib/finternet.ts`)
- Complete API wrapper for Finternet Payment Gateway
- Support for all payment types: CONDITIONAL, DELIVERY_VS_PAYMENT
- Milestone management and completion
- Payment status monitoring and polling
- Delivery proof submission

### 2. Cooper Payment Service (`src/lib/cooper-payment-service.ts`)
- High-level service integrating Finternet with your database
- Event payment creation and management
- Milestone-based payment workflows
- Participant payment handling
- Automatic status synchronization

### 3. API Routes
- `/api/events/[eventId]/payment` - Event payment management
- `/api/events/[eventId]/milestones` - Milestone creation and management
- `/api/milestones/[milestoneId]/complete` - Milestone completion

### 4. UI Components
- `EventPaymentManager` - Complete payment management interface
- Support for all Finternet payment types
- Real-time status updates
- Milestone progress tracking

## 🔧 Configuration

Your `.env` file is already configured with:
```env
FINTERNET_API_KEY="sk_hackathon_b583d804ace81543fecf47eee783e167"
FINTERNET_BASE_URL="https://api.fmm.finternetlab.io/api/v1"
```

## 📋 Usage Examples

### 1. Create Simple Pool Payment

```typescript
import { cooperPaymentService } from '@/lib/cooper-payment-service';

const result = await cooperPaymentService.createEventPayment({
  eventId: 'event_123',
  amount: '100.00',
  paymentType: 'POOL',
  settlementDestination: 'bank_account_123',
});

console.log('Payment URL:', result.paymentIntent.data.paymentUrl);
```

### 2. Create Milestone-Based Payment

```typescript
const result = await cooperPaymentService.createMilestonePayment({
  eventId: 'event_123',
  totalAmount: '1000.00',
  milestones: [
    {
      subCategoryId: 'subcat_1',
      amount: '300.00',
      description: 'Project kickoff - 30%',
      percentage: 30
    },
    {
      subCategoryId: 'subcat_2',
      amount: '500.00',
      description: 'Core features - 50%',
      percentage: 50
    },
    {
      subCategoryId: 'subcat_3',
      amount: '200.00',
      description: 'Final delivery - 20%',
      percentage: 20
    }
  ],
  settlementDestination: 'bank_account_123',
});
```

### 3. Complete Milestone

```typescript
const result = await cooperPaymentService.completeMilestone(
  'subcat_1',
  'user_123',
  'milestone_completion_proof'
);
```

### 4. Submit Delivery Proof

```typescript
const result = await cooperPaymentService.submitDeliveryProof(
  'event_123',
  'TRACK123456',
  '2026-02-04T10:00:00Z',
  'user_123'
);
```

## 🎯 Payment Flow Examples

### Basic Event Payment Flow

1. **Event Leader creates payment intent**
   ```typescript
   POST /api/events/event_123/payment
   {
     "amount": "100.00",
     "paymentType": "POOL",
     "settlementDestination": "bank_account_123"
   }
   ```

2. **Participants pay via Finternet URL**
   - Users redirected to `paymentIntent.data.paymentUrl`
   - Complete payment with crypto wallet

3. **Automatic status updates**
   - Database automatically updated when payment succeeds
   - Event status changes to `IN_PROGRESS`

### Milestone Payment Flow

1. **Create milestone payment**
   ```typescript
   POST /api/events/event_123/milestones
   {
     "totalAmount": "1000.00",
     "milestones": [...],
     "settlementDestination": "bank_account_123"
   }
   ```

2. **Complete milestones sequentially**
   ```typescript
   POST /api/milestones/milestone_123/complete
   {
     "completionProof": "proof_hash"
   }
   ```

3. **Automatic fund release**
   - Funds released automatically when milestone completed
   - Transaction records created in database

## 🔄 Database Integration

### Event Model Updates
- `paymentIntentId` - Links to Finternet payment intent
- `paymentUrl` - Direct payment URL for participants
- `status` - Synced with Finternet payment status

### Transaction Tracking
- All Finternet operations create `Transaction` records
- Complete audit trail of payment activities
- Status synchronization with Finternet

### Milestone Management
- `SubCategory` model enhanced with milestone fields
- `milestoneId` - Links to Finternet milestone
- `milestoneStatus` - Tracks completion status

## 🎨 UI Components Usage

### In your event page:

```tsx
import EventPaymentManager from '@/components/cooper/EventPaymentManager';

export default function EventPage({ eventId, isEventLeader }) {
  return (
    <div>
      <h1>Event Details</h1>
      <EventPaymentManager 
        eventId={eventId} 
        isEventLeader={isEventLeader} 
      />
    </div>
  );
}
```

## 🔐 Security Features

- **API Key Protection** - Server-side only, never exposed to client
- **User Authorization** - Only event leaders can create payments
- **Participant Verification** - Only participants can complete milestones
- **Audit Logging** - All actions logged in `AuditLog` table

## 📊 Monitoring & Analytics

### Payment Status Monitoring
```typescript
// Automatic polling for payment status updates
await cooperPaymentService.monitorPaymentStatus('intent_123');
```

### Transaction Analytics
```sql
-- Get payment statistics for an event
SELECT 
  type,
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM Transaction 
WHERE eventId = 'event_123'
GROUP BY type, status;
```

## 🚀 Next Steps

1. **Test the Integration**
   - Create a test event
   - Set up payment intent
   - Test milestone completion

2. **Customize UI**
   - Modify `EventPaymentManager` component
   - Add your branding and styling

3. **Add Webhooks** (Optional)
   - Set up Finternet webhooks for real-time updates
   - Handle payment confirmations automatically

4. **Production Deployment**
   - Update API keys for production
   - Configure production settlement destinations

## 🔗 Resources

- [Finternet Documentation](https://docs.fmm.finternetlab.io)
- [Finternet Dashboard](https://dashboard.finternetlab.io)
- [Cooper Database Schema](./COOPER_INTEGRATION.md)

## 🆘 Troubleshooting

### Common Issues

1. **Payment Intent Creation Fails**
   - Check API key configuration
   - Verify settlement destination format

2. **Milestone Completion Fails**
   - Ensure user has proper permissions
   - Check milestone exists and is in PENDING status

3. **Status Not Updating**
   - Check payment polling is working
   - Verify webhook configuration (if using)

Your Finternet integration is now complete and ready for use! 🎉