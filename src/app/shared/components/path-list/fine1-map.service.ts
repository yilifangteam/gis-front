import { Injectable } from '@angular/core';
import { CacheService } from '@delon/cache';
import smooth from 'chaikin-smooth';
import { AnyNsRecord } from 'dns';
import { Extent } from 'ol/extent';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import LineString from 'ol/geom/LineString';
import MultiPolygon from 'ol/geom/MultiPolygon';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import { get } from 'ol/proj';
import { fromEPSG4326 } from 'ol/proj/epsg3857';
import { getVectorContext } from 'ol/render';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import { Fill, Icon, Stroke, Style, Text } from 'ol/style';
import View from 'ol/View';

/**
 * 每个组件单独引入，确保分离
 */
@Injectable()
export class Fine1MapService {
  /**
   * 地图中心，默认深圳
   */
  center = [12699989.526708398, 2577327.1035168194];
  map: Map;
  view: View;
  mainLayer: TileLayer;
  vectorLayer: VectorLayer;
  source: VectorSource;
  /**
   * 车
   */
  carSource: VectorSource;
  carLayer: VectorLayer;
  /**
   * 垃圾点
   */
  crapSource: VectorSource;
  crapLayer: VectorLayer;
  /**
   * 基地
   */
  baseSource: VectorSource;
  baseLayer: VectorLayer;
  /**
   * 中转
   */
  transferSource: VectorSource;
  transferLayer: VectorLayer;

  /**
   * 历史轨迹
   */
  historySource: VectorSource;
  historyLayer: VectorLayer;
  animatingPoint: Feature;

  /**
   * 实时轨迹
   */
  realTimeSource: VectorSource;
  realTimeLayer: VectorLayer;

  animating = false;
  styles;

  car;

  allMonitor: any = {};

  isShowName = true;
  overlay: Overlay;

  constructor(private cacheSrv: CacheService) {}

  get tips() {
    if (this.map) {
      return `缩放 ${this.map.getView().getZoom()} 分辨率 ${this.map.getView().getResolution()}`;
    }
    return '';
  }

  /**
   * 渲染基础map，锁定深圳地区限制
   */
  initMap(target = 'map') {
    const resolutions = []; // 分辨率数组
    const extent = [12665080.52765571, 2550703.6338763316, 12725465.780000998, 2601457.820657688] as Extent;
    const prj = get('EPSG:3857');
    const prjExtend = prj.getExtent();
    // 初始化分辨率数组
    for (let i = 0; i < 19; i++) {
      resolutions[i] = Math.pow(2, 18 - i);
    }
    this.source = new VectorSource({
      features: [],
    });
    this.vectorLayer = new VectorLayer({
      source: this.source,
    });

    this.carSource = new VectorSource({
      features: [],
    });
    this.carLayer = new VectorLayer({
      source: this.carSource,
    });

    this.crapSource = new VectorSource({
      features: [],
    });
    this.crapLayer = new VectorLayer({
      source: this.crapSource,
    });

    this.baseSource = new VectorSource({
      features: [],
    });
    this.baseLayer = new VectorLayer({
      source: this.baseSource,
    });

    this.transferSource = new VectorSource({
      features: [],
    });
    this.transferLayer = new VectorLayer({
      source: this.transferSource,
    });

    const container = document.getElementById('popup');
    const content = document.getElementById('popup-content');
    const closer = document.getElementById('popup-closer');
    this.overlay = new Overlay({
      element: container,
      autoPan: true,
      autoPanAnimation: {
        duration: 250,
      },
      offset: [0, -50],
    });
    closer.onclick = () => {
      this.overlay.setPosition(undefined);
      closer.blur();
      return false;
    };

    this.view = new View({
      center: this.center,
      zoom: 19,
      // extent,
      projection: prj,
      resolutions,
    });
    this.mainLayer = new TileLayer({
      source: new XYZ({
        projection: prj,
        url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&scl=1&style=7',
      }),
    });
    this.map = new Map({
      layers: [this.mainLayer, this.vectorLayer, this.carLayer, this.crapLayer, this.baseLayer, this.transferLayer],
      keyboardEventTarget: document,
      overlays: [this.overlay],
      target,
      view: this.view,
      controls: [], // defaultControls().extend([new ZoomSlider()]),
    });
  }

