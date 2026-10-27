import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SessionStore } from '../../session/session-store';

@Component({
  imports: [RouterLink],
  selector: 'app-toolbar',
  styleUrl: './toolbar.scss',
  templateUrl: './toolbar.html',
})
export class Toolbar {
  private readonly router = inject(Router);
  private readonly sessionStore = inject(SessionStore);

  protected readonly isAuthenticated = this.sessionStore.isAuthenticated;

  protected logout(): void {
    this.sessionStore.clear();
    void this.router.navigate(['/login']);
  }
}
