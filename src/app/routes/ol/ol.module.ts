import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OlRoutingModule } from './ol-routing.module';
import { ExtentConstrainedComponent } from './extent-constrained/extent-constrained.component';
import { LineArrowsComponent } from './line-arrows/line-arrows.component';
import { FeatureMoveAnimationComponent } from './feature-move-animation/feature-move-animation.component';

@NgModule({
  declarations: [ExtentConstrainedComponent, LineArrowsComponent, FeatureMoveAnimationComponent],
  imports: [CommonModule, OlRoutingModule],
})
export class OlModule {}
