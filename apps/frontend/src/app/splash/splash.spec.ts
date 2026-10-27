import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import type { LoginResponse } from '@monorepo/shared';
import { sessionFixture } from '../testing/jwt';
import { SessionStore } from '../session/session-store';
import { Splash, SPLASH_DURATION_MS } from './splash';

const SESSION_STORAGE_KEY = 'app.session';

@Component({ selector: 'app-login-stub', template: '' })
class LoginStub {}

@Component({ selector: 'app-main-stub', template: '' })
class MainStub {}

@Component({ selector: 'app-signup-stub', template: '' })
class SignupStub {}

const testRoutes = [
  { path: 'login', component: LoginStub },
  { path: 'main', component: MainStub },
  { path: 'signup', component: SignupStub },
];

describe('Splash', () => {
  function setup(options: { session?: LoginResponse } = {}): {
    fixture: ReturnType<typeof TestBed.createComponent<Splash>>;
    router: Router;
    flushHasUsers: (value: boolean | 'error') => Promise<void>;
  } {
    TestBed.configureTestingModule({
      imports: [Splash],
      providers: [
        provideRouter(testRoutes),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SPLASH_DURATION_MS, useValue: 15 },
      ],
    });

    if (options.session) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(options.session));
    }
    TestBed.inject(SessionStore);

    const fixture = TestBed.createComponent(Splash);
    fixture.detectChanges();

    // A verificação só é emitida quando a splash termina sem sessão válida.
    const flushHasUsers = async (value: boolean | 'error'): Promise<void> => {
      const http = TestBed.inject(HttpTestingController);
      const request = await vi.waitFor(() => http.expectOne('/api/auth/has-users'));
      if (value === 'error') {
        request.error(new ProgressEvent('error'));
      } else {
        request.flush({ hasUsers: value });
      }
    };

    return { fixture, router: TestBed.inject(Router), flushHasUsers };
  }

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('exibe a arte de splash e a identidade do sistema', async () => {
    const { fixture, flushHasUsers } = setup();
    const pending = flushHasUsers(true);
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('AngularApp');
    expect(compiled.querySelector<HTMLImageElement>('.splash-image')?.src).toContain('/splash.svg');
    expect(compiled.querySelector<HTMLImageElement>('.logo')?.src).toContain('/logo.svg');
    await pending;
  });

  it('sem sessão e com usuários cadastrados, segue para /login ao terminar', async () => {
    const { router, flushHasUsers } = setup();

    await flushHasUsers(true);
    await vi.waitFor(() => expect(router.url).toBe('/login'));
  });

  it('sem sessão e sem usuários cadastrados, segue para /signup ao terminar', async () => {
    const { router, flushHasUsers } = setup();

    await flushHasUsers(false);
    await vi.waitFor(() => expect(router.url).toBe('/signup'));
  });

  it('sem sessão e com falha na verificação, segue para /login ao terminar', async () => {
    const { router, flushHasUsers } = setup();

    await flushHasUsers('error');
    await vi.waitFor(() => expect(router.url).toBe('/login'));
  });

  it('com sessão ativa, segue para /main ao terminar sem consultar usuários', async () => {
    const { router } = setup({ session: sessionFixture() });

    TestBed.inject(HttpTestingController).expectNone('/api/auth/has-users');
    await vi.waitFor(() => expect(router.url).toBe('/main'));
  });

  it('com sessão de token expirado, segue para /login ao terminar', async () => {
    const { router, flushHasUsers } = setup({ session: sessionFixture({}, { expired: true }) });

    await flushHasUsers(true);
    await vi.waitFor(() => expect(router.url).toBe('/login'));
  });

  it('cancela o temporizador ao ser destruída', async () => {
    const { fixture, router } = setup();
    fixture.destroy();

    await new Promise((resolve) => setTimeout(resolve, 40));

    expect(router.url).toBe('/');
  });
});
