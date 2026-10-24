import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { LoginResponse } from '@monorepo/shared';
import { App } from './app';
import { routes } from './app.routes';
import { SessionStore } from './session/session-store';

const SESSION_STORAGE_KEY = 'app.session';

const response: LoginResponse = {
  token: 'demo-token-123',
  user: { id: 'u1', name: 'Maria Souza', email: 'maria@exemplo.com' },
};

describe('routes', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(routes)],
    });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('rota vazia sem sessão termina em /login', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);

    await router.navigateByUrl('/');
    fixture.detectChanges();

    expect(router.url).toBe('/login');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Entrar');
  });

  it('rota vazia com sessão semeada termina em /main', async () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(response));
    TestBed.inject(SessionStore);
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);

    await router.navigateByUrl('/');
    fixture.detectChanges();

    expect(router.url).toBe('/main');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.content h1')?.textContent).toContain('Seja bem-vindo(a)');
  });

  it('acesso direto a /main sem sessão redireciona para /login', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);

    await router.navigateByUrl('/main');
    fixture.detectChanges();

    expect(router.url).toBe('/login');
  });
});
