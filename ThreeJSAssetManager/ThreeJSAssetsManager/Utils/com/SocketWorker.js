主线程WebSocket管理器
class SocketWorker {
  constructor() {
    this.worker = new Worker('websocket.worker.js');
    this.worker.onmessage = this.handleMessage.bind(this);
    this.callbacks = new Map();
  }

  connect(url) {
    this.worker.postMessage({ action: 'connect', payload: { url } });
  }

  send(data) {
    this.worker.postMessage({ action: 'send', payload: data });
  }

  on(eventType, callback) {
    this.callbacks.set(eventType, callback);
    this.worker.postMessage({ action: 'addListener', payload: eventType });
  }

  handleMessage(e) {
    const { type, status, event } = e.data;
    switch (type) {
      case 'status':
        console.log(`Socket状态: ${status}`);
        break;
      case 'event':
        const callback = this.callbacks.get(event.type);
        callback?.(event);
        break;
    }
  }
}

// 使用示例
// const socket = new SocketWorker();
// socket.connect('wss://echo.websocket.org');
// socket.on('message', (data) => {
//   console.log('收到消息:', data);
// });
