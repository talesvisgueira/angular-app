import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot, UrlTree } from '@angular/router';
import type { LoginResponse } from '@monorepo/shared';
import { authGuard } from './auth-guard';

const SESSION_STORAGE_KEY = 'app.session';

const response: LoginResponse = {
  token: 'demo-token-123',
  user: { id: 'u1', name: 'Maria Souza', email: 'maria@exemplo.com' },
};

describe('authGuard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('permite o acesso com sessão ativa', () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(response));

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/main' } as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it('redireciona para /login sem sessão ativa', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/main' } as RouterStateSnapshot),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login');
  });
});
