import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { sessionFixture } from '../testing/jwt';
import { Login } from './login';
import { SessionStore } from '../session/session-store';

const response = sessionFixture({ profiles: ['Administrador'] });

describe('Login', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  function setup() {
    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance as unknown as {
      loginForm: { setValue: (v: Record<string, string>) => void };
    };
    fixture.detectChanges();
    // Verificação de existência de usuários feita ao abrir a tela: com usuários,
    // a tela de login permanece (cenário padrão dos testes abaixo).
    TestBed.inject(HttpTestingController)
      .expectOne('/api/auth/has-users')
      .flush({ hasUsers: true });
    return { fixture, component };
  }

  it('should create the login page', () => {
    const { fixture } = setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the login form', () => {
    const { fixture } = setup();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Entrar');
    expect(compiled.querySelector('input[formcontrolname="email"]')).toBeTruthy();
    expect(compiled.querySelector('input[formcontrolname="password"]')).toBeTruthy();
  });

  it('navega para /main e grava a sessão após login bem-sucedido', async () => {
    const { fixture, component } = setup();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.loginForm.setValue({ email: 'maria@exemplo.com', password: 'password123' });
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/auth/login').flush(response);
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith(['/main']);
    expect(TestBed.inject(SessionStore).user()).toEqual(response.user);
    expect(TestBed.inject(SessionStore).isAuthenticated()).toBe(true);
  });

  it('permanece no login, exibe erro e não grava sessão quando a API responde 401', async () => {
    const { fixture, component } = setup();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.loginForm.setValue({ email: 'maria@exemplo.com', password: 'errada123' });
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne('/api/auth/login')
      .flush({ message: 'Credenciais inválidas.' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    expect(navigateSpy).not.toHaveBeenCalled();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-box')?.textContent).toContain(
      'Falha ao entrar. Verifique suas credenciais.',
    );
    expect(TestBed.inject(SessionStore).isAuthenticated()).toBe(false);
  });

  it('permanece no login, exibe erro e não grava sessão quando a API responde 200 com token inválido', async () => {
    const { fixture, component } = setup();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.loginForm.setValue({ email: 'maria@exemplo.com', password: 'password123' });
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/auth/login').flush({ token: 'demo-token-123', user: response.user });
    await fixture.whenStable();

    expect(navigateSpy).not.toHaveBeenCalled();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-box')?.textContent).toContain(
      'Resposta de autenticação inválida.',
    );
    expect(TestBed.inject(SessionStore).isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('app.session')).toBeNull();
  });

  it('não chama a API quando o formulário é inválido', () => {
    const { fixture } = setup();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    TestBed.inject(HttpTestingController).expectNone('/api/auth/login');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error')?.textContent).toContain('Informe o e-mail.');
  });

  it('sem usuários cadastrados, redireciona para /signup ao abrir', async () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    TestBed.inject(HttpTestingController)
      .expectOne('/api/auth/has-users')
      .flush({ hasUsers: false });
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith(['/signup']);
  });

  it('com usuários cadastrados, permanece na tela de login', async () => {
    const { fixture } = setup();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    await fixture.whenStable();

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
