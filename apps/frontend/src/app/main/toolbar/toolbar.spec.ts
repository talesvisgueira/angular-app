import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { sessionFixture } from '../../testing/jwt';
import { SessionStore } from '../../session/session-store';
import { Toolbar } from './toolbar';

const SESSION_STORAGE_KEY = 'app.session';

const response = sessionFixture({ profiles: ['Administrador'] });

@Component({ template: '' })
class LoginStub {}

describe('Toolbar', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [Toolbar],
      providers: [provideRouter([{ path: 'login', component: LoginStub }])],
    }).compileComponents();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  function renderToolbar() {
    const fixture = TestBed.createComponent(Toolbar);
    fixture.detectChanges();
    return fixture;
  }

  function renderWithSession() {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(response));
    TestBed.inject(SessionStore);
    return renderToolbar();
  }

  it('should create', () => {
    const fixture = renderWithSession();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('exibe os links Home, Admin e Help com seus destinos', () => {
    const fixture = renderWithSession();
    const compiled = fixture.nativeElement as HTMLElement;

    const expected = [
      ['Home', '/main'],
      ['Admin', '/admin'],
      ['Help', '/help'],
    ] as const;

    for (const [label, href] of expected) {
      const anchor = compiled.querySelector<HTMLAnchorElement>(`nav a[href="${href}"]`);
      expect(anchor?.textContent?.trim()).toBe(label);
    }
  });

  it('exibe o rótulo de logout (Sair) com sessão ativa', () => {
    const fixture = renderWithSession();
    const compiled = fixture.nativeElement as HTMLElement;

    const button = compiled.querySelector<HTMLButtonElement>('button.session-button');
    expect(button?.textContent?.trim()).toBe('Sair');
  });

  it('exibe o rótulo de login (Entrar) sem sessão', () => {
    const fixture = renderToolbar();
    const compiled = fixture.nativeElement as HTMLElement;

    const anchor = compiled.querySelector<HTMLAnchorElement>('a.session-button');
    expect(anchor?.textContent?.trim()).toBe('Entrar');
    expect(anchor?.getAttribute('href')).toBe('/login');
  });

  it('remove a sessão e navega para /login ao acionar Sair', async () => {
    const fixture = renderWithSession();
    const sessionStore = TestBed.inject(SessionStore);
    const router = TestBed.inject(Router);
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('button.session-button')?.click();
    await fixture.whenStable();

    expect(sessionStore.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(router.url).toBe('/login');
  });

  it('navega para /login ao acionar Entrar sem sessão', async () => {
    const fixture = renderToolbar();
    const router = TestBed.inject(Router);
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLAnchorElement>('a.session-button')?.click();
    await fixture.whenStable();

    expect(router.url).toBe('/login');
  });
});
