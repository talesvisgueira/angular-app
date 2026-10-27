import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { sessionFixture } from '../testing/jwt';
import { SYSTEM_AUTHOR, SYSTEM_COPYRIGHT, SYSTEM_NAME } from '../app-info';
import { Main } from './main';

const SESSION_STORAGE_KEY = 'app.session';

const response = sessionFixture({ profiles: ['Administrador'] });

describe('Main', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [Main],
      providers: [provideRouter([])],
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

  it('exibe a toolbar com os links Home, Admin e Help entre o banner e a área central', () => {
    const fixture = renderWithSession();
    const compiled = fixture.nativeElement as HTMLElement;

    const toolbarHost = compiled.querySelector('app-toolbar');
    expect(toolbarHost).toBeTruthy();
    expect(toolbarHost?.querySelector('nav.toolbar')).toBeTruthy();

    const banner = compiled.querySelector('.banner');
    const content = compiled.querySelector('.content');
    expect(banner?.nextElementSibling).toBe(toolbarHost);
    expect(toolbarHost?.nextElementSibling).toBe(content);

    const expected = [
      ['Home', '/main'],
      ['Admin', '/admin'],
      ['Help', '/help'],
    ] as const;
    for (const [label, href] of expected) {
      const anchor = toolbarHost?.querySelector<HTMLAnchorElement>(`a[href="${href}"]`);
      expect(anchor?.textContent?.trim()).toBe(label);
    }
  });

  it('exibe o botão de logout (Sair) na toolbar com sessão ativa', () => {
    const fixture = renderWithSession();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('button.session-button')?.textContent?.trim()).toBe('Sair');
  });

  it('exibe o botão de login (Entrar) na toolbar sem sessão', () => {
    const fixture = TestBed.createComponent(Main);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('a.session-button')?.textContent?.trim()).toBe('Entrar');
  });
});
