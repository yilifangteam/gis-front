import { toBoolean } from '@delon/util';
import { environment } from '@env/environment';

export function urlSerialize(url: string, dashboard: string, isAuth = true) {
  return `${url}#dashboard#${dashboard}#dashboard#${isAuth}`;
}
export function isUrlSerialize(url) {
  return url && url.includes('#dashboard#');
}
export function urlDeserialization(url: string) {
  if (isUrlSerialize(url)) {
    return url.split('#dashboard#');
  }
  return url;
}
export function getUrl(url: string) {
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    if (isUrlSerialize(url)) {
      const dd = urlDeserialization(url);
      const keyJson = this.cacheSrv.get(dd[1], { mode: 'none' });
      if (keyJson.test) {
        // 测试环境
        url = keyJson.url + dd[0];
      } else {
        // 生产环境
        url = keyJson.pUrl + dd[0];
      }
      if (toBoolean(dd[2])) {
      }
    } else {
      url = environment.SERVER_URL + url;
    }
  }
  return url;
}
