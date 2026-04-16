export interface TerminalConnectionStatus {
  connected: boolean;
  lastConnected?: Date;
  lastDisconnected?: Date;
  errorMessage?: string;
}
