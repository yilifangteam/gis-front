import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtentConstrainedComponent } from './extent-constrained.component';

describe('ExtentConstrainedComponent', () => {
  let component: ExtentConstrainedComponent;
  let fixture: ComponentFixture<ExtentConstrainedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExtentConstrainedComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtentConstrainedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