  showArea(geo: any[] = []) {
    if (geo.length == 0) {
      return false;
    }
    const features = [];
    geo.forEach((g) => {
      console.log(g);

      const lineData = g.features[0];
      let routeFeature;
      console.log(lineData.geometry.type);
      if (lineData.geometry.type == 'MultiPolygon') {
        routeFeature = new Feature({
          geometry: new MultiPolygon(lineData.geometry.coordinates).transform('EPSG:4326', 'EPSG:3857'),
        });
      } else if (lineData.geometry.type == 'Polygon') {
        routeFeature = new Feature({
          geometry: new Polygon(lineData.geometry.coordinates).transform('EPSG:4326', 'EPSG:3857'),
        });
      }
      routeFeature.setStyle(
        new Style({
          // fill: new Fill({
          //   color: '#4e98f444', // 填充颜色
          // }),
          stroke: new Stroke({
            width: 3, // 边界宽度
            color: [71, 137, 227, 1], // 边界颜色
          }),
        }),
      );
      features.push(routeFeature);
    });
    // 设置图层
    const routeLayer = new VectorLayer({
      source: new VectorSource({
        features,
      }),
    });
    // 添加图层
    this.map.addLayer(routeLayer);
  }

  makeSmooth(path, numIterations) {
    numIterations = Math.min(Math.max(numIterations, 1), 10);
    while (numIterations > 0) {
      path = smooth(path);
      numIterations--;
    }
    return path;
  }

