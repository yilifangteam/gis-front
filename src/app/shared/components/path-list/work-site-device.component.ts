import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { MapDataService } from '@service/common/map.data.service';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-work-site-device',
  template: `
    <nz-table
      #smallTable
      nzSize="small"
      [nzData]="dataList"
      [nzFrontPagination]="false"
      [nzTotal]="data?.totalSize"
      [nzPageSize]="data?.limit"
      [nzScroll]="{ y: '240px' }"
    >
      <thead>
        <tr>
          <th>设备名称</th>
          <th>设备类型</th>
          <th nzAlign="center">设备值</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let data of smallTable.data">
          <td>{{ data.deviceName }}</td>
          <td>{{ data.deviceType | deviceType }}</td>
          <td nzAlign="center">
            <ng-container *ngIf="data.deviceType == 1">
              <a nz-button (click)="viewVideo(data)" nzType="link">查看</a>
            </ng-container>
            <ng-container *ngIf="data.deviceType != 1"> -- </ng-container>
          </td>
        </tr>
      </tbody>
    </nz-table>

    <ng-template #videoTpl let-params>
      <div id="videoMonitoring1" style="height: 332px"></div>
    </ng-template>
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
export class WorkSiteDeviceComponent {
  private _site: any;
  @Input()
  set site(val) {
    this._site = val;
    this.query();
  }
  get site() {
    return this._site;
  }

  data: any;
  dataList: any = [];
  player;
  @ViewChild('videoTpl', { static: false }) videoTpl?: TemplateRef<{}>;
  constructor(
    private modalRef: NzModalRef,
    private modal: NzModalService,
    private mapDataSrv: MapDataService,
    private modalSrv: NzModalService,
    private http: _HttpClient,
  ) {}

  query() {
    this.mapDataSrv.getWorkSiteDevice(this.site.ID, this.site.comCode).subscribe((x) => {
      this.data = x;
      this.dataList = x.dataList;
    });
  }

  viewVideo(item) {
    const modal = this.modal.create({
      nzTitle: item.deviceName,
      nzContent: this.videoTpl,
      nzWidth: '720px',
      nzZIndex: 1020,
      nzCancelText: null,
      nzOkText: '关闭',
    });
    modal.afterOpen.subscribe((x) => {
      this.playLive(item);
    });
    modal.afterClose.subscribe((x) => {
      this.player = null;
    });
  }

  playLive(item) {
    this.player = new ckplayer({
      container: '#videoMonitoring1',
      variable: 'player',
      crossorigin: 'Anonymous',
      autoplay: true,
      flashplayer: false,
      live: true,
      html5m3u8: true,
      video: item.videoUrl,
    });
  }

  destroyModal(): void {
    this.modalRef.destroy();
  }
}
