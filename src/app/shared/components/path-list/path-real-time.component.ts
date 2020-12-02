import { Component, Input, OnDestroy } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { MapDataService } from '@service/common/map.data.service';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { defaults as defaultControls } from 'ol/control';
import { ZoomSlider } from 'ol/control';
import { Coordinate } from 'ol/coordinate';
import { Extent, getBottomLeft } from 'ol/extent';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import Polyline from 'ol/format/Polyline';
import Geometry from 'ol/geom/Geometry';
import GeometryLayout from 'ol/geom/GeometryLayout';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import { get } from 'ol/proj';
import { fromEPSG4326, toEPSG4326 } from 'ol/proj/epsg3857';
import { getVectorContext } from 'ol/render';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import { Circle as CircleStyle, Fill, Icon, Stroke, Style, Text } from 'ol/style';
import TileGrid from 'ol/tilegrid/TileGrid';
import View from 'ol/View';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-path-real-time',
  template: `
    <div id="real-time-map" class="map"></div>

    <nz-table #dataTable nzSize="small" [nzData]="pointList" [nzPageSize]="10" [nzScroll]="{ y: '240px' }">
      <thead>
        <tr>
          <th nzWidth="100px">车牌号</th>
          <th nzWidth="150px">时间</th>
          <th nzWidth="100px">速度</th>
          <th>经度</th>
          <th>纬度</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let data of dataTable.data">
          <td>{{ data.carNum }}</td>
          <td>{{ data.time || now | _date }}</td>
          <td>{{ data.speed | round }}km/h</td>
          <td>{{ data.longitude }}</td>
          <td>{{ data.latitude }}</td>
        </tr>
      </tbody>
    </nz-table>
    <div id="real-time-popup" class="ol-popup">
      <a href="#" id="real-time-popup-closer" class="ol-popup-closer"></a>
      <div id="real-time-popup-content">
        <p>车牌：{{ newData?.carNum }}</p>
        <p>时间：{{ newData?.time || now | _date }}</p>
        <p>速度：{{ newData.speed | round }}km/h</p>
        <p>经度：{{ newData?.longitude }}</p>
        <p>纬度：{{ newData?.latitude }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: black;
        width: 100%;
        height: 500px;
      }
      #real-time-map {
        width: 100%;
        height: 400px;
        background-color: #f7f7f7;
      }
      .ol-popup {
        position: absolute;
        z-index: 999;
        background-color: white;
        -webkit-filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.2));
        /*filter: drop-shadow(0 1px 4px rgba(0,0,0,0.2));*/
        filter: drop-shadow(0 1px 4px #ffc125);
        padding: 8px;
        border-radius: 10px;
        border: 1px solid #cccccc;

        bottom: 12px;
        left: -50px;
        min-width: 280px;
      }
      #real-time-popup-content {
        font-size: 12px;
        line-height: 12px;
      }
      p {
        margin-bottom: 0;
      }
      .ol-popup:after,
      .ol-popup:before {
        top: 100%;
        border: solid transparent;
        content: ' ';
        height: 0;
        width: 0;
        position: absolute;
        pointer-events: none;
      }
      .ol-popup:after {
        border-top-color: white;
        border-width: 10px;
        left: 48px;
        margin-left: -10px;
      }
      .ol-popup:before {
        border-top-color: #cccccc;
        border-width: 11px;
        left: 48px;
        margin-left: -11px;
      }
      .ol-popup-closer {
        text-decoration: none;
        position: absolute;
        top: 2px;
        right: 8px;
      }
      .ol-popup-closer:after {
        content: '✖';
      }
    `,
  ],
  providers: [],
})
export class PathRealTimeComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  map: Map;
  geoMarker: Feature;
  lineMarker: Feature;
  mainLayer: TileLayer;
  center;
  styles;

  /**
   * 实时轨迹
   */
  realTimeSource: VectorSource;
  realTimeLayer: VectorLayer;

  polyLine: any[];

  newData: any;
  overlay: Overlay;

  private _car;
  @Input()
  set car(val) {
    this._car = val;
    this.newData = val;
    this.pointList = [];
    this.pointList.push(val);
    // const el = document.querySelector('#real-time-map');
    this.oldPoint = fromEPSG4326([val.longitude, val.latitude]);
    this.newPoint = fromEPSG4326([val.longitude, val.latitude]);

    // setInterval(() => {
    //   const e = { ...{}, ...val };
    //   if (Math.random() > 0.5) {
    //     e.longitude = this.roundNum(Number.parseFloat(val.longitude) + Math.random() * 10, 5);
    //   } else {
    //     e.longitude = this.roundNum(Number.parseFloat(val.longitude) - Math.random() * 10, 5);
    //   }

    //   if (Math.random() > 0.5) {
    //     e.latitude = this.roundNum(Number.parseFloat(val.latitude) + Math.random() * 10, 5);
    //   } else {
    //     e.latitude = this.roundNum(Number.parseFloat(val.latitude) - Math.random() * 10, 5);
    //   }
    // this.newData=e;
    //   this.pointList = [e, ...this.pointList];
    //   this.monitor(e);
    // }, 1000);
  }

  get car() {
    return this._car;
  }

  now = new Date();

  oldPoint: Coordinate = [0, 0];
  newPoint: Coordinate = [0, 0];

  pointList: any[] = [];

  constructor(private modal: NzModalRef, private mapDataSrv: MapDataService, private modalSrv: NzModalService, private http: _HttpClient) {
    this.mapDataSrv
      .getCarRealTimeGps()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data && data.length > 0) {
          if (this.car.imei == data[0].imei) {
            // console.log('新数据');
            this.newData = data[0];
            this.pointList = [data[0], ...this.pointList];
            this.monitor(data[0]);
          }
        }
      });
    this.modal.afterOpen.subscribe((x) => {
      this.initMap();
    });
  }

  roundNum(value, roundNum = 2) {
    value = Number.parseFloat(value.toString());
    if (roundNum <= 0) {
      return Math.round(value);
    }
    // eslint-disable-next-line no-restricted-properties
    value = Math.round(Math.round(value * Math.pow(10, roundNum + 1)) / Math.pow(10, 1)) / Math.pow(10, roundNum);
    return value;
  }
  monitor(d) {
    this.oldPoint = (this.geoMarker.getGeometry() as any).getFlatCoordinates();

    this.newPoint = fromEPSG4326([d.longitude, d.latitude]);
    this.overlay.setPosition(this.newPoint);

    // if (Math.random() > 0.5) {
    //   this.newPoint[0] = this.oldPoint[0] + Math.random() * 500;
    // } else {
    //   this.newPoint[0] = this.oldPoint[0] - Math.random() * 500;
    // }

    // if (Math.random() > 0.5) {
    //   this.newPoint[1] = this.oldPoint[1] + Math.random() * 500;
    // } else {
    //   this.newPoint[1] = this.oldPoint[1] - Math.random() * 500;
    // }

    // const newPoint: Coordinate = fromEPSG4326([d.longitude, d.latitude]);
    this.geoMarker.setGeometry(new Point(this.newPoint));
    (this.geoMarker.getStyle() as any).getImage().setRotation(this.rotation(this.newPoint, this.oldPoint));
    // const line = this.lineMarker.getGeometry() as LineString;
    // line.appendCoordinate(this.newPoint);

    // this.fitMap(this.realTimeSource);
    this.focusPoint(this.newPoint);
  }

  rotation(np, op) {
    // 90度的PI值
    const pi90 = Math.atan2(1, 0);
    // 当前点的PI值
    const piAc = Math.atan2(np[1] - op[1], np[0] - op[0]);

    return pi90 - piAc;
  }

  initMap() {
    const prj = get('EPSG:3857');

    this.center = [12699989.526708398, 2577327.1035168194];

    this.geoMarker = new Feature({
      type: 'geoMarker',
      geometry: new Point(fromEPSG4326([this._car.longitude, this._car.latitude])),
    });
    this.lineMarker = new Feature({
      type: 'route',
      geometry: new LineString([fromEPSG4326([this._car.longitude, this._car.latitude])]),
    });

    this.styles = {
      route: new Style({
        stroke: new Stroke({
          width: 6,
          color: '#459C50',
        }),
      }),
      geoMarker: new Style({
        image: new Icon({
          src: './assets/images/navigation.png',
          anchor: [0.5, 0.5],
          scale: 0.4,
          rotateWithView: true,
        }),
      }),
    };

    this.geoMarker.setStyle(this.styles.geoMarker);
    this.lineMarker.setStyle(this.styles.route);
    this.realTimeSource = new VectorSource({
      features: [this.geoMarker, this.lineMarker],
    });
    this.realTimeLayer = new VectorLayer({
      source: this.realTimeSource,
    });

    const container = document.getElementById('real-time-popup');
    const content = document.getElementById('real-time-popup-content');
    const closer = document.getElementById('real-time-popup-closer');
    this.overlay = new Overlay({
      element: container,
      offset: [0, -20],
      // autoPan: true,
      // autoPanAnimation: {
      //   duration: 250,
      // },
    });
    closer.onclick = () => {
      this.overlay.setPosition(undefined);
      closer.blur();
      return false;
    };

    const view = new View({
      center: this.center,
      zoom: 19,
      // extent,
      projection: prj,
      // resolutions,
    });
    this.mainLayer = new TileLayer({
      source: new XYZ({
        projection: prj,
        url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&scl=1&style=7',
      }),
    });
    this.map = new Map({
      layers: [this.mainLayer, this.realTimeLayer],
      keyboardEventTarget: document,
      overlays: [this.overlay],
      target: 'real-time-map',
      view,
      controls: [],
    });
    setTimeout(() => {
      this.monitor(this.car);
    }, 100);
    this.fitMap(this.realTimeSource);
  }

  fitMap(target: any) {
    const pointArr = [];
    const targetSource = target;
    targetSource.getFeatures().forEach((ele) => {
      pointArr.push(this.one(ele.getGeometry()));
    });
    // 假设第一个点为最合适的点
    const fit_point = pointArr[0];
    pointArr.forEach((point, index) => {
      // 最小经度
      if (point[0] < fit_point[0]) {
        fit_point[0] = point[0];
      }

      // 最小纬度
      if (point[1] < fit_point[1]) {
        fit_point[1] = point[1];
      }

      // 最大经度
      if (point[2] > fit_point[2]) {
        fit_point[2] = point[2];
      }

      // 最大纬度
      if (point[3] > fit_point[3]) {
        fit_point[3] = point[3];
      }
    });

    // 没有数据
    if (targetSource.getFeatures().length == 0) {
      return;
    }
    // 单个DOM
    else {
      this.map
        .getView()
        .centerOn(
          [(fit_point[2] - fit_point[0]) / 2 + fit_point[0], (fit_point[3] - fit_point[1]) / 2 + fit_point[1]],
          this.map.getSize(),
          [document.querySelector('#real-time-map').clientWidth / 2, document.querySelector('#real-time-map').clientHeight / 2],
        );
      // this.map.getView().setZoom(19);
    }
  }

  one(dom: any) {
    // 4点数组
    let one_p = null;
    // 类型
    const type = dom.getType();

    // 每个类型的坐标值
    let path = dom.getCoordinates();

    if (type == 'Point') {
      one_p = [path[0], path[1], path[0], path[1]];
    }
    // 多边形
    else if (type == 'Polygon') {
      const line_path = path[0];
      one_p = [line_path[0][0], line_path[0][1], line_path[0][0], line_path[0][1]];

      line_path.forEach((p, index) => {
        // 最小经度
        if (p[0] < one_p[0]) {
          one_p[0] = p[0];
        }
        // 最小纬度
        if (p[1] < one_p[1]) {
          one_p[1] = p[1];
        }

        // 最大经度
        if (p[0] > one_p[2]) {
          one_p[2] = p[0];
        }
        // 最大纬度
        if (p[1] > one_p[3]) {
          one_p[3] = p[1];
        }
      });
    }
    // 线
    else if (type == 'LineString') {
      one_p = [path[0][0], path[0][1], path[0][0], path[0][1]];

      path.forEach((p, index) => {
        // 最小经度
        if (p[0] < one_p[0]) {
          one_p[0] = p[0];
        }
        // 最小纬度
        if (p[1] < one_p[1]) {
          one_p[1] = p[1];
        }

        // 最大经度
        if (p[0] > one_p[2]) {
          one_p[2] = p[0];
        }
        // 最大纬度
        if (p[1] > one_p[3]) {
          one_p[3] = p[1];
        }
      });
    }
    // 圆
    else if (type == 'Circle') {
      path = dom.getCenter();
      one_p = [path[0], path[1], path[0], path[1]];
    }

    return one_p;
  }

  focusPoint(point: Coordinate) {
    this.map
      .getView()
      .centerOn(point, this.map.getSize(), [
        document.querySelector('#real-time-map').clientWidth / 2,
        document.querySelector('#real-time-map').clientHeight / 2,
      ]);

    // this.map.getView().setZoom(16);
  }

  destroyModal(): void {
    this.modal.destroy();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.overlay.setPosition(undefined);
  }
}
