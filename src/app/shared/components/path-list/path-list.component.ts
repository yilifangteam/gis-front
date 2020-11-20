import { AfterViewInit, Component, OnDestroy, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { GeoPathService } from '@service/common/geo-path.service';
import { GeoService } from '@service/common/geo.service';
import { MapDataService } from '@service/common/map.data.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { chunkArray } from '../../utils/array';
import { Fine1MapService } from './fine1-map.service';
import { PathHistoryComponent } from './path-history.component';

@Component({
  selector: 'ipt-path-list',
  templateUrl: './path-list.component.html',
  styleUrls: ['./path-list.component.less'],
  providers: [Fine1MapService],
})
export class PathListComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  constructor(
    // public geo: GeoService,
    public fine1MapSrv: Fine1MapService,
    private notificationSrv: NzNotificationService,
    private mapDataSrv: MapDataService,
    private modal: NzModalService,
    private viewContainerRef: ViewContainerRef,
  ) {}

  @ViewChild('carTpl', { static: false }) carTpl?: TemplateRef<{}>;
  @ViewChild('crapTpl', { static: false }) crapTpl?: TemplateRef<{}>;
  @ViewChild('baseTpl', { static: false }) baseTpl?: TemplateRef<{}>;
  @ViewChild('transferTpl', { static: false }) transferTpl?: TemplateRef<{}>;
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
  tipBoxLimit = 1;

  ngOnInit(): void {
    this.geolocation = navigator.geolocation;
    this.mapDataSrv.getGpsData().subscribe((d) => {
      this.baseData = d;
      this.query();
      this.fine1MapSrv.showCar(this.baseData.carGps);
      this.fine1MapSrv.showCrapSite(this.baseData.siteGps);
      this.fine1MapSrv.showBase(this.baseData.destructorPlant);
      this.fine1MapSrv.fitMap(this.fine1MapSrv.crapSource);
      this.mapDataSrv
        .getCarRealTimeGps()
        .pipe(takeUntil(this.destroy$))
        .subscribe((data) => {
          if (data && data.length > 0) {
            const e = this.baseData.carGps.find((x) => x.imei == data[0].imei);
            if (e) {
              if (e.historyLine) {
                e.historyLine = [...e.historyLine, [data[0].longitude, data[0].latitude]];
              }
              Object.assign(e, data[0]);
            } else {
              this.baseData.carGps.push(data[0]);
            }

            this.fine1MapSrv.showCar(this.baseData.carGps);
          }
        });
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
          this.data = [
            ...this.baseData.carGps.filter(
              (c) =>
                c.carNum.toLowerCase().indexOf(kw.toLowerCase()) >= 0 || c.comClearTypeName.toLowerCase().indexOf(kw.toLowerCase()) >= 0,
            ),
          ];
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
    this.mapDataSrv.getShenzhenGeo().subscribe((x) => {
      // this.fine1MapSrv.showArea(x);
      this.fine1MapSrv.clipMap(x);
    });
  }

  selectedIndexChange($event) {
    this.query(this.inputValue);
  }

  checkChange($event, item) {
    if ($event) {
      item.tabIndex = this.tabIndex;
      this.addTipBoxList(item);
    } else {
      this.subTipBoxList(item);
    }
  }
  addTipBoxList(item) {
    item.checked = true;
    if (this.tipBoxLimit <= this.tipBoxList.length) {
      this.subTipBoxList(this.tipBoxList[0], false);
    }
    let tpl;
    switch (this.tabIndex) {
      case 0:
        tpl = this.carTpl;
        break;
      case 1:
        tpl = this.crapTpl;
        break;
      case 2:
        tpl = this.baseTpl;
        break;
      case 3:
        tpl = this.transferTpl;
        break;

      default:
        break;
    }
    const nty = this.notificationSrv.template(tpl, {
      nzClass: 'fine1-ntf',
      nzData: item,
      nzDuration: 0,
      nzKey: item.recNo || item.id,
    });
    item.ntfId = nty.messageId;
    nty.onClose.subscribe((x) => {
      const tmp = this.tipBoxList.find((t) => t.ntfId == nty.messageId);
      if (tmp) {
        this.subTipBoxList(tmp);
      }
    });
    this.tipBoxList.push(item);
    this.fine1MapSrv.focusPoint([item.longitude, item.latitude]);
  }

  subTipBoxList(item, autoFit = true) {
    item.checked = false;
    this.notificationSrv.remove(item.ntfId);
    item.ntfId = '';
    this.tipBoxList = this.tipBoxList.filter((t) => t !== item);
    if (autoFit) {
      this.fine1MapSrv.fitMap(this.fine1MapSrv.crapSource);
    }
  }

  viewHistory(item) {
    const modal = this.modal.create({
      nzTitle: item.carNum,
      nzContent: PathHistoryComponent,
      nzViewContainerRef: this.viewContainerRef,
      nzComponentParams: {
        car: item,
      },
      nzWidth: '720px',
      nzZIndex: 1020,
      nzCancelText: null,
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
