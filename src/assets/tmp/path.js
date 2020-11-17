import { Map, View } from 'ol';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON'
import { getVectorContext } from 'ol/render';
import { Fill, Stroke, Circle, Style, Text, Icon } from 'ol/style';
import soul from './data/soul.json';
 
let tileLayer = new TileLayer({
  source: new OSM()
})
let map = new Map({
  target: 'map',
  layers: [
    tileLayer
  ],
  view: new View({
    center: [11936406.337013, 3786384.633134],
    zoom: 5,
    constrainResolution: true
  })
});
 
var vSource = new VectorSource()
var vLayer = new VectorLayer(
  {
    source: vSource,
  }
)
var geojsonFormat = new GeoJSON();
var features = geojsonFormat.readFeatures(soul, {
  dataProjection: "EPSG:4326",
  featureProjection: "EPSG:3857"
});
var street = features[16];
map.addLayer(vLayer);
map.getView().fit(street.getGeometry());
 
//some styles =========================================================================
var textStyle = new Style({
  text: new Text({
    font: 'bold 26px Mirosoft Yahei',
    placement: 'line',
    text: "江 南 大 街",
    fill: new Fill({
      color: '#000'
    }),
    offsetY:3,
    stroke: new Stroke({
      color: '#FFF',
      width: 2
    })
  })
})
var buttomPathStyle = new Style({
  stroke: new Stroke({
    color: [4, 110, 74],
    width: 28
  }),
})
var upperPathStyle = new Style({
 
  stroke: new Stroke({
    color: [0, 186, 107],
    width: 20
  }),
})
var outStyle = new Style({
  image: new Circle({
    radius: 18,
    fill: new Fill({
      color: [4, 110, 74]
    })
  })
})
var midStyle = new Style({
  image: new Circle({
    radius: 15,
    fill: new Fill({
      color: [0, 186, 107]
    })
  })
})
var innerDot = new Style({
  image: new Circle({
    radius: 6,
    fill: new Fill({
      color: [255, 255, 255]
    })
  })
})
var foutrStyle = new Style({
  image: new Circle({
    radius: 18,
    fill: new Fill({
      color: "#000"
    })
  })
})
var fmidStyle = new Style({
  image: new Circle({
    radius: 15,
    fill: new Fill({
      color: '#FFF'
    })
  })
})
var finnerStyle = new Style({
  image: new Circle({
    radius: 6,
    fill: new Fill({
      color: '#000'
    })
  })
})
street.setStyle(textStyle);
vSource.addFeature(street)
//some styles end =========================================================================
 
var offset = 0.01;
tileLayer.on('postrender', (evt) => {
  var vct = getVectorContext(evt);
  vct.drawFeature(street, buttomPathStyle)
  vct.drawFeature(street, upperPathStyle)
  let numArr = Math.ceil((street.getGeometry().getLength() / map.getView().getResolution()) / 100)
  var points = []
  for (var i = 0; i <= numArr; i++) {
    let fracPos = (i / numArr) + offset;
    if (fracPos > 1) fracPos -= 1
    let pf = new Feature(new Point(street.getGeometry().getCoordinateAt(fracPos)));
    points.push(pf);
  }
 
  //确定方向并绘制
  street.getGeometry().forEachSegment((start, end) => {
    points.forEach((item) => {
      let line = new LineString([start, end])
      let coord = item.getGeometry().getFirstCoordinate();
      let cPoint = line.getClosestPoint(coord);
      if (Math.abs(cPoint[0] - coord[0]) < 1 && Math.abs(cPoint[1] - coord[1]) < 1) {
        var myImage = new Image(117, 71);
        myImage.src = '/data/arrow.png';
        let dx=end[0] - start[0];
        let dy=end[1] - start[1];
        var rotation = Math.atan(dx/dy);
        rotation=dy>0?rotation:(Math.PI+rotation);
        vct.setStyle(new Style({
          image: new Icon({
            img: myImage,
            imgSize: [117, 71],
            scale: 0.15,
            rotation: rotation
          })
        }))
        vct.drawGeometry(item.getGeometry())
      }
    });
    vct.setStyle(outStyle)
    vct.drawGeometry(new Point(street.getGeometry().getFirstCoordinate()))
    vct.setStyle(midStyle)
    vct.drawGeometry(new Point(street.getGeometry().getFirstCoordinate()))
    vct.setStyle(innerDot)
    vct.drawGeometry(new Point(street.getGeometry().getFirstCoordinate()));
    vct.setStyle(foutrStyle)
    vct.drawGeometry(new Point(street.getGeometry().getLastCoordinate()))
    vct.setStyle(fmidStyle)
    vct.drawGeometry(new Point(street.getGeometry().getLastCoordinate()))
    vct.setStyle(finnerStyle)
    vct.drawGeometry(new Point(street.getGeometry().getLastCoordinate()));
  })
 
  offset = offset + 0.003 
  //复位
  if (offset >= 1) offset = 0.001
  map.render()
})