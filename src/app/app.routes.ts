import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../layout/app-shell/app-shell.component').then(m => m.AppShellComponent),
    children: [
      {
        path: '',
        loadComponent: async () => import('../components/landing-page/landing-page').then(m => m.LandingPage),
      }, {
        path: 'menu',
        loadComponent: async () => import('../components/menu-page/menu-page').then(m => m.MenuPage)
      }, {
        path: 'cart',
        loadComponent: async () => import('../components/cart/cart').then(m => m.Cart)
      }
    ]
  },
  {
    path: 'qr',
    loadComponent: () => import('../components/order-init/order-init').then(m => m.OrderInitComponent)
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: ''
  }
];
