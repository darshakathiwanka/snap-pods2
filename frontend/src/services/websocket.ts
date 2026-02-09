export class TerminalWebSocket {
  private ws: WebSocket | null = null;
  private onMessageCallback: ((data: string) => void) | null = null;
  private onErrorCallback: ((error: Event) => void) | null = null;
  private onCloseCallback: (() => void) | null = null;

  connect(containerId: string) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws/terminal/${containerId}`;
    
    this.ws = new WebSocket(url);
    
    this.ws.onmessage = (event) => {
      if (this.onMessageCallback) {
        this.onMessageCallback(event.data);
      }
    };
    
    this.ws.onerror = (error) => {
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    };
    
    this.ws.onclose = () => {
      if (this.onCloseCallback) {
        this.onCloseCallback();
      }
    };
  }

  send(data: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  onMessage(callback: (data: string) => void) {
    this.onMessageCallback = callback;
  }

  onError(callback: (error: Event) => void) {
    this.onErrorCallback = callback;
  }

  onClose(callback: () => void) {
    this.onCloseCallback = callback;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export class StatsWebSocket {
  private ws: WebSocket | null = null;
  private onStatsCallback: ((stats: any) => void) | null = null;
  private onErrorCallback: ((error: Event) => void) | null = null;

  connect(containerId: string) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws/stats/${containerId}`;
    
    this.ws = new WebSocket(url);
    
    this.ws.onmessage = (event) => {
      if (this.onStatsCallback) {
        try {
          const stats = JSON.parse(event.data);
          this.onStatsCallback(stats);
        } catch (e) {
          console.error('Failed to parse stats:', e);
        }
      }
    };
    
    this.ws.onerror = (error) => {
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    };
  }

  onStats(callback: (stats: any) => void) {
    this.onStatsCallback = callback;
  }

  onError(callback: (error: Event) => void) {
    this.onErrorCallback = callback;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

