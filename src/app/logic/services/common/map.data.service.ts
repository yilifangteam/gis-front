import { Injectable } from '@angular/core';
import { _HttpClient } from '@delon/theme';

@Injectable({
  providedIn: 'root',
})
export class MapDataService {
  constructor(private http: _HttpClient) {}

  getGpsData() {
    return this.http.post('http://49.234.204.23:6605/CarGps/getGpsDatas', {
      comCode: 'cus000001cus000007',
    });
  }

  getCarGps(carNum: string) {
    return this.http.post('http://49.234.204.23:6605/CarGps/getGpsDatas', {
      comCode: 'cus000001cus000007',
      tbName: 'carGps',
      timePoliy: '天',
      carNum,
    });
  }
}
