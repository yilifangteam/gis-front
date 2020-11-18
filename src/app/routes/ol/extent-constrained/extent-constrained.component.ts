import { AfterViewInit, Component, OnInit } from '@angular/core';
import { defaults as defaultControls } from 'ol/control';
import ZoomSlider from 'ol/control/ZoomSlider';
import { Extent, getBottomLeft } from 'ol/extent';
import TileLayer from 'ol/layer/Tile';
import Map from 'ol/Map';
import { get } from 'ol/proj';
import { fromEPSG4326, toEPSG4326 } from 'ol/proj/epsg3857';
import TileDebug from 'ol/source/TileDebug';
import XYZ from 'ol/source/XYZ';
import TileGrid from 'ol/tilegrid/TileGrid';
import View from 'ol/View';

@Component({
  selector: 'app-extent-constrained',
  templateUrl: './extent-constrained.component.html',
  styles: [
    `
      .map {
        width: 100%;
        height: 600px;
      }
    `,
  ],
})
export class ExtentConstrainedComponent implements OnInit, AfterViewInit {
  constructor() {}
  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnInit(): void {}

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

    const view = new View({
      center: eCenter,
      zoom: 0,
      extent,
      projection: prj,
      resolutions,
    });

    const m = new Map({
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
      ],
      keyboardEventTarget: document,
      target: 'map',
      view,
      controls: defaultControls().extend([new ZoomSlider()]),
    });
  }
}
