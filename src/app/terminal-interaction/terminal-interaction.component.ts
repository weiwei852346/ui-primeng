import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { SplitterModule } from 'primeng/splitter';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { WebsocketTerminalService } from '../core/services/websocket-terminal.service';
import { TerminalConnectionStatus } from '../shared/models/terminal-connection.interface';
import { VirtualTarget } from '../shared/models/virtual-target.interface';

export interface ReservedTarget extends VirtualTarget {
  reservedAt: Date;
  reservedBy: string;
}

@Component({
  selector: 'app-terminal-interaction',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SplitterModule,
    ButtonModule,
    CardModule,
  ],
  templateUrl: './terminal-interaction.component.html',
  styleUrls: ['./terminal-interaction.component.scss']
})
export class TerminalInteractionComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('terminalContainer', { static: false }) terminalContainer!: ElementRef;

  private terminal: Terminal | null = null;
  private fitAddon: FitAddon | null = null;
  private subscriptions: Subscription[] = [];
  private messageSubscription: Subscription | null = null;
  private resizeObserver: ResizeObserver | null = null;

  connectionStatus: TerminalConnectionStatus = { connected: false };
  targetInfo: ReservedTarget | null = null;
  isFullscreen: boolean = false;

  constructor(
    private websocketService: WebsocketTerminalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // const navigation = this.router.getCurrentNavigation();
    this.targetInfo = history.state?.['target'] as any; // 使用any类型来处理

    console.log('Terminal Interaction - targetInfo:', this.targetInfo);

    const statusSub = this.websocketService.getStatus().subscribe(status => {
      this.connectionStatus = status;
      console.log('Connection status changed:', status);
    });
    this.subscriptions.push(statusSub);
  }

  getFormattedReserveTime(): string {
    if (this.targetInfo && 'reservedAt' in this.targetInfo) {
      const reservedAt = this.targetInfo.reservedAt;
      return reservedAt.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
    return 'Not reserved';
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit - terminalContainer:', this.terminalContainer);

    // Delay initialization to ensure splitter layout is complete
    setTimeout(() => {
      // 即使没有 targetInfo 也初始化终端，方便测试
      this.initTerminal();

      // 尝试连接 WebSocket（使用 targetInfo.id 或默认值 'test'）
      const targetId = this.targetInfo?.id || 'test';
      console.log('Connecting to WebSocket with targetId:', targetId);
      this.connectWebSocket(targetId);
    }, 300);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    this.resizeObserver?.disconnect();
    this.websocketService.disconnect();
    this.terminal?.dispose();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.fitAddon?.fit();
  }

  goBack(): void {
    this.router.navigate(['/my-reservation']);
  }

  reconnect(): void {    const targetId = this.targetInfo?.id || 'test';
    console.log('Reconnecting with targetId:', targetId);
    this.connectWebSocket(targetId);
  }

  disconnect(): void {
    this.websocketService.disconnect();
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    console.log('Toggle fullscreen called, isFullscreen:', this.isFullscreen);

    const terminalContainer = this.terminalContainer?.nativeElement;
    if (!terminalContainer) {
      console.error('Terminal container not found');
      return;
    }

    if (this.isFullscreen) {
      console.log('Entering fullscreen within browser page');
      terminalContainer.classList.add('terminal-fullscreen');
      this.fitAddon?.fit();
    } else {
      console.log('Exiting fullscreen');
      terminalContainer.classList.remove('terminal-fullscreen');
      this.fitAddon?.fit();
    }
  }

  private initTerminal(): void {
    console.log('Initializing terminal...');

    const terminalTheme = {
      background: '#1e1e1e',
      foreground: '#00ff00',
      cursor: '#00ff00',
      cursorAccent: '#1e1e1e',
      selection: 'rgba(255, 255, 255, 0.3)',
      black: '#000000',
      red: '#ff5555',
      green: '#50fa7b',
      yellow: '#f1fa8c',
      blue: '#bd93f9',
      magenta: '#ff79c6',
      cyan: '#8be9fd',
      white: '#bfbfbf',
      brightBlack: '#4d4d4d',
      brightRed: '#ff6e67',
      brightGreen: '#5af78e',
      brightYellow: '#f4f99d',
      brightBlue: '#caa9fa',
      brightMagenta: '#ff92d0',
      brightCyan: '#9aedfe',
      brightWhite: '#e6e6e6'
    };

    this.terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: terminalTheme,
      scrollback: 1000,
      convertEol: true,
      allowTransparency: false,
      rightClickSelectsWord: true,
      disableStdin: false,
      screenReaderMode: false,
      lineHeight: 1.0,
      letterSpacing: 0
    });

    console.log('Terminal instance created:', this.terminal);

    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);

    if (this.terminalContainer && this.terminalContainer.nativeElement) {
      this.terminal.open(this.terminalContainer.nativeElement);
      console.log('Terminal opened in container');

      // Delay fit to ensure container is fully rendered with correct dimensions
      setTimeout(() => {
        const rect = this.terminalContainer.nativeElement.getBoundingClientRect();
        console.log('Container dimensions:', rect.width, 'x', rect.height);
        this.fitAddon?.fit();
        console.log('Terminal fitted to container');
      }, 200);

      this.terminal.onData(data => {
        console.log('Terminal data input:', data);
        this.websocketService.send(data);
      });
    } else {
      console.error('Terminal container not found!');
    }
  }

  private connectWebSocket(targetId: string): void {
    console.log('Connecting WebSocket with targetId:', targetId);

    // 清理旧的消息订阅，避免重复
    if (this.messageSubscription) {
      console.log('Unsubscribing old message subscription');
      this.messageSubscription.unsubscribe();
      this.messageSubscription = null;
    }

    this.websocketService.connect(targetId);

    this.messageSubscription = this.websocketService.getMessages().subscribe(message => {
      console.log('Received message from WebSocket:', message);
      this.terminal?.write(message);
    });
  }
}

