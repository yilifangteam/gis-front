import { NgModule, Type } from '@angular/core';

import { SharedModule } from '@shared';
import { PathListComponent } from '../shared/components/path-list/path-list.component';
import { TodayDayCountComponent } from '../shared/components/path-list/today-day-count.component';
import { VideoDeviceEventComponent } from '../shared/components/path-list/video-device-event.component';
import { WorkSiteDeviceComponent } from '../shared/components/path-list/work-site-device.component';
// single pages
import { CallbackComponent } from './callback/callback.component';
// dashboard pages
import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeComponent } from './home/home.component';
import { TrackPathHistoryComponent } from './ol/track/path-history.component';
import { TrackComponent } from './ol/track/track.component';
import { UserLockComponent } from './passport/lock/lock.component';
// passport pages
import { UserLoginComponent } from './passport/login/login.component';
import { UserRegisterResultComponent } from './passport/register-result/register-result.component';
import { UserRegisterComponent } from './passport/register/register.component';
import { RouteRoutingModule } from './routes-routing.module';

const COMPONENTS: Type<void>[] = [
  DashboardComponent,
  // passport pages
  UserLoginComponent,
  UserRegisterComponent,
  UserRegisterResultComponent,
  // single pages
  CallbackComponent,
  UserLockComponent,
  TrackComponent,
  TrackPathHistoryComponent,
  PathListComponent,
  VideoDeviceEventComponent,
  TodayDayCountComponent,
  WorkSiteDeviceComponent,
];
const COMPONENTS_NOROUNT: Type<void>[] = [];

@NgModule({
  imports: [SharedModule, RouteRoutingModule],
  declarations: [...COMPONENTS, ...COMPONENTS_NOROUNT, HomeComponent],
})
export class RoutesModule {}
