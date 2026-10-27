import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import type { HasUsersResponse, LoginRequest, LoginResponse } from '@monorepo/shared';
import { SessionStore } from '../session/session-store';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly sessionStore = inject(SessionStore);

  protected readonly loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected get email() {
    return this.loginForm.controls.email;
  }

  protected get password() {
    return this.loginForm.controls.password;
  }

  constructor() {
    // Direcionamento de entrada: sem usuários cadastrados, o sistema abre o
    // cadastro inicial em vez da tela de login.
    if (!this.sessionStore.hasValidSession()) {
      this.http.get<HasUsersResponse>('/api/auth/has-users').subscribe({
        next: (response) => {
          if (!response.hasUsers) {
            void this.router.navigate(['/signup']);
          }
        },
        error: () => {
          // Falha de rede: permanece na tela de login (comportamento padrão).
        },
      });
    }
  }

  protected onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const credentials: LoginRequest = this.loginForm.getRawValue();

    this.http.post<LoginResponse>('/api/auth/login', credentials).subscribe({
      next: (response) => {
        this.loading.set(false);

        if (!this.sessionStore.set(response)) {
          this.error.set('Resposta de autenticação inválida.');
          return;
        }

        this.loginForm.reset();
        void this.router.navigate(['/main']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Falha ao entrar. Verifique suas credenciais.');
      },
    });
  }
}
