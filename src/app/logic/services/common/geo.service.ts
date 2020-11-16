import { Injectable } from '@angular/core';
import { Feature } from 'ol';
import { defaults as defaultControls } from 'ol/control';
import Attribution from 'ol/control/Attribution';
import FullScreen from 'ol/control/FullScreen';
import { getBottomLeft } from 'ol/extent';
import GeometryLayout from 'ol/geom/GeometryLayout';
import Point from 'ol/geom/Point';
import { defaults as defaultInteractions, PinchZoom } from 'ol/interaction';
import LayerTile from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import Map from 'ol/Map';
import { fromLonLat } from 'ol/proj';
import { get } from 'ol/proj/projections';
import VectorSource from 'ol/source/Vector';
import { Icon, Style } from 'ol/style';
import TileGrid from 'ol/tilegrid/TileGrid';
import View from 'ol/View';

import { AMapVec } from './amap.source';

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
    const areaExtent = [12665080.52765571, 2550703.6338763316, 12725465.780000998, 2601457.820657688];
    const projection = get('EPSG:3857'); // 获得对应的投影坐标系
    const projectionExtent = projection.getExtent(); // 投影坐标系的范围

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
      new LayerTile({
        source: new AMapVec({
          // projection,
          // tileGrid,
          // wrapX: false,
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

    this.map = new Map({
      interactions: defaultInteractions().extend([new PinchZoom()]),
      layers: [...layerTiles],
      view: new View({
        projection,
        center: [12697184.079535482, 2563239.3065151004], // 深圳
        resolutions,
        // center: fromLonLat([12697184.079535482, 2563239.3065151004]),
        zoom: 16,
        // constrainResolution: true,
      }),
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
