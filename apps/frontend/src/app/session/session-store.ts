import { Injectable, computed, signal } from '@angular/core';
import { isTokenExpired, parseJwt } from '@monorepo/shared';
import type { LoginResponse } from '@monorepo/shared';

const SESSION_STORAGE_KEY = 'app.session';

/** Estrutura + expiração: válido apenas se decodifica e `exp` está no futuro. */
function hasValidToken(token: string): boolean {
  const claims = parseJwt(token);
  return claims !== null && !isTokenExpired(claims);
}

/**
 * Guarda a sessão do usuário autenticado (`token` + `user`) em memória via
 * signal e espelha em `sessionStorage` para sobreviver a refresh na mesma aba.
 * O token precisa ser um JWT estruturalmente válido e não expirado — na
 * gravação (`set`) e na reidratação. Se o storage estiver indisponível, a
 * sessão funciona apenas em memória.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly session = signal<LoginResponse | null>(this.readStoredSession());

  readonly user = computed(() => this.session()?.user ?? null);

  readonly isAuthenticated = computed(() => this.session() !== null);

  /**
   * Valida o token recebido e, só então, armazena a sessão. Retorna `false`
   * quando o token é estruturalmente inválido ou está expirado — nesse caso
   * nada é armazenado.
   */
  set(response: LoginResponse): boolean {
    if (!hasValidToken(response.token)) {
      return false;
    }

    this.session.set(response);
    this.writeStoredSession(response);
    return true;
  }

  clear(): void {
    this.session.set(null);
    this.removeStoredSession();
  }

  /**
   * Avalia o token da sessão no momento da chamada (a validade depende do
   * tempo, que não é reativo a signals). Usado por guards e redirecionamentos.
   */
  hasValidSession(): boolean {
    const current = this.session();
    return current !== null && hasValidToken(current.token);
  }

  private readStoredSession(): LoginResponse | null {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as LoginResponse;
      const structurallyValid =
        parsed !== null &&
        typeof parsed === 'object' &&
        typeof parsed.token === 'string' &&
        parsed.user !== null &&
        typeof parsed.user === 'object';

      if (!structurallyValid) {
        return null;
      }

      // Token inválido ou expirado: descarta a sessão e limpa o espelho.
      if (!hasValidToken(parsed.token)) {
        this.removeStoredSession();
        return null;
      }

      return parsed;
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
