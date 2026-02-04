'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoaderFive } from "@/components/ui/loader";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Calendar,
  Users,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  FileText
} from "lucide-react";
import Image from 'next/image';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface Group {
  id: string;
  name: string;
}

interface Settlement {
  id: string;
  amount: number;
  note?: string;
  date: string;
  group: Group;
  paidBy: User;
  receivedBy: User;
  createdBy: User;
}

const SettlementsHistoryPage = () => {
  const { data: session, status } = useSession();
  
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [filteredSettlements, setFilteredSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'paid' | 'received'>('all');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSettlements();
    }
  }, [status]);

  const fetchSettlements = async () => {
    try {
      setError(null);
      const response = await fetch('/api/settlements');
      
      if (!response.ok) {
        throw new Error('Failed to fetch settlements');
      }
      
      const data = await response.json();
      setSettlements(data.settlements || []);
    } catch (error) {
      console.error('Error fetching settlements:', error);
      setError(error instanceof Error ? error.message : 'Failed to load settlements');
    } finally {
      setIsLoading(false);
    }
  };

  const filterSettlements = useCallback(() => {
    let filtered = settlements;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(settlement => 
        settlement.paidBy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        settlement.receivedBy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        settlement.group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        settlement.note?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (typeFilter !== 'all' && session?.user?.id) {
      filtered = filtered.filter(settlement => {
        if (typeFilter === 'paid') {
          return settlement.paidBy.id === session.user.id;
        } else if (typeFilter === 'received') {
          return settlement.receivedBy.id === session.user.id;
        }
        return true;
      });
    }

    setFilteredSettlements(filtered);
  }, [settlements, searchTerm, typeFilter, session?.user?.id]);

  useEffect(() => {
    filterSettlements();
  }, [filterSettlements]);

  const getTotalAmount = (type: 'paid' | 'received') => {
    if (!session?.user?.id) return 0;
    
    return settlements
      .filter(settlement => 
        type === 'paid' 
          ? settlement.paidBy.id === session.user.id
          : settlement.receivedBy.id === session.user.id
      )
      .reduce((total, settlement) => total + settlement.amount, 0);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoaderFive text="Loading settlement history..." />
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p>Please sign in to view your settlement history.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-red-500">
              <p>Error: {error}</p>
              <Button 
                onClick={fetchSettlements} 
                className="mt-4"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPaid = getTotalAmount('paid');
  const totalReceived = getTotalAmount('received');

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settlement History</h1>
          <p className="text-muted-foreground">
            Complete history of all your settlement transactions
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Paid
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              ${totalPaid.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Money you&apos;ve paid to others
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Received
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalReceived.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Money you&apos;ve received from others
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Settlements
            </CardTitle>
            <Receipt className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {settlements.length}
            </div>
            <p className="text-xs text-muted-foreground">
              All settlement transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search settlements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={typeFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setTypeFilter('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={typeFilter === 'paid' ? 'default' : 'outline'}
                onClick={() => setTypeFilter('paid')}
                size="sm"
              >
                Paid
              </Button>
              <Button
                variant={typeFilter === 'received' ? 'default' : 'outline'}
                onClick={() => setTypeFilter('received')}
                size="sm"
              >
                Received
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settlements List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Settlement History
          </CardTitle>
          <CardDescription>
            {filteredSettlements.length} of {settlements.length} settlements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSettlements.length === 0 ? (
            <div className="text-center py-12">
              {settlements.length === 0 ? (
                <>
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No settlements yet</h3>
                  <p className="text-muted-foreground">
                    Your settlement history will appear here once you start making payments.
                  </p>
                </>
              ) : (
                <>
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No settlements found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filter criteria.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSettlements.map((settlement) => {
                const isReceived = settlement.receivedBy.id === session?.user?.id;
                const otherUser = isReceived ? settlement.paidBy : settlement.receivedBy;
                
                return (
                  <div
                    key={settlement.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isReceived ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                      }`}>
                        {isReceived ? (
                          <ArrowDownRight className="h-6 w-6" />
                        ) : (
                          <ArrowUpRight className="h-6 w-6" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {otherUser.image ? (
                            <Image
                              src={otherUser.image}
                              alt={otherUser.name}
                              className="w-full h-full rounded-full object-cover"
                              width={100}
                              height={100}
                            />
                          ) : (
                            <span className="text-sm font-medium">
                              {otherUser.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        
                        <div>
                          <p className="font-medium">
                            {isReceived 
                              ? `${otherUser.name} paid you`
                              : `You paid ${otherUser.name}`
                            }
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{settlement.group.name}</span>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(settlement.date).toLocaleDateString()}</span>
                          </div>
                          {settlement.note && (
                            <p className="text-sm text-muted-foreground italic mt-1">
                              &ldquo;{settlement.note}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-xl font-bold ${
                        isReceived ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {isReceived ? '+' : '-'}${settlement.amount.toFixed(2)}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {isReceived ? 'Received' : 'Paid'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettlementsHistoryPage;