  getDistance(p1, p2) {
    return Math.sqrt((p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1]));
  }
  smooth1(points, isLoop) {
    var len = points.length;
    var ret = [];
    var distance = 0;
    for (var i = 1; i < len; i++) {
      distance += this.getDistance(points[i - 1], points[i]);
    }
    var segs = distance / 2;
    segs = segs < len ? len : segs;
    for (var i = 0; i < segs; i++) {
      var pos = (i / (segs - 1)) * (isLoop ? len : len - 1);
      var idx = Math.floor(pos);
      var w = pos - idx;
      var p0;
      var p1 = points[idx % len];
      var p2;
      var p3;
      if (!isLoop) {
        p0 = points[idx === 0 ? idx : idx - 1];
        p2 = points[idx > len - 2 ? len - 1 : idx + 1];
        p3 = points[idx > len - 3 ? len - 1 : idx + 2];
      } else {
        p0 = points[(idx - 1 + len) % len];
        p2 = points[(idx + 1) % len];
        p3 = points[(idx + 2) % len];
      }
      var w2 = w * w;
      var w3 = w * w2;

      ret.push([this.interpolate(p0[0], p1[0], p2[0], p3[0], w, w2, w3), this.interpolate(p0[1], p1[1], p2[1], p3[1], w, w2, w3)]);
    }
    return ret;
  }

  interpolate(p0, p1, p2, p3, t, t2, t3) {
    var v0 = (p2 - p0) * 0.5;
    var v1 = (p3 - p1) * 0.5;
    return (2 * (p1 - p2) + v0 + v1) * t3 + (-3 * (p1 - p2) - 2 * v0 - v1) * t2 + v0 * t + p1;
  }

  clipMap(geoJson: any) {
    const formatGeoJSON = new GeoJSON({
      // featureProjection: 'EPSG:3857',
    });

    const features = formatGeoJSON.readFeatures(geoJson);
    let usaGeometry: any = features[0].getGeometry();
    const coords = usaGeometry.getCoordinates();
    let cds = [...coords[0]];
    const smoothened = this.makeSmooth(cds, 1);
    usaGeometry.setCoordinates([smoothened]);
    usaGeometry = usaGeometry.transform('EPSG:4326', 'EPSG:3857');
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
    else if (targetSource.getFeatures().length == 1) {
      this.map
        .getView()
        .centerOn([fit_point[0], fit_point[1]], this.map.getSize(), [document.body.clientWidth / 2, document.body.clientHeight / 2]);

      this.map.getView().setZoom(14);
    }
    // 多个dom
    else {
      // this.map.getView().fit(fit_point, {
      //   size: this.map.getSize(),
      //   padding: [100, 100, 100, 100],
      //   // constrainResolution: false,
      // });
      this.map
        .getView()
        .centerOn(
          [(fit_point[2] - fit_point[0]) / 2 + fit_point[0], (fit_point[3] - fit_point[1]) / 2 + fit_point[1]],
          this.map.getSize(),
          [document.body.clientWidth / 2, document.body.clientHeight / 2],
        );
      this.map.getView().setZoom(14);
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
      .centerOn(fromEPSG4326([point[0], point[1]]), this.map.getSize(), [document.body.clientWidth / 2, document.body.clientHeight / 2]);

    this.map.getView().setZoom(16);
  }

  /**
   * 展示车的位置
   */
  showCar(cars: any[]) {
    const carMarkers = [];

    cars.forEach((c) => {
      const f = new Feature({
        type: 'geoMarker',
        geometry: new Point(fromEPSG4326([c.longitude, c.latitude])),
      });
      let style = new Style({
        image: new Icon({
          // 比例 左上[0,0]  左下[0,1]  右下[1，1]
          anchor: [0.5, 1],
          src: c.iconPath,
          // imgSize: [54, 97],
          scale: 0.5,
          rotation: c.gpscourse,
        }),
      });
      if (this.isShowName) {
        style.setText(
          new Text({
            // 对其方式
            textAlign: 'center',
            // 基准线
            textBaseline: 'middle',
            offsetY: -50,
            // 文字样式
            font: 'normal 16px 黑体',
            // 文本内容
            text: c.carNum,
            // 文本填充样式
            fill: new Fill({
              color: 'rgba(255,255,255,1)',
            }),
            padding: [5, 15, 5, 15],
            backgroundFill: new Fill({
              color: 'rgba(0,0,0,0.6)',
            }),
          }),
        );
      }
      f.setStyle([style]);
      carMarkers.push(f);
    });
    this.carSource.clear();
    this.carSource.addFeatures(carMarkers);
  }

  /**
   * 展示车的实时轨迹
   */
  showRealTimeCar() {}

  showCarHistoryLine(car: any, speed = 60, linePath: any[]) {
    if (!this.historySource) {
      this.historyLayer = new VectorLayer();
      this.historySource = new VectorSource();
      this.historyLayer.setSource(this.historySource);
      this.map.addLayer(this.historyLayer);
    } else {
      this.historySource.clear();
    }
    const lineStyle = new Style({
      stroke: new Stroke({
        width: 10,
        color: '#459C50',
      }),
    });
    const pointStyle = new Style({
      image: new Icon({
        src: './assets/images/navigation.png',
        anchor: [0.5, 0.5],
        scale: 0.5,
        rotateWithView: true,
      }),
    });
    const textStyle = new Style({
      text: new Text({
        // 对其方式
        textAlign: 'center',
        // 基准线
        textBaseline: 'middle',
        offsetY: -30,
        // 文字样式
        font: 'normal 16px 黑体',
        // 文本内容
        text: car.carNum,
        // 文本填充样式
        fill: new Fill({
          color: 'rgba(255,255,255,1)',
        }),
        padding: [5, 15, 5, 15],
        backgroundFill: new Fill({
          color: 'rgba(0,0,0,0.6)',
        }),
      }),
    });
    if (linePath && linePath.length > 0) {
      const lineData = linePath.map((c) => fromEPSG4326([c.longitude, c.latitude]));
      // 画初始点
      this.animatingPoint = new Feature({
        type: 'initialPoint',
        geometry: new Point(lineData[0]),
      });
      this.animatingPoint.setStyle(pointStyle);
      this.historySource.addFeature(this.animatingPoint);

      // 画线

      const line = new Feature({
        type: 'line',
        geometry: new LineString(lineData),
      });
      line.setStyle(lineStyle);
      this.historySource.addFeature(line);
    }
  }

  /**
   * 垃圾点
   */
  showCrapSite(craps: any[] = []) {
    const crapMarkers = [];

    craps.forEach((c) => {
      const f = new Feature({
        type: 'crapMarker',
        geometry: new Point(fromEPSG4326([c.longitude, c.latitude])),
      });
      let style = new Style({
        image: new Icon({
          // 比例 左上[0,0]  左下[0,1]  右下[1，1]
          anchor: [0.5, 1],
          src: c.iconPath,
          // imgSize: [54, 97],
          scale: 0.5,
          rotation: c.gpscourse,
        }),
      });
      if (this.isShowName) {
        style.setText(
          new Text({
            // 对其方式
            textAlign: 'center',
            // 基准线
            textBaseline: 'middle',
            offsetY: -40,
            // 文字样式
            font: 'normal 16px 黑体',
            // 文本内容
            text: c.Name,
            // 文本填充样式
            fill: new Fill({
              color: 'rgba(255,255,255,1)',
            }),
            padding: [5, 15, 5, 15],
            backgroundFill: new Fill({
              color: '#48C23D',
            }),
          }),
        );
      }
      f.setStyle([style]);
      crapMarkers.push(f);
    });
    this.crapSource.clear();
    this.crapSource.addFeatures(crapMarkers);
  }

  /**
   * 基地
   */
  showBase(bases: any[] = []) {
    const baseMarkers = [];

    bases.forEach((c) => {
      const f = new Feature({
        type: 'baseMarker',
        geometry: new Point(fromEPSG4326([c.longitude, c.latitude])),
      });
      let style = new Style({
        image: new Icon({
          // 比例 左上[0,0]  左下[0,1]  右下[1，1]
          anchor: [0.5, 1],
          src: c.iconPath || './assets/images/base.svg',
          // imgSize: [54, 97],
          scale: 0.5,
          rotation: c.gpscourse,
        }),
      });
      if (this.isShowName) {
        style.setText(
          new Text({
            // 对其方式
            textAlign: 'center',
            // 基准线
            textBaseline: 'middle',
            offsetY: -40,
            // 文字样式
            font: 'normal 16px 黑体',
            // 文本内容
            text: c.plantName,
            // 文本填充样式
            fill: new Fill({
              color: 'rgba(255,255,255,1)',
            }),
            padding: [5, 15, 5, 15],
            backgroundFill: new Fill({
              color: '#239DD5',
            }),
          }),
        );
      }
      f.setStyle([style]);
      baseMarkers.push(f);
    });
    this.baseSource.clear();
    this.baseSource.addFeatures(baseMarkers);
  }

  /**
   * 中转
   */
  showTransfer(transfers: any[] = []) {
    // const baseMarkers = [];
    // bases.forEach((c) => {
    //   const f = new Feature({
    //     type: 'baseMarker',
    //     geometry: new Point(fromEPSG4326([c.longitude, c.latitude])),
    //   });
    //   f.setStyle([
    //     new Style({
    //       text: new Text({
    //         // 对其方式
    //         textAlign: 'center',
    //         // 基准线
    //         textBaseline: 'middle',
    //         offsetY: -50,
    //         // 文字样式
    //         font: 'normal 16px 黑体',
    //         // 文本内容
    //         text: c.plantName,
    //         // 文本填充样式
    //         fill: new Fill({
    //           color: 'rgba(255,255,255,1)',
    //         }),
    //         padding: [5, 15, 5, 15],
    //         backgroundFill: new Fill({
    //           color: 'rgba(0,0,0,0.6)',
    //         }),
    //       }),
    //       image: new Icon({
    //         // 比例 左上[0,0]  左下[0,1]  右下[1，1]
    //         anchor: [0.5, 1],
    //         src: c.iconPath || './assets/images/base.svg',
    //         // imgSize: [54, 97],
    //         scale: 0.5,
    //         rotation: c.gpscourse,
    //       }),
    //     }),
    //   ]);
    //   baseMarkers.push(f);
    // });
    // this.baseSource.clear();
    // this.baseSource.addFeatures(baseMarkers);
  }
}
