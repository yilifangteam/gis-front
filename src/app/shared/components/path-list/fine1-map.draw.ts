import polyline from '@mapbox/polyline';
import { defaults as defaultControls } from 'ol/control';
import { ZoomSlider } from 'ol/control';
import { Extent, getBottomLeft } from 'ol/extent';
import Feature from 'ol/Feature';
import Polyline from 'ol/format/Polyline';
import Geometry from 'ol/geom/Geometry';
import GeometryLayout from 'ol/geom/GeometryLayout';
import LineString from 'ol/geom/LineString';
import MultiPoint from 'ol/geom/MultiPoint';
import Point from 'ol/geom/Point';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import Map from 'ol/Map';
import { get } from 'ol/proj';
import { fromEPSG4326, toEPSG4326 } from 'ol/proj/epsg3857';
import { getVectorContext } from 'ol/render';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';

import { Circle as CircleStyle, Fill, Icon, Stroke, Style, Text } from 'ol/style';
import TileGrid from 'ol/tilegrid/TileGrid';
import View from 'ol/View';

export class fine1MapDraw {
  psArr: any[] = [];

  /**
   * 地图中心，默认深圳
   */
  center = [12699989.526708398, 2577327.1035168194];

  allMonitor = {
    imgStyle: new Icon({
      src: './assets/images/loacId1.png',
      anchor: [0.5, 1],
      scale: 0.5,
    }),
    textStyleKey: false,
    textStyleObj: {},
  };
  allObj = {
    allMonitor: {
      layer: null,
      dataSource: null,
      data: null,
    },
  };

  map: Map;

  _init() {
    this._map();
    this._all();
  }

  // =====================最优视角
  // 图最优
  _map_fit(data_c) {
    // console.log(data_c.getFeatures());

    // 整个容器每个元素的最小最大 集合数组
    let point_arr = [];
    data_c.getFeatures().forEach((ele, index) => {
      point_arr.push(_one(ele.getGeometry()));
    });

    // 假设第一个点为最合适的点
    let fit_point = point_arr[0];
    point_arr.forEach((point, index) => {
      // 最小经度
      if (point[0] < fit_point[0]) {
        fit_point[0] = point[0];
      }

      // 最小纬度
      if (point[1] < fit_point[1]) {
        fit_point[1] = point[1];
      }

      // 最大经度
      if (point[2] > fit_point[2]) {
        fit_point[2] = point[2];
      }

      // 最大纬度
      if (point[3] > fit_point[3]) {
        fit_point[3] = point[3];
      }
    });

    // 没有数据
    if (data_c.getFeatures().length == 0) {
      return;
    }
    // 单个DOM
    else if (data_c.getFeatures().length == 1) {
      this.map
        .getView()
        .centerOn([fit_point[0], fit_point[1]], this.map.getSize(), [document.body.clientWidth / 2, document.body.clientHeight / 2]);

      this.map.getView().setZoom(12);
    }
    // 多个dom
    else {
      this.map.getView().fit(fit_point, {
        size: this.map.getSize(),
        padding: [100, 100, 100, 100],
        // constrainResolution: false,
      });
    }

    // 单个点的最小经纬度/最大经纬度
    function _one(dom) {
      // 4点数组
      let one_p = null;
      // 类型
      let type = dom.getType();

      // 每个类型的坐标值
      let path = dom.getCoordinates();

      if (type == 'Point') {
        one_p = [path[0], path[1], path[0], path[1]];
      }
      // 多边形
      else if (type == 'Polygon') {
        let line_path = path[0];
        one_p = [line_path[0][0], line_path[0][1], line_path[0][0], line_path[0][1]];

        line_path.forEach(function (p, index) {
          // 最小经度
          if (p[0] < one_p[0]) {
            one_p[0] = p[0];
          }
          // 最小纬度
          if (p[1] < one_p[1]) {
            one_p[1] = p[1];
          }

          // 最大经度
          if (p[0] > one_p[2]) {
            one_p[2] = p[0];
          }
          // 最大纬度
          if (p[1] > one_p[3]) {
            one_p[3] = p[1];
          }
        });
      }
      // 线
      else if (type == 'LineString') {
        one_p = [path[0][0], path[0][1], path[0][0], path[0][1]];

        path.forEach(function (p, index) {
          // 最小经度
          if (p[0] < one_p[0]) {
            one_p[0] = p[0];
          }
          // 最小纬度
          if (p[1] < one_p[1]) {
            one_p[1] = p[1];
          }

          // 最大经度
          if (p[0] > one_p[2]) {
            one_p[2] = p[0];
          }
          // 最大纬度
          if (p[1] > one_p[3]) {
            one_p[3] = p[1];
          }
        });
      }
      // 圆
      else if (type == 'Circle') {
        path = dom.getCenter();
        one_p = [path[0], path[1], path[0], path[1]];
      }

      return one_p;
    }
  }

