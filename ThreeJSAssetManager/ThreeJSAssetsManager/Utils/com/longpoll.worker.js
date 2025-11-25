
// 长轮询工作线程实现
let pollingInterval = 2000;
let abortController = null;

self.onmessage = function(e) {
  const { action, config } = e.data;
  
  switch(action) {
    case 'start':
      pollingInterval = config?.interval || 2000;
      startPolling(config.url);
      break;
    case 'stop':
      stopPolling();
      break;
    case 'config':
      pollingInterval = config.interval;
      break;
  }
};

function startPolling(url) {
  abortController = new AbortController();
  
  const poll = async () => {
    try {
      const response = await fetch(url, {
        signal: abortController.signal,
        headers: { 'Last-Event-ID': self.lastEventId || '' }
      });
      
      if (response.ok) {
        const data = await response.json();
        self.lastEventId = data.lastId;
        self.postMessage({ type: 'data', data });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        self.postMessage({ type: 'error', error: err.message });
      }
      return;
    }
    
    setTimeout(poll, pollingInterval);
  };

  poll();
}

function stopPolling() {
  abortController?.abort();
}
