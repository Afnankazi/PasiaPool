'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Receipt, 
  Search, 
  Filter,
  Users,
  User,
  Calendar
} from "lucide-react";
import { LoaderFive } from "@/components/ui/loader";
import Link from "next/link";

type SplitType = 'EQUAL' | 'UNEQUAL' | 'PERCENTAGE';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
}

interface ExpenseSplit {
  id: string;
  userId: string;
  amountOwed: number;
  user: User;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string | null;
  date: string;
  splitType: SplitType;
  groupId: string | null;
  paidBy: User;
  createdBy: User;
  group: Group | null;
  splits: ExpenseSplit[];
  createdAt: string;
  updatedAt: string;
}

const ExpensesPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'personal' | 'group'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchExpenses();
    }
  }, [status]);

  const fetchExpenses = async () => {
    try {
      setError(null);
      const response = await fetch('/api/expenses');
      
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      
      const data = await response.json();
      setExpenses(data);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const filterExpenses = useCallback(() => {
    let filtered = expenses;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.group?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (typeFilter === 'personal') {
      filtered = filtered.filter(expense => expense.groupId === null);
    } else if (typeFilter === 'group') {
      filtered = filtered.filter(expense => expense.groupId !== null);
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(expense => expense.category === categoryFilter);
    }

    setFilteredExpenses(filtered);
  }, [expenses, searchTerm, typeFilter, categoryFilter]);

  useEffect(() => {
    filterExpenses();
  }, [filterExpenses]);

  const getUniqueCategories = () => {
    const categories = expenses
      .map(expense => expense.category)
      .filter(Boolean) as string[];
    return [...new Set(categories)];
  };

  const getUserSplit = (expense: Expense) => {
    if (!session?.user?.id) return null;
    return expense.splits.find(split => split.userId === session.user.id);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoaderFive text="Loading expenses..." />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Expenses</h1>
          <p className="text-muted-foreground">
            Manage all your personal and group expenses
          </p>
        </div>
        <Link href="/dashboard/expenses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={typeFilter} onValueChange={(value: 'all' | 'personal' | 'group') => setTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Expenses</SelectItem>
                  <SelectItem value="personal">Personal Only</SelectItem>
                  <SelectItem value="group">Group Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {getUniqueCategories().map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Expenses ({filteredExpenses.length})
          </CardTitle>
          <CardDescription>
            {typeFilter === 'all' && 'All your expenses across personal and group accounts'}
            {typeFilter === 'personal' && 'Your personal expenses'}
            {typeFilter === 'group' && 'Your group expenses'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-center text-destructive p-4 border border-destructive/20 rounded-lg mb-4">
              {error}
            </div>
          )}

          {filteredExpenses.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No expenses found</h3>
              <p className="mb-4">
                {searchTerm || typeFilter !== 'all' || categoryFilter !== 'all'
                  ? "Try adjusting your filters to see more expenses."
                  : "Start by adding your first expense."}
              </p>
              <Link href="/dashboard/expenses/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Expense
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map((expense) => {
                const userSplit = getUserSplit(expense);
                const isPersonal = expense.groupId === null;
                
                return (
                  <div 
                    key={expense.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {isPersonal ? (
                            <User className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Users className="h-4 w-4 text-green-600" />
                          )}
                          <h4 className="font-medium">{expense.description}</h4>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {expense.category && (
                            <Badge variant="secondary" className="text-xs">
                              {expense.category}
                            </Badge>
                          )}
                          <Badge variant={isPersonal ? "default" : "outline"} className="text-xs">
                            {isPersonal ? "Personal" : expense.group?.name}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(expense.date).toLocaleDateString()}
                        </div>
                        <div>
                          Paid by {expense.paidBy.name}
                        </div>
                        {!isPersonal && (
                          <div>
                            Split: {expense.splitType.toLowerCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        ${expense.amount.toFixed(2)}
                      </div>
                      {userSplit && userSplit.amountOwed !== expense.amount && (
                        <div className="text-sm text-muted-foreground">
                          Your share: ${userSplit.amountOwed.toFixed(2)}
                        </div>
                      )}
                      {expense.paidBy.id === session?.user?.id && !isPersonal && (
                        <Badge variant="outline" className="text-xs mt-1">
                          You paid
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {filteredExpenses.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Your Share</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${filteredExpenses.reduce((sum, exp) => {
                  const userSplit = getUserSplit(exp);
                  return sum + (userSplit?.amountOwed || 0);
                }, 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">You Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${filteredExpenses
                  .filter(exp => exp.paidBy.id === session?.user?.id)
                  .reduce((sum, exp) => sum + exp.amount, 0)
                  .toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
