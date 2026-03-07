import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../state/app.state';
import { selectCart } from '../../state/cart/cart.selector';
import { AsyncPipe } from '@angular/common';
import { CartService } from '../../services/cart/cart.service';
import { CustomerService } from '../../services/customer/customer.service';
import * as CartActions from '../../state/cart/cart.actions';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './cart.html',
})
export class Cart implements OnInit {
  private store = inject<Store<AppState>>(Store);
  private cartService = inject(CartService);
  private customerService = inject(CustomerService);

  public cart$ = this.store.select(selectCart);
  public foodItemLength: WritableSignal<any> = signal(0);

  private restaurantId = localStorage.getItem('restaurant_id') || '101';

  ngOnInit() {
    this.loadCart();
  }

  loadCart() {
    const sessionId = this.customerService.getSessionToken();
    if (sessionId) {
      this.cartService.getCart(parseInt(this.restaurantId), sessionId).subscribe({
        next: (cart) => {
          console.log('Cart loaded successfully:', cart);
          this.store.dispatch(CartActions.loadCartSuccess({ cart }));
        },
        error: (err) => {
          console.error('Error loading cart:', err);
          alert('Failed to load cart. Ensure Cart Service is running.');
        }
      });
    }
  }

  updateQuantity(item: any, delta: number) {
    const sessionId = this.customerService.getSessionToken();
    const newQuantity = item.quantity + delta;

    if (newQuantity <= 0) {
      this.removeItem(item);
      return;
    }

    if (sessionId && item.cartItemId) {
      this.cartService.updateItemQuantity(item.cartItemId, {
        restaurantId: parseInt(this.restaurantId),
        sessionId: sessionId,
        quantity: newQuantity
      }).subscribe({
        next: (cart) => {
          console.log('Quantity updated successfully:', cart);
          this.store.dispatch(CartActions.loadCartSuccess({ cart }));
        },
        error: (err) => {
          console.error('Error updating quantity:', err);
          alert('Failed to update quantity.');
        }
      });
    }
  }

  removeItem(item: any) {
    const sessionId = this.customerService.getSessionToken();
    if (sessionId && item.cartItemId) {
      this.cartService.removeItem(item.cartItemId, parseInt(this.restaurantId), sessionId).subscribe({
        next: (cart) => {
          console.log('Item removed successfully. Updated cart:', cart);
          this.store.dispatch(CartActions.loadCartSuccess({ cart }));
        },
        error: (err) => {
          console.error('Error removing item:', err);
          alert('Failed to remove item.');
        }
      });
    }
  }


  checkout() {
    const sessionId = this.customerService.getSessionToken();
    if (sessionId) {
      this.cartService.checkout({
        restaurantId: parseInt(this.restaurantId),
        sessionId: sessionId
      }).subscribe({
        next: (res) => {
          alert('Order placed successfully!');
          this.store.dispatch(CartActions.loadCartSuccess({ cart: null as any }));
        },
        error: (err) => console.error('Checkout failed:', err)
      });
    }
  }
}
