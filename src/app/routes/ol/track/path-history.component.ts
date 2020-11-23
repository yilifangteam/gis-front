import { Component, Input, OnInit } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { MapDataService } from '@service/common/map.data.service';
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
import { Circle, Circle as CircleStyle, Fill, Icon, Stroke, Style, Text } from 'ol/style';
import TileGrid from 'ol/tilegrid/TileGrid';
import View from 'ol/View';

@Component({
  selector: 'track-path-history',
  template: `
    <div id="history-map" class="map"></div>
    <div id="popup" class="ol-popup">
      <a href="#" id="popup-closer" class="ol-popup-closer"></a>
      <div id="popup-content">
        <p>车牌：{{ baseData?.vehicle }}</p>
        <p>温度：{{ baseData?.list[currentPointIndex]?.Temp1 }}℃</p>
        <p>湿度：{{ baseData?.list[currentPointIndex]?.Temp2 }}%</p>
        <p>时间：{{ baseData?.list[currentPointIndex]?.GPSTime }}</p>
        <p>位置：{{ baseData?.list[currentPointIndex]?.PlaceName }}</p>
      </div>
    </div>
    <label for="speed" style="display:none">
      speed:&nbsp;
      <input id="speed" type="range" min="0" max="999" step="10" value="5" />
    </label>
    <!-- <img src="./assets/images/navigation.png" /> -->
    <button style="display:none" nz-button nzType="primary" id="start-animation" (click)="startAnimation()">回放</button>
    <nz-table
      #headerTable
      class="f-table"
      nzSize="small"
      [nzData]="baseData?.list"
      [nzShowPagination]="false"
      [nzBordered]="true"
      [nzPageSize]="9999"
      [nzScroll]="{ y: '240px' }"
    >
      <thead>
        <tr>
          <th>车牌</th>
          <th>温度</th>
          <th>湿度</th>
          <th>时间</th>
          <th>位置</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let data of headerTable.data">
          <td>{{ baseData?.vehicle }}</td>
          <td>{{ data.Temp1 }}℃</td>
          <td>{{ data.Temp2 }}%</td>
          <td>{{ data.GPSTime }}</td>
          <td>{{ data.PlaceName }}</td>
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
      #history-map {
        width: 100%;
        height: 400px;
        background-color: #f7f7f7;
      }
      .f-table {
        border: 1px solid #cccccc;
        margin-bottom: 8px;
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
      #popup-content {
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
      .fine1-infinite-container {
        height: 300px;
        border: 1px solid #e8e8e8;
        border-radius: 4px;
      }
    `,
  ],
  providers: [],
})
export class TrackPathHistoryComponent implements OnInit {
  animating = false;
  speed;
  now;
  speedInput;
  startButton;
  map;
  geoMarker: Feature;
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

  route;
  polyLine: any;
  baseData: any;
  overlay: Overlay;
  currentPointIndex = 0;
  constructor(private mapDataSrv: MapDataService, private modalSrv: NzModalService, private http: _HttpClient) {}
  ngOnInit(): void {
    // this.http
    //   .post('https://garbagesortingcity.fine1.com.cn/8888/influxdb/health/selectByTable', {
    //     comCode: 'cus000001cus000007',
    //     tbName: 'carGps',
    //     timePoliy: '天',
    //     carNum: '粤BDL1013',
    //   })
    //   .subscribe((d: any[]) => {
    //     if (d) {
    //       const l = d.map((j) => fromEPSG4326([j.longitude, j.latitude]));
    //       // this.polyLine = new Feature({
    //       //   opt_geometryOrProperties: new LineString(l, GeometryLayout.XYZ),
    //       // });
    //       this.polyLine = new LineString(l, GeometryLayout.XYZ);
    //       this.initMap();
    //     } else {
    //       this.modalSrv.warning({ nzTitle: '该车辆暂无历史数据', nzZIndex: 1030 });
    //     }
    //   });
    this.http.get('./assets/tmp/mock-path.json').subscribe((d: any) => {
      if (d) {
        this.baseData = d;
        const l = d.list.map((j) => fromEPSG4326([j.Lon, j.Lat]));
        // this.polyLine = new Feature({
        //   opt_geometryOrProperties: new LineString(l, GeometryLayout.XYZ),
        // });
        this.polyLine = new LineString(l, GeometryLayout.XYZ);
        this.initMap();
      } else {
        this.modalSrv.warning({ nzTitle: '该车辆暂无历史数据', nzZIndex: 1030 });
      }
    });
  }

  initMap() {
    const prj = get('EPSG:3857');
    const prjExtend = prj.getExtent();
    this.center = [12699989.526708398, 2577327.1035168194];

    const route = this.polyLine;
    this.routeCoords = route.getCoordinates();
    this.routeLength = this.routeCoords.length;

    const routeFeature = new Feature({
      type: 'route',
      geometry: route,
    });
    this.geoMarker = new Feature({
      type: 'geoMarker',
      geometry: new Point(this.routeCoords[0]),
    });
    const startMarker = new Feature({
      type: 'start',
      geometry: new Point(this.routeCoords[0]),
    });
    const endMarker = new Feature({
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
          offsetX: -15,
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
          offsetX: 15,
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
        // text: new Text({
        //   // 对其方式
        //   textAlign: 'center',
        //   // 基准线
        //   textBaseline: 'middle',
        //   offsetY: -50,
        //   // 文字样式
        //   font: 'normal 16px 黑体',
        //   // 文本内容
        //   text: this.baseData.vehicle,
        //   // 文本填充样式
        //   fill: new Fill({
        //     color: 'rgba(255,255,255,1)',
        //   }),
        //   padding: [5, 15, 5, 15],
        //   backgroundFill: new Fill({
        //     color: 'rgba(0,0,0,0.6)',
        //   }),
        // }),
      }),
    };

    const container = document.getElementById('popup');
    const content = document.getElementById('popup-content');
    const closer = document.getElementById('popup-closer');
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
      features: [routeFeature, this.geoMarker, startMarker, endMarker],
    });
    this.historyLayer = new VectorLayer({
      source: this.historySource,
      style: (feature) => {
        if (this.animating && feature.get('type') === 'geoMarker') {
          return null;
        }
        const tStyles = [this.styles[feature.get('type')]];

        return tStyles;
      },
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

    setTimeout(() => {
      this.startAnimation();
    }, 1000);
  }

  moveFeature(event) {
    const vectorContext = getVectorContext(event);
    const frameState = event.frameState;

    if (this.animating) {
      const elapsedTime = frameState.time - this.now;

      const index = Math.round((0.8 * elapsedTime) / 1000);

      if (index >= this.routeLength) {
        this.stopAnimation(true);
        setTimeout(() => {
          this.startAnimation();
        }, 1000 * 5);
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
      const d = this.baseData.list[index];
      this.currentPointIndex = index;
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
      // this.map.getView().setCenter(this.center);
      this.historyLayer.on('postrender', (event) => this.moveFeature(event));
      this.map.render();
    }
  }
  stopAnimation(ended) {
    this.animating = false;
    this.startButton.textContent = '回放';
    this.geoMarker.setStyle(this.styles.geoMarker);
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
      this.map.getView().setZoom(7);
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

  destroyModal(): void {}
}
