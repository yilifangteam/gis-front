import { Injectable, OnDestroy } from '@angular/core';
import { CacheService } from '@delon/cache';
import { _HttpClient } from '@delon/theme';
import { fine1Url, LmWebSocket, UrlConfig, urlSerialize } from '@shared';
@Injectable({
  providedIn: 'root',
})
export class MapDataService implements OnDestroy {
  private carGpsObs: LmWebSocket;
  constructor(private http: _HttpClient, private cacheSrv: CacheService) {}
  ngOnDestroy(): void {
    this.carGpsObs.close();
  }

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

  getShenzhenGeo() {
    return this.http.get('./assets/json/440300.json');
  }
}
