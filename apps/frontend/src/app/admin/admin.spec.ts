import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Admin } from './admin';

describe('Admin', () => {
  let component: Admin;
  let fixture: ComponentFixture<Admin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Admin],
    }).compileComponents();

    fixture = TestBed.createComponent(Admin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exibe o título Administração', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Administração');
  });

  it('exibe aviso de página em construção', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.placeholder-page p')?.textContent).toContain('Em construção');
  });
});
