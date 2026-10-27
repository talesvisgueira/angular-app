import type { AuthClaims, LoginResponse } from '@monorepo/shared';

function base64UrlEncode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Cria um JWT estruturalmente válido (3 segmentos, payload decodificável)
 * sem assinatura real — suficiente para os helpers do shared no frontend,
 * que validam estrutura e expiração, nunca a assinatura.
 */
export function makeJwt(
  overrides: Partial<Omit<AuthClaims, 'exp'>> & { exp?: number } = {},
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AuthClaims = {
    sub: 'u1',
    email: 'maria@exemplo.com',
    name: 'Maria Souza',
    profiles: [],
    iat: now,
    ...overrides,
    exp: overrides.exp ?? now + 20 * 60,
  };
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  return `${header}.${base64UrlEncode(JSON.stringify(payload))}.assinatura-de-teste`;
}

/** `LoginResponse` de teste com token JWT válido (ou expirado, via opções). */
export function sessionFixture(
  userOverrides: Partial<LoginResponse['user']> = {},
  options: { expired?: boolean; exp?: number } = {},
): LoginResponse {
  const user = {
    id: 'u1',
    name: 'Maria Souza',
    email: 'maria@exemplo.com',
    profiles: [],
    ...userOverrides,
  };
  const now = Math.floor(Date.now() / 1000);
  const exp = options.exp ?? (options.expired ? now - 60 : now + 20 * 60);

  return {
    token: makeJwt({
      sub: user.id,
      email: user.email,
      name: user.name,
      profiles: user.profiles,
      iat: exp - 20 * 60,
      exp,
    }),
    user,
  };
}
