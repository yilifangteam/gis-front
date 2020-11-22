import { AfterViewInit, HostListener, Renderer2 } from '@angular/core';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { DA_SERVICE_TOKEN, ITokenService } from '@delon/auth';

@Component({
  selector: 'layout-passport',
  templateUrl: './passport.component.html',
  styleUrls: ['./passport.component.less'],
})
export class LayoutPassportComponent implements OnInit, AfterViewInit {
  links = [];

  @ViewChild('wrap', { static: false }) wrap?: ElementRef<{}>;

  constructor(@Inject(DA_SERVICE_TOKEN) private tokenService: ITokenService, private render: Renderer2) {}
  ngAfterViewInit(): void {
    this._resize();
  }

  ngOnInit(): void {
    this.tokenService.clear();
  }

  @HostListener('window:resize')
  _resize(): void {
    const left = (1205 * document.body.clientWidth) / 1920;
    const top = (220 * document.body.clientWidth) / 1920;
    this.render.setStyle(this.wrap.nativeElement, 'top', `${top}px`);
    this.render.setStyle(this.wrap.nativeElement, 'left', `${left}px`);
  }
}
