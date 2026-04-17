import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { TerminalConnectionStatus } from '../../shared/models/terminal-connection.interface';

@Injectable({
  providedIn: 'root'
})
export class WebsocketTerminalService {
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<string>();
  private statusSubject = new BehaviorSubject<TerminalConnectionStatus>({ connected: false });

  /**
   * Parse IP string to extract host and port
   * @param ip - IP string in format "ip:port" or just "ip"
   * @returns Object with host and port (defaults to port 22)
   */
  private parseIp(ip: string): { host: string; port: number } {
    if (!ip) {
      return { host: '', port: 22 };
    }

    // Check if IP contains port separator
    if (ip.includes(':')) {
      const [host, portStr] = ip.split(':');
      const port = parseInt(portStr, 10);
      return {
        host,
        port: isNaN(port) ? 22 : port
      };
    }

    // No port specified, use default SSH port
    return {
      host: ip,
      port: 22
    };
  }

  /**
   * Connect to terminal using connection information
   * @param targetId - Target identifier
   * @param gateway - Gateway address (e.g., "192.168.2.182:3000")
   * @param connectionInfo - Connection information object
   */
  connect(
    targetId: string,
    gateway: string,
    connectionInfo: {
      ip: string;
      user: string;
      password: string;
    }
  ): void {
    this.disconnect();

    // Parse IP to extract host and port
    const { host: hostIp, port } = this.parseIp(connectionInfo.ip);

    // Construct WebSocket URL
    const url = `ws://${gateway}/terminal/${targetId}?host=${hostIp}&port=${port}&user=${connectionInfo.user}&password=${connectionInfo.password}`;

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.statusSubject.next({ connected: true, lastConnected: new Date() });
    };

    this.socket.onmessage = (event: MessageEvent) => {
      this.messageSubject.next(event.data as string);
    };

    this.socket.onerror = () => {
      this.statusSubject.next({
        connected: false,
        lastDisconnected: new Date(),
        errorMessage: 'WebSocket connection error'
      });
    };

    this.socket.onclose = () => {
      this.statusSubject.next({
        ...this.statusSubject.value,
        connected: false,
        lastDisconnected: new Date()
      });
    };
  }

  send(data: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  getStatus(): Observable<TerminalConnectionStatus> {
    return this.statusSubject.asObservable();
  }

  getMessages(): Observable<string> {
    return this.messageSubject.asObservable();
  }
}
