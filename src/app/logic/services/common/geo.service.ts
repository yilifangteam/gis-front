import { Injectable } from '@angular/core';
import { defaults as defaultControls } from 'ol/control';
import Attribution from 'ol/control/Attribution';
import FullScreen from 'ol/control/FullScreen';
import ScaleLine from 'ol/control/ScaleLine';
import ZoomToExtent from 'ol/control/ZoomToExtent';
import { defaults as defaultInteractions, PinchZoom } from 'ol/interaction';
import LayerTile from 'ol/layer/Tile';
import Map from 'ol/Map';
import { fromLonLat } from 'ol/proj';
import SourceOsm from 'ol/source/OSM';
import SourceStamen from 'ol/source/Stamen';
import View from 'ol/View';
import { AMapImg, AMapRoadLabel, AMapVec } from './amap.source';
import { MapUrl } from './map.url';

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
    const layerTiles = [
      new LayerTile({
        source: new AMapImg(),
      }),
      new LayerTile({
        source: new AMapVec(),
      }),
      // new LayerTile({
      //   source: new AMapRoadLabel(),
      // }),
    ];

    this.map = new Map({
      interactions: defaultInteractions().extend([new PinchZoom()]),
      layers: [...layerTiles],
      view: new View({
        center: fromLonLat([114.065286, 22.541722]),
        zoom: 14,
        constrainResolution: true,
      }),
      controls: defaultControls().extend([
        new Attribution(),
        // new ZoomToExtent({
        //   extent: [813079.7791264898, 5929220.284081122, 848966.9639063801, 5936863.986909639],
        // }),
        new FullScreen(),
        new ScaleLine({
          bar: true,
          minWidth: 150,
        }),
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
