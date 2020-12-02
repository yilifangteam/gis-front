import { Component, Input } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { MapDataService } from '@service/common/map.data.service';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-today-day-count',
  template: `
    <nz-table #smallTable nzSize="small" [nzData]="data" [nzScroll]="{ y: '240px' }">
      <thead>
        <tr>
          <th>名称</th>
          <th>日期</th>
          <th>值</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let data of smallTable.data">
          <td>{{ data.workContentName }}</td>
          <td>{{ data.weightDate }}</td>
          <td>{{ data.sum }}{{ data.unit }}</td>
        </tr>
      </tbody>
    </nz-table>
  `,
  styles: [
    `
      :host {
        display: black;
        width: 100%;
        height: 500px;
      }
    `,
  ],
  providers: [],
})
export class TodayDayCountComponent {
  private _site: any;
  @Input()
  set site(val) {
    this._site = val;
    this.query();
  }
  get site() {
    return this._site;
  }

  data: any[] = [];
  constructor(private modal: NzModalRef, private mapDataSrv: MapDataService, private modalSrv: NzModalService, private http: _HttpClient) {}

  query() {
    this.mapDataSrv.selectTodayDayCount(this.site.ID, this.site.comCode).subscribe((x) => {
      this.data = x;
    });
  }

  destroyModal(): void {
    this.modal.destroy();
  }
}
