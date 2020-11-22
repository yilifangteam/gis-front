import { AfterViewInit, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-track',
  templateUrl: './track.component.html',
  styleUrls: ['./track.component.less'],
})
export class TrackComponent implements OnInit, AfterViewInit {
  constructor() {}
  data = [[], []];
  initNow = new Date();
  now = this.initNow;
  now1 = this.initNow;
  oneDay = 5000;
  value = 3;
  value1 = 30;

  option = {
    title: {
      text: '实时温度/湿度',
      x: 'center',
    },
    tooltip: {
      trigger: 'axis',
      formatter(params, p) {
        const p0 = params[0];
        const p1 = params[1];
        const date = new Date(p0.name);
        return date.toLocaleString('chinese', { hour12: false }) + '<br>温度:' + -p0.value[1] + '℃' + '<br>湿度:' + p1.value[1] + '%';
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
        name: '温度(-℃)',
        boundaryGap: [0, '100%'],
        splitLine: {
          show: false,
        },
      },
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
        name: '温度',
        type: 'line',
        data: this.data[0],
      },
      {
        name: '湿度',
        yAxisIndex: 1,
        type: 'line',
        data: this.data[1],
      },
    ],
  };
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
    this.initMap();
  }
  initMap() {
    const myChart = echarts.init(document.getElementById('f-echart'));

    for (let i = 0; i < 50; i++) {
      this.data[0].push(this.randomData());
    }
    for (let i = 0; i < 50; i++) {
      this.data[1].push(this.randomData1());
    }

    myChart.setOption(this.option);

    setInterval(() => {
      this.data[0].shift();
      this.data[1].shift();
      this.data[0].push(this.randomData());
      this.data[1].push(this.randomData1());
      myChart.setOption({
        series: [
          {
            data: this.data[0],
          },
          {
            data: this.data[1],
          },
        ],
      });
    }, 5000);
  }
}
