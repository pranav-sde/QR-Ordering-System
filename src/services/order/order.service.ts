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
        // API Gateway securely injects X-User-Id, so no manual headers needed!
        return this.http.get<CheckoutResponse>(`${this.orderUrl}/order/${orderId}`);
    }

    getMyOrders(): Observable<CheckoutResponse[]> {
        // API Gateway securely injects X-Restaurant-Id and X-Table-No headers!
        return this.http.get<CheckoutResponse[]>(`${this.orderUrl}/order/my`);
    }
}
