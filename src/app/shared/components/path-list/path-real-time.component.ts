import { Component, Input } from '@angular/core';
import { _HttpClient } from '@delon/theme';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { defaults as defaultControls, ZoomSlider } from 'ol/control';
import { Extent, getBottomLeft } from 'ol/extent';
import Feature from 'ol/Feature';
import GeometryLayout from 'ol/geom/GeometryLayout';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import Map from 'ol/Map';
import { get } from 'ol/proj';
import { fromEPSG4326 } from 'ol/proj/epsg3857';
import { getVectorContext } from 'ol/render';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import { Fill, Icon, Stroke, Style, Text } from 'ol/style';
import TileGrid from 'ol/tilegrid/TileGrid';
import View from 'ol/View';

@Component({
  selector: 'app-path-real-time',
  template: ` <div id="real-time-map" class="map"></div> `,
  styles: [
    `
      :host {
        display: black;
        width: 100%;
        height: 500px;
      }
      #real-time-map {
        width: 100%;
        height: 400px;
      }
    `,
  ],
  providers: [],
})
export class PathRealTimeComponent {
  map;

  vectorLayer;
  center;
  routeCoords;
  routeLength;
  styles;

  polyLine: any;
  @Input()
  set car(val) {}

  constructor(private modal: NzModalRef, private modalSrv: NzModalService, private http: _HttpClient) {}

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

    const tileGrid = new TileGrid({
      // 投影坐标系范围的左下角作为瓦片坐标系原点
      origin: getBottomLeft(prjExtend),
      resolutions,
      extent: prjExtend,
      tileSize: [256, 256],
    });

    const route = this.polyLine;
    this.routeCoords = route.getCoordinates();
    this.routeLength = this.routeCoords.length;

    const routeFeature = new Feature({
      type: 'route',
      geometry: route,
    });

    this.styles = {
      route: new Style({
        stroke: new Stroke({
          width: 6,
          color: '#459C50',
        }),
      }),
    };

    this.vectorLayer = new VectorLayer({
      source: new VectorSource({
        features: [routeFeature],
      }),
    });

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
            // tileGrid,
            url: 'http://webst0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}',
          }),
        }),
        this.vectorLayer,
      ],
      keyboardEventTarget: document,
      target: 'real-time-map',
      view,
      controls: defaultControls().extend([new ZoomSlider()]),
    });
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

      vectorContext.drawFeature(
        feature,
        new Style({
          image: new Icon({
            src: './assets/images/navigation.png',
            anchor: [0.5, 0.5],
            scale: 0.2,
            rotateWithView: true,
            rotation,
          }),
        }),
      );
    }
    this.map.render();
  }

  // stopAnimation(ended) {
  //   this.animating = false;
  //   this.startButton.textContent = '回放';

  //   // const coord = ended ? this.routeCoords[this.routeLength - 1] : this.routeCoords[0];
  //   // const geometry = this.geoMarker.getGeometry();
  //   // geometry.setCoordinates(coord);
  //   this.vectorLayer.un('postrender', (event) => this.moveFeature(event));
  // }

  destroyModal(): void {
    this.modal.destroy();
  }
}
