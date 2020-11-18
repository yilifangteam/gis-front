import { Injectable } from '@angular/core';
import { Feature } from 'ol';
import { defaults as defaultControls, ZoomSlider } from 'ol/control';
import Attribution from 'ol/control/Attribution';
import FullScreen from 'ol/control/FullScreen';
import { Extent, getBottomLeft } from 'ol/extent';
import GeometryLayout from 'ol/geom/GeometryLayout';
import Point from 'ol/geom/Point';
import { defaults as defaultInteractions, PinchZoom } from 'ol/interaction';
import TileLayer from 'ol/layer/Tile';
import LayerTile from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import Map from 'ol/Map';
import { fromLonLat } from 'ol/proj';
import { get } from 'ol/proj/projections';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import { Icon, Style } from 'ol/style';
import TileGrid from 'ol/tilegrid/TileGrid';
import View from 'ol/View';

import { AMapVec } from './amap.source';

/***
 * 
 *   高德新版的参数：

lang可以通过zh_cn设置中文，en设置英文；
size基本无作用；
scl设置标注还是底图，scl=1代表注记，scl=2代表底图（矢量或者影像）；
style设置影像和路网，style=6为影像图，style=7为矢量路网，style=8为影像路网。
    总结之：

http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7 为矢量图（含路网、含注记）
http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=2&style=7 为矢量图（含路网，不含注记）
http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=6 为影像底图（不含路网，不含注记）
http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=2&style=6 为影像底图（不含路网、不含注记）
http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=8 为影像路图（含路网，含注记）
http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=2&style=8 为影像路网（含路网，不含注记）
 * 
 */

@Injectable({
  providedIn: 'root',
})
export class GeoService {
  /** OL-Map. */
  readonly map: Map;
  /**
   * Initialise the map.
   */
  constructor() {
    const place = [114.065344, 22.540882];

    const point = new Point(place, GeometryLayout.XY);

    // 创建图标样式
    const iconStyle = new Style({
      image: new Icon({
        opacity: 0.75,
        src: './assets/images/garbage_truck.png',
      }),
    });

    const rome = new Feature({
      geometry: new Point(fromLonLat([114.064593, 22.540454])),
    });
    rome.setStyle(
      new Style({
        image: new Icon({
          // color: 'green',
          rotateWithView: false,
          scale: 0.05,
          crossOrigin: 'anonymous',
          rotation: 0,
          // For Internet Explorer 11
          // imgSize: [90, 90],
          src: './assets/images/garbage_truck.png',
        }),
      }),
    );

    const rome1 = new Feature({
      geometry: new Point(fromLonLat([114.067683, 22.538561])),
    });
    rome1.setStyle(
      new Style({
        image: new Icon({
          // color: 'green',
          rotateWithView: false,
          scale: 0.05,
          crossOrigin: 'anonymous',
          rotation: 1.5,
          // For Internet Explorer 11
          // imgSize: [90, 90],
          src: './assets/images/garbage_truck.png',
        }),
      }),
    );

    const rome2 = new Feature({
      geometry: new Point(fromLonLat([114.064443, 22.539602])),
    });
    rome2.setStyle(
      new Style({
        image: new Icon({
          // color: 'green',
          rotateWithView: false,
          scale: 0.05,
          crossOrigin: 'anonymous',
          // For Internet Explorer 11
          // imgSize: [90, 90],
          src: './assets/images/garbage_truck.png',
        }),
      }),
    );

    const resolutions = []; // 分辨率数组
    const tileSize = 256; // 瓦片大小
    // 深圳地区
    const areaExtent = [12665080.52765571, 2550703.6338763316, 12725465.780000998, 2601457.820657688] as Extent;
    const projection = get('EPSG:3857'); // 获得对应的投影坐标系
    const projectionExtent = projection.getExtent(); // 投影坐标系的范围
    const eCenter = [12699989.526708398, 2577327.1035168194];

    // 初始化分辨率数组
    for (let i = 0; i < 19; i++) {
      resolutions[i] = Math.pow(2, 18 - i);
    }

    const tileGrid = new TileGrid({
      // 投影坐标系范围的左下角作为瓦片坐标系原点
      origin: getBottomLeft(projectionExtent),
      resolutions,
      // extent: projectionExtent,
      tileSize: [256, 256],
    });

    const layerTiles = [
      // new LayerTile({
      //   source: new AMapImg(),
      // }),
      new TileLayer({
        source: new XYZ({
          projection,
          // tileGrid,
          url: 'http://webst0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}',
        }),
      }),
      // new LayerTile({
      //   source: new AMapRoadLabel(),
      // }),
      new VectorLayer({
        source: new VectorSource({
          // projection,
          features: [rome, rome1, rome2],
        }),
        // style: iconStyle,
      }),
    ];
    const view = new View({
      center: eCenter,
      zoom: 0,
      extent: areaExtent,
      projection,
      resolutions,
    });

    this.map = new Map({
      interactions: defaultInteractions().extend([new PinchZoom()]),
      layers: [...layerTiles],
      view,
      controls: defaultControls().extend([
        new Attribution(),
        // new ZoomToExtent({
        //   extent: [813079.7791264898, 5929220.284081122, 848966.9639063801, 5936863.986909639],
        // }),
        new FullScreen(),
        // new ScaleLine({
        //   bar: true,
        //   minWidth: 150,
        // }),
        new ZoomSlider(),
      ]),
    });
  }

  /**
   * Sets the view to the accordant zoom and center.
   *
   * @param zoom Zoom.
   * @param center Center in long/lat.
   */
  setView(zoom: number, center: [number, number]): void {
    this.map.getView().setZoom(10);
    this.map.getView().setCenter(fromLonLat(center));
  }

  /**
   * Updates target and size of the map.
   *
   * @param target HTML container.
   */
  updateSize(target: string = 'map'): void {
    this.map.setTarget(target);
    this.map.updateSize();
  }
}
