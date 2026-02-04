/**
 * Cooper Event Detail Page
 * Manage Finternet payments and milestones
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoaderFive } from "@/components/ui/loader";
import EventPaymentManager from "@/components/cooper/EventPaymentManager";
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  ArrowLeft,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

interface EventData {
  id: string;
  name: string;
  description?: string;
  eventType: string;
  location?: string;
  eventDate?: string;
  status: string;
  estimatedTotal: number;
  actualTotal: number;
  totalPooled: number;
  paymentIntentId?: string;
  paymentUrl?: string;
  leader: {
    id: string;
    name: string;
    email: string;
  };
  participants: Array<{
    id: string;
    userId: string;
    shareAmount: number;
    contributionAmount: number;
    paymentStatus: string;
    paymentUrl?: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    currency: string;
    status: string;
    description?: string;
    createdAt: string;
    user: {
      name: string;
    };
  }>;
}

export default function EventDetailPage() {
  const params = useParams();
  const { status } = useSession();
  const eventId = params.eventId as string;

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (status !== 'authenticated') return;

      try {
        setError(null);
        
        // Get current user
        const userResponse = await fetch('/api/user/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setCurrentUser(userData);
        }

        // Get event data
        const eventResponse = await fetch(`/api/events/${eventId}`);
        if (!eventResponse.ok) {
          if (eventResponse.status === 404) {
            setError('Event not found');
          } else {
            setError('Failed to load event data');
          }
          return;
        }

        const data = await eventResponse.json();
        setEventData(data);
      } catch (error) {
        console.error('Error fetching event data:', error);
        setError('Failed to load event data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [eventId, status]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoaderFive text="Loading event details..." />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Unauthorized</h1>
          <p className="text-muted-foreground mt-2">Please log in to view this event.</p>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">
            {error || 'Event not found'}
          </h1>
          <p className="text-muted-foreground mt-2">
            The event you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link href="/dashboard">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isEventLeader = eventData.leader.id === currentUser?.id;
  const userParticipation = eventData.participants.find(p => p.userId === currentUser?.id);

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Event Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{eventData.name}</h1>
            {eventData.description && (
              <p className="text-muted-foreground mt-2">{eventData.description}</p>
            )}
          </div>
          <Badge variant="outline" className="text-sm">
            {eventData.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {eventData.eventDate 
                ? new Date(eventData.eventDate).toLocaleDateString()
                : 'No date set'
              }
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{eventData.location || 'No location set'}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{eventData.participants.length} participants</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>${eventData.estimatedTotal} USDC</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm text-muted-foreground mb-2">Event Leader</div>
          <div className="bg-background border rounded-full px-3 py-1 text-sm inline-block">
            {eventData.leader.name}
          </div>
        </div>
      </div>

      {/* Payment Management */}
      <EventPaymentManager 
        eventId={eventId}
        isEventLeader={isEventLeader}
      />

      {/* Participants */}
      <Card>
        <CardHeader>
          <CardTitle>Participants</CardTitle>
          <CardDescription>
            Payment status for all event participants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {eventData.participants.map((participant) => (
              <div 
                key={participant.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{participant.user.name}</h4>
                    {participant.userId === eventData.leader.id && (
                      <Badge variant="outline" className="text-xs">Leader</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {participant.user.email}
                  </div>
                </div>
                
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Share: ${participant.shareAmount}</span>
                    <Badge 
                      variant="outline"
                      className={
                        participant.paymentStatus === 'PAID' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {participant.paymentStatus}
                    </Badge>
                  </div>
                  
                  {participant.paymentUrl && participant.paymentStatus === 'PENDING' && (
                    <Button asChild size="sm" variant="outline">
                      <a href={participant.paymentUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-3 w-3" />
                        Pay Now
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Latest payment activities for this event
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eventData.transactions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No transactions yet
            </div>
          ) : (
            <div className="space-y-4">
              {eventData.transactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">
                        {transaction.description || transaction.type}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {transaction.type}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {transaction.user.name} • {new Date(transaction.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">
                      ${transaction.amount} {transaction.currency}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        transaction.status === 'SUCCEEDED' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}