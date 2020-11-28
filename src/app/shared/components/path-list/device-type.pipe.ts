import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'deviceType' })
export class DeviceTypePipe implements PipeTransform {
  transform(value: number): any {
    switch (value) {
      case 1:
        return '摄像头';
      case 2:
        return '地磅';
      case 3:
        return '读卡器';
      default:
        return '';
    }
  }
}
