import { Observable, Subject } from 'rxjs';

export interface LmWsOption {
  debug: boolean;
  /**
   * websocket是否应该在实例化后立即尝试连接
   */
  automaticOpen: boolean;
  /**
   * 尝试重新连接之前要延迟的毫秒数
   */
  reconnectInterval: number;
  /**
   * 延迟重连接尝试的最大毫秒数
   */
  maxReconnectInterval: number;
  /**
   * 重新连接延迟的增长率。允许重新连接尝试后退时
   */
  reconnectDecay: number;
  /**
   * 在关闭和重试之前，等待连接成功的最长时间(以毫秒为单位)
   */
  timeoutInterval: number;
  /**
   * 试图重新连接的最大次数。null 为无限制
   */
  maxReconnectAttempts: number | null;
  binaryType: 'blob' | 'arraybuffer';
}

export const wsDefaultOption: LmWsOption = {
  debug: false,
  automaticOpen: true,
  reconnectInterval: 1000,
  maxReconnectInterval: 30000,
  reconnectDecay: 1.5,
  timeoutInterval: 2000,
  maxReconnectAttempts: null,
  binaryType: 'blob',
};

export class LmWebSocket {
  private unsubscribe$ = new Subject<void>();
  private wsNotify$ = new Subject<any>();
  private ws: WebSocket;
  public uri: string;
  private reconnectAttempts = 0;
  private readyState = WebSocket.CONNECTING;
  private protocol = null;
  private forcedClose = false;
  private timedOut = false;
  private option = wsDefaultOption;

  constructor(uri: string, wsOption?: LmWsOption) {
    this.option = Object.assign({}, this.option, wsOption);
    this.uri = uri;
    if (this.option.automaticOpen) {
      this.open(false);
    }
  }
  LmObservable(): Observable<any> {
    return this.wsNotify$.asObservable();
    // return new Observable((observer) => {
    //   this.ws.onmessage = (event) => {
    //     return observer.next(JSON.parse(event.data));
    //   };
    //   this.ws.onerror = (event) => {
    //     return observer.error(event);
    //   };
    //   this.ws.onclose = (event) => {
    //     return observer.complete();
    //   };
    // });
  }

  open(reconnectAttempt: boolean): void {
    this.ws = new WebSocket(this.uri);
    this.ws.binaryType = this.option.binaryType;
    if (reconnectAttempt) {
      if (this.option.maxReconnectAttempts && this.reconnectAttempts > this.option.maxReconnectAttempts) {
        return;
      }
    } else {
      this.reconnectAttempts = 0;
    }
    if (this.option.debug) {
      console.log('lm-websocket', 'attempt-connect', this.uri);
    }
    const localWs = this.ws;
    const tempTimeOut = setTimeout(() => {
      if (this.option.debug) {
        console.log('lm-websocket', 'connection-timeout', this.uri);
      }
      this.timedOut = true;
      localWs.close();
      this.timedOut = false;
    }, this.option.timeoutInterval);

    this.ws.onopen = () => {
      clearTimeout(tempTimeOut);
      if (this.option.debug) {
        console.log('lm-websocket', 'onopen', this.uri);
      }
      this.protocol = this.ws.protocol;
      this.readyState = WebSocket.OPEN;
      this.reconnectAttempts = 0;
      reconnectAttempt = false;
    };

    this.ws.onclose = () => {
      clearTimeout(tempTimeOut);
      this.ws = null;
      if (this.forcedClose) {
        this.readyState = WebSocket.CLOSED;
      } else {
        this.readyState = WebSocket.CONNECTING;
        if (!reconnectAttempt && !this.timedOut) {
          if (this.option.debug) {
            console.log('lm-websocket', 'onclose', this.uri);
          }
        }

        const timeout = this.option.reconnectInterval * Math.pow(this.option.reconnectDecay, this.reconnectAttempts);
        setTimeout(
          () => {
            this.reconnectAttempts++;
            this.open(true);
          },
          timeout > this.option.maxReconnectInterval ? this.option.maxReconnectInterval : timeout,
        );
      }
    };

    this.ws.onmessage = (event) => {
      if (this.option.debug) {
        console.log('lm-websocket', 'onmessage', this.uri, event.data);
      }
      try {
        this.wsNotify$.next(JSON.parse(event.data));
      } catch (error) {
        this.wsNotify$.next(event.data);
      }
    };

    this.ws.onerror = (event) => {
      if (this.option.debug) {
        console.log('lm-websocket', 'onerror', this.uri, event);
      }
      this.ws.close();
      // this.wsNotify$.error(event);
    };
  }

  send(msg: any): void {
    if (this.ws && this.ws.readyState === 1) {
      if (this.option.debug) {
        console.log('lm-websocket', 'send', this.uri, msg);
      }
      this.ws.send(msg);
    } else {
      throw new Error('INVALID_STATE_ERR : Pausing to reconnect websocket');
    }
  }

  /**
   * 关闭
   */
  close(): void {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.close();
      this.wsNotify$.complete();
    }
  }
}
