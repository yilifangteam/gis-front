import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { MapDataService } from '@service/common/map.data.service';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-video-device-event',
  template: `
    <nz-table
      #smallTable
      nzSize="small"
      [nzData]="dataList"
      [nzFrontPagination]="false"
      [nzTotal]="data?.totalSize"
      [nzPageSize]="data?.limit"
    >
      <thead>
        <tr>
          <th>事件名称</th>
          <th>触发时间</th>
          <th nzAlign="center">图片</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let data of smallTable.data">
          <td>{{ data.eventName }}</td>
          <td>{{ data.eventDate }}</td>
          <td nzAlign="center">
            <ng-container *ngIf="data.imgUrl">
              <a nz-button (click)="viewImg(data)" nzType="link">查看</a>
            </ng-container>
            <ng-container *ngIf="!data.imgUrl"> -- </ng-container>
          </td>
        </tr>
      </tbody>
    </nz-table>
    <ng-template #imgTpl let-params>
      <nz-carousel [nzEffect]="effect">
        <div nz-carousel-content *ngFor="let img of imgs">
          <img style="width: 672px;" [src]="img" />
        </div>
      </nz-carousel>
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
export class VideoDeviceEventComponent {
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
  imgs: string[] = [];
  @ViewChild('imgTpl', { static: false }) imgTpl?: TemplateRef<{}>;
  constructor(
    private modalRef: NzModalRef,
    private modal: NzModalService,
    private mapDataSrv: MapDataService,
    private modalSrv: NzModalService,
    private http: _HttpClient,
  ) {}

  query() {
    this.mapDataSrv.workSiteDeviceEvent(this.site.ID, this.site.comCode).subscribe((x) => {
      this.data = x;
      this.dataList = x.dataList;
    });
  }

  viewImg(item) {
    if (item.imgUrl) {
      this.imgs = item.imgUrl.split(',');
    }

    const modal = this.modal.create({
      nzTitle: item.eventName,
      nzContent: this.imgTpl,
      nzWidth: '720px',
      nzZIndex: 1020,
      nzCancelText: null,
      nzOkText: '关闭',
    });
    modal.afterOpen.subscribe((x) => {});
  }

  destroyModal(): void {
    this.modalRef.destroy();
  }
}
