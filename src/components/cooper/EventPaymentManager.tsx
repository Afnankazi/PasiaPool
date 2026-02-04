/**
 * Event Payment Manager Component
 * Comprehensive UI for managing Finternet payments in Cooper events
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Plus,
  DollarSign
} from 'lucide-react';

interface EventPaymentManagerProps {
  eventId: string;
  isEventLeader: boolean;
}

interface PaymentIntent {
  id: string;
  status: string;
  paymentUrl: string;
  amount: string;
  currency: string;
}

interface Milestone {
  id: string;
  name: string;
  amount: string;
  percentage: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  milestoneId?: string;
}

export default function EventPaymentManager({ eventId, isEventLeader }: EventPaymentManagerProps) {
  const [loading, setLoading] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [paymentType, setPaymentType] = useState<'POOL' | 'MILESTONE' | 'TIME_LOCKED'>('POOL');
  const [amount, setAmount] = useState('');
  const [settlementDestination, setSettlementDestination] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load existing payment data
  useEffect(() => {
    loadPaymentData();
  }, [eventId]);

  const loadPaymentData = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/payment`);
      if (response.ok) {
        const data = await response.json();
        if (data.paymentIntentId) {
          setPaymentIntent({
            id: data.paymentIntentId,
            status: data.event.status,
            paymentUrl: data.paymentUrl,
            amount: data.event.estimatedTotal?.toString() || '0',
            currency: 'USDC'
          });
        }
      }
    } catch (error) {
      console.error('Failed to load payment data:', error);
    }
  };

  const loadMilestones = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/milestones`);
      if (response.ok) {
        const data = await response.json();
        setMilestones(data.milestones || []);
      }
    } catch (error) {
      console.error('Failed to load milestones:', error);
    }
  };

  const createPayment = async () => {
    if (!amount || !settlementDestination) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/events/${eventId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'USDC',
          paymentType,
          settlementDestination,
          metadata: {
            createdAt: new Date().toISOString(),
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment');
      }

      const data = await response.json();
      setPaymentIntent({
        id: data.paymentIntent.id,
        status: data.paymentIntent.data.status || 'INITIATED',
        paymentUrl: data.paymentIntent.data.paymentUrl,
        amount: data.paymentIntent.data.amount,
        currency: data.paymentIntent.data.currency,
      });

      setSuccess('Payment intent created successfully!');
      
      // Start monitoring payment status
      monitorPaymentStatus(data.paymentIntent.id);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  const createMilestonePayment = async (milestoneData: any[]) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/events/${eventId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalAmount: amount,
          milestones: milestoneData,
          settlementDestination,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create milestone payment');
      }

      const data = await response.json();
      setPaymentIntent({
        id: data.paymentIntent.id,
        status: data.paymentIntent.data.status || 'INITIATED',
        paymentUrl: data.paymentIntent.data.paymentUrl,
        amount: data.paymentIntent.data.amount,
        currency: data.paymentIntent.data.currency,
      });

      setMilestones(data.milestones.map((m: any) => ({
        id: m.subCategory.id,
        name: m.subCategory.name,
        amount: m.subCategory.estimatedCost.toString(),
        percentage: m.finternetMilestone.percentage,
        status: m.subCategory.milestoneStatus,
        milestoneId: m.finternetMilestone.id,
      })));

      setSuccess('Milestone payment created successfully!');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create milestone payment');
    } finally {
      setLoading(false);
    }
  };

  const completeMilestone = async (milestoneId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/milestones/${milestoneId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completionProof: `milestone_${milestoneId}_completed_${Date.now()}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete milestone');
      }

      setSuccess('Milestone completed successfully!');
      loadMilestones(); // Reload milestones
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to complete milestone');
    } finally {
      setLoading(false);
    }
  };

  const monitorPaymentStatus = async (intentId: string) => {
    // Simple polling implementation
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/payment`);
        if (response.ok) {
          const data = await response.json();
          if (data.event.status === 'SUCCEEDED' || data.event.status === 'SETTLED') {
            clearInterval(pollInterval);
            setSuccess('Payment completed successfully!');
            loadPaymentData();
          }
        }
      } catch (error) {
        console.error('Payment status check failed:', error);
      }
    }, 5000);

    // Clear interval after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 300000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'INITIATED':
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'PROCESSING':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'SUCCEEDED':
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'INITIATED':
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'SUCCEEDED':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isEventLeader) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>
            Only the event leader can manage payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentIntent && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Payment Status:</span>
                <Badge className={getStatusColor(paymentIntent.status)}>
                  {getStatusIcon(paymentIntent.status)}
                  <span className="ml-1">{paymentIntent.status}</span>
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Amount:</span>
                <span className="font-semibold">{paymentIntent.amount} {paymentIntent.currency}</span>
              </div>
              {paymentIntent.paymentUrl && (
                <Button asChild className="w-full">
                  <a href={paymentIntent.paymentUrl} target="_blank" rel="noopener noreferrer">
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

      <Tabs defaultValue="payment" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payment">Payment Setup</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Create Payment Intent
              </CardTitle>
              <CardDescription>
                Set up Finternet payment for your event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentIntent ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold">Payment Intent Created</p>
                      <p className="text-sm text-gray-600">ID: {paymentIntent.id}</p>
                    </div>
                    <Badge className={getStatusColor(paymentIntent.status)}>
                      {getStatusIcon(paymentIntent.status)}
                      <span className="ml-1">{paymentIntent.status}</span>
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Amount</Label>
                      <p className="text-lg font-semibold">{paymentIntent.amount} {paymentIntent.currency}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <p className="text-lg">{paymentIntent.status}</p>
                    </div>
                  </div>

                  {paymentIntent.paymentUrl && (
                    <Button asChild className="w-full">
                      <a href={paymentIntent.paymentUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Payment Page
                      </a>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="paymentType">Payment Type</Label>
                    <Select value={paymentType} onValueChange={(value: any) => setPaymentType(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="POOL">Simple Pool Payment</SelectItem>
                        <SelectItem value="MILESTONE">Milestone-based Payment</SelectItem>
                        <SelectItem value="TIME_LOCKED">Time-locked Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="amount">Amount (USDC)</Label>
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

                  <Button 
                    onClick={createPayment} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Creating...' : 'Create Payment Intent'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Milestone Management
              </CardTitle>
              <CardDescription>
                Manage milestone-based payments and releases
              </CardDescription>
            </CardHeader>
            <CardContent>
              {milestones.length > 0 ? (
                <div className="space-y-4">
                  {milestones.map((milestone) => (
                    <div key={milestone.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{milestone.name}</h4>
                        <Badge className={getStatusColor(milestone.status)}>
                          {getStatusIcon(milestone.status)}
                          <span className="ml-1">{milestone.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <Label>Amount</Label>
                          <p>{milestone.amount} USDC</p>
                        </div>
                        <div>
                          <Label>Percentage</Label>
                          <p>{milestone.percentage}%</p>
                        </div>
                      </div>

                      <Progress value={milestone.status === 'COMPLETED' ? 100 : 0} className="mb-3" />

                      {milestone.status === 'PENDING' && milestone.milestoneId && (
                        <Button
                          onClick={() => completeMilestone(milestone.milestoneId!)}
                          disabled={loading}
                          size="sm"
                        >
                          Complete Milestone
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No milestones created yet</p>
                  <Button onClick={loadMilestones}>
                    <Plus className="mr-2 h-4 w-4" />
                    Load Milestones
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}