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

  connect(targetId: string): void {
    this.disconnect();

    //const url = `ws://localhost:3000/terminal/${targetId}`;
    const url = `ws://192.168.2.182:3001`;
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
