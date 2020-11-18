import { Injectable } from '@angular/core';
import { AfterViewInit, Component, OnInit } from '@angular/core';
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
import Point from 'ol/geom/Point';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import Map from 'ol/Map';
import { get } from 'ol/proj';
import { fromEPSG4326, toEPSG4326 } from 'ol/proj/epsg3857';
import { getVectorContext } from 'ol/render';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import { Circle as CircleStyle, Fill, Icon, Stroke, Style } from 'ol/style';
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
  constructor() {}

  /**
   * 渲染基础map，锁定深圳地区限制
   */
  initMap() {
    const resolutions = []; // 分辨率数组
    const extent = [12665080.52765571, 2550703.6338763316, 12725465.780000998, 2601457.820657688] as Extent;
    const prj = get('EPSG:3857');
    const prjExtend = prj.getExtent();
    // 初始化分辨率数组
    for (let i = 0; i < 19; i++) {
      resolutions[i] = Math.pow(2, 18 - i);
    }

    const view = new View({
      center: this.center,
      zoom: 8,
      extent,
      projection: prj,
      resolutions,
    });
    this.map = new Map({
      layers: [
        new TileLayer({
          source: new XYZ({
            projection: prj,
            url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=0.5&scl=1&style=7',
          }),
        }),
      ],
      keyboardEventTarget: document,
      target: 'map',
      view,
      controls: [], // defaultControls().extend([new ZoomSlider()]),
    });
  }
}
