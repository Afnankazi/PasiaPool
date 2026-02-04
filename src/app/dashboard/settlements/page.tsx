'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoaderFive } from "@/components/ui/loader";
import { 
  CreditCard, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ArrowRight,
  History,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

interface SettlementsOverview {
  totalOwedToMe: number;
  totalIOwePeople: number;
  netBalance: number;
  pendingDebtsCount: number;
  recentSettlementsCount: number;
  totalSettlementsCount: number;
}

const SettlementsOverviewPage = () => {
  const { status } = useSession();
  
  const [overview, setOverview] = useState<SettlementsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchOverview();
    }
  }, [status]);

  const fetchOverview = async () => {
    try {
      setError(null);
      const response = await fetch('/api/settlements');
      
      if (!response.ok) {
        throw new Error('Failed to fetch settlements overview');
      }
      
      const data = await response.json();
      
      setOverview({
        totalOwedToMe: data.totalOwedToMe || 0,
        totalIOwePeople: data.totalIOwePeople || 0,
        netBalance: data.netBalance || 0,
        pendingDebtsCount: data.debtSummaries?.length || 0,
        recentSettlementsCount: data.settlements?.slice(0, 5).length || 0,
        totalSettlementsCount: data.settlements?.length || 0
      });
    } catch (error) {
      console.error('Error fetching settlements overview:', error);
      setError(error instanceof Error ? error.message : 'Failed to load overview');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoaderFive text="Loading settlements overview..." />
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
                onClick={fetchOverview} 
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

  if (!overview) {
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settlements</h1>
          <p className="text-muted-foreground">
            Manage and track your group settlement activities
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Money Owed to You
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${overview.totalOwedToMe.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total amount to be received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Money You Owe
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${overview.totalIOwePeople.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total amount to be paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Net Balance
            </CardTitle>
            <DollarSign className={`h-4 w-4 ${overview.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overview.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(overview.netBalance).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {overview.netBalance >= 0 ? 'You are owed' : 'You owe overall'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-dashed hover:border-solid transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Pending Settlements
            </CardTitle>
            <CardDescription>
              {overview.pendingDebtsCount} outstanding debt{overview.pendingDebtsCount !== 1 ? 's' : ''} to settle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {overview.pendingDebtsCount}
                </p>
                <p className="text-sm text-muted-foreground">
                  {overview.pendingDebtsCount === 0 
                    ? 'All settled up!' 
                    : 'Require attention'
                  }
                </p>
              </div>
              <Link href="/dashboard/settlements/pending">
                <Button>
                  View Pending
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed hover:border-solid transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              Settlement History
            </CardTitle>
            <CardDescription>
              {overview.totalSettlementsCount} total settlement{overview.totalSettlementsCount !== 1 ? 's' : ''} recorded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {overview.totalSettlementsCount}
                </p>
                <p className="text-sm text-muted-foreground">
                  {overview.recentSettlementsCount} recent
                </p>
              </div>
              <Link href="/dashboard/settlements/history">
                <Button variant="outline">
                  View History
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Settlement Status
          </CardTitle>
          <CardDescription>
            Overview of your current settlement status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {overview.pendingDebtsCount > 0 ? (
              <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800">
                      You have {overview.pendingDebtsCount} pending settlement{overview.pendingDebtsCount !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-orange-600">
                      Review and settle outstanding debts with group members
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/settlements/pending">
                  <Button size="sm">
                    Settle Now
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">All settled up!</p>
                    <p className="text-sm text-green-600">
                      You have no outstanding debts with group members
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${overview.totalOwedToMe.toFixed(0)}
                </div>
                <p className="text-sm text-muted-foreground">Owed to You</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  ${overview.totalIOwePeople.toFixed(0)}
                </div>
                <p className="text-sm text-muted-foreground">You Owe</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {overview.totalSettlementsCount}
                </div>
                <p className="text-sm text-muted-foreground">Total Settlements</p>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${overview.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(overview.netBalance).toFixed(0)}
                </div>
                <p className="text-sm text-muted-foreground">Net Balance</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettlementsOverviewPage;
