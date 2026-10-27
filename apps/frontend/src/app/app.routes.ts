import { Routes } from '@angular/router';
import { authGuard } from './session/auth-guard';

export const routes: Routes = [
  {
    path: 'splash',
    loadComponent: () => import('./splash/splash').then((m) => m.Splash),
  },
  { path: 'login', loadComponent: () => import('./login/login').then((m) => m.Login) },
  {
    path: 'signup',
    loadComponent: () => import('./signup/signup').then((m) => m.Signup),
  },
  {
    path: 'main',
    canActivate: [authGuard],
    loadComponent: () => import('./main/main').then((m) => m.Main),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./admin/admin').then((m) => m.Admin),
  },
  {
    path: 'help',
    canActivate: [authGuard],
    loadComponent: () => import('./help/help').then((m) => m.Help),
  },
  { path: '', redirectTo: 'splash', pathMatch: 'full' },
];
