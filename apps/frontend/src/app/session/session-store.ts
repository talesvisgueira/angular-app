import { Injectable, computed, signal } from '@angular/core';
import type { LoginResponse } from '@monorepo/shared';

const SESSION_STORAGE_KEY = 'app.session';

/**
 * Guarda a sessão do usuário autenticado (`token` + `user`) em memória via
 * signal e espelha em `sessionStorage` para sobreviver a refresh na mesma aba.
 * Se o storage estiver indisponível, a sessão funciona apenas em memória.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly session = signal<LoginResponse | null>(this.readStoredSession());

  readonly user = computed(() => this.session()?.user ?? null);

  readonly isAuthenticated = computed(() => this.session() !== null);

  set(response: LoginResponse): void {
    this.session.set(response);
    this.writeStoredSession(response);
  }

  clear(): void {
    this.session.set(null);
    this.removeStoredSession();
  }

  private readStoredSession(): LoginResponse | null {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as LoginResponse;
      const valid =
        parsed !== null &&
        typeof parsed === 'object' &&
        typeof parsed.token === 'string' &&
        parsed.user !== null &&
        typeof parsed.user === 'object';

      return valid ? parsed : null;
    } catch {
      return null;
    }
  }

  private writeStoredSession(response: LoginResponse): void {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(response));
    } catch {
      // Storage indisponível: mantém a sessão apenas em memória.
    }
  }

  private removeStoredSession(): void {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Storage indisponível: nada a remover.
    }
  }
}
