import { vi } from 'vitest';
import { sessionFixture } from '../testing/jwt';
import { SessionStore } from './session-store';

const SESSION_STORAGE_KEY = 'app.session';

describe('SessionStore', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it('começa sem sessão quando não há storage', () => {
    const store = new SessionStore();

    expect(store.user()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
  });

  it('set armazena a sessão válida e persiste em sessionStorage', () => {
    const store = new SessionStore();
    const response = sessionFixture({ profiles: ['Administrador'] });

    expect(store.set(response)).toBe(true);
    expect(store.user()).toEqual(response.user);
    expect(store.isAuthenticated()).toBe(true);
    expect(JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY) ?? '')).toEqual(response);
  });

  it('set rejeita token malformado e não armazena nada', () => {
    const store = new SessionStore();
    const response = { ...sessionFixture(), token: 'demo-token-123' };

    expect(store.set(response)).toBe(false);
    expect(store.isAuthenticated()).toBe(false);
    expect(store.user()).toBeNull();
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('set rejeita token expirado e não armazena nada', () => {
    const store = new SessionStore();
    const response = sessionFixture({}, { expired: true });

    expect(store.set(response)).toBe(false);
    expect(store.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('nova instância rehidrata a sessão com token válido', () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionFixture()));

    const store = new SessionStore();

    expect(store.user()).toEqual(sessionFixture().user);
    expect(store.isAuthenticated()).toBe(true);
  });

  it('descarta e limpa a sessão com token expirado ao reidratar', () => {
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(sessionFixture({}, { expired: true })),
    );

    const store = new SessionStore();

    expect(store.user()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('descarta e limpa a sessão com token inválido ao reidratar', () => {
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ ...sessionFixture(), token: 'valor-editado-na-mao' }),
    );

    const store = new SessionStore();

    expect(store.user()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('ignora sessão corrompida no storage', () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, '{não é json válido');

    const store = new SessionStore();

    expect(store.user()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
  });

  it('storage indisponível não quebra: sessão funciona apenas em memória', () => {
    const storageError = () => {
      throw new Error('storage indisponível');
    };
    vi.stubGlobal('sessionStorage', {
      getItem: storageError,
      setItem: storageError,
      removeItem: storageError,
    });

    const store = new SessionStore();

    expect(() => store.set(sessionFixture())).not.toThrow();
    expect(store.user()).toEqual(sessionFixture().user);
    expect(store.isAuthenticated()).toBe(true);
  });

  it('clear remove a sessão da memória e do storage', () => {
    const store = new SessionStore();
    store.set(sessionFixture());

    store.clear();

    expect(store.user()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('hasValidSession avalia o token no momento da chamada', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    vi.useFakeTimers({ now });
    try {
      const store = new SessionStore();
      const response = sessionFixture({}, { exp: Math.floor(now.getTime() / 1000) + 60 });

      expect(store.set(response)).toBe(true);
      expect(store.hasValidSession()).toBe(true);

      vi.setSystemTime(new Date(now.getTime() + 61_000));
      expect(store.hasValidSession()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('hasValidSession é false sem sessão', () => {
    const store = new SessionStore();

    expect(store.hasValidSession()).toBe(false);
  });
});
