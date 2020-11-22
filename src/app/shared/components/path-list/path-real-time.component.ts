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

    <div>123456</div>
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

  private _car;
  @Input()
  set car(val) {
    this._car = val;
    const el = document.querySelector('#real-time-map');
    this.oldPoint = fromEPSG4326([val.longitude, val.latitude]);
    this.newPoint = fromEPSG4326([val.longitude, val.latitude]);
    setTimeout(() => {
      this.initMap();
      setInterval(() => {
        this.monitor(val);
      }, 1000);
      // this.mapDataSrv
      //   .getCarRealTimeGps()
      //   .pipe(takeUntil(this.destroy$))
      //   .subscribe((data) => {
      //     if (data && data.length > 0) {
      //       // const d = data.find((x) => x.imei === this._car?.imei);
      //       // if (d) {
      //       // this.polyLine.push(fromEPSG4326([d.longitude, d.latitude]));
      //       this.monitor(data[0]);
      //       // }
      //     }
      //   });
    }, 50);
  }

  oldPoint: Coordinate = [0, 0];
  newPoint: Coordinate = [0, 0];
  constructor(private modal: NzModalRef, private mapDataSrv: MapDataService, private modalSrv: NzModalService, private http: _HttpClient) {}
  monitor(d) {
    this.oldPoint = (this.geoMarker.getGeometry() as any).getFlatCoordinates();

    this.newPoint = fromEPSG4326([d.longitude, d.latitude]);

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
    const line = this.lineMarker.getGeometry() as LineString;
    line.appendCoordinate(this.newPoint);

    // this.fitMap(this.realTimeSource);
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
      target: 'real-time-map',
      view,
      controls: [],
    });

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
      this.map.getView().setZoom(19);
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

  focusPoint(point: [number, number]) {
    this.map
      .getView()
      .centerOn(fromEPSG4326([point[0], point[1]]), this.map.getSize(), [
        document.querySelector('#history-map').clientWidth / 2,
        document.querySelector('#history-map').clientHeight / 2,
      ]);

    this.map.getView().setZoom(16);
  }

  destroyModal(): void {
    this.modal.destroy();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
