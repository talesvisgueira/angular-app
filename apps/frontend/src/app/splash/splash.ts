import { HttpClient } from '@angular/common/http';
import { Component, InjectionToken, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import type { HasUsersResponse } from '@monorepo/shared';
import { SYSTEM_COPYRIGHT, SYSTEM_LOGO_PATH, SYSTEM_NAME } from '../app-info';
import { SessionStore } from '../session/session-store';

/** Tempo de exibição da splash antes de seguir para a próxima rota. */
export const SPLASH_DURATION_MS = new InjectionToken<number>('SPLASH_DURATION_MS', {
  factory: () => 3000,
});

/**
 * Tela de abertura do sistema: exibe a arte de splash por um curto período e
 * então direciona para `/main` (sessão ativa), para `/signup` (sem usuários
 * cadastrados) ou para `/login`.
 */
@Component({
  selector: 'app-splash',
  templateUrl: './splash.html',
  styleUrl: './splash.scss',
})
export class Splash implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly sessionStore = inject(SessionStore);
  private readonly durationMs = inject(SPLASH_DURATION_MS);

  protected readonly systemName = SYSTEM_NAME;
  protected readonly logoPath = SYSTEM_LOGO_PATH;
  protected readonly copyright = SYSTEM_COPYRIGHT;
  protected readonly splashImagePath = '/splash.svg';

  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.timer = setTimeout(() => this.finish(), this.durationMs);
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private finish(): void {
    this.clearTimer();

    if (this.sessionStore.hasValidSession()) {
      void this.router.navigate(['/main']);
      return;
    }

    // Sem sessão: a existência de usuários decide entre cadastro inicial e login.
    this.http.get<HasUsersResponse>('/api/auth/has-users').subscribe({
      next: (response) => void this.router.navigate([response.hasUsers ? '/login' : '/signup']),
      error: () => void this.router.navigate(['/login']),
    });
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
