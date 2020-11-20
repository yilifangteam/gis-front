import { Injectable } from '@angular/core';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CacheService } from '@delon/cache';
import { _HttpClient } from '@delon/theme';
import polyline from '@mapbox/polyline';
import { defaults as defaultControls } from 'ol/control';
import { ZoomSlider } from 'ol/control';
import { Extent, getBottomLeft } from 'ol/extent';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import Polyline from 'ol/format/Polyline';
import Geometry from 'ol/geom/Geometry';
import GeometryLayout from 'ol/geom/GeometryLayout';
import LineString from 'ol/geom/LineString';
import MultiPoint from 'ol/geom/MultiPoint';
import MultiPolygon from 'ol/geom/MultiPolygon';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
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
  animating = false;
  styles;

  car;

  allMonitor: any = {};

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

    this.view = new View({
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
      layers: [this.mainLayer, this.vectorLayer],
      keyboardEventTarget: document,
      target,
      view: this.view,
      controls: [], // defaultControls().extend([new ZoomSlider()]),
    });
    this.fitMap();
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

  clipMap(geoJson: any) {
    const formatGeoJSON = new GeoJSON({
      featureProjection: 'EPSG:3857',
    });
    const features = formatGeoJSON.readFeatures(geoJson);
    const usaGeometry = features[0].getGeometry();
    const fExtent = usaGeometry.getExtent();
    // this.view.fit(fExtent);
    this.fitMap();
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

  fitMap() {
    const pointArr = [];
    this.source.getFeatures().forEach((ele) => {
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
    if (this.source.getFeatures().length == 0) {
      return;
    }
    // 单个DOM
    else if (this.source.getFeatures().length == 1) {
      this.map
        .getView()
        .centerOn([fit_point[0], fit_point[1]], this.map.getSize(), [document.body.clientWidth / 2, document.body.clientHeight / 2]);

      this.map.getView().setZoom(12);
    }
    // 多个dom
    else {
      this.map.getView().fit(fit_point, {
        size: this.map.getSize(),
        padding: [100, 100, 100, 100],
        // constrainResolution: false,
      });
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
      f.setStyle([
        new Style({
          text: new Text({
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
          image: new Icon({
            // 比例 左上[0,0]  左下[0,1]  右下[1，1]
            anchor: [0.5, 1],
            src: c.iconPath,
            // imgSize: [54, 97],
            scale: 0.5,
            rotation: c.gpscourse,
          }),
        }),
      ]);
      carMarkers.push(f);
    });
    this.source.clear();
    this.source.addFeatures(carMarkers);
  }

  /**
   * 展示车的实时轨迹
   */
  showRealTimeCar() {}

  showCarHistoryLine(car: any) {}
}
