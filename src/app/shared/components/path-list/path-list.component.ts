import { AfterViewInit, Component, OnDestroy, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { GeoPathService } from '@service/common/geo-path.service';
import { GeoService } from '@service/common/geo.service';
import { MapDataService } from '@service/common/map.data.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { fromEPSG4326 } from 'ol/proj/epsg3857';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { chunkArray } from '../../utils/array';
import { Fine1MapService } from './fine1-map.service';
import { PathHistoryComponent } from './path-history.component';
import { PathRealTimeComponent } from './path-real-time.component';
import { TodayDayCountComponent } from './today-day-count.component';
import { VideoDeviceEventComponent } from './video-device-event.component';
import { WorkSiteDeviceComponent } from './work-site-device.component';

@Component({
  selector: 'ipt-path-list',
  templateUrl: './path-list.component.html',
  styleUrls: ['./path-list.component.less'],
  providers: [Fine1MapService],
})
export class PathListComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();

  carVisible = true;
  siteVisible = true;
  baseVisible = true;
  transferVisible = true;

  isShowName = false;

  constructor(
    // public geo: GeoService,
    public fine1MapSrv: Fine1MapService,
    private notificationSrv: NzNotificationService,
    private mapDataSrv: MapDataService,
    private modal: NzModalService,
    private viewContainerRef: ViewContainerRef,
  ) {}

  player;

  @ViewChild('carTpl', { static: false }) carTpl?: TemplateRef<{}>;
  @ViewChild('crapTpl', { static: false }) crapTpl?: TemplateRef<{}>;
  @ViewChild('baseTpl', { static: false }) baseTpl?: TemplateRef<{}>;
  @ViewChild('transferTpl', { static: false }) transferTpl?: TemplateRef<{}>;
  @ViewChild('videoTpl', { static: false }) videoTpl?: TemplateRef<{}>;
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

  tipBoxTarget: any = {};

  /**
   * tip box 限制 3个
   */
  tipBoxLimit = 1;
  /**
   * 展开
   */
  isExpand = true;

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

  pointVisibleChange(key) {
    switch (key) {
      case 0:
        this.carVisible = !this.carVisible;
        if (this.carVisible) {
          this.fine1MapSrv.showCar(this.baseData.carGps);
        } else {
          this.fine1MapSrv.carSource.clear();
        }
        break;
      case 1:
        this.siteVisible = !this.siteVisible;
        if (this.siteVisible) {
          this.fine1MapSrv.showCrapSite(this.baseData.siteGps);
        } else {
          this.fine1MapSrv.crapSource.clear();
        }
        break;
      case 2:
        this.baseVisible = !this.baseVisible;
        if (this.baseVisible) {
          this.fine1MapSrv.showBase(this.baseData.destructorPlant);
        } else {
          this.fine1MapSrv.baseSource.clear();
        }
        break;
      case 3:
        this.transferVisible = !this.transferVisible;
        if (this.transferVisible) {
          this.fine1MapSrv.showTransfer(this.baseData.transfer);
        } else {
          this.fine1MapSrv.transferSource.clear();
        }
        break;
      default:
        break;
    }
  }

  showNameChange($event) {
    this.fine1MapSrv.isShowName = this.isShowName;
    this.fine1MapSrv.showCar(this.baseData.carGps);
    this.fine1MapSrv.showCrapSite(this.baseData.siteGps);
    this.fine1MapSrv.showBase(this.baseData.destructorPlant);
  }

  pageChange(index: number = 1) {
    const cArr = chunkArray(this.data, this.listPagination.pageSize);
    this.pageData = cArr[index - 1];
  }

  iptChange($event) {
    this.query(this.inputValue);
  }

  query(kw: string = '') {
    switch (this.tabIndex) {
      case 0:
        // 垃圾运输车
        if (kw) {
          this.data = [
            ...this.baseData.carGps.filter(
              (c) =>
                (c.carNum || '').toLowerCase().indexOf(kw.toLowerCase()) >= 0 ||
                (c.comClearTypeName || '').toLowerCase().indexOf(kw.toLowerCase()) >= 0,
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
    this.fine1MapSrv.target = this;
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
  addTipBoxList(item, autoFit = true) {
    item.checked = true;
    if (this.tipBoxTarget && this.tipBoxTarget.tabIndex != undefined) {
      this.subTipBoxList(this.tipBoxTarget, false);
    }
    let tpl;
    switch (item.tabIndex) {
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
      const tmp = this.tipBoxTarget;
      if (tmp) {
        this.subTipBoxList(tmp);
      }
    });
    this.tipBoxTarget = item;
    this.fine1MapSrv.overlay.setPosition(fromEPSG4326([item.longitude, item.latitude]));
    if (autoFit) {
      this.fine1MapSrv.focusPoint([item.longitude, item.latitude]);
    }
  }

  subTipBoxList(item, autoFit = true) {
    item.checked = false;
    this.notificationSrv.remove(item.ntfId);
    item.ntfId = '';
    this.tipBoxTarget = {};
    if (autoFit) {
      this.fine1MapSrv.fitMap(this.fine1MapSrv.crapSource);
    }
    this.fine1MapSrv.overlay.setPosition(undefined);
  }

  viewRealTime(item) {
    const modal = this.modal.create({
      nzTitle: item.carNum,
      nzContent: PathRealTimeComponent,
      nzViewContainerRef: this.viewContainerRef,
      nzComponentParams: {
        car: item,
      },
      nzWidth: '720px',
      nzZIndex: 1020,
      nzCancelText: null,
      nzOkText: '关闭',
    });
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
      nzOkText: '关闭',
    });
  }

  viewVideo(item) {
    const modal = this.modal.create({
      nzTitle: item.carNum,
      nzContent: this.videoTpl,
      nzViewContainerRef: this.viewContainerRef,

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
      container: '#videoMonitoring',
      variable: 'player',
      crossorigin: 'Anonymous',
      autoplay: true,
      flashplayer: false,
      live: true,
      html5m3u8: true,
      video: item.videoUrl,
    });
  }

  viewWorkSiteDevice(item) {
    const modal = this.modal.create({
      nzTitle: item.Name + '(硬件信息)',
      nzContent: WorkSiteDeviceComponent,
      nzViewContainerRef: this.viewContainerRef,
      nzComponentParams: {
        site: item,
      },
      nzWidth: '720px',
      nzZIndex: 1020,
      nzCancelText: null,
      nzOkText: '关闭',
    });
  }

  viewTodayDayCount(item) {
    const modal = this.modal.create({
      nzTitle: item.Name + '(当天称重数量)',
      nzContent: TodayDayCountComponent,
      nzViewContainerRef: this.viewContainerRef,
      nzComponentParams: {
        site: item,
      },
      nzWidth: '720px',
      nzZIndex: 1020,
      nzCancelText: null,
      nzOkText: '关闭',
    });
  }

  viewDeviceEvent(item) {
    const modal = this.modal.create({
      nzTitle: item.Name + '(摄像头事件)',
      nzContent: VideoDeviceEventComponent,
      nzViewContainerRef: this.viewContainerRef,
      nzComponentParams: {
        site: item,
      },
      nzWidth: '720px',
      nzZIndex: 1020,
      nzCancelText: null,
      nzOkText: '关闭',
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
