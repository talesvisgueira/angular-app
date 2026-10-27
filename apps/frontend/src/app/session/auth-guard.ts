import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from './session-store';

/**
 * Protege as rotas autenticadas: exige sessão com token JWT válido no
 * momento do acesso. Sessão ausente, expirada ou com token inválido é
 * descartada e o usuário é redirecionado para `/login`.
 */
export const authGuard: CanActivateFn = () => {
  const sessionStore = inject(SessionStore);
  const router = inject(Router);

  if (sessionStore.hasValidSession()) {
    return true;
  }

  sessionStore.clear();
  return router.createUrlTree(['/login']);
};
