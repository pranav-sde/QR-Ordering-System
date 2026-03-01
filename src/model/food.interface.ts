export interface foodInterface {
  id: string;
  name: string;
  image: string;
  description?: string;
  veg: boolean;
  quantity: number;
  price: number;
  variants?: any[];
  addons?: any[];
  mealType?: string;
  cuisine?: string;
  rating?: number;
  reviewCount?: number;
}
