import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureMoveAnimationComponent } from './feature-move-animation.component';

describe('FeatureMoveAnimationComponent', () => {
  let component: FeatureMoveAnimationComponent;
  let fixture: ComponentFixture<FeatureMoveAnimationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FeatureMoveAnimationComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeatureMoveAnimationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
