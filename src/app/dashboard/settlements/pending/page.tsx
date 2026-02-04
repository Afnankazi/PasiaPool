'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoaderFive } from "@/components/ui/loader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  CreditCard, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Receipt
} from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/user-avatar";

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

interface DebtSummary {
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  groupId: string;
  groupName: string;
  totalOwed: number; // How much this user owes me
  totalOwing: number; // How much I owe this user
  netAmount: number; // Positive means they owe me, negative means I owe them
}

interface SettlementsData {
  settlements: Settlement[];
  debtSummaries: DebtSummary[];
  totalOwedToMe: number;
  totalIOwePeople: number;
  netBalance: number;
}

const SettlementsPage = () => {
  const { data: session, status } = useSession();
  
  const [settlementsData, setSettlementsData] = useState<SettlementsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Settlement creation states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingSettlement, setIsCreatingSettlement] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtSummary | null>(null);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [settlementNote, setSettlementNote] = useState('');

  const fetchSettlementsData = useCallback(async (retryCount = 0) => {
    try {
      setError(null);
      const response = await fetch('/api/settlements');
      
      if (response.status === 429) {
        // Rate limit hit
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(`Rate limit hit, retrying in ${delay}ms...`);
          setTimeout(() => fetchSettlementsData(retryCount + 1), delay);
          return;
        } else {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch settlements data (${response.status})`);
      }
      
      const data = await response.json();
      setSettlementsData(data);
    } catch (error) {
      console.error('Error fetching settlements:', error);
      setError(error instanceof Error ? error.message : 'Failed to load settlements');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSettlementsData();
    }
  }, [status, fetchSettlementsData]);

  const handleCreateSettlement = async () => {
    if (!selectedDebt || !settlementAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(settlementAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const maxAmount = Math.abs(selectedDebt.netAmount);
    
    if (amount > maxAmount) {
      toast.error(`Amount cannot exceed ${maxAmount.toFixed(2)}`);
      return;
    }

    setIsCreatingSettlement(true);
    
    try {
      // Determine who paid and who received based on the debt direction
      // If netAmount > 0: they owe me, so they're paying me
      // If netAmount < 0: I owe them, so I'm paying them
      const theyOweMe = selectedDebt.netAmount > 0;
      const paidByUserId = theyOweMe ? selectedDebt.userId : session?.user?.id;
      const receivedByUserId = theyOweMe ? session?.user?.id : selectedDebt.userId;

      const response = await fetch('/api/settlements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          note: settlementNote || undefined,
          groupId: selectedDebt.groupId,
          paidByUserId,
          receivedByUserId,
        }),
      });

      if (response.status === 429) {
        toast.error('Too many requests. Please wait a moment and try again.');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create settlement (${response.status})`);
      }

      toast.success('Settlement recorded successfully! Debt has been updated.');
      setIsCreateModalOpen(false);
      setSelectedDebt(null);
      setSettlementAmount('');
      setSettlementNote('');
      fetchSettlementsData(); // Refresh data
    } catch (error) {
      console.error('Error creating settlement:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create settlement');
    } finally {
      setIsCreatingSettlement(false);
    }
  };

  const openSettleModal = (debt: DebtSummary) => {
    setSelectedDebt(debt);
    setSettlementAmount(Math.abs(debt.netAmount).toString());
    setIsCreateModalOpen(true);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoaderFive text="Loading settlements..." />
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p>Please sign in to view your settlements.</p>
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
            <div className="text-red-600">
              <p>Error: {error}</p>
              <Button 
                onClick={() => fetchSettlementsData()} 
                className="mt-4"
                variant="default"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!settlementsData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p>No settlements data available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { settlements, debtSummaries, totalOwedToMe, totalIOwePeople, netBalance } = settlementsData;

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settlements</h1>
          <p className="text-muted-foreground">
            Manage your debts and payments with group members
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              People Owe Me
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalOwedToMe.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Money to be received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              I Owe People
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalIOwePeople.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Money to be paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Net Balance
            </CardTitle>
            <DollarSign className={`h-4 w-4 ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(netBalance).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {netBalance >= 0 ? 'You are owed' : 'You owe'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Debts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Outstanding Debts
          </CardTitle>
          <CardDescription>
            Settle up with your group members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {debtSummaries.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">All settled up!</h3>
              <p className="text-muted-foreground">
                You have no outstanding debts with any group members.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {debtSummaries.map((debt) => (
                <div
                  key={`${debt.userId}-${debt.groupId}`}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar 
                        user={{
                          name: debt.userName,
                          image: debt.userImage
                        }}
                        size="md"
                      />
                      <div>
                        <p className="font-medium">{debt.userName}</p>
                        <p className="text-sm text-muted-foreground">{debt.groupName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {debt.netAmount > 0 ? (
                        <>
                          <p className="text-green-600 font-medium flex items-center gap-1">
                            <ArrowDownRight className="h-4 w-4" />
                            They owe you ${debt.netAmount.toFixed(2)}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-red-600 font-medium flex items-center gap-1">
                            <ArrowUpRight className="h-4 w-4" />
                            You owe them ${Math.abs(debt.netAmount).toFixed(2)}
                          </p>
                        </>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => openSettleModal(debt)}
                      size="sm"
                      variant={debt.netAmount > 0 ? "outline" : "default"}
                    >
                      {debt.netAmount > 0 ? "Record Payment" : "Record Payment"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Settlements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Recent Settlements
          </CardTitle>
          <CardDescription>
            Your latest settlement activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settlements.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No settlements yet</h3>
              <p className="text-muted-foreground">
                Settlement history will appear here once you start making payments.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {settlements.slice(0, 10).map((settlement) => {
                const isReceived = settlement.receivedBy.id === session?.user?.id;
                const otherUser = isReceived ? settlement.paidBy : settlement.receivedBy;
                
                return (
                  <div
                    key={settlement.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isReceived ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                      }`}>
                        {isReceived ? (
                          <ArrowDownRight className="h-5 w-5" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {isReceived 
                            ? `${otherUser.name} paid you`
                            : `You paid ${otherUser.name}`
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {settlement.group.name} • {new Date(settlement.date).toLocaleDateString()}
                        </p>
                        {settlement.note && (
                          <p className="text-sm text-muted-foreground italic">
                            &ldquo;{settlement.note}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className={`text-lg font-medium ${
                      isReceived ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isReceived ? '+' : '-'}${settlement.amount.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settlement Creation Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDebt?.netAmount && selectedDebt.netAmount > 0 
                ? 'Record Payment Received' 
                : 'Record Payment Made'
              }
            </DialogTitle>
            <DialogDescription>
              {selectedDebt?.netAmount && selectedDebt.netAmount > 0
                ? `Record that ${selectedDebt.userName} has paid you to settle the debt`
                : `Record that you have paid ${selectedDebt?.userName} to settle the debt`
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedDebt && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{selectedDebt.userName}</span>
                  <span className="font-medium">{selectedDebt.groupName}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Total amount: ${Math.abs(selectedDebt.netAmount).toFixed(2)}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={Math.abs(selectedDebt.netAmount)}
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Note (optional)</label>
                <Textarea
                  value={settlementNote}
                  onChange={(e) => setSettlementNote(e.target.value)}
                  placeholder="Add a note about this settlement..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateSettlement}
                  disabled={isCreatingSettlement}
                  className="flex-1"
                >
                  {isCreatingSettlement ? (
                    <LoaderFive text="Processing..." />
                  ) : (
                    selectedDebt.netAmount > 0 ? 'Record Payment Received' : 'Record Payment Made'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setSelectedDebt(null);
                    setSettlementAmount('');
                    setSettlementNote('');
                  }}
                  disabled={isCreatingSettlement}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettlementsPage;
