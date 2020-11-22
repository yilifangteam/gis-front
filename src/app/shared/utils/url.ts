import { CacheService } from '@delon/cache';
import { toBoolean } from '@delon/util';
import { environment } from '@env/environment';

export const UrlConfig = {
  dashboard: 'dashboard',
  dashboard1: 'dashboard1',
  dashboard2: 'dashboard2',
  dashboard3: 'dashboard3',
};

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
export function getUrl(cacheSrv: CacheService, url: string) {
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    if (isUrlSerialize(url)) {
      const dd = urlDeserialization(url);
      const keyJson = cacheSrv.get(dd[1], { mode: 'none' });
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
export function getUrlByDashboard(cacheSrv: CacheService, dashboard: string) {
  let url = '';
  const keyJson = cacheSrv.get(dashboard, { mode: 'none' });
  if (keyJson.test) {
    // 测试环境
    url = keyJson.url;
  } else {
    // 生产环境
    url = keyJson.pUrl;
  }
  return url;
}

export function fine1Url(dashboard: string) {
  let url = '';
  const v = localStorage.getItem(dashboard) || '{}';
  const val = JSON.parse(v);
  if (val.v) {
    if (val.v.test) {
      // 测试环境
      url = val.v.url;
    } else {
      // 生产环境
      url = val.v.pUrl;
    }
  }
  return url;
}
