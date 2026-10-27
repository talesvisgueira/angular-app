export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  /** Nomes dos perfis ativos do usuário (via organization_user_profile). */
  profiles: string[];
}

export interface LoginResponse {
  token: string;
  user: User;
}

/** Payload do JWT emitido no login. */
export interface AuthClaims {
  /** Id do usuário autenticado. */
  sub: string;
  email: string;
  name: string;
  profiles: string[];
  /** Expiração, em segundos desde o epoch (20 minutos após o login). */
  exp: number;
  /** Emitido em, em segundos desde o epoch. */
  iat?: number;
}

export interface ApiError {
  message: string;
}

export function isLoginRequest(value: unknown): value is LoginRequest {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const { email, password } = value as Record<string, unknown>;

  return (
    typeof email === 'string' &&
    email.includes('@') &&
    typeof password === 'string' &&
    password.length >= 6
  );
}

/** Dados da organização no cadastro inicial (primeira execução). */
export interface SetupOrganization {
  name: string;
  email: string;
}

/** Dados do administrador no cadastro inicial (primeira execução). */
export interface SetupAdmin {
  name: string;
  email: string;
  username: string;
  password: string;
}

/** Carga do cadastro inicial: `POST /api/auth/setup`. */
export interface SetupRequest {
  organization: SetupOrganization;
  admin: SetupAdmin;
}

/** Resposta de `GET /api/auth/has-users`. */
export interface HasUsersResponse {
  hasUsers: boolean;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && value.includes('@');
}

/**
 * Valida o corpo do cadastro inicial: nome e email da organização e nome, email
 * e username do administrador são obrigatórios, e a senha tem no mínimo 6
 * caracteres — mesma regra de senha de `isLoginRequest`.
 */
export function isSetupRequest(value: unknown): value is SetupRequest {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const { organization, admin } = value as Record<string, unknown>;

  if (typeof organization !== 'object' || organization === null) {
    return false;
  }
  if (typeof admin !== 'object' || admin === null) {
    return false;
  }

  const org = organization as Record<string, unknown>;
  const adm = admin as Record<string, unknown>;

  return (
    isNonEmptyString(org.name) &&
    isValidEmail(org.email) &&
    isNonEmptyString(adm.name) &&
    isValidEmail(adm.email) &&
    isNonEmptyString(adm.username) &&
    typeof adm.password === 'string' &&
    adm.password.length >= 6
  );
}

function base64UrlDecode(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Decodifica o payload de um JWT SEM verificar a assinatura — a verificação
 * criptográfica é responsabilidade do backend (`POST /api/auth/validate`).
 * Retorna null quando o token não tem a estrutura de 3 segmentos ou o payload
 * não contém os claims mínimos esperados.
 */
export function parseJwt(token: string): AuthClaims | null {
  if (typeof token !== 'string') {
    return null;
  }

  const segments = token.split('.');
  if (segments.length !== 3) {
    return null;
  }

  const [, payloadSegment] = segments;
  if (!payloadSegment) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payloadSegment)) as unknown;
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }

    const { sub, email, name, profiles, exp } = parsed as Record<string, unknown>;
    const valid =
      typeof sub === 'string' &&
      typeof email === 'string' &&
      typeof name === 'string' &&
      Array.isArray(profiles) &&
      profiles.every((profile) => typeof profile === 'string') &&
      typeof exp === 'number';

    return valid ? (parsed as AuthClaims) : null;
  } catch {
    return null;
  }
}

/** Indica se os claims já expiraram (`exp` em segundos desde o epoch). */
export function isTokenExpired(claims: AuthClaims, now: number = Date.now()): boolean {
  return claims.exp * 1000 <= now;
}
