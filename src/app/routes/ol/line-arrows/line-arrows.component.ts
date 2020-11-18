import { AfterViewInit, Component, OnInit } from '@angular/core';
import { defaults as defaultControls } from 'ol/control';
import ZoomSlider from 'ol/control/ZoomSlider';
import { Extent, getBottomLeft } from 'ol/extent';
import GeometryType from 'ol/geom/GeometryType';
import Point from 'ol/geom/Point';
import { Draw } from 'ol/interaction';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import Map from 'ol/Map';
import { get } from 'ol/proj';
import { fromEPSG4326, toEPSG4326 } from 'ol/proj/epsg3857';
import TileDebug from 'ol/source/TileDebug';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import { Icon, Stroke, Style } from 'ol/style';
import TileGrid from 'ol/tilegrid/TileGrid';
import View from 'ol/View';

@Component({
  selector: 'app-line-arrows',
  templateUrl: './line-arrows.component.html',
  styles: [
    `
      .map {
        width: 100%;
        height: 600px;
      }
    `,
  ],
})
export class LineArrowsComponent implements OnInit, AfterViewInit {
  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initMap();
  }

  initMap() {
    const resolutions = []; // 分辨率数组
    const tileSize = 256;
    const extent = [12665080.52765571, 2550703.6338763316, 12725465.780000998, 2601457.820657688] as Extent;
    const prj = get('EPSG:3857');
    const prjExtend = prj.getExtent();
    const eCenter = [12699989.526708398, 2577327.1035168194];

    // 初始化分辨率数组
    for (let i = 0; i < 19; i++) {
      resolutions[i] = Math.pow(2, 18 - i);
    }

    const tileGrid = new TileGrid({
      // 投影坐标系范围的左下角作为瓦片坐标系原点
      origin: getBottomLeft(prjExtend),
      resolutions,
      extent: prjExtend,
      tileSize: [256, 256],
    });

    const source = new VectorSource();

    const styleFunction = function (feature) {
      const geometry = feature.getGeometry();
      const styles = [
        // linestring
        new Style({
          stroke: new Stroke({
            color: '#ffcc33',
            width: 2,
          }),
        }),
      ];

      geometry.forEachSegment(function (start, end) {
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const rotation = Math.atan2(dy, dx);
        // arrows
        styles.push(
          new Style({
            geometry: new Point(end),
            image: new Icon({
              src: './assets/images/arrow.png',
              anchor: [0.75, 0.5],
              rotateWithView: true,
              rotation: -rotation,
            }),
          }),
        );
      });

      return styles;
    };
    const vector = new VectorLayer({
      source,
      style: styleFunction,
    });

    const view = new View({
      center: eCenter,
      zoom: 0,
      extent,
      projection: prj,
      resolutions,
    });

    const map = new Map({
      layers: [
        // new TileLayer({
        //   source: new TileDebug({
        //     projection: prj,
        //     tileGrid,
        //     // url: 'http://webst0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}',
        //   }),
        // }),
        new TileLayer({
          source: new XYZ({
            projection: prj,
            // tileGrid,
            url: 'http://webst0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}',
          }),
        }),
        vector,
      ],
      keyboardEventTarget: document,
      target: 'map',
      view,
      controls: defaultControls().extend([new ZoomSlider()]),
    });

    map.addInteraction(
      new Draw({
        source,
        type: GeometryType.LINE_STRING,
      }),
    );
  }
}
