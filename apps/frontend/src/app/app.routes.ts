import { Routes } from '@angular/router';
import { authGuard } from './session/auth-guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./login/login').then((m) => m.Login) },
  {
    path: 'main',
    canActivate: [authGuard],
    loadComponent: () => import('./main/main').then((m) => m.Main),
  },
  { path: '', redirectTo: 'main', pathMatch: 'full' },
];
