import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environment/env';
import {
    CreateOrderRequest,
    CreateOrderResponse,
    VerifyPaymentRequest,
    VerifyPaymentResponse
} from '../../model/payment.model';
import { base64Logo } from './logo-base64';

@Injectable({
    providedIn: 'root'
})
export class PaymentService {
    private http = inject(HttpClient);
    private paymentUrl = environment.paymentUrl;

    /**
     * Creates a Razorpay order on the backend.
     * The backend looks up the order amount from the orderId.
     */
    createOrder(orderId: string, amount: number): Observable<CreateOrderResponse> {
        const body: CreateOrderRequest = { orderId, amount };
        return this.http.post<CreateOrderResponse>(`${this.paymentUrl}/create-order`, body);
    }

    /**
     * Verifies the Razorpay payment signature on the backend.
     */
    verifyPayment(request: VerifyPaymentRequest): Observable<VerifyPaymentResponse> {
        return this.http.post<VerifyPaymentResponse>(`${this.paymentUrl}/verify-payment`, request);
    }

    /**
     * Marks a Razorpay order as cancelled on the backend.
     */
    cancelPayment(razorpayOrderId: string): Observable<any> {
        return this.http.post(`${this.paymentUrl}/cancel`, { razorpayOrderId });
    }

    /**
     * Opens the Razorpay checkout modal and returns a Promise that
     * resolves with the payment response or rejects on dismiss/failure.
     */
    openCheckoutModal(options: {
        keyId: string;
        amount: number;
        razorpayOrderId: string;
        customerName?: string;
        description?: string;
    }): Promise<RazorpayPaymentResponse> {
        return new Promise((resolve, reject) => {
            if (typeof Razorpay === 'undefined') {
                reject(new Error('Razorpay SDK not loaded. Please check your internet connection.'));
                return;
            }

            const rzp = new Razorpay({
                key: options.keyId,
                amount: options.amount,
                currency: 'INR',
                name: 'DineSphere',
                description: options.description || 'Food Order Payment',
                image: base64Logo,
                order_id: options.razorpayOrderId,
                prefill: {
                    name: options.customerName || ''
                },
                theme: {
                    color: '#090A0F'
                },
                modal: {
                    escape: false,
                    confirm_close: true,
                    ondismiss: () => {
                        reject(new Error('PAYMENT_CANCELLED'));
                    }
                },
                handler: (response: RazorpayPaymentResponse) => {
                    resolve(response);
                }
            });

            rzp.on('payment.failed', (response: any) => {
                reject(new Error(response?.error?.description || 'Payment failed. Please try again.'));
            });

            rzp.open();
        });
    }
}
