// SSE工作线程实现
let eventSource = null;

self.onmessage = function(e) {
  const { action, config } = e.data;
  
  switch(action) {
    case 'connect':
      connectSSE(config.url, config.events);
      break;
    case 'disconnect':
      disconnectSSE();
      break;
  }
};

function connectSSE(url, eventTypes) {
  eventSource = new EventSource(url);
  
  eventSource.onopen = () => {
    self.postMessage({ type: 'status', connected: true });
  };

  eventTypes.forEach(type => {
    eventSource.addEventListener(type, (e) => {
      self.postMessage({ 
        type: 'event',
        eventType: type,
        data: JSON.parse(e.data) 
      });
    });
  });

  eventSource.onerror = () => {
    self.postMessage({ type: 'status', connected: false });
  };
}

function disconnectSSE() {
  eventSource?.close();
}
