import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from '@shared';
import { ExtentConstrainedComponent } from './extent-constrained/extent-constrained.component';
import { FeatureMoveAnimationComponent } from './feature-move-animation/feature-move-animation.component';
import { LineArrowsComponent } from './line-arrows/line-arrows.component';
import { OlRoutingModule } from './ol-routing.module';
import { TrackPathHistoryComponent } from './track/path-history.component';
import { TrackComponent } from './track/track.component';

@NgModule({
  declarations: [
    ExtentConstrainedComponent,
    LineArrowsComponent,
    FeatureMoveAnimationComponent,

    // TrackPathHistoryComponent, TrackComponent
  ],
  imports: [SharedModule, OlRoutingModule],
})
export class OlModule {}
