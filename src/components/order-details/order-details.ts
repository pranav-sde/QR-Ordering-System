import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../services/order/order.service';
import { CheckoutResponse, OrderStatus } from '../../model/cart.model';
import { interval, Subscription, switchMap } from 'rxjs';

@Component({
    selector: 'app-order-details',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './order-details.html',
    styleUrls: ['./order-details.css']
})
export class OrderDetailsComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private orderService = inject(OrderService);
    private pollingSubscription?: Subscription;

    public order = signal<CheckoutResponse | null>(null);
    public loading = signal(true);
    public error = signal<string | null>(null);

    public OrderStatus = OrderStatus;

    ngOnInit() {
        this.startPolling();
    }

    startPolling() {
        const orderId = this.route.snapshot.paramMap.get('id');
        if (!orderId) {
            this.error.set('No order ID provided.');
            this.loading.set(false);
            return;
        }

        // Initial fetch
        this.fetchOrder(orderId);

        // Polling every 5 seconds
        this.pollingSubscription = interval(5000)
            .pipe(
                switchMap(() => this.orderService.getOrder(orderId))
            )
            .subscribe({
                next: (fetchedOrder) => {
                    if (fetchedOrder) {
                        this.order.set(fetchedOrder);
                        // Stop polling if finalized
                        if (fetchedOrder.status === OrderStatus.SERVED || fetchedOrder.status === OrderStatus.CANCELLED) {
                            this.pollingSubscription?.unsubscribe();
                        }
                    }
                },
                error: (err) => {
                    console.error('Polling error:', err);
                }
            });
    }

    fetchOrder(orderId: string) {
        this.orderService.getOrder(orderId).subscribe({
            next: (fetchedOrder) => {
                if (fetchedOrder) {
                    this.order.set(fetchedOrder);
                } else {
                    this.error.set('Order not found.');
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to fetch order details:', err);
                this.error.set('Could not load order details. Please refresh or check back later.');
                this.loading.set(false);
            }
        });
    }

    ngOnDestroy() {
        if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
        }
    }

    getStatusIcon(status: OrderStatus): string {
        switch (status) {
            case OrderStatus.PENDING: return 'hourglass_empty';
            case OrderStatus.PREPARING: return 'restaurant';
            case OrderStatus.READY: return 'check_circle';
            case OrderStatus.SERVED: return 'done_all';
            case OrderStatus.CANCELLED: return 'cancel';
            default: return 'help';
        }
    }

    getStatusClass(status: OrderStatus): string {
        return status.toLowerCase();
    }
}
