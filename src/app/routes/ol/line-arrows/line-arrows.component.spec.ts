import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineArrowsComponent } from './line-arrows.component';

describe('LineArrowsComponent', () => {
  let component: LineArrowsComponent;
  let fixture: ComponentFixture<LineArrowsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LineArrowsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LineArrowsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
