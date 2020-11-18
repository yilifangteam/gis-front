import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExtentConstrainedComponent } from './extent-constrained/extent-constrained.component';
import { FeatureMoveAnimationComponent } from './feature-move-animation/feature-move-animation.component';
import { LineArrowsComponent } from './line-arrows/line-arrows.component';

const routes: Routes = [
  {
    path: 'extent-constrained',
    component: ExtentConstrainedComponent,
  },
  {
    path: 'line-arrows',
    component: LineArrowsComponent,
  },
  {
    path: 'feature-move-animation',
    component: FeatureMoveAnimationComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OlRoutingModule {}
