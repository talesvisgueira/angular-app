import { SignJWT, jwtVerify } from 'jose';
import type { AuthClaims } from '@monorepo/shared';

/** Vida útil do token de sessão: 20 minutos. */
export const TOKEN_TTL_SECONDS = 20 * 60;

const DEV_FALLBACK_SECRET = 'dev-insecure-jwt-secret-change-me';

let warnedNoSecret = false;

/**
 * Segredo de assinatura do JWT (HS256): lê `JWT_SECRET` do ambiente e, na
 * ausência dela, usa um fallback de desenvolvimento emitindo um aviso único.
 * Em produção a variável SHALL estar definida.
 */
export function getJwtSecret(log?: { warn(message: string): void }): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    return new TextEncoder().encode(secret);
  }

  if (!warnedNoSecret) {
    warnedNoSecret = true;
    (log ?? console).warn(
      'JWT_SECRET não definida: usando segredo de desenvolvimento. Defina a variável em produção.',
    );
  }
  return new TextEncoder().encode(DEV_FALLBACK_SECRET);
}

/** Assina um JWT HS256 com `iat` agora e `exp` em 20 minutos. */
export async function signSessionToken(claims: Omit<AuthClaims, 'exp' | 'iat'>): Promise<string> {
  const nowInSeconds = Math.floor(Date.now() / 1000);

  return new SignJWT({ email: claims.email, name: claims.name, profiles: claims.profiles })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuedAt(nowInSeconds)
    .setExpirationTime(nowInSeconds + TOKEN_TTL_SECONDS)
    .sign(getJwtSecret());
}

function isAuthClaims(payload: unknown): payload is AuthClaims {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const { sub, email, name, profiles, exp } = payload as Record<string, unknown>;
  return (
    typeof sub === 'string' &&
    typeof email === 'string' &&
    typeof name === 'string' &&
    Array.isArray(profiles) &&
    profiles.every((profile) => typeof profile === 'string') &&
    typeof exp === 'number'
  );
}

/**
 * Verifica assinatura (HS256, mesmo segredo) e expiração do token.
 * Retorna os claims quando válido, ou null quando ausente/inválido/expirado.
 */
export async function verifySessionToken(token: string): Promise<AuthClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), { algorithms: ['HS256'] });
    return isAuthClaims(payload) ? (payload as AuthClaims) : null;
  } catch {
    return null;
  }
}
