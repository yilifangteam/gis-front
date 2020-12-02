import { Component, Input } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { MapDataService } from '@service/common/map.data.service';
import { format } from 'date-fns';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { defaults as defaultControls } from 'ol/control';
import { ZoomSlider } from 'ol/control';
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

@Component({
  selector: 'app-path-history',
  template: `
    <div id="history-map" class="map"></div>
    <nz-space nzAlign="center" class="mtb16">
      <nz-space-item>
        <label for="speed">
          回放速度:&nbsp;
          <input id="speed" type="range" min="10" max="999" step="10" value="60" />
        </label>
        <!-- <img src="./assets/images/navigation.png" /> -->
        <button nz-button nzType="primary" nzSize="small" id="start-animation" (click)="startAnimation()">回放</button>
      </nz-space-item>
      <nz-space-item>
        <nz-range-picker
          [nzAllowClear]="false"
          nzDropdownClassName="fine1-rp"
          [nzShowTime]="true"
          [(ngModel)]="date"
          (ngModelChange)="dateOnChange($event)"
        ></nz-range-picker>
      </nz-space-item>
    </nz-space>

    <nz-table #dataTable nzSize="small" [nzData]="pointList" nzPageSize="50" [nzScroll]="{ y: '240px' }">
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
          <td>{{ car?.carNum }}</td>
          <td>{{ data.time || now | _date }}</td>
          <td>{{ data.speed || 0 | round }}km/h</td>
          <td>{{ data.longitude }}</td>
          <td>{{ data.latitude }}</td>
        </tr>
      </tbody>
    </nz-table>
    <div id="history-time-popup" class="ol-popup">
      <a href="#" id="history-time-popup-closer" class="ol-popup-closer"></a>
      <div id="history-time-popup-content">
        <p>车牌：{{ car?.carNum }}</p>
        <p>时间：{{ newData?.time || now | _date }}</p>
        <p>速度：{{ newData?.speed || 0 | round }}km/h</p>
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
      .mtb16{
        margin-top:16px;
        margin-bottom:16px;
      }
      #history-map {
        width: 100%;
        height: 400px;
        bac
        kground-color: #f7f7f7;
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
        display:none;
        min-width: 280px;
      }
      #history-time-popup-content {
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
export class PathHistoryComponent {
  date = [new Date(new Date().setHours(0, 0, 0, 0)), new Date(new Date().setHours(0, 0, 0, 0) + 24 * 60 * 60 * 1000 - 1)];
  animating = false;
  speed;
  now;
  speedInput;
  startButton;
  map;
  geoMarker: Feature;
  routeFeature: Feature;
  startMarker: Feature;
  endMarker: Feature;
  mainLayer: TileLayer;
  center;
  routeCoords;
  routeLength;
  styles;

  /**
   * 历史轨迹
   */
  historySource: VectorSource;
  historyLayer;
  pointList: any[] = [];
  polyLine: any;
  overlay: Overlay;
  currentPointIndex = 0;
  private _car;
  @Input()
  set car(val) {
    if (this._car != val) {
      this._car = val;
      this.query();
    }
  }

  get car() {
    return this._car;
  }

  newData: any;
  constructor(private modal: NzModalRef, private mapDataSrv: MapDataService, private modalSrv: NzModalService, private http: _HttpClient) {
    // this.modal.afterOpen.subscribe((x) => {
    //   this.initMap();
    // });
  }

  query() {
    this.http
      .post('https://garbagesortingcity.fine1.com.cn/8888/influxdb/health/selectByTable', {
        // comCode: 'cus000001cus000007',
        // tbName: 'carGps',
        // timePoliy: '天',
        carNum: this.car.carNum,
        startDate: format(this.date[0], 'yyyy-MM-dd HH:mm:ss'),
        endDate: format(this.date[1], 'yyyy-MM-dd HH:mm:ss'),
      })
      .subscribe((d: any[]) => {
        if (Array.isArray(d) && d.length > 0) {
          const l = d.map((j) => fromEPSG4326([j.longitude, j.latitude]));

          this.pointList = d;
          this.newData = d[0];
          // this.polyLine = new Feature({
          //   opt_geometryOrProperties: new LineString(l, GeometryLayout.XYZ),
          // });
          this.polyLine = new LineString(l, GeometryLayout.XYZ);
          if (this.map) {
            this.resetData();
          } else {
            const el = document.querySelector('#history-map');
            if (el) {
              this.initMap();
            } else {
              setTimeout(() => {
                this.initMap();
              }, 50);
            }
          }
        } else {
          this.modalSrv.warning({ nzTitle: '该车辆暂无历史数据', nzZIndex: 1030 });
        }
      });
  }

  resetData() {
    const route = this.polyLine;
    this.routeCoords = route.getCoordinates();
    this.routeLength = this.routeCoords.length;
    this.routeFeature.setGeometry(route);
    this.geoMarker.setGeometry(new Point(this.routeCoords[0]));
    this.startMarker.setGeometry(new Point(this.routeCoords[0]));
    this.endMarker.setGeometry(new Point(this.routeCoords[this.routeLength - 1]));
    this.fitMap(this.historySource);
    setTimeout(() => {
      this.overlay.setPosition(this.routeCoords[this.currentPointIndex]);
    }, 100);
  }

  initMap() {
    const resolutions = []; // 分辨率数组
    const tileSize = 256;
    const extent = [12665080.52765571, 2550703.6338763316, 12725465.780000998, 2601457.820657688] as Extent;
    const prj = get('EPSG:3857');
    const prjExtend = prj.getExtent();
    this.center = [12699989.526708398, 2577327.1035168194];

    // 初始化分辨率数组
    for (let i = 0; i < 19; i++) {
      resolutions[i] = Math.pow(2, 18 - i);
    }
    const route = this.polyLine;
    this.routeCoords = route.getCoordinates();
    this.routeLength = this.routeCoords.length;

    this.routeFeature = new Feature({
      type: 'route',
      geometry: route,
    });
    this.geoMarker = new Feature({
      type: 'geoMarker',
      geometry: new Point(this.routeCoords[0]),
    });
    this.startMarker = new Feature({
      type: 'start',
      geometry: new Point(this.routeCoords[0]),
    });
    this.endMarker = new Feature({
      type: 'end',
      geometry: new Point(this.routeCoords[this.routeLength - 1]),
    });

    this.styles = {
      route: new Style({
        stroke: new Stroke({
          width: 6,
          color: '#459C50',
        }),
      }),
      start: new Style({
        image: new Icon({
          anchor: [0.5, 1],
          src: './assets/images/mark.svg',
          scale: 0.4,
        }),
        text: new Text({
          // 对其方式
          textAlign: 'center',
          // 基准线
          textBaseline: 'middle',
          offsetY: -30,
          // 文字样式
          font: 'normal 16px 黑体',
          // 文本内容
          text: '始点',
          // 文本填充样式
          fill: new Fill({
            color: 'rgba(255,255,255,1)',
          }),
          padding: [5, 15, 5, 15],
          backgroundFill: new Fill({
            color: 'rgba(0,0,0,0.6)',
          }),
        }),
      }),
      end: new Style({
        image: new Icon({
          anchor: [0.5, 1],
          src: './assets/images/mark.svg',
          scale: 0.4,
        }),
        text: new Text({
          // 对其方式
          textAlign: 'center',
          // 基准线
          textBaseline: 'middle',
          offsetY: -30,
          // 文字样式
          font: 'normal 16px 黑体',
          // 文本内容
          text: '终点',
          // 文本填充样式
          fill: new Fill({
            color: 'rgba(255,255,255,1)',
          }),
          padding: [5, 15, 5, 15],
          backgroundFill: new Fill({
            color: 'rgba(0,0,0,0.6)',
          }),
        }),
      }),
      geoMarker: new Style({
        image: new Icon({
          src: './assets/images/navigation.png',
          anchor: [0.5, 0.5],
          scale: 0.3,
          rotateWithView: true,
        }),
      }),
    };
    this.routeFeature.setStyle(this.styles.route);
    this.geoMarker.setStyle(this.styles.geoMarker);
    this.startMarker.setStyle(this.styles.start);
    this.endMarker.setStyle(this.styles.end);

    const container = document.getElementById('history-time-popup');
    const content = document.getElementById('history-time-popup-content');
    const closer = document.getElementById('history-time-popup-closer');
    container.style.display = 'block';
    this.overlay = new Overlay({
      element: container,
      autoPan: true,
      autoPanAnimation: {
        duration: 250,
      },
    });
    closer.onclick = () => {
      this.overlay.setPosition(undefined);
      closer.blur();
      return false;
    };

    this.animating = false;

    this.speedInput = document.getElementById('speed');
    this.startButton = document.getElementById('start-animation');
    this.historySource = new VectorSource({
      features: [this.routeFeature, this.geoMarker, this.startMarker, this.endMarker],
    });
    this.historyLayer = new VectorLayer({
      source: this.historySource,
      // style: (feature) => {
      //   // if (this.animating && feature.get('type') === 'geoMarker') {
      //   //   return null;
      //   // }
      //   const tStyles = [this.styles[feature.get('type')]];

      //   return tStyles;
      // },
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
      layers: [this.mainLayer, this.historyLayer],
      overlays: [this.overlay],
      keyboardEventTarget: document,
      target: 'history-map',
      view,
      controls: [],
    });
    // this.mapDataSrv.getShenzhenGeo().subscribe((x) => {
    //   // this.fine1MapSrv.showArea(x);
    //   this.clipMap(x);
    //   this.fitMap(this.historySource);
    // });
    this.fitMap(this.historySource);
    setTimeout(() => {
      this.overlay.setPosition(this.routeCoords[this.currentPointIndex]);
    }, 100);
  }

  dateOnChange($event) {
    this.query();
  }

  moveFeature(event) {
    const vectorContext = getVectorContext(event);
    const frameState = event.frameState;

    if (this.animating) {
      const elapsedTime = frameState.time - this.now;

      const index = Math.round((this.speed * elapsedTime) / 1000);

      if (index >= this.routeLength) {
        this.stopAnimation(true);
        return;
      }

      const currentPoint = new Point(this.routeCoords[index]);
      const feature = new Feature(currentPoint);
      let rotation = 0;
      if (index > 0) {
        const start = this.routeCoords[index - 1];
        const end = this.routeCoords[index];
        // 90度的PI值
        const pi90 = Math.atan2(1, 0);
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        rotation = pi90 - Math.atan2(dy, dx);
      }
      this.currentPointIndex = index;
      this.newData = this.pointList[this.currentPointIndex];
      this.overlay.setPosition(this.routeCoords[this.currentPointIndex]);
      vectorContext.drawFeature(
        feature,
        new Style({
          image: new Icon({
            src: './assets/images/navigation.png',
            anchor: [0.5, 0.5],
            scale: 0.3,
            rotateWithView: true,
            rotation,
          }),
        }),
      );

      // this.focusPoint(this.routeCoords[index]);
    }
    this.map.render();
  }

  startAnimation() {
    this.fitMap(this.historySource);
    if (this.animating) {
      this.stopAnimation(false);
    } else {
      this.animating = true;
      this.now = new Date().getTime();
      this.speed = this.speedInput.value;
      this.startButton.textContent = '取消回放';
      this.geoMarker.setStyle(null);
      // this.geoMarker.setGeometry(undefined);
      // this.map.getView().setCenter(this.center);
      this.historyLayer.on('postrender', (event) => this.moveFeature(event));
      this.map.render();
    }
  }
  stopAnimation(ended) {
    this.animating = false;
    this.startButton.textContent = '回放';
    // this.geoMarker.setStyle(this.styles.geoMarker);
    this.geoMarker.setGeometry(new Point(this.routeCoords[this.currentPointIndex]));
    this.currentPointIndex = 0;
    this.overlay.setPosition(this.routeCoords[this.currentPointIndex]);
    this.historyLayer.un('postrender', (event) => this.moveFeature(event));
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
          [document.querySelector('#history-map').clientWidth / 2, document.querySelector('#history-map').clientHeight / 2],
        );
      this.map.getView().setZoom(14);
    }
    // if (targetSource.getFeatures().length == 1) {
    //   this.map
    //     .getView()
    //     .centerOn([fit_point[0], fit_point[1]], this.map.getSize(), [
    //       document.querySelector('#history-map').clientWidth / 2,
    //       document.querySelector('#history-map').clientHeight / 2,
    //     ]);

    //   this.map.getView().setZoom(12);
    // }
    // // 多个dom
    // else {
    //   // this.map.getView().fit(fit_point, {
    //   //   size: this.map.getSize(),
    //   //   padding: [100, 100, 100, 100],
    //   //   // constrainResolution: false,
    //   // });
    //   this.map
    //     .getView()
    //     .centerOn(
    //       [(fit_point[2] - fit_point[0]) / 2 + fit_point[0], (fit_point[3] - fit_point[1]) / 2 + fit_point[1]],
    //       this.map.getSize(),
    //       [document.querySelector('#history-map').clientWidth / 2, document.querySelector('#history-map').clientHeight / 2],
    //     );
    //   this.map.getView().setZoom(14);
    // }
  }

  clipMap(geoJson: any) {
    const formatGeoJSON = new GeoJSON({
      featureProjection: 'EPSG:3857',
    });
    const features = formatGeoJSON.readFeatures(geoJson);
    const usaGeometry = features[0].getGeometry();
    const fExtent = usaGeometry.getExtent();
    // this.view.fit(fExtent);
    // this.fitMap();
    const fillStyle = new Fill({
      color: [0, 0, 0, 0],
    });
    const styleVC = new Style({
      fill: fillStyle,
    });
    // For openlayers v6.0+:
    // osm.on('prerender', function (event) {
    this.mainLayer.on('prerender', (event) => {
      const ctx = event.context;
      const pixelRatio = event.frameState.pixelRatio;
      // For openlayers v6.0+:
      const vecCtx = getVectorContext(event);
      // const vecCtx = event.vectorContext;
      ctx.save();
      vecCtx.setStyle(styleVC);
      vecCtx.drawGeometry(usaGeometry);
      ctx.lineWidth = 5 * pixelRatio;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.stroke();
      ctx.clip();
    });
    // For openlayers v6.0+:
    // osm.on('postrender', function (event) {
    this.mainLayer.on('postrender', (event) => {
      const ctx = event.context;
      ctx.restore();
    });
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
}
