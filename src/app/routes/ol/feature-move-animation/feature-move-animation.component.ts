import { AfterViewInit, Component, OnInit } from '@angular/core';
import { _HttpClient } from '@delon/theme';
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

@Component({
  selector: 'app-feature-move-animation',
  templateUrl: './feature-move-animation.component.html',
  styles: [
    `
      .map {
        width: 100%;
        height: 550px;
      }
    `,
  ],
})
export class FeatureMoveAnimationComponent implements OnInit, AfterViewInit {
  animating = false;
  speed;
  now;
  speedInput;
  startButton;
  map;
  geoMarker;
  vectorLayer;
  center;
  routeCoords;
  routeLength;
  styles;

  polyLine: any;
  constructor(private http: _HttpClient) {}

  ngAfterViewInit(): void {
    this.http
      .post('https://garbagesortingcity.fine1.com.cn/8888/influxdb/health/selectByTable', {
        comCode: 'cus000001cus000007',
        tbName: 'carGps',
        timePoliy: '天',
        carNum: '粤BDL1013',
      })
      .subscribe((d: any[]) => {
        const l = d.map((j) => fromEPSG4326([j.longitude, j.latitude]));
        // this.polyLine = new Feature({
        //   opt_geometryOrProperties: new LineString(l, GeometryLayout.XYZ),
        // });
        this.polyLine = new LineString(l, GeometryLayout.XYZ);
        this.initMap();
      });
  }

  ngOnInit(): void {}

  initMap() {
    const resolutions = []; // 分辨率数组
    const tileSize = 256;
    const extent = [12665080.52765571, 2550703.6338763316, 12725465.780000998, 2601457.820657688] as Extent;
    const prj = get('EPSG:3857');
    const prjExtend = prj.getExtent();
    this.center = [12699989.526708398, 2577327.1035168194];
    console.log(toEPSG4326(this.center));

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
    this.geoMarker = /** @type Feature<import("../src/ol/geom/Point").default> */ new Feature({
      type: 'geoMarker',
      geometry: new Point(this.routeCoords[0]),
    });
    const startMarker = new Feature({
      type: 'icon',
      geometry: new Point(this.routeCoords[0]),
    });
    console.log('eee' + toEPSG4326(this.routeCoords[0]));
    const endMarker = new Feature({
      type: 'icon',
      geometry: new Point(this.routeCoords[this.routeLength - 1]),
    });
    const endPointMarker = new Feature({
      type: 'geoMarker',
      geometry: new Point(this.routeCoords[this.routeLength - 1]),
    });

    this.styles = {
      route: new Style({
        stroke: new Stroke({
          width: 6,
          color: 'red',
        }),
      }),
      icon: new Style({
        image: new Icon({
          anchor: [0.5, 1],
          src: './assets/images/mark.svg',
          imgSize: [50, 50],
        }),
      }),
      geoMarker: new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: 'black' }),
          stroke: new Stroke({
            color: 'white',
            width: 2,
          }),
        }),
      }),
    };

    this.animating = false;

    this.speedInput = document.getElementById('speed');
    this.startButton = document.getElementById('start-animation');

    this.vectorLayer = new VectorLayer({
      source: new VectorSource({
        features: [routeFeature, this.geoMarker, startMarker, endMarker, endPointMarker],
      }),
      style: (feature) => {
        // hide geoMarker if animation is active
        if (this.animating && feature.get('type') === 'geoMarker') {
          return null;
        }
        const tStyles = [this.styles[feature.get('type')]];
        const geometry: any = feature.getGeometry();
        // if (geometry && geometry.forEachSegment) {
        //   geometry.forEachSegment((start, end) => {
        //     const dx = end[0] - start[0];
        //     const dy = end[1] - start[1];
        //     const rotation = Math.atan2(dy, dx);

        //     // arrows
        //     tStyles.push(
        //       new Style({
        //         geometry: new Point(end),
        //         image: new Icon({
        //           src: './assets/images/arrow.png',
        //           anchor: [0.75, 0.5],
        //           rotateWithView: true,
        //           rotation: -rotation,
        //           imgSize: [6, 9.5],
        //         }),
        //       }),
        //     );
        //   });
        // }

        return tStyles;
      },
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
        this.vectorLayer,
      ],
      keyboardEventTarget: document,
      target: 'map',
      view,
      controls: defaultControls().extend([new ZoomSlider()]),
    });
  }

  moveFeature(event) {
    const vectorContext = getVectorContext(event);
    const frameState = event.frameState;

    if (this.animating) {
      const elapsedTime = frameState.time - this.now;
      // here the trick to increase speed is to jump some indexes
      // on lineString coordinates
      const index = Math.round((this.speed * elapsedTime) / 1000);

      if (index >= this.routeLength) {
        this.stopAnimation(true);
        return;
      }

      const currentPoint = new Point(this.routeCoords[index]);
      const feature = new Feature(currentPoint);
      vectorContext.drawFeature(feature, this.styles.geoMarker);
    }
    // tell OpenLayers to continue the postrender animation
    this.map.render();
  }

  startAnimation() {
    if (this.animating) {
      this.stopAnimation(false);
    } else {
      this.animating = true;
      this.now = new Date().getTime();
      this.speed = this.speedInput.value;
      this.startButton.textContent = 'Cancel Animation';
      // hide geoMarker
      this.geoMarker.setStyle(null);
      // just in case you pan somewhere else
      this.map.getView().setCenter(this.center);
      this.vectorLayer.on('postrender', (event) => this.moveFeature(event));
      this.map.render();
    }
  }

  /**
   * @param {boolean} ended end of animation.
   */
  stopAnimation(ended) {
    this.animating = false;
    this.startButton.textContent = 'Start Animation';

    // if animation cancelled set the marker at the beginning
    const coord = ended ? this.routeCoords[this.routeLength - 1] : this.routeCoords[0];
    const geometry = this.geoMarker.getGeometry();
    geometry.setCoordinates(coord);
    // remove listener
    this.vectorLayer.un('postrender', (event) => this.moveFeature(event));
  }
}
