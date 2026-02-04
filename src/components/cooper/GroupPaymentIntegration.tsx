/**
 * Group Payment Integration Component
 * Integrates Finternet payments with existing groups
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  DollarSign,
  Clock,
  Target,
  Users
} from 'lucide-react';

interface GroupPaymentIntegrationProps {
  groupId: string;
  groupName: string;
  groupMembers: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
      walletAddress?: string;
    };
  }>;
  isGroupLeader: boolean;
}

interface EventData {
  id: string;
  name: string;
  status: string;
  paymentIntentId?: string;
  paymentUrl?: string;
  estimatedTotal: number;
  actualTotal: number;
  totalPooled: number;
}

export default function GroupPaymentIntegration({ 
  groupId, 
  groupName, 
  groupMembers, 
  isGroupLeader 
}: GroupPaymentIntegrationProps) {
  const [loading, setLoading] = useState(false);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [paymentType, setPaymentType] = useState<'POOL' | 'MILESTONE' | 'TIME_LOCKED'>('POOL');
  const [amount, setAmount] = useState('');
  const [eventType, setEventType] = useState('OTHER');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [settlementDestination, setSettlementDestination] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if group already has an associated event
  useEffect(() => {
    checkExistingEvent();
  }, [groupId]);

  const checkExistingEvent = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/event`);
      if (response.ok) {
        const data = await response.json();
        setEventData(data.event);
      }
    } catch (error) {
      console.error('Failed to check existing event:', error);
    }
  };

  const createEventFromGroup = async () => {
    if (!amount || !settlementDestination) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // First create the Cooper Event
      const eventResponse = await fetch(`/api/groups/${groupId}/create-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          description: `Payment-enabled event for ${groupName}`,
          eventType,
          location,
          eventDate: eventDate ? new Date(eventDate).toISOString() : null,
        }),
      });

      if (!eventResponse.ok) {
        throw new Error('Failed to create event');
      }

      const eventData = await eventResponse.json();
      console.log('Event creation response:', eventData);

      // Then create the payment intent
      const paymentResponse = await fetch(`/api/events/${eventData.event.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'USDC',
          paymentType,
          settlementDestination,
          metadata: {
            groupId,
            groupName,
            memberCount: groupMembers.length,
          }
        }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        console.error('Payment creation failed:', errorData);
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const paymentData = await paymentResponse.json();
      console.log('Payment response data:', paymentData);
      
      setEventData(paymentData.event);
      setSuccess('Payment-enabled event created successfully!');
      
      // Refresh the event data to get the latest status
      await checkExistingEvent();

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create payment event');
    } finally {
      setLoading(false);
    }
  };

  const createParticipantPayments = async () => {
    if (!eventData) return;

    setLoading(true);
    setError('');

    try {
      const shareAmount = eventData.estimatedTotal > 0 
        ? (eventData.estimatedTotal / groupMembers.length).toFixed(2)
        : '0.00';
        
      const response = await fetch(`/api/events/${eventData.id}/participant-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareAmount,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create participant payments');
      }

      const data = await response.json();
      setSuccess(`Created ${data.payments.length} individual payment intents for group members!`);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create participant payments');
    } finally {
      setLoading(false);
    }
  };

  if (!isGroupLeader) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Payment Integration
          </CardTitle>
          <CardDescription>
            Only the group creator can set up payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eventData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Payment Status:</span>
                <Badge variant="outline">
                  {eventData.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Amount:</span>
                <span className="font-semibold">${eventData.estimatedTotal} USDC</span>
              </div>
              {eventData.paymentUrl && (
                <Button asChild className="w-full">
                  <a href={eventData.paymentUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Complete Payment
                  </a>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {eventData ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5 text-green-500" />
              Payment-Enabled Event
            </CardTitle>
            <CardDescription>
              Your group is now connected to Finternet payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Event Status</Label>
                <Badge className="mt-1" variant="outline">
                  {eventData.status}
                </Badge>
              </div>
              <div>
                <Label>Total Amount</Label>
                <p className="text-lg font-semibold">${eventData.estimatedTotal} USDC</p>
              </div>
              <div>
                <Label>Amount Pooled</Label>
                <p className="text-lg">${eventData.totalPooled} USDC</p>
              </div>
              <div>
                <Label>Progress</Label>
                <Progress 
                  value={eventData.estimatedTotal > 0 ? (eventData.totalPooled / eventData.estimatedTotal) * 100 : 0} 
                  className="mt-1"
                />
              </div>
            </div>

            {eventData.paymentUrl && (
              <Button asChild className="w-full">
                <a href={eventData.paymentUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Payment Page
                </a>
              </Button>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={createParticipantPayments}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                <Users className="mr-2 h-4 w-4" />
                Create Individual Payments
              </Button>
              <Button 
                onClick={() => window.open(`/events/${eventData.id}`, '_blank')}
                variant="outline"
                className="flex-1"
              >
                <Target className="mr-2 h-4 w-4" />
                Manage Event
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Enable Finternet Payments
            </CardTitle>
            <CardDescription>
              Convert your group to a payment-enabled event with crypto payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentType">Payment Type</Label>
                <Select value={paymentType} onValueChange={(value: any) => setPaymentType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POOL">
                      <div className="flex items-center">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Simple Pool Payment
                      </div>
                    </SelectItem>
                    <SelectItem value="MILESTONE">
                      <div className="flex items-center">
                        <Target className="mr-2 h-4 w-4" />
                        Milestone-based Payment
                      </div>
                    </SelectItem>
                    <SelectItem value="TIME_LOCKED">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        Time-locked Payment
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="eventType">Event Type</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DINNER">Dinner</SelectItem>
                    <SelectItem value="TRIP">Trip</SelectItem>
                    <SelectItem value="MOVIE">Movie</SelectItem>
                    <SelectItem value="SHOPPING">Shopping</SelectItem>
                    <SelectItem value="ENTERTAINMENT">Entertainment</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Total Amount (USDC)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100.00"
                />
              </div>

              <div>
                <Label htmlFor="settlement">Settlement Destination</Label>
                <Input
                  id="settlement"
                  value={settlementDestination}
                  onChange={(e) => setSettlementDestination(e.target.value)}
                  placeholder="bank_account_123"
                />
              </div>

              <div>
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Restaurant, City, etc."
                />
              </div>

              <div>
                <Label htmlFor="eventDate">Event Date (Optional)</Label>
                <Input
                  id="eventDate"
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Payment Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Group Members:</span>
                  <span>{groupMembers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span>{amount ? `$${amount} USDC` : 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Per Member:</span>
                  <span>
                    {amount ? `$${(parseFloat(amount) / groupMembers.length).toFixed(2)} USDC` : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Type:</span>
                  <span>{paymentType.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={createEventFromGroup} 
              disabled={loading || !amount || !settlementDestination}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Enable Finternet Payments'}
            </Button>

            <div className="text-xs text-muted-foreground">
              <p>
                This will create a Cooper Event linked to your group with Finternet payment capabilities.
                Members will be able to pay using cryptocurrency wallets.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}