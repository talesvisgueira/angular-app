import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import type { LoginRequest, LoginResponse } from '@monorepo/shared';

@Component({
  imports: [ReactiveFormsModule, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly http = inject(HttpClient);

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
  protected readonly submitted = signal(false);
  protected readonly error = signal<string | null>(null);

  protected get email() {
    return this.loginForm.controls.email;
  }

  protected get password() {
    return this.loginForm.controls.password;
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
      next: () => {
        this.loading.set(false);
        this.submitted.set(true);
        this.loginForm.reset();
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Falha ao entrar. Verifique suas credenciais.');
      },
    });
  }
}
