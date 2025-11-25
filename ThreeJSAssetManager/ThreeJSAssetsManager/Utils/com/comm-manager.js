
class CommunicationManager {
    constructor(workerType = 'sse') {
      this.worker = new Worker(
        workerType === 'sse' ? 'sse.worker.js' : 'longpoll.worker.js'
      );
      this.callbacks = {
        data: new Set(),
        error: new Set(),
        status: new Set()
      };
      
      this.worker.onmessage = (e) => {
        const handlers = this.callbacks[e.data.type];
        handlers?.forEach(cb => cb(e.data));
      };
    }
  
    on(eventType, callback) {
      this.callbacks[eventType]?.add(callback);
      return this;
    }
  
    start(config) {
      this.worker.postMessage({
        action: config.url ? 'connect' : 'start',
        config
      });
      return this;
    }
  
    stop() {
      this.worker.postMessage({
        action: 'disconnect'
      });
      return this;
    }
  
    configure(options) {
      this.worker.postMessage({
        action: 'config',
        config: options
      });
      return this;
    }
  }
  
  // 使用示例
//   const sseManager = new CommunicationManager('sse')
//     .on('data', (msg) => console.log('Received:', msg))
//     .on('error', (err) => console.error('Error:', err))
//     .start({
//       url: '/api/events',
//       events: ['stockUpdate', 'newsAlert']
//     });
  