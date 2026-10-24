import { TestBed } from '@angular/core/testing';
import type { LoginResponse } from '@monorepo/shared';
import { SYSTEM_AUTHOR, SYSTEM_COPYRIGHT, SYSTEM_NAME } from '../app-info';
import { Main } from './main';

const SESSION_STORAGE_KEY = 'app.session';

const response: LoginResponse = {
  token: 'demo-token-123',
  user: { id: 'u1', name: 'Maria Souza', email: 'maria@exemplo.com' },
};

describe('Main', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [Main],
    }).compileComponents();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  function renderWithSession() {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(response));
    const fixture = TestBed.createComponent(Main);
    fixture.detectChanges();
    return fixture;
  }

  it('should create the main page', () => {
    const fixture = renderWithSession();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('exibe o nome do sistema no banner', () => {
    const fixture = renderWithSession();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.system-name')?.textContent?.trim()).toBe(SYSTEM_NAME);
  });

  it('exibe a logo do sistema no banner', () => {
    const fixture = renderWithSession();
    const compiled = fixture.nativeElement as HTMLElement;
    const img = compiled.querySelector<HTMLImageElement>('img.logo');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe('/logo.svg');
  });

  it('exibe o nome e o e-mail do usuário autenticado no banner', () => {
    const fixture = renderWithSession();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.user-name')?.textContent?.trim()).toBe(response.user.name);
    expect(compiled.querySelector('.user-email')?.textContent?.trim()).toBe(response.user.email);
  });

  it('exibe mensagem de boas-vindas com o nome do usuário na área central', () => {
    const fixture = renderWithSession();
    const compiled = fixture.nativeElement as HTMLElement;
    const welcome = compiled.querySelector('.content h1')?.textContent ?? '';
    expect(welcome).toContain('Seja bem-vindo(a)');
    expect(welcome).toContain(response.user.name);
  });

  it('exibe copyright e dados do autor no rodapé', () => {
    const fixture = renderWithSession();
    const compiled = fixture.nativeElement as HTMLElement;
    const footer = compiled.querySelector('.footer')?.textContent ?? '';
    expect(footer).toContain(SYSTEM_COPYRIGHT);
    expect(footer).toContain(SYSTEM_AUTHOR);
  });
});
