/**
 * Payment-related request/response interfaces for the Razorpay integration.
 */

export interface CreateOrderRequest {
  orderId: string;
  amount: number;
}

export interface CreateOrderResponse {
  razorpayOrderId: string;
  amount: number;
  keyId: string;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResponse {
  status: string;
  message?: string;
}

export type PaymentStatus = 'idle' | 'creating' | 'paying' | 'verifying' | 'success' | 'failed' | 'cancelled';
