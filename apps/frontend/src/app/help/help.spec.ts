import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Help } from './help';

describe('Help', () => {
  let component: Help;
  let fixture: ComponentFixture<Help>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Help],
    }).compileComponents();

    fixture = TestBed.createComponent(Help);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exibe o título Ajuda', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('Ajuda');
  });

  it('exibe aviso de página em construção', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.placeholder-page p')?.textContent).toContain('Em construção');
  });
});
