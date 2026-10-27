import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { sessionFixture } from '../testing/jwt';
import { authGuard } from './auth-guard';

const SESSION_STORAGE_KEY = 'app.session';

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

  function runGuard(): boolean | UrlTree {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/main' } as RouterStateSnapshot),
    ) as boolean | UrlTree;
  }

  it('permite o acesso com sessão de token válido', () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionFixture()));

    expect(runGuard()).toBe(true);
  });

  it('redireciona para /login sem sessão ativa', () => {
    const result = runGuard();

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login');
  });

  it('descarta a sessão e redireciona para /login com token expirado', () => {
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(sessionFixture({}, { expired: true })),
    );

    const result = runGuard();

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login');
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('descarta a sessão e redireciona para /login com token inválido', () => {
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ ...sessionFixture(), token: 'token-editado' }),
    );

    const result = runGuard();

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login');
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });
});
