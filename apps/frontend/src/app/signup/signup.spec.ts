import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { sessionFixture } from '../testing/jwt';
import { Signup } from './signup';
import { SessionStore } from '../session/session-store';

const response = sessionFixture({ profiles: ['Administrador'] });

const filledForm = {
  organizationName: 'Organização Alfa',
  organizationEmail: 'contato@alfa.com.br',
  adminName: 'Maria Souza',
  adminEmail: 'maria@alfa.com.br',
  username: 'maria',
  password: 'password123',
  confirmPassword: 'password123',
};

describe('Signup', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [Signup],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  function setup() {
    const fixture = TestBed.createComponent(Signup);
    const component = fixture.componentInstance as unknown as {
      signupForm: { setValue: (v: Record<string, string>) => void };
    };
    fixture.detectChanges();
    // Verificação de existência de usuários feita ao abrir a tela.
    TestBed.inject(HttpTestingController)
      .expectOne('/api/auth/has-users')
      .flush({ hasUsers: false });
    return { fixture, component };
  }

  function submitForm(fixture: ReturnType<typeof TestBed.createComponent<Signup>>): void {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
  }

  it('should create the signup page', () => {
    const { fixture } = setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the signup form', () => {
    const { fixture } = setup();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Criar acesso');
    expect(compiled.querySelector('input[formcontrolname="organizationName"]')).toBeTruthy();
    expect(compiled.querySelector('input[formcontrolname="organizationEmail"]')).toBeTruthy();
    expect(compiled.querySelector('input[formcontrolname="adminName"]')).toBeTruthy();
    expect(compiled.querySelector('input[formcontrolname="adminEmail"]')).toBeTruthy();
    expect(compiled.querySelector('input[formcontrolname="username"]')).toBeTruthy();
    expect(compiled.querySelector('input[formcontrolname="password"]')).toBeTruthy();
    expect(compiled.querySelector('input[formcontrolname="confirmPassword"]')).toBeTruthy();
  });

  it('envia o cadastro sem a confirmação de senha e navega autenticado para /main', async () => {
    const { fixture, component } = setup();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.signupForm.setValue(filledForm);
    submitForm(fixture);

    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne('/api/auth/setup');
    expect(request.request.body).toEqual({
      organization: { name: 'Organização Alfa', email: 'contato@alfa.com.br' },
      admin: {
        name: 'Maria Souza',
        email: 'maria@alfa.com.br',
        username: 'maria',
        password: 'password123',
      },
    });
    request.flush(response);
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith(['/main']);
    expect(TestBed.inject(SessionStore).user()).toEqual(response.user);
    expect(TestBed.inject(SessionStore).isAuthenticated()).toBe(true);
  });

  it('senhas divergentes não enviam requisição e indicam o erro', () => {
    const { fixture, component } = setup();

    component.signupForm.setValue({ ...filledForm, confirmPassword: 'outra-senha' });
    submitForm(fixture);
    fixture.detectChanges();

    TestBed.inject(HttpTestingController).expectNone('/api/auth/setup');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('As senhas não conferem.');
  });

  it('formulário inválido não envia requisição e indica os erros', () => {
    const { fixture } = setup();

    submitForm(fixture);
    fixture.detectChanges();

    TestBed.inject(HttpTestingController).expectNone('/api/auth/setup');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Informe o nome da organização.');
  });

  it('permanece na tela com a mensagem do backend quando responde 409', async () => {
    const { fixture, component } = setup();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.signupForm.setValue(filledForm);
    submitForm(fixture);

    TestBed.inject(HttpTestingController)
      .expectOne('/api/auth/setup')
      .flush({ message: 'Username já utilizado.' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();

    expect(navigateSpy).not.toHaveBeenCalled();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-box')?.textContent).toContain('Username já utilizado.');
    expect(TestBed.inject(SessionStore).isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('app.session')).toBeNull();
  });

  it('permanece na tela quando o backend responde 400', async () => {
    const { fixture, component } = setup();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.signupForm.setValue(filledForm);
    submitForm(fixture);

    TestBed.inject(HttpTestingController)
      .expectOne('/api/auth/setup')
      .flush(
        { message: 'Dados de cadastro inválidos.' },
        { status: 400, statusText: 'Bad Request' },
      );
    await fixture.whenStable();

    expect(navigateSpy).not.toHaveBeenCalled();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-box')?.textContent).toContain(
      'Dados de cadastro inválidos.',
    );
    expect(TestBed.inject(SessionStore).isAuthenticated()).toBe(false);
  });

  it('permanece na tela quando a resposta 201 traz token inválido', async () => {
    const { fixture, component } = setup();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.signupForm.setValue(filledForm);
    submitForm(fixture);

    TestBed.inject(HttpTestingController)
      .expectOne('/api/auth/setup')
      .flush({ token: 'demo-token-123', user: response.user });
    await fixture.whenStable();

    expect(navigateSpy).not.toHaveBeenCalled();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-box')?.textContent).toContain(
      'Resposta de cadastro inválida.',
    );
    expect(TestBed.inject(SessionStore).isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('app.session')).toBeNull();
  });

  it('redireciona para /login ao abrir quando já existem usuários cadastrados', async () => {
    const fixture = TestBed.createComponent(Signup);
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    TestBed.inject(HttpTestingController)
      .expectOne('/api/auth/has-users')
      .flush({ hasUsers: true });
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
