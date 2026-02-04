'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Plus, 
  Receipt, 
  DollarSign, 
  Calendar, 
  User,
  Users,
  ArrowLeft,
  Loader2,
  Upload,
  Camera,
  X,
  CheckCircle
} from "lucide-react";
import { LoaderFive } from "@/components/ui/loader";
import Link from "next/link";
import { toast } from "sonner";
import Image from 'next/image';

interface Group {
  id: string;
  name: string;
  description: string | null;
}

interface ExpenseFormData {
  description: string;
  amount: string;
  category: string;
  date: string;
  expenseType: 'personal' | 'group';
  groupId: string;
}

interface ReceiptData {
  extractedText: string;
  detectedPrice: number;
  confidence: number;
  description: string;
  merchantName: string;
  date: string;
  items: Array<{
    name: string;
    price: number;
  }>;
  fileName?: string;
  message?: string;
  success?: boolean;
  requiresClientOCR?: boolean;
}

const AddExpensePage = () => {
  const { status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    expenseType: 'personal',
    groupId: ''
  });
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Receipt upload states
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [processingStep, setProcessingStep] = useState<string>('');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchGroups();
    }
  }, [status]);

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ExpenseFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Reset groupId when switching to personal
    if (field === 'expenseType' && value === 'personal') {
      setFormData(prev => ({
        ...prev,
        groupId: ''
      }));
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processReceipt = async () => {
    if (!uploadedImage) return;

    setIsProcessingReceipt(true);
    setProcessingStep('Uploading image...');
    setError(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('receipt', uploadedImage);

      setProcessingStep('Processing with server-side OCR...');
      
      const response = await fetch('/api/receipts/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process receipt');
      }

      setProcessingStep('Analyzing with AI...');
      
      const data: ReceiptData = await response.json();

      // Show server message
      if (data.message) {
        toast.success(data.message);
      }

      setReceiptData(data);
      setProcessingStep('Complete!');
      
      // Auto-fill form if we have results
      if (data.detectedPrice && data.confidence > 0.7) {
        handleInputChange('amount', data.detectedPrice.toString());
        toast.success(`Price detected: $${data.detectedPrice.toFixed(2)} (${Math.round(data.confidence * 100)}% confidence)`);
        
        if (data.description && data.description !== 'Purchase from receipt') {
          handleInputChange('description', data.description);
          toast.success(`Description auto-filled: "${data.description}"`);
        }
      } else if (data.detectedPrice && data.detectedPrice > 0) {
        const confidencePercent = Math.round(data.confidence * 100);
        toast.info(`Suggested: $${data.detectedPrice.toFixed(2)} (${confidencePercent}% confidence)`, {
          action: {
            label: "Use",
            onClick: () => {
              handleInputChange('amount', data.detectedPrice.toString());
              if (data.description && data.description !== 'Purchase from receipt') {
                handleInputChange('description', data.description);
              }
            }
          }
        });
      } else if (data.extractedText) {
        toast.info('Receipt processed successfully, but no clear price was detected');
      } else {
        toast.warning('Receipt uploaded but OCR processing failed');
      }

    } catch (err) {
      console.error('Error processing receipt:', err);
      setError('Failed to process receipt. Please try again or enter details manually.');
      toast.error('Failed to process receipt. Please try again.');
    } finally {
      setIsProcessingReceipt(false);
      setProcessingStep('');
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setReceiptData(null);
    setProcessingStep('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate form
      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }
      
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error('Please enter a valid amount');
      }

      if (formData.expenseType === 'group' && !formData.groupId) {
        throw new Error('Please select a group');
      }

      const expenseData = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        category: formData.category || null,
        date: formData.date,
        splitType: 'EQUAL',
        groupId: formData.expenseType === 'group' ? formData.groupId : null,
        splits: [] // Will be handled by the API for personal expenses
      };

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create expense');
      }

      // Success - redirect to expenses page
      router.push('/dashboard/expenses');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoaderFive text="Loading..." />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard/expenses">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Expenses
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold">Add New Expense</h1>
        <p className="text-muted-foreground">
          Add a personal expense or group expense
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Expense Details
          </CardTitle>
          <CardDescription>
            Fill in the details for your new expense
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Expense Type Selection */}
            <div className="space-y-4">
              <Label>Expense Type</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleInputChange('expenseType', 'personal')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    formData.expenseType === 'personal'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <User className="h-5 w-5" />
                    <span className="font-medium">Personal Expense</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Track your individual expenses
                  </p>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleInputChange('expenseType', 'group')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    formData.expenseType === 'group'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="h-5 w-5" />
                    <span className="font-medium">Group Expense</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Split expenses with group members
                  </p>
                </button>
              </div>
            </div>

            {/* Group Selection (only for group expenses) */}
            {formData.expenseType === 'group' && (
              <div className="space-y-2">
                <Label htmlFor="group">Select Group</Label>
                <Select
                  value={formData.groupId}
                  onValueChange={(value) => handleInputChange('groupId', value)}
                  required={formData.expenseType === 'group'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {groups.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No groups found. <Link href="/dashboard/groups" className="text-primary underline">Create a group first</Link>.
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Description */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Description
                </Label>
                <Input
                  id="description"
                  placeholder="e.g., Lunch at cafe, Grocery shopping"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  required
                />
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  required
                />
              </div>

              {/* Receipt Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Receipt (Optional)
                </Label>
                
                {!uploadedImage ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload receipt to auto-detect price
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Choose Image
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Image Preview */}
                    <div className="relative border rounded-lg p-2">
                      <div className="flex items-center gap-3">
                        {imagePreview && (
                          <Image
                            src={imagePreview}
                            alt="Receipt preview"
                            className="w-16 h-16 object-cover rounded"
                            width={100}
                            height={100}
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">
                            {uploadedImage.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(uploadedImage.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeImage}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Process Button */}
                    {!receiptData && (
                      <Button
                        type="button"
                        onClick={processReceipt}
                        disabled={isProcessingReceipt}
                        size="sm"
                        className="w-full"
                      >
                        {isProcessingReceipt ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {processingStep || 'Processing Receipt...'}
                          </>
                        ) : (
                          <>
                            <Camera className="mr-2 h-4 w-4" />
                            Extract Price from Receipt
                          </>
                        )}
                      </Button>
                    )}

                    {/* Receipt Data Display */}
                    {receiptData && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Receipt Analysis Complete
                          </span>
                        </div>
                        
                        {receiptData.detectedPrice > 0 && (
                          <div className="text-sm text-green-700">
                            <div className="flex justify-between items-center">
                              <span>Detected Price:</span>
                              <span className="font-medium">${receiptData.detectedPrice.toFixed(2)}</span>
                            </div>
                            {receiptData.confidence && (
                              <div className="text-xs text-green-600 mt-1">
                                Confidence: {Math.round(receiptData.confidence * 100)}%
                              </div>
                            )}
                          </div>
                        )}

                        {receiptData.description && receiptData.description !== 'Purchase from receipt' && (
                          <div className="text-sm text-green-700">
                            <div className="flex justify-between items-start">
                              <span>Description:</span>
                              <span className="font-medium text-right max-w-[200px] text-wrap">
                                {receiptData.description}
                              </span>
                            </div>
                          </div>
                        )}

                        {receiptData.merchantName && (
                          <div className="text-sm text-green-700">
                            <div className="flex justify-between items-center">
                              <span>Merchant:</span>
                              <span className="font-medium">{receiptData.merchantName}</span>
                            </div>
                          </div>
                        )}

                        {receiptData.date && (
                          <div className="text-sm text-green-700">
                            <div className="flex justify-between items-center">
                              <span>Receipt Date:</span>
                              <span className="font-medium">{receiptData.date}</span>
                            </div>
                          </div>
                        )}

                        {receiptData.items && receiptData.items.length > 0 && (
                          <div className="text-sm text-green-700">
                            <div className="mb-1 font-medium">Items:</div>
                            <div className="max-h-20 overflow-y-auto space-y-1">
                              {receiptData.items.slice(0, 3).map((item, index) => (
                                <div key={index} className="flex justify-between text-xs">
                                  <span className="truncate max-w-[120px]">{item.name}</span>
                                  <span>${item.price.toFixed(2)}</span>
                                </div>
                              ))}
                              {receiptData.items.length > 3 && (
                                <div className="text-xs text-green-600">
                                  +{receiptData.items.length - 3} more items...
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (receiptData.detectedPrice > 0) {
                              handleInputChange('amount', receiptData.detectedPrice.toString());
                            }
                            if (receiptData.description && receiptData.description !== 'Purchase from receipt') {
                              handleInputChange('description', receiptData.description);
                            }
                            if (receiptData.date) {
                              handleInputChange('date', receiptData.date);
                            }
                            toast.success('Receipt data applied to form');
                          }}
                          className="w-full mt-2"
                        >
                          Apply All Data to Form
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="category">Category (Optional)</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Food & Dining</SelectItem>
                    <SelectItem value="transport">Transportation</SelectItem>
                    <SelectItem value="accommodation">Accommodation</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="shopping">Shopping</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4">
              <Link href="/dashboard/expenses">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Expense
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h3 className="font-medium">What&apos;s the difference?</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex gap-3">
                <User className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Personal Expense</p>
                  <p className="text-xs text-muted-foreground">
                    Track your individual spending without splitting with others
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Users className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Group Expense</p>
                  <p className="text-xs text-muted-foreground">
                    Share expenses with group members and track splits
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddExpensePage;
