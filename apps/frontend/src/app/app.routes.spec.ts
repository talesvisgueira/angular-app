import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { sessionFixture } from './testing/jwt';
import { App } from './app';
import { routes } from './app.routes';
import { SessionStore } from './session/session-store';
import { SPLASH_DURATION_MS } from './splash/splash';

const SESSION_STORAGE_KEY = 'app.session';

const response = sessionFixture({ profiles: ['Administrador'] });
const expiredResponse = sessionFixture({}, { expired: true });

describe('routes', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes),
        { provide: SPLASH_DURATION_MS, useValue: 20 },
      ],
    });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('rota vazia sem sessão passa pela splash e termina em /login', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);

    await router.navigateByUrl('/');
    fixture.detectChanges();

    expect(router.url).toBe('/splash');
    expect((fixture.nativeElement as HTMLElement).querySelector('app-splash')).toBeTruthy();

    // A splash consulta a existência de usuários antes de decidir o destino.
    const hasUsers = await vi.waitFor(() =>
      TestBed.inject(HttpTestingController).expectOne('/api/auth/has-users'),
    );
    hasUsers.flush({ hasUsers: true });

    await vi.waitFor(() => expect(router.url).toBe('/login'));
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Entrar');
  });

  it('rota vazia com sessão semeada passa pela splash e termina em /main', async () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(response));
    TestBed.inject(SessionStore);
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);

    await router.navigateByUrl('/');
    fixture.detectChanges();

    expect(router.url).toBe('/splash');

    await vi.waitFor(() => expect(router.url).toBe('/main'));
    fixture.detectChanges();
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

  it('acesso direto a /admin sem sessão redireciona para /login', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);

    await router.navigateByUrl('/admin');
    fixture.detectChanges();

    expect(router.url).toBe('/login');
  });

  it('acesso direto a /help sem sessão redireciona para /login', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);

    await router.navigateByUrl('/help');
    fixture.detectChanges();

    expect(router.url).toBe('/login');
  });

  it('rota vazia com sessão de token expirado termina em /login', async () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(expiredResponse));
    TestBed.inject(SessionStore);
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);

    await router.navigateByUrl('/');
    fixture.detectChanges();

    expect(router.url).toBe('/splash');

    const hasUsers = await vi.waitFor(() =>
      TestBed.inject(HttpTestingController).expectOne('/api/auth/has-users'),
    );
    hasUsers.flush({ hasUsers: true });

    await vi.waitFor(() => expect(router.url).toBe('/login'));
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('rota /admin com sessão semeada exibe a página de administração', async () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(response));
    TestBed.inject(SessionStore);
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);

    await router.navigateByUrl('/admin');
    fixture.detectChanges();

    expect(router.url).toBe('/admin');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Administração');
  });

  it('rota /help com sessão semeada exibe a página de ajuda', async () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(response));
    TestBed.inject(SessionStore);
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);

    await router.navigateByUrl('/help');
    fixture.detectChanges();

    expect(router.url).toBe('/help');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Ajuda');
  });

  it('rota /signup é pública e exibe o formulário de cadastro', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);

    await router.navigateByUrl('/signup');
    fixture.detectChanges();

    expect(router.url).toBe('/signup');
    TestBed.inject(HttpTestingController)
      .expectOne('/api/auth/has-users')
      .flush({ hasUsers: false });
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Criar acesso');
  });
});
