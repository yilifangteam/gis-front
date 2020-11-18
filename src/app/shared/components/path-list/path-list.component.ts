import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { GeoPathService } from '@service/common/geo-path.service';
import { GeoService } from '@service/common/geo.service';
import { MapDataService } from '@service/common/map.data.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { chunkArray } from '../../utils/array';
import { Fine1MapService } from './fine1-map.service';

@Component({
  selector: 'ipt-path-list',
  templateUrl: './path-list.component.html',
  styleUrls: ['./path-list.component.less'],
  providers: [Fine1MapService],
})
export class PathListComponent implements OnInit, AfterViewInit {
  constructor(
    // public geo: GeoService,
    private fine1MapSrv: Fine1MapService,
    private notificationSrv: NzNotificationService,
    private mapDataSrv: MapDataService,
  ) {}
  @ViewChild('carTpl', { static: false }) carTpl?: TemplateRef<{}>;
  geolocation: Geolocation;

  /**
   * 0 垃圾运输车
   * 1 垃圾点
   * 2 处理基地
   * 3 中转站
   */
  tabIndex = 0;
  selectedValue = null;
  /**
   * 原始数据
   */
  baseData: any = {
    carGps: [],
    siteGps: [],
  };
  data = [];
  pageData = [];

  listPagination = {
    onChange: this.pageChange,
    pageSize: 8,
    pageIndex: 1,
  };

  inputValue = '';

  tipBoxList: any[] = [];

  /**
   * tip box 限制 3个
   */
  tipBoxLimit = 3;

  ngOnInit(): void {
    this.geolocation = navigator.geolocation;
    this.mapDataSrv.getGpsData().subscribe((d) => {
      this.baseData = d;
      this.query();
    });
  }

  pageChange(index: number = 1) {
    const cArr = chunkArray(this.data, this.listPagination.pageSize);
    this.pageData = cArr[index - 1];
  }

  query(kw: string = '') {
    switch (this.tabIndex) {
      case 0:
        // 垃圾运输车
        if (kw) {
          this.data = [...this.baseData.carGps.filter((c) => c.callout.content.toLowerCase().indexOf(kw.toLowerCase()) >= 0)];
        } else {
          this.data = [...this.baseData.carGps];
        }
        break;
      case 1:
        // 垃圾点
        if (kw) {
          this.data = [
            ...this.baseData.siteGps.filter(
              (c) => c.Name.toLowerCase().indexOf(kw.toLowerCase()) >= 0 || c.workContentName.toLowerCase().indexOf(kw.toLowerCase()) >= 0,
            ),
          ];
        } else {
          this.data = [...this.baseData.siteGps];
        }
        break;
      case 2:
        // 处理基地
        if (kw) {
          this.data = [
            ...this.baseData.destructorPlant.filter(
              (c) =>
                c.plantName.toLowerCase().indexOf(kw.toLowerCase()) >= 0 || c.plantAddress.toLowerCase().indexOf(kw.toLowerCase()) >= 0,
            ),
          ];
        } else {
          this.data = [...this.baseData.destructorPlant];
        }
        break;
      case 3:
        // 中转站
        this.data = [];
        break;
      default:
        break;
    }

    this.pageChange();
  }

  ngAfterViewInit(): void {
    // this.geo.updateSize();
    // this.locate();
    this.fine1MapSrv.initMap();
  }

  selectedIndexChange($event) {
    this.query(this.inputValue);
  }

  checkChange($event, item) {
    if ($event) {
      this.addTipBoxList(item);
    } else {
      this.subTipBoxList(item);
    }
  }
  addTipBoxList(item) {
    item.checked = true;
    if (this.tipBoxLimit <= this.tipBoxList.length) {
      this.subTipBoxList(this.tipBoxList[0]);
    }
    const nty = this.notificationSrv.template(this.carTpl, { nzData: item, nzDuration: 0, nzKey: item.recNo || item.id });
    item.ntfId = nty.messageId;
    nty.onClose.subscribe((x) => {
      const tmp = this.tipBoxList.find((t) => t.ntfId == nty.messageId);
      if (tmp) {
        tmp.checked = false;
      }
    });
    this.tipBoxList.push(item);
  }

  subTipBoxList(item) {
    item.checked = false;
    item.ntfId = '';
    this.notificationSrv.remove(item.ntfId);
    this.tipBoxList = this.tipBoxList.filter((t) => t !== item);
  }
}
