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
    '粤B6E941绿化垃圾',
    '粤B6E942绿化垃圾',
    '粤B6E943绿化垃圾',
    '粤B6E944绿化垃圾',
    '粤BDH6233果蔬垃圾',
    '粤BD90219果蔬垃圾',
    '粤BD90220果蔬垃圾',
    '粤BD90260生活垃圾',
    '粤BD90261生活垃圾',
    '粤BD90262生活垃圾',
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
