import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import type { HasUsersResponse, LoginResponse, SetupRequest } from '@monorepo/shared';
import { SessionStore } from '../session/session-store';

/** Exige igualdade entre a senha e a confirmação no nível do grupo. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMatch: true };
}

/**
 * Tela de cadastro inicial (primeira execução): cria a organização e o
 * administrador com o perfil Administrador e estabelece a sessão (login
 * automático). A tela só fica disponível enquanto não houver usuário
 * cadastrado — com usuários existentes, redireciona para o login.
 */
@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-signup',
  styleUrl: './signup.scss',
  templateUrl: './signup.html',
})
export class Signup {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly sessionStore = inject(SessionStore);

  protected readonly signupForm = new FormGroup(
    {
      organizationName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      organizationEmail: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      adminName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      adminEmail: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      username: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(6)],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: passwordsMatch },
  );

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected get organizationName() {
    return this.signupForm.controls.organizationName;
  }

  protected get organizationEmail() {
    return this.signupForm.controls.organizationEmail;
  }

  protected get adminName() {
    return this.signupForm.controls.adminName;
  }

  protected get adminEmail() {
    return this.signupForm.controls.adminEmail;
  }

  protected get username() {
    return this.signupForm.controls.username;
  }

  protected get password() {
    return this.signupForm.controls.password;
  }

  protected get confirmPassword() {
    return this.signupForm.controls.confirmPassword;
  }

  constructor() {
    // Direcionamento de entrada: com usuários já cadastrados, a tela não se aplica.
    this.http.get<HasUsersResponse>('/api/auth/has-users').subscribe({
      next: (response) => {
        if (response.hasUsers) {
          void this.router.navigate(['/login']);
        }
      },
      error: () => {
        // Falha de rede: permanece na tela; a submissão reportará erros.
      },
    });
  }

  protected onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const value = this.signupForm.getRawValue();
    const payload: SetupRequest = {
      organization: { name: value.organizationName, email: value.organizationEmail },
      admin: {
        name: value.adminName,
        email: value.adminEmail,
        username: value.username,
        password: value.password,
      },
    };

    this.loading.set(true);
    this.error.set(null);

    this.http.post<LoginResponse>('/api/auth/setup', payload).subscribe({
      next: (response) => {
        this.loading.set(false);
        // Mesma validação do login: token estruturalmente válido e não expirado.
        if (!this.sessionStore.set(response)) {
          this.error.set('Resposta de cadastro inválida.');
          return;
        }
        this.signupForm.reset();
        void this.router.navigate(['/main']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const message = typeof err.error?.message === 'string' ? err.error.message : null;
        this.error.set(message ?? 'Falha ao concluir o cadastro. Tente novamente.');
      },
    });
  }
}
