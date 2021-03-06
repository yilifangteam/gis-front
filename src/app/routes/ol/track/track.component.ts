import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Route } from '@angular/router';
import { _HttpClient } from '@delon/theme';
import { MapDataService } from '@service/common/map.data.service';
import { format } from 'date-fns';

@Component({
  selector: 'app-track',
  templateUrl: './track.component.html',
  styleUrls: ['./track.component.less'],
})
export class TrackComponent implements OnInit, AfterViewInit {
  constructor(private http: _HttpClient, private mapDataSrv: MapDataService, private route: ActivatedRoute) {
    this.route.queryParams.subscribe((x) => {
      this.customerRegNo = x.customerRegNo;
      this.delivetyOrderNo = x.delivetyOrderNo;
      this.mapDataSrv.getSourceCargpsData(this.customerRegNo, this.delivetyOrderNo).subscribe((d) => {
        this.baseData = d;
        this.initData();
      });
    });
  }
  customerRegNo;
  delivetyOrderNo;
  searchTime = format(new Date(), 'yyyy-MM-dd');
  isInit = false;
  data = [[], []];
  initNow = new Date();
  now = this.initNow;
  now1 = this.initNow;
  oneDay = 5000;
  value = 3;
  value1 = 30;
  baseData: any = {};

  option = {
    title: {
      text: '温度',
      x: 'center',
    },
    tooltip: {
      trigger: 'axis',
      formatter(params, p) {
        const p0 = params[0];
        const date = new Date(p0.name);
        return date.toLocaleString('chinese', { hour12: false }) + '<br>温度:' + p0.value[1] + '℃';
      },
      axisPointer: {
        animation: false,
      },
    },
    xAxis: {
      type: 'time',
      name: '时间',
      splitLine: {
        show: false,
      },
      axisLine: {
        onZero: false, // -----------重点
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '温度(℃)',
        boundaryGap: [0, '100%'],
        splitLine: {
          show: false,
        },
      },
    ],
    series: [
      {
        name: '温度',
        type: 'line',
        data: this.data[0],
      },
    ],
  };

  option2 = {
    title: {
      text: '湿度',
      x: 'center',
    },
    tooltip: {
      trigger: 'axis',
      formatter(params, p) {
        const p0 = params[0];
        const date = new Date(p0.name);
        return date.toLocaleString('chinese', { hour12: false }) + '<br>湿度:' + p0.value[1] + '%';
      },
      axisPointer: {
        animation: false,
      },
    },
    xAxis: {
      type: 'time',
      name: '时间',
      splitLine: {
        show: false,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '湿度%',
        boundaryGap: [0, '100%'],
        splitLine: {
          show: false,
        },
      },
    ],
    series: [
      {
        name: '湿度',

        type: 'line',
        data: this.data[1],
      },
    ],
  };
  initData() {
    if (this.isInit) {
      this.initMap();
    } else {
      setTimeout(() => {
        this.initData();
      }, 100);
    }
  }
  randomData() {
    this.now = new Date(+this.now + this.oneDay);
    const value = this.value + Math.random() * 5;
    return {
      name: this.now.toString(),
      value: [this.now, value.toFixed(2)],
    };
  }

  randomData1() {
    this.now1 = new Date(+this.now1 + this.oneDay);
    const value = this.value1 + Math.random() * 21 - 10;
    return {
      name: this.now1.toString(),
      value: [this.now1, value.toFixed(2)],
    };
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // this.http.get('./assets/tmp/mock-path.json').subscribe((d: any) => {
    //   this.baseData = d;
    //   this.initMap();
    // });
    this.isInit = true;
  }
  initMap() {
    // for (let i = 0; i < 50; i++) {
    //   this.data[0].push(this.randomData());
    // }
    // for (let i = 0; i < 50; i++) {
    //   this.data[1].push(this.randomData1());
    // }
    this.data[0] = this.baseData.list.map((x) => {
      return {
        name: x.GPSTime,
        value: [new Date(x.GPSTime), x.Temp1],
      };
    });
    // this.data[1] = this.baseData.list.map((x) => {
    //   return {
    //     name: x.GPSTime,
    //     value: [new Date(x.GPSTime), x.Temp2],
    //   };
    // });
    this.option.series[0].data = this.data[0];
    this.option2.series[0].data = this.data[1];
    const echart1 = document.getElementById('f-echart');
    const echart2 = document.getElementById('f-echart2');
    if (this.data[0].length > 0) {
      const myChart = echarts.init(document.getElementById('f-echart'));
      myChart.setOption(this.option);
    } else {
      echart1.style.display = 'none';
    }
    if (this.data[1].length > 0) {
      const myChart2 = echarts.init(document.getElementById('f-echart2'));
      myChart2.setOption(this.option2);
    } else {
      echart2.style.display = 'none';
    }
    // setInterval(() => {
    //   this.data[0].shift();
    //   this.data[1].shift();
    //   this.data[0].push(this.randomData());
    //   this.data[1].push(this.randomData1());
    //   myChart.setOption({
    //     series: [
    //       {
    //         data: this.data[0],
    //       },
    //       {
    //         data: this.data[1],
    //       },
    //     ],
    //   });
    // }, 5000);
  }
}
