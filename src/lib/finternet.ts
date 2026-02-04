/**
 * Finternet Payment Gateway Integration
 * Complete integration with Cooper database schema
 */

export interface FinternetConfig {
  apiKey: string;
  baseUrl: string;
  environment: 'test' | 'live' | 'hackathon';
}

export interface PaymentIntentData {
  id: string;
  object: string;
  status: 'INITIATED' | 'PROCESSING' | 'SUCCEEDED' | 'SETTLED' | 'FINAL' | 'FAILED';
  data: {
    paymentUrl: string;
    amount: string;
    currency: string;
    estimatedFee: string;
    estimatedDeliveryTime: string;
  };
}

export interface CreatePaymentIntentRequest {
  amount: string;
  currency: string;
  type: 'CONDITIONAL' | 'DELIVERY_VS_PAYMENT';
  settlementMethod: string;
  settlementDestination: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface MilestoneData {
  id: string;
  milestoneIndex: number;
  amount: string;
  description: string;
  percentage: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
}

export interface DeliveryProofData {
  proofHash: string;
  proofURI: string;
  submittedBy: string;
}

export class FinternetClient {
  private config: FinternetConfig;

  constructor(config: FinternetConfig) {
    this.config = config;
  }

  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-API-Key': this.config.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API request failed: ${response.status}`);
    }

    return response.json();
  }

  // Basic Payment Intent Operations
  async createPaymentIntent(data: CreatePaymentIntentRequest): Promise<PaymentIntentData> {
    return this.apiRequest<PaymentIntentData>('/payment-intents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPaymentIntent(intentId: string): Promise<PaymentIntentData> {
    return this.apiRequest<PaymentIntentData>(`/payment-intents/${intentId}`);
  }

  // Milestone Operations
  async createMilestone(
    intentId: string,
    milestone: {
      milestoneIndex: number;
      amount: string;
      description: string;
      percentage: number;
    }
  ): Promise<MilestoneData> {
    return this.apiRequest<MilestoneData>(
      `/payment-intents/${intentId}/escrow/milestones`,
      {
        method: 'POST',
        body: JSON.stringify(milestone),
      }
    );
  }

  async completeMilestone(
    intentId: string,
    milestoneId: string,
    completionData: {
      completedBy: string;
      completionProof: string;
    }
  ): Promise<any> {
    return this.apiRequest(
      `/payment-intents/${intentId}/escrow/milestones/${milestoneId}/complete`,
      {
        method: 'POST',
        body: JSON.stringify(completionData),
      }
    );
  }

  // Delivery vs Payment Operations
  async submitDeliveryProof(
    intentId: string,
    proofData: DeliveryProofData
  ): Promise<any> {
    return this.apiRequest(
      `/payment-intents/${intentId}/escrow/delivery-proof`,
      {
        method: 'POST',
        body: JSON.stringify(proofData),
      }
    );
  }

  // Conditional Payment Operations
  async getConditionalPayment(intentId: string): Promise<any> {
    return this.apiRequest(`/payment-intents/${intentId}/conditional-payment`);
  }

  // Utility Methods
  generateDeliveryProof(trackingNumber: string, deliveredAt: string): string {
    const deliveryData = {
      trackingNumber,
      deliveredAt,
      timestamp: Date.now(),
    };

    return '0x' + Buffer.from(JSON.stringify(deliveryData))
      .toString('hex')
      .padStart(64, '0');
  }

  async pollPaymentStatus(
    intentId: string,
    onStatusChange?: (status: string) => void,
    maxAttempts: number = 60,
    intervalMs: number = 5000
  ): Promise<PaymentIntentData> {
    let attempts = 0;
    
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const intent = await this.getPaymentIntent(intentId);
          
          if (onStatusChange) {
            onStatusChange(intent.data.status);
          }

          if (intent.data.status === 'SUCCEEDED' || intent.data.status === 'FINAL') {
            resolve(intent);
            return;
          }

          if (intent.data.status === 'FAILED') {
            reject(new Error('Payment failed'));
            return;
          }

          attempts++;
          if (attempts >= maxAttempts) {
            reject(new Error('Payment polling timeout'));
            return;
          }

          setTimeout(poll, intervalMs);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}

// Default client instance
export const finternetClient = new FinternetClient({
  apiKey: process.env.FINTERNET_API_KEY || '',
  baseUrl: process.env.FINTERNET_BASE_URL || 'https://api.fmm.finternetlab.io/api/v1',
  environment: (process.env.FINTERNET_ENVIRONMENT as any) || 'test',
});