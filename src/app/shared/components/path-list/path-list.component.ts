import { AfterViewInit, Component, OnInit } from '@angular/core';
import { GeoService } from '@service/common/geo.service';

@Component({
  selector: 'ipt-path-list',
  templateUrl: './path-list.component.html',
  styleUrls: ['./path-list.component.less'],
})
export class PathListComponent implements OnInit, AfterViewInit {
  geolocation: Geolocation;

  index2 = 0;
  selectedValue = null;
  data = [
    '粤B88881-(宝安1号车)',
    '粤B88882-(宝安2号车)',
    '粤B88883-(宝安3号车)',
    '粤B88884-(宝安4号车)',
    '粤B88885-(宝安5号车)',
    '粤B88886-(宝安6号车)',
    '粤B88887-(宝安7号车)',
    '粤B88888-(宝安8号车)',
    '粤B88889-(宝安9号车)',
    '粤B88880-(宝安10号车)',
  ];
  constructor(public geo: GeoService) {}

  ngOnInit(): void {
    this.geolocation = navigator.geolocation;
  }

  ngAfterViewInit(): void {
    this.geo.updateSize();
    // this.locate();
  }

  locate(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.geo.setView(16, [position.coords.longitude, position.coords.latitude]);
      });
    }
  }
}
