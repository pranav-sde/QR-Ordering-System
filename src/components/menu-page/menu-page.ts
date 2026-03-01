import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  WritableSignal,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FoodItemService } from '../../shared/services/foodItems/food-item.service';
import { FoodItem } from '../../shared/food-item/food-item';
import { foodInterface } from '../../model/food.interface';
import { Store } from '@ngrx/store';
import { AppState } from '../../state/app.state';
import { addToCart } from '../../state/cart/cart.actions';
import { Router } from '@angular/router';
import { UicartService } from '../../shared/services/uicart/uicart.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [
    FoodItem,
    CommonModule
  ],
  templateUrl: './menu-page.html',
  styleUrl: './menu-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuPage implements OnInit, OnDestroy {

  private foodApi = inject(FoodItemService);
  private uiCart = inject(UicartService);
  private destroyRef = inject(DestroyRef);

  foodItem: WritableSignal<foodInterface[]> = signal<foodInterface[]>([]);
  isLoading: WritableSignal<boolean> = signal(true);
  hasError: WritableSignal<boolean> = signal(false);
  searchTerm: WritableSignal<string> = signal('');

  categories = signal<any[]>([]);
  selectedCategoryId = signal<string | number | null>(null);
  private restaurantId = localStorage.getItem('restaurant_id') || '101';

  private store = inject<Store<AppState>>(Store);
  private router = inject(Router);

  constructor() {
    // Re-fetch items whenever category changes
    effect(() => {
      const catId = this.selectedCategoryId();
      this.loadFoodItems(catId);
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.uiCart.setShowCart(true);
    this.loadCategories();
  }

  loadCategories() {
    this.foodApi.getCategories(this.restaurantId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.categories.set(data);
        if (data.length > 0 && !this.selectedCategoryId()) {
          this.selectedCategoryId.set(data[0].categoryId);
        }
      },
      error: (err) => console.error('Error fetching categories:', err)
    });
  }

  loadFoodItems(categoryId: string | number | null) {
    this.isLoading.set(true);
    this.foodApi.getFoodItems(this.restaurantId, categoryId || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.foodItem.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error fetching food items:', err);
          this.hasError.set(true);
          this.isLoading.set(false);
        }
      });
  }

  selectCategory(id: string | number) {
    this.selectedCategoryId.set(id);
  }

  filteredFoodItems = computed<foodInterface[]>(() =>
    this.foodItem().filter(item =>
      item.name.toLowerCase().includes(this.searchTerm())
    )
  )

  searchMenu(event: any) {
    this.searchTerm.set(event.target.value.toLowerCase());
  }

  addItemToCart(product: foodInterface) {
    this.store.dispatch(addToCart({ product }));
  }

  ngOnDestroy() {
    this.uiCart.setShowCart(false);
  }
}
