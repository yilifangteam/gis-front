import { Injectable } from '@angular/core';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CacheService } from '@delon/cache';
import { _HttpClient } from '@delon/theme';
import polyline from '@mapbox/polyline';
import { defaults as defaultControls } from 'ol/control';
import { ZoomSlider } from 'ol/control';
import { Extent, getBottomLeft } from 'ol/extent';
import Feature from 'ol/Feature';
import Polyline from 'ol/format/Polyline';
import Geometry from 'ol/geom/Geometry';
import GeometryLayout from 'ol/geom/GeometryLayout';
import LineString from 'ol/geom/LineString';
import MultiPoint from 'ol/geom/MultiPoint';
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

    const view = new View({
      center: this.center,
      zoom: 12,
      extent,
      projection: prj,
      // resolutions,
    });
    this.map = new Map({
      layers: [
        new TileLayer({
          source: new XYZ({
            projection: prj,
            url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&scl=1&style=7',
          }),
        }),
        this.vectorLayer,
      ],
      keyboardEventTarget: document,
      target,
      view,
      controls: [], // defaultControls().extend([new ZoomSlider()]),
    });
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
