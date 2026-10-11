export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: User;
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
