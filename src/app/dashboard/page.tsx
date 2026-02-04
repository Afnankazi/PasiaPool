'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoaderFive } from "@/components/ui/loader";
import { 
  Users, 
  Receipt, 
  CreditCard, 
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

interface DashboardStats {
  totalStats: {
    totalGroups: number;
    totalExpenses: number;
    totalAmountPaid: number;
    totalAmountOwed: number;
    netBalance: number;
  };
  expensesByCategory: Array<{
    category: string;
    amount: number;
  }>;
  expensesByMonth: Array<{
    month: string;
    amount: number;
  }>;
  groupActivity: Array<{
    name: string;
    expenses: number;
    members: number;
    settlements: number;
    totalAmount: number;
  }>;
  recentExpenses: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
    groupName: string;
    category: string | null;
  }>;
  balanceData: Array<{
    groupName: string;
    owedToUser: number;
    userOwes: number;
    netBalance: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function DashboardPage() {
  const { status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (status !== 'authenticated') return;

      try {
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [status]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoaderFive text="Loading dashboard..." />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome to Settle</h1>
          <p className="text-muted-foreground">Please log in to view your dashboard</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-red-500">{error || 'Failed to load dashboard data'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto max-w-7xl">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your expenses and group activities
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStats.totalGroups}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStats.totalExpenses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalStats.totalAmountPaid.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Owed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalStats.totalAmountOwed.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            {stats.totalStats.netBalance >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              stats.totalStats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${Math.abs(stats.totalStats.netBalance).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalStats.netBalance >= 0 ? 'You are owed' : 'You owe'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Expenses by Category - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Expenses by Category
            </CardTitle>
            <CardDescription>
              Distribution of your expenses across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.expensesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) => `${category} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {stats.expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No expense data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Spending Trend - Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Spending Trend
            </CardTitle>
            <CardDescription>
              Your spending pattern over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.expensesByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.expensesByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']} />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No monthly data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Group Activity and Balance */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Group Activity - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Group Activity
            </CardTitle>
            <CardDescription>
              Number of expenses per group
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.groupActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.groupActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="expenses" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No group data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Balance by Group */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Balance by Group
            </CardTitle>
            <CardDescription>
              What you owe vs what others owe you
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.balanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.balanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="groupName" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, '']} />
                  <Legend />
                  <Bar dataKey="owedToUser" fill="#00C49F" name="Owed to You" />
                  <Bar dataKey="userOwes" fill="#FF8042" name="You Owe" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No balance data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to get you started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/groups">
              <Button className="w-full justify-start hover:text-white dark:hover:text-green-400  " variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Create New Group
                <ArrowUpRight className="ml-auto h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/expenses">
              <Button className="w-full justify-start hover:text-white dark:hover:text-green-400  " variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
                <ArrowUpRight className="ml-auto h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/settlements">
              <Button className="w-full justify-start hover:text-white dark:hover:text-green-400  " variant="outline">
                <CreditCard className="mr-2 h-4 w-4" />
                Settle Balances
                <ArrowUpRight className="ml-auto h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Expenses
            </CardTitle>
            <CardDescription>
              Your latest expenses across all groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentExpenses.length > 0 ? (
              <div className="space-y-4">
                {stats.recentExpenses.slice(0, 5).map((expense) => (
                  <div 
                    key={expense.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{expense.description}</h4>
                        {expense.category && (
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {expense.category}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {expense.groupName} • {new Date(expense.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">
                        ${expense.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
                {stats.recentExpenses.length > 5 && (
                  <div className="text-center pt-2">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No recent expenses found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
