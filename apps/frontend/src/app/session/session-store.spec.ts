import { vi } from 'vitest';
import type { LoginResponse } from '@monorepo/shared';
import { SessionStore } from './session-store';

const SESSION_STORAGE_KEY = 'app.session';

const response: LoginResponse = {
  token: 'demo-token-123',
  user: { id: 'u1', name: 'Maria Souza', email: 'maria@exemplo.com' },
};

describe('SessionStore', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it('começa sem sessão quando não há storage', () => {
    const store = new SessionStore();

    expect(store.user()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
  });

  it('set armazena a sessão e persiste em sessionStorage', () => {
    const store = new SessionStore();

    store.set(response);

    expect(store.user()).toEqual(response.user);
    expect(store.isAuthenticated()).toBe(true);
    expect(JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY) ?? '')).toEqual(response);
  });

  it('nova instância rehidrata a sessão do storage', () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(response));

    const store = new SessionStore();

    expect(store.user()).toEqual(response.user);
    expect(store.isAuthenticated()).toBe(true);
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

    expect(() => store.set(response)).not.toThrow();
    expect(store.user()).toEqual(response.user);
    expect(store.isAuthenticated()).toBe(true);
  });

  it('clear remove a sessão da memória e do storage', () => {
    const store = new SessionStore();
    store.set(response);

    store.clear();

    expect(store.user()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });
});