  // 点的转向角度设置  new_p 上一点的坐标 old_p 下一点的坐标
  _map_p_rotation(new_p, old_p) {
    // 90度的PI值
    let pi_90 = Math.atan2(1, 0);
    // 当前点的PI值
    let pi_ac = Math.atan2(new_p[1] - old_p[1], new_p[0] - old_p[0]);

    return pi_90 - pi_ac;
  }

  _map() {
    const extent = toEPSG4326([12665080.52765571, 2550703.6338763316, 12725465.780000998, 2601457.820657688]) as Extent;
    const prj = get('EPSG:4326');
    const prjExtend = prj.getExtent();
    const view = new View({
      center: this.center,
      zoom: 4,
      extent,
      projection: prj,
      // resolutions,
    });
    this.map = new Map({
      layers: [
        new TileLayer({
          source: new XYZ({
            projection: prj,
            url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&scl=1&style=7',
          }),
        }),
      ],
      keyboardEventTarget: document,
      target: 'map',
      view,
      controls: [], // defaultControls().extend([new ZoomSlider()]),
    });
  }

  _all() {
    // 设置层
    this._all_layer();

    // 初始化
    this._all_init([]);

    // 最优一次
    this._map_fit(this.allObj.allMonitor.dataSource);
  }

  _all_layer() {
    // 层
    this.allObj.allMonitor.layer = new VectorLayer();

    // 数据容器
    this.allObj.allMonitor.dataSource = new VectorSource();

    // 注入层
    this.allObj.allMonitor.layer.setSource(this.allObj.allMonitor.dataSource);

    // 打到地图上
    this.map.addLayer(this.allObj.allMonitor.layer);
  }

  _all_init(psData: any[]) {
    this.psArr = psData;
    // 初始字体样式
    this._all_text_init();

    // 渲染数据
    this._all_render();
  }

  _all_text_init() {
    if (this.allMonitor.textStyleKey) {
      return;
    }
    this.allMonitor.textStyleKey = true;
    this.psArr.forEach((ele, index) => {
      this.allMonitor.textStyleObj[ele.name] = new Text({
        // 对其方式
        textAlign: 'center',
        // 基准线
        textBaseline: 'middle',
        offsetY: -70,
        // 文字样式
        font: 'normal 16px 黑体',
        // 文本内容
        text: ele.name,
        // 文本填充样式
        fill: new Fill({
          color: 'rgba(255,255,255,1)',
        }),
        padding: [5, 15, 5, 15],
        backgroundFill: new Fill({
          color: 'rgba(0,0,0,0.6)',
        }),
      });
    });
  }

  _all_render() {
    this.allObj.allMonitor.dataSource.clear();
    this.psArr.forEach((ele, index) => {
      //
      this._all_marker(ele);
    });
  }

  _all_marker(ele) {
    let p_data = new Feature({
      // 就一个参数啊，定义坐标
      geometry: new Point([ele.longitude, ele.latitude]),
    });

    // me.conf.all_monitor.text_style.setText(ele.name);

    p_data.setStyle(
      new Style({
        // 设置一个标识
        image: this.allMonitor.imgStyle,

        text: this.allMonitor.textStyleObj[ele.name],
      }),
    );

    // 属性关注
    // p_data.ele = ele;

    // 数据层收集
    this.allObj.allMonitor.dataSource.addFeature(p_data);

    p_data = null;
  }
}
