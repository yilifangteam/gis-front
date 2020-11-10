import { AfterViewInit, Component, OnInit } from '@angular/core';
import { GeoService } from '@service/common/geo.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.less'],
})
export class HomeComponent implements OnInit, AfterViewInit {
  geolocation: Geolocation;

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
        this.geo.setView(14, [position.coords.longitude, position.coords.latitude]);
      });
    }
  }
}
