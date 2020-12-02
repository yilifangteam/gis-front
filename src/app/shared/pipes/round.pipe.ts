import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'round' })
export class RoundPipe implements PipeTransform {
  transform(value: string | number, roundNum: number = 2): number {
    value = Number.parseFloat(value.toString());
    if (roundNum <= 0) {
      return Math.round(value);
    }
    // eslint-disable-next-line no-restricted-properties
    value = Math.round(Math.round(value * Math.pow(10, roundNum + 1)) / Math.pow(10, 1)) / Math.pow(10, roundNum);
    return value;
  }
}
