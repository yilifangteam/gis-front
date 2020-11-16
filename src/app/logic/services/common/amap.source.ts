/**
 * @module ol/source/OSM
 */

import { get } from 'ol/proj/projections';
import XYZ from 'ol/source/XYZ';

/**
 * The attribution containing a link to the OpenStreetMap Copyright and License
 * page.
 * @const
 * @type {string}
 * @api
 */
export const ATTRIBUTION = '&#169; ' + '<a href="https://www.fine1.cn/copyright" target="_blank">fine1-gis</a> ' + 'contributors.';

export class AMapVec extends XYZ {
  /**
   * @param {Options=} [opt_options] Open Street Map options.
   */
  constructor(opt_options?: any) {
    const options = opt_options || {};

    let attributions;
    if (options.attributions !== undefined) {
      attributions = options.attributions;
    } else {
      attributions = [ATTRIBUTION];
    }

    const crossOrigin = options.crossOrigin !== undefined ? options.crossOrigin : 'anonymous';

    const url =
      options.url !== undefined
        ? options.url
        : 'http://webrd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}';

    super({
      attributions,
      attributionsCollapsible: false,
      cacheSize: options.cacheSize,
      crossOrigin,
      projection: options.projection || get('EPSG:3857'),
      imageSmoothing: options.imageSmoothing,
      maxZoom: options.maxZoom !== undefined ? options.maxZoom : 19,
      opaque: options.opaque !== undefined ? options.opaque : true,
      reprojectionErrorThreshold: options.reprojectionErrorThreshold,
      tileLoadFunction: options.tileLoadFunction,
      transition: options.transition,
      tileGrid: options.tileGrid,
      url,
      wrapX: options.wrapX !== undefined ? options.wrapX : true,
    });
  }
}

export class AMapImg extends XYZ {
  /**
   * @param {Options=} [opt_options] Open Street Map options.
   */
  constructor(opt_options?: any) {
    const options = opt_options || {};

    let attributions;
    if (options.attributions !== undefined) {
      attributions = options.attributions;
    } else {
      attributions = [ATTRIBUTION];
    }

    const crossOrigin = options.crossOrigin !== undefined ? options.crossOrigin : 'anonymous';

    const url = options.url !== undefined ? options.url : 'http://webst0{1-4}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}';

    super({
      attributions,
      attributionsCollapsible: false,
      cacheSize: options.cacheSize,
      crossOrigin,
      projection: get('EPSG:3857'),
      imageSmoothing: options.imageSmoothing,
      maxZoom: options.maxZoom !== undefined ? options.maxZoom : 19,
      opaque: options.opaque !== undefined ? options.opaque : true,
      reprojectionErrorThreshold: options.reprojectionErrorThreshold,
      tileLoadFunction: options.tileLoadFunction,
      transition: options.transition,
      url,
      wrapX: options.wrapX !== undefined ? options.wrapX : true,
    });
  }
}

export class AMapRoadLabel extends XYZ {
  /**
   * @param {Options=} [opt_options] Open Street Map options.
   */
  constructor(opt_options?: any) {
    const options = opt_options || {};

    let attributions;
    if (options.attributions !== undefined) {
      attributions = options.attributions;
    } else {
      attributions = [ATTRIBUTION];
    }

    const crossOrigin = options.crossOrigin !== undefined ? options.crossOrigin : 'anonymous';

    const url = options.url !== undefined ? options.url : 'http://webst0{1-4}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}';

    super({
      attributions,
      attributionsCollapsible: false,
      cacheSize: options.cacheSize,
      crossOrigin,
      projection: get('EPSG:3857'),
      imageSmoothing: options.imageSmoothing,
      maxZoom: options.maxZoom !== undefined ? options.maxZoom : 19,
      opaque: options.opaque !== undefined ? options.opaque : true,
      reprojectionErrorThreshold: options.reprojectionErrorThreshold,
      tileLoadFunction: options.tileLoadFunction,
      transition: options.transition,
      url,
      wrapX: options.wrapX !== undefined ? options.wrapX : true,
    });
  }
}
