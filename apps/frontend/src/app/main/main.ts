import { Component, inject } from '@angular/core';
import { SYSTEM_AUTHOR, SYSTEM_COPYRIGHT, SYSTEM_LOGO_PATH, SYSTEM_NAME } from '../app-info';
import { SessionStore } from '../session/session-store';

@Component({
  selector: 'app-main',
  styleUrl: './main.scss',
  templateUrl: './main.html',
})
export class Main {
  private readonly sessionStore = inject(SessionStore);

  protected readonly systemName = SYSTEM_NAME;
  protected readonly logoPath = SYSTEM_LOGO_PATH;
  protected readonly copyright = SYSTEM_COPYRIGHT;
  protected readonly author = SYSTEM_AUTHOR;

  protected readonly user = this.sessionStore.user;
}
