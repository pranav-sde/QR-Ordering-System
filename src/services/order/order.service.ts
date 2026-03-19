import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment/env';
import { Observable } from 'rxjs';
import { CheckoutResponse } from '../../model/cart.model';
import { CustomerService } from '../customer/customer.service';

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private http = inject(HttpClient);
    private customerService = inject(CustomerService);
    private orderUrl = environment.orderUrl;

    getOrder(orderId: string): Observable<CheckoutResponse> {
        const sessionId = this.customerService.getSessionToken();
        const headers = new HttpHeaders().set('sessionId', sessionId || '');
        return this.http.get<CheckoutResponse>(`${this.orderUrl}/order/${orderId}`, { headers });
    }

    getMyOrders(restaurantId: number, tableNumber: number): Observable<CheckoutResponse[]> {
        const sessionId = this.customerService.getSessionToken();
        const headers = new HttpHeaders().set('sessionId', sessionId || '');
        return this.http.get<CheckoutResponse[]>(`${this.orderUrl}/order/my?restaurantId=${restaurantId}&tableNumber=${tableNumber}`, { headers });
    }
}
