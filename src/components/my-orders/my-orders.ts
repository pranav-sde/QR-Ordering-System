import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../services/order/order.service';
import { CheckoutResponse, OrderStatus } from '../../model/cart.model';

@Component({
    selector: 'app-my-orders',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './my-orders.html',
    styleUrls: ['./my-orders.css']
})
export class MyOrdersComponent implements OnInit {
    private orderService = inject(OrderService);
    
    public orders = signal<CheckoutResponse[]>([]);
    public loading = signal(true);
    public error = signal<string | null>(null);
    public OrderStatus = OrderStatus;

    ngOnInit() {
        this.fetchMyOrders();
    }

    fetchMyOrders() {
        this.loading.set(true);
        const restaurantIdStr = localStorage.getItem('restaurant_id') || '101';
        const restaurantId = parseInt(restaurantIdStr);
        const tableId = localStorage.getItem('table_id');
        const tableNumber = tableId ? parseInt(tableId) : 3;

        this.orderService.getMyOrders(restaurantId, tableNumber).subscribe({
            next: (data) => {
                this.orders.set(data || []);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error fetching orders:', err);
                this.error.set('Failed to load your orders.');
                this.loading.set(false);
            }
        });
    }
}
