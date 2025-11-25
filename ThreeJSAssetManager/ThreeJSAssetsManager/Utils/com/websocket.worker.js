
// WebSocket 工作线程核心逻辑
let socket;
const messageQueue = [];
const listeners = new Set();

// 主线程消息处理
self.onmessage = (e) => {
  const { action, payload } = e.data;
  switch (action) {
    case 'connect':
      initSocket(payload.url);
      break;
    case 'send':
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(payload));
      } else {
        messageQueue.push(payload);
      }
      break;
    case 'close':
      socket?.close();
      break;
    case 'addListener':
      listeners.add(payload.eventType);
      break;
  }
};

function initSocket(url) {
  socket = new WebSocket(url);
  
  socket.onopen = () => {
    self.postMessage({ type: 'status', status: 'connected' });
    flushMessageQueue();
  };

  socket.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (listeners.has(data.type)) {
      self.postMessage({ type: 'event', event: data });
    }
  };

  socket.onclose = () => {
    self.postMessage({ type: 'status', status: 'disconnected' });
  };
}

function flushMessageQueue() {
  while (messageQueue.length > 0) {
    socket.send(JSON.stringify(messageQueue.shift()));
  }
}
