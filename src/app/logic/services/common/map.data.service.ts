import { Injectable } from '@angular/core';
import { CacheService } from '@delon/cache';
import { _HttpClient } from '@delon/theme';
import { LmWebSocket } from '@shared';
import { fine1Url, UrlConfig, urlSerialize } from 'src/app/shared/utils/url';

@Injectable({
  providedIn: 'root',
})
export class MapDataService {
  private carGpsObs: LmWebSocket;
  constructor(private http: _HttpClient, private cacheSrv: CacheService) {}

  getGpsData() {
    return this.http.post(fine1Url(UrlConfig.dashboard1), {
      comCode: 'cus000001cus000007',
    });
  }

  getCarGps(carNum: string) {
    return this.http.post(fine1Url(UrlConfig.dashboard), {
      comCode: 'cus000001cus000007',
      tbName: 'carGps',
      timePoliy: '天',
      carNum,
    });
  }
  getCarRealTimeGps() {
    if (!this.carGpsObs) {
      this.carGpsObs = new LmWebSocket(fine1Url(UrlConfig.dashboard2));
    }
    return this.carGpsObs.LmObservable();
  }
}
