import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { PaymentService } from '../../services/payment/payment.service';
import { OrderService } from '../../services/order/order.service';
import { OrderTrackingService } from '../../services/order-tracking.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-payment-selection',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-selection.html',
  styleUrl: './payment-selection.css'
})
export class PaymentSelection implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private paymentService = inject(PaymentService);
  private orderService = inject(OrderService);
  private orderTrackingService = inject(OrderTrackingService);

  public orderId = signal<string | null>(null);
  public isProcessing = signal(false);
  public error = signal<string | null>(null);
  public paymentStatus = signal<'idle' | 'creating' | 'paying' | 'verifying' | 'success' | 'failed' | 'cancelled'>('idle');

  // State from navigation
  public totalAmount = 0;
  public customerName = '';

  ngOnInit() {
    this.orderId.set(this.route.snapshot.paramMap.get('id'));
    
    // Get state from navigation
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state) {
      this.totalAmount = nav.extras.state['totalAmount'] || 0;
      this.customerName = nav.extras.state['customerName'] || localStorage.getItem('user_name') || 'Guest';
    } else {
      // Fallback
      this.customerName = localStorage.getItem('user_name') || 'Guest';
    }
  }

  async selectCOD() {
    if (!this.orderId()) return;
    
    this.isProcessing.set(true);
    this.error.set(null);
    
    try {
      await firstValueFrom(this.orderService.selectCOD(this.orderId()!));
      
      // Start tracking and navigate
      this.orderTrackingService.startTracking(this.orderId()!, { orderId: this.orderId()!, status: 'PENDING' as any, totalAmount: this.totalAmount } as any);
      this.router.navigate(['/orders']);
    } catch (err: any) {
      this.isProcessing.set(false);
      this.error.set(err.error?.message || 'Failed to select Cash On Delivery. Please try again.');
    }
  }

  async payWithRazorpay() {
    if (!this.orderId()) return;

    this.isProcessing.set(true);
    this.error.set(null);
    
    let razorpayOrderId = '';

    try {
      // Step 1: Create Razorpay order
      this.paymentStatus.set('creating');
      const orderResponse = await firstValueFrom(
        this.paymentService.createOrder(this.orderId()!, this.totalAmount)
      );
      razorpayOrderId = orderResponse.razorpayOrderId;

      // Step 2: Open Razorpay checkout modal
      this.paymentStatus.set('paying');
      const paymentResponse = await this.paymentService.openCheckoutModal({
        keyId: orderResponse.keyId,
        amount: orderResponse.amount,
        razorpayOrderId: orderResponse.razorpayOrderId,
        customerName: this.customerName,
        description: `Order #${this.orderId()!.substring(0, 8)}`
      });

      // Step 3: Verify payment signature
      this.paymentStatus.set('verifying');
      await firstValueFrom(
        this.paymentService.verifyPayment({
          razorpayOrderId: paymentResponse.razorpay_order_id,
          razorpayPaymentId: paymentResponse.razorpay_payment_id,
          razorpaySignature: paymentResponse.razorpay_signature
        })
      );

      // Payment verified successfully
      this.paymentStatus.set('success');
      this.orderTrackingService.startTracking(this.orderId()!, { orderId: this.orderId()!, status: 'PENDING' as any, totalAmount: this.totalAmount } as any);
      this.router.navigate(['/orders']);

    } catch (err: any) {
      if (err?.message === 'PAYMENT_CANCELLED') {
        this.paymentStatus.set('cancelled');
        if (razorpayOrderId) {
          this.paymentService.cancelPayment(razorpayOrderId).subscribe();
        }
        this.error.set('Payment was cancelled. You can try again or choose Cash On Delivery.');
      } else {
        this.paymentStatus.set('failed');
        console.error('Payment failed:', err);
        if (razorpayOrderId) {
          this.paymentService.cancelPayment(razorpayOrderId).subscribe();
        }
        this.error.set(err?.message || 'Payment failed. Please try again or choose Cash On Delivery.');
      }
    } finally {
      this.isProcessing.set(false);
    }
  }
}
