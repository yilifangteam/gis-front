import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Map, View } from 'ol';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import SimpleGeometry from 'ol/geom/SimpleGeometry';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { getVectorContext } from 'ol/render';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import { Circle, Fill, Icon, Stroke, Style, Text } from 'ol/style';

@Injectable({
  providedIn: 'root',
})
export class GeoPathService {
  map: Map;
  soul: any;
  constructor(private http: HttpClient) {
    this.http.get('./assets/tmp/seoul.json').subscribe((d) => {
      this.soul = d;
      // this.init();
    });
  }
  init() {
    const tileLayer = new TileLayer({
      source: new OSM(),
    });
    this.map = new Map({
      target: 'map',
      layers: [tileLayer],
      view: new View({
        center: [11936406.337013, 3786384.633134],
        zoom: 5,
        constrainResolution: true,
      }),
    });

    const vSource = new VectorSource();
    const vLayer = new VectorLayer({
      source: vSource,
    });
    const geojsonFormat = new GeoJSON();
    const features = geojsonFormat.readFeatures(this.soul, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    });
    const street = features[16] as any;
    this.map.addLayer(vLayer);
    this.map.getView().fit(street.getGeometry() as SimpleGeometry);

    // some styles =========================================================================
    const textStyle = new Style({
      text: new Text({
        font: 'bold 26px Mirosoft Yahei',
        placement: 'line',
        text: '江 南 大 街',
        fill: new Fill({
          color: '#000',
        }),
        offsetY: 3,
        stroke: new Stroke({
          color: '#FFF',
          width: 2,
        }),
      }),
    });
    const buttomPathStyle = new Style({
      stroke: new Stroke({
        color: [4, 110, 74],
        width: 28,
      }),
    });
    const upperPathStyle = new Style({
      stroke: new Stroke({
        color: [0, 186, 107],
        width: 20,
      }),
    });
    const outStyle = new Style({
      image: new Circle({
        radius: 18,
        fill: new Fill({
          color: [4, 110, 74],
        }),
      }),
    });
    const midStyle = new Style({
      image: new Circle({
        radius: 15,
        fill: new Fill({
          color: [0, 186, 107],
        }),
      }),
    });
    const innerDot = new Style({
      image: new Circle({
        radius: 6,
        fill: new Fill({
          color: [255, 255, 255],
        }),
      }),
    });
    const foutrStyle = new Style({
      image: new Circle({
        radius: 18,
        fill: new Fill({
          color: '#000',
        }),
      }),
    });
    const fmidStyle = new Style({
      image: new Circle({
        radius: 15,
        fill: new Fill({
          color: '#FFF',
        }),
      }),
    });
    const finnerStyle = new Style({
      image: new Circle({
        radius: 6,
        fill: new Fill({
          color: '#000',
        }),
      }),
    });
    street.setStyle(textStyle);
    vSource.addFeature(street);
    // some styles end =========================================================================

    let offset = 0.01;
    tileLayer.on('postrender', (evt) => {
      const vct = getVectorContext(evt);
      vct.drawFeature(street, buttomPathStyle);
      vct.drawFeature(street, upperPathStyle);
      const numArr = Math.ceil(street.getGeometry().getLength() / this.map.getView().getResolution() / 100);
      const points = [];
      for (let i = 0; i <= numArr; i++) {
        let fracPos = i / numArr + offset;
        if (fracPos > 1) {
          fracPos -= 1;
        }
        const pf = new Feature(new Point(street.getGeometry().getCoordinateAt(fracPos)));
        points.push(pf);
      }

      // 确定方向并绘制
      street.getGeometry().forEachSegment((start, end) => {
        points.forEach((item) => {
          const line = new LineString([start, end]);
          const coord = item.getGeometry().getFirstCoordinate();
          const cPoint = line.getClosestPoint(coord);
          if (Math.abs(cPoint[0] - coord[0]) < 1 && Math.abs(cPoint[1] - coord[1]) < 1) {
            const myImage = new Image(117, 71);
            myImage.src = './assets/tmp/arrowright.png';
            const dx = end[0] - start[0];
            const dy = end[1] - start[1];
            let rotation = Math.atan(dx / dy);
            rotation = dy > 0 ? rotation : Math.PI + rotation;
            vct.setStyle(
              new Style({
                image: new Icon({
                  img: myImage,
                  imgSize: [117, 71],
                  scale: 0.15,
                  rotation,
                }),
              }),
            );
            vct.drawGeometry(item.getGeometry());
          }
        });
        vct.setStyle(outStyle);
        vct.drawGeometry(new Point(street.getGeometry().getFirstCoordinate()));
        vct.setStyle(midStyle);
        vct.drawGeometry(new Point(street.getGeometry().getFirstCoordinate()));
        vct.setStyle(innerDot);
        vct.drawGeometry(new Point(street.getGeometry().getFirstCoordinate()));
        vct.setStyle(foutrStyle);
        vct.drawGeometry(new Point(street.getGeometry().getLastCoordinate()));
        vct.setStyle(fmidStyle);
        vct.drawGeometry(new Point(street.getGeometry().getLastCoordinate()));
        vct.setStyle(finnerStyle);
        vct.drawGeometry(new Point(street.getGeometry().getLastCoordinate()));
      });

      offset = offset + 0.003;
      // 复位
      if (offset >= 1) {
        offset = 0.001;
      }
      this.map.render();
    });
  }
}
