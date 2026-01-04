import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('../components/signup/signup').then(m => m.Signup)
  }, {
  path: 'login',
    pathMatch: 'full',
    loadComponent: () => import('../components/login/login').then(m => m.Login)
  },
  {
    path: 'home',
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
    path: '**',
    pathMatch: 'full',
    redirectTo: ''
  }
];
