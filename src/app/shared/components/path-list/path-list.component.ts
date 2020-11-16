import { AfterViewInit, Component, OnInit } from '@angular/core';
import { GeoService } from '@service/common/geo.service';
import { MapDataService } from '@service/common/map.data.service';
import { chunkArray } from '../../utils/array';

@Component({
  selector: 'ipt-path-list',
  templateUrl: './path-list.component.html',
  styleUrls: ['./path-list.component.less'],
})
export class PathListComponent implements OnInit, AfterViewInit {
  constructor(public geo: GeoService, private mapDataSrv: MapDataService) {}
  geolocation: Geolocation;

  /**
   * 0 垃圾运输车
   * 1 垃圾点
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
    pageSize: 5,
    pageIndex: 1,
  };

  inputValue = '';

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
    if (this.tabIndex == 0) {
      // 垃圾运输车
      if (kw) {
        this.data = [...this.baseData.carGps.filter((c) => c.callout.content.toLowerCase().indexOf(kw.toLowerCase()) >= 0)];
      } else {
        this.data = [...this.baseData.carGps];
      }
    } else if (this.tabIndex == 1) {
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
    }
    this.pageChange();
  }

  ngAfterViewInit(): void {
    this.geo.updateSize();
    // this.locate();
  }

  selectedIndexChange($event) {
    this.query(this.inputValue);
  }

  locate(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.geo.setView(16, [position.coords.longitude, position.coords.latitude]);
      });
    }
  }
}
